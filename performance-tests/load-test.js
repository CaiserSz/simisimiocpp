/**
 * K6 Load Testing Script for EV Charging Station Simulator
 * 
 * Created: 2025-01-11
 * Purpose: Comprehensive load testing for API endpoints
 * 
 * Usage:
 *   k6 run load-test.js
 *   k6 run --vus 50 --duration 30s load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                  // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Test data
const testUser = {
  username: `loadtest_${Date.now()}`,
  email: `loadtest_${Date.now()}@example.com`,
  password: 'LoadTest123!',
  firstName: 'Load',
  lastName: 'Test'
};

let authToken = null;

export function setup() {
  console.log(`🚀 Starting load test against: ${BASE_URL}`);
  
  // Register a test user
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    username: testUser.username,
    email: testUser.email,
    password: testUser.password,
    firstName: testUser.firstName,
    lastName: testUser.lastName
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status === 201) {
    authToken = registerRes.json().token;
    console.log('✅ Test user registered');
  } else {
    // Try to login instead
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: testUser.email,
      password: testUser.password
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status === 200) {
      authToken = loginRes.json().token;
      console.log('✅ Test user logged in');
    }
  }

  return { authToken };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (data.authToken) {
    headers['Authorization'] = `Bearer ${data.authToken}`;
  }

  // Test 1: Health check
  let res = http.get(`${BASE_URL}/health`);
  let success = check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(0.5);

  // Test 2: Dashboard overview
  res = http.get(`${BASE_URL}/api/dashboard/overview`, { headers });
  success = check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard has statistics': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data !== undefined;
    },
  });
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(0.5);

  // Test 3: Get stations list
  res = http.get(`${BASE_URL}/api/simulator/stations`, { headers });
  success = check(res, {
    'stations list status is 200': (r) => r.status === 200,
    'stations list is valid': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && Array.isArray(body.data);
    },
  });
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(0.5);

  // Test 4: Get statistics
  res = http.get(`${BASE_URL}/api/simulator/stats`, { headers });
  success = check(res, {
    'stats status is 200': (r) => r.status === 200,
    'stats has data': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data !== undefined;
    },
  });
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(0.5);

  // Test 5: Get health summary
  res = http.get(`${BASE_URL}/api/simulator/health`, { headers });
  success = check(res, {
    'health summary status is 200': (r) => r.status === 200,
    'health summary valid': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true;
    },
  });
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);
}

export function teardown(data) {
  console.log('✅ Load test completed');
}

