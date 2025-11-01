import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const failureRate = new Rate('failures');
const responseTrend = new Trend('response_time_ms');
const stationCreationTrend = new Trend('station_creation_time_ms');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'], // Error rate should be less than 10%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    failures: ['rate<0.1'],
    response_time_ms: ['p(95)<200'],
    station_creation_time_ms: ['p(95)<1000']
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const CSMS_URL = __ENV.CSMS_URL || 'ws://localhost:9220';

let authToken = null;

export function setup() {
  // Login and get auth token
  const loginPayload = {
    email: 'admin@example.com',
    password: 'admin123'
  };

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginResponse.status === 200) {
    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.token;
    console.log('🔑 Authentication successful');
  } else {
    console.error('❌ Authentication failed');
    throw new Error('Authentication failed');
  }

  return { authToken };
}

export default function(data) {
  const token = data.authToken;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Test scenarios
  const scenarios = [
    testDashboardOverview,
    testStationManagement,
    testStationCreation,
    testStationOperation,
    testVehicleSimulation,
    testRealtimeMetrics
  ];

  // Randomly select a scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario(headers);

  sleep(1);
}

function testDashboardOverview(headers) {
  const start = Date.now();
  
  const response = http.get(`${BASE_URL}/api/dashboard/overview`, { headers });
  
  const duration = Date.now() - start;
  responseTrend.add(duration);
  
  const success = check(response, {
    'dashboard overview status is 200': (r) => r.status === 200,
    'dashboard overview has data': (r) => {
      const data = JSON.parse(r.body);
      return data.success && data.data;
    },
    'dashboard overview response time < 200ms': () => duration < 200
  });

  failureRate.add(!success);
}

function testStationManagement(headers) {
  const start = Date.now();
  
  const response = http.get(`${BASE_URL}/api/dashboard/stations`, { headers });
  
  const duration = Date.now() - start;
  responseTrend.add(duration);
  
  const success = check(response, {
    'stations list status is 200': (r) => r.status === 200,
    'stations list has data': (r) => {
      const data = JSON.parse(r.body);
      return data.success && Array.isArray(data.data.stations);
    },
    'stations list response time < 300ms': () => duration < 300
  });

  failureRate.add(!success);
}

function testStationCreation(headers) {
  const stationConfig = {
    vendor: `LoadTestVendor_${__VU}_${__ITER}`,
    model: 'LoadTestModel',
    ocppVersion: Math.random() > 0.5 ? '1.6J' : '2.0.1',
    connectorCount: Math.floor(Math.random() * 3) + 1,
    maxPower: 22000,
    csmsUrl: CSMS_URL
  };

  const start = Date.now();
  
  const response = http.post(
    `${BASE_URL}/api/simulator/stations`, 
    JSON.stringify(stationConfig), 
    { headers }
  );
  
  const duration = Date.now() - start;
  stationCreationTrend.add(duration);
  
  const success = check(response, {
    'station creation status is 201': (r) => r.status === 201,
    'station creation returns station data': (r) => {
      const data = JSON.parse(r.body);
      return data.success && data.data.station;
    },
    'station creation time < 1000ms': () => duration < 1000
  });

  failureRate.add(!success);

  // If station created successfully, try to start it
  if (success && response.status === 201) {
    const stationData = JSON.parse(response.body);
    const stationId = stationData.data.station.stationId;
    
    sleep(0.5); // Brief pause
    
    const startResponse = http.put(
      `${BASE_URL}/api/simulator/stations/${stationId}/start`,
      null,
      { headers }
    );
    
    check(startResponse, {
      'station start status is 200': (r) => r.status === 200
    });
  }
}

function testStationOperation(headers) {
  // Get existing stations first
  const stationsResponse = http.get(`${BASE_URL}/api/dashboard/stations`, { headers });
  
  if (stationsResponse.status !== 200) {
    failureRate.add(true);
    return;
  }

  const stationsData = JSON.parse(stationsResponse.body);
  const stations = stationsData.data.stations;

  if (stations.length === 0) {
    return; // No stations to test
  }

  // Pick a random station
  const station = stations[Math.floor(Math.random() * stations.length)];
  const stationId = station.stationId;

  // Test various station operations
  const operations = [
    () => http.get(`${BASE_URL}/api/dashboard/stations/${stationId}`, { headers }),
    () => http.put(`${BASE_URL}/api/simulator/stations/${stationId}/stop`, null, { headers }),
    () => http.put(`${BASE_URL}/api/simulator/stations/${stationId}/start`, null, { headers })
  ];

  const operation = operations[Math.floor(Math.random() * operations.length)];
  const response = operation();
  
  const success = check(response, {
    'station operation status is 200': (r) => r.status === 200
  });

  failureRate.add(!success);
}

function testVehicleSimulation(headers) {
  // Get existing stations
  const stationsResponse = http.get(`${BASE_URL}/api/dashboard/stations`, { headers });
  
  if (stationsResponse.status !== 200) {
    failureRate.add(true);
    return;
  }

  const stationsData = JSON.parse(stationsResponse.body);
  const stations = stationsData.data.stations.filter(s => s.isOnline);

  if (stations.length === 0) {
    return; // No online stations
  }

  const station = stations[Math.floor(Math.random() * stations.length)];
  const stationId = station.stationId;
  const connectorId = Math.floor(Math.random() * station.connectors.length) + 1;

  // Connect vehicle
  const vehicleConfig = {
    vehicleType: ['compact', 'sedan', 'suv'][Math.floor(Math.random() * 3)],
    initialSoC: Math.floor(Math.random() * 50) + 10,
    targetSoC: Math.floor(Math.random() * 30) + 70
  };

  const connectResponse = http.post(
    `${BASE_URL}/api/simulator/stations/${stationId}/connectors/${connectorId}/vehicle/connect`,
    JSON.stringify(vehicleConfig),
    { headers }
  );

  const connectSuccess = check(connectResponse, {
    'vehicle connect status is 200': (r) => r.status === 200
  });

  if (connectSuccess) {
    sleep(0.5);
    
    // Start charging
    const chargingConfig = {
      idTag: `LOAD_TEST_${__VU}_${__ITER}`
    };

    const chargingResponse = http.post(
      `${BASE_URL}/api/simulator/stations/${stationId}/connectors/${connectorId}/charging/start`,
      JSON.stringify(chargingConfig),
      { headers }
    );

    check(chargingResponse, {
      'charging start status is 200': (r) => r.status === 200
    });
  }

  failureRate.add(!connectSuccess);
}

function testRealtimeMetrics(headers) {
  const metrics = ['power', 'energy', 'utilization', 'sessions'];
  const durations = ['5m', '15m', '1h'];
  
  const metric = metrics[Math.floor(Math.random() * metrics.length)];
  const duration = durations[Math.floor(Math.random() * durations.length)];

  const start = Date.now();
  
  const response = http.get(
    `${BASE_URL}/api/dashboard/metrics?metric=${metric}&duration=${duration}`,
    { headers }
  );
  
  const responseTime = Date.now() - start;
  responseTrend.add(responseTime);
  
  const success = check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics has data': (r) => {
      const data = JSON.parse(r.body);
      return data.success && data.data;
    },
    'metrics response time < 150ms': () => responseTime < 150
  });

  failureRate.add(!success);
}

export function teardown(data) {
  console.log('🧹 Cleaning up test data...');
  
  // Optional: Clean up created stations
  // This would require tracking created station IDs during the test
}

// WebSocket stress test (separate scenario)
export function testWebSocketConnections() {
  const url = `ws://localhost:3001/socket.io/?EIO=4&transport=websocket`;
  
  const response = ws.connect(url, {
    timeout: '10s'
  }, function (socket) {
    socket.on('open', () => {
      console.log('WebSocket connected');
      
      // Send authentication
      socket.send(JSON.stringify({
        type: 'auth',
        token: authToken
      }));
    });

    socket.on('message', (data) => {
      console.log('Received:', data);
    });

    socket.on('close', () => {
      console.log('WebSocket closed');
    });

    // Keep connection alive for testing
    sleep(30);
  });

  check(response, {
    'WebSocket connection successful': (r) => r && r.status === 101
  });
}
