import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Benchmark configuration for different scenarios
export const scenarios = {
  // Single user baseline
  baseline: {
    executor: 'constant-vus',
    vus: 1,
    duration: '2m',
    tags: { scenario: 'baseline' }
  },
  
  // API performance test
  api_performance: {
    executor: 'constant-arrival-rate',
    rate: 100, // 100 requests per second
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 10,
    maxVUs: 50,
    tags: { scenario: 'api_performance' }
  },
  
  // Station creation burst
  station_burst: {
    executor: 'constant-arrival-rate',
    rate: 20, // 20 station creations per second
    timeUnit: '1s',
    duration: '2m',
    preAllocatedVUs: 5,
    maxVUs: 20,
    tags: { scenario: 'station_burst' }
  },
  
  // Long running stability test
  stability: {
    executor: 'constant-vus',
    vus: 25,
    duration: '30m',
    tags: { scenario: 'stability' }
  }
};

export const options = {
  scenarios,
  thresholds: {
    // Overall system thresholds
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'], // 5% error rate threshold
    
    // Scenario-specific thresholds
    'http_req_duration{scenario:baseline}': ['p(95)<100'],
    'http_req_duration{scenario:api_performance}': ['p(95)<200'],
    'http_req_duration{scenario:station_burst}': ['p(95)<1000'],
    'http_req_duration{scenario:stability}': ['p(95)<300'],
  }
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const CSMS_URL = __ENV.CSMS_URL || 'ws://localhost:9220';

let authToken = null;

export function setup() {
  console.log('🚀 Starting EV Simulator Benchmark Tests');
  console.log(`📡 Target: ${BASE_URL}`);
  console.log(`🔌 CSMS: ${CSMS_URL}`);
  
  // Authenticate
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginResponse.status === 200) {
    const data = JSON.parse(loginResponse.body);
    authToken = data.token;
    console.log('✅ Authentication successful');
  } else {
    throw new Error('Authentication failed');
  }

  return { authToken };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json'
  };

  const scenario = __ENV.EXEC_SCENARIO || 'baseline';
  
  switch (scenario) {
    case 'baseline':
      runBaselineTests(headers);
      break;
    case 'api_performance':
      runAPIPerformanceTests(headers);
      break;
    case 'station_burst':
      runStationBurstTests(headers);
      break;
    case 'stability':
      runStabilityTests(headers);
      break;
    default:
      runMixedScenario(headers);
  }
}

function runBaselineTests(headers) {
  // Test basic API endpoints with single user
  const endpoints = [
    '/api/dashboard/overview',
    '/api/dashboard/stations',
    '/api/simulator/profiles',
    '/api/simulator/scenarios',
    '/api/dashboard/metrics?metric=power&duration=1h'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const response = http.get(`${BASE_URL}${endpoint}`, { headers });
  
  check(response, {
    'baseline status is 200': (r) => r.status === 200,
    'baseline response time < 100ms': (r) => r.timings.duration < 100,
    'baseline has valid JSON': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success !== undefined;
      } catch (e) {
        return false;
      }
    }
  });
  
  sleep(0.1);
}

function runAPIPerformanceTests(headers) {
  // High-frequency API calls
  const apiCalls = [
    () => http.get(`${BASE_URL}/api/dashboard/overview`, { headers }),
    () => http.get(`${BASE_URL}/api/dashboard/stations`, { headers }),
    () => http.get(`${BASE_URL}/api/simulator/statistics`, { headers }),
    () => http.get(`${BASE_URL}/api/dashboard/metrics?metric=power`, { headers })
  ];
  
  const apiCall = apiCalls[Math.floor(Math.random() * apiCalls.length)];
  const response = apiCall();
  
  check(response, {
    'api performance status is 200': (r) => r.status === 200,
    'api performance response time < 200ms': (r) => r.timings.duration < 200
  });
  
  // No sleep for high frequency testing
}

function runStationBurstTests(headers) {
  // Rapid station creation and management
  const actions = [
    () => createStation(headers),
    () => createBulkStations(headers),
    () => startRandomStation(headers),
    () => stopRandomStation(headers)
  ];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  action();
  
  sleep(0.2);
}

function runStabilityTests(headers) {
  // Long-running test with mixed operations
  const operations = [
    () => http.get(`${BASE_URL}/api/dashboard/overview`, { headers }),
    () => http.get(`${BASE_URL}/api/dashboard/stations`, { headers }),
    () => createStation(headers),
    () => simulateVehicleInteraction(headers)
  ];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
  
  sleep(1 + Math.random() * 2); // Variable sleep 1-3 seconds
}

function runMixedScenario(headers) {
  // Mixed operations for general load testing
  const scenarios = [
    runBaselineTests,
    runAPIPerformanceTests,
    runStationBurstTests
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario(headers);
}

// Helper functions
function createStation(headers) {
  const stationConfig = {
    vendor: `BenchmarkVendor_${Math.random().toString(36).substr(2, 5)}`,
    model: 'BenchmarkModel',
    ocppVersion: Math.random() > 0.5 ? '1.6J' : '2.0.1',
    connectorCount: Math.floor(Math.random() * 3) + 1,
    maxPower: 22000,
    csmsUrl: CSMS_URL
  };

  const response = http.post(
    `${BASE_URL}/api/simulator/stations`,
    JSON.stringify(stationConfig),
    { headers }
  );

  check(response, {
    'station creation status is 201': (r) => r.status === 201,
    'station creation time < 1000ms': (r) => r.timings.duration < 1000
  });

  return response;
}

function createBulkStations(headers) {
  const bulkConfig = {
    profileId: 'urban_ac',
    count: Math.floor(Math.random() * 5) + 1,
    options: {
      csmsUrl: CSMS_URL,
      autoStart: false
    }
  };

  const response = http.post(
    `${BASE_URL}/api/simulator/stations/from-profile`,
    JSON.stringify(bulkConfig),
    { headers }
  );

  check(response, {
    'bulk creation status is 201': (r) => r.status === 201,
    'bulk creation time < 5000ms': (r) => r.timings.duration < 5000
  });

  return response;
}

function startRandomStation(headers) {
  // Get stations list first
  const stationsResponse = http.get(`${BASE_URL}/api/dashboard/stations`, { headers });
  
  if (stationsResponse.status === 200) {
    const data = JSON.parse(stationsResponse.body);
    const offlineStations = data.data.stations.filter(s => !s.isOnline);
    
    if (offlineStations.length > 0) {
      const station = offlineStations[Math.floor(Math.random() * offlineStations.length)];
      
      const response = http.put(
        `${BASE_URL}/api/simulator/stations/${station.stationId}/start`,
        null,
        { headers }
      );
      
      check(response, {
        'station start status is 200': (r) => r.status === 200
      });
    }
  }
}

function stopRandomStation(headers) {
  // Get stations list first
  const stationsResponse = http.get(`${BASE_URL}/api/dashboard/stations`, { headers });
  
  if (stationsResponse.status === 200) {
    const data = JSON.parse(stationsResponse.body);
    const onlineStations = data.data.stations.filter(s => s.isOnline);
    
    if (onlineStations.length > 0) {
      const station = onlineStations[Math.floor(Math.random() * onlineStations.length)];
      
      const response = http.put(
        `${BASE_URL}/api/simulator/stations/${station.stationId}/stop`,
        null,
        { headers }
      );
      
      check(response, {
        'station stop status is 200': (r) => r.status === 200
      });
    }
  }
}

function simulateVehicleInteraction(headers) {
  // Get online stations
  const stationsResponse = http.get(`${BASE_URL}/api/dashboard/stations`, { headers });
  
  if (stationsResponse.status === 200) {
    const data = JSON.parse(stationsResponse.body);
    const onlineStations = data.data.stations.filter(s => s.isOnline);
    
    if (onlineStations.length > 0) {
      const station = onlineStations[Math.floor(Math.random() * onlineStations.length)];
      const connectorId = Math.floor(Math.random() * station.connectors.length) + 1;
      
      // Connect vehicle
      const vehicleConfig = {
        vehicleType: 'sedan',
        initialSoC: 30,
        targetSoC: 80
      };
      
      const connectResponse = http.post(
        `${BASE_URL}/api/simulator/stations/${station.stationId}/connectors/${connectorId}/vehicle/connect`,
        JSON.stringify(vehicleConfig),
        { headers }
      );
      
      check(connectResponse, {
        'vehicle connect status is 200': (r) => r.status === 200
      });
      
      if (connectResponse.status === 200) {
        sleep(0.5);
        
        // Start charging
        const chargingResponse = http.post(
          `${BASE_URL}/api/simulator/stations/${station.stationId}/connectors/${connectorId}/charging/start`,
          JSON.stringify({ idTag: `BENCH_${Date.now()}` }),
          { headers }
        );
        
        check(chargingResponse, {
          'charging start status is 200': (r) => r.status === 200
        });
      }
    }
  }
}

export function handleSummary(data) {
  console.log('📊 Generating benchmark report...');
  
  // Generate HTML report
  return {
    'benchmark-report.html': htmlReport(data),
    'benchmark-summary.json': JSON.stringify(data, null, 2)
  };
}

export function teardown(data) {
  console.log('🏁 Benchmark test completed');
  console.log(`📈 Results saved to benchmark-report.html`);
}
