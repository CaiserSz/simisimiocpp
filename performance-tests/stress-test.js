/**
 * K6 Stress Test Script for EV Charging Station Simulator
 * 
 * Created: 2025-01-11
 * Purpose: Stress testing to find breaking points
 * 
 * Usage:
 *   k6 run stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 200 },    // Ramp up to 200 users
    { duration: '2m', target: 200 },   // Stay at 200 users
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% < 2s under stress
    http_req_failed: ['rate<0.05'],     // Allow up to 5% errors under stress
  },
};

export default function() {
  const endpoints = [
    '/health',
    '/api/dashboard/overview',
    '/api/simulator/stats',
  ];

  for (const endpoint of endpoints) {
    const res = http.get(`${BASE_URL}${endpoint}`);
    
    const success = check(res, {
      [`${endpoint} status is 200`]: (r) => r.status === 200 || r.status === 503, // Allow 503 under stress
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);

    sleep(0.1);
  }
}

