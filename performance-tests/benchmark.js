/**
 * K6 Benchmark Script for EV Charging Station Simulator
 * 
 * Created: 2025-01-11
 * Purpose: Performance benchmarking and baseline measurements
 * 
 * Usage:
 *   k6 run benchmark.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const throughput = new Counter('throughput');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  vus: 20,           // 20 virtual users
  duration: '60s',   // Run for 60 seconds
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<300', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  const endpoints = [
    '/health',
    '/api/dashboard/overview',
    '/api/simulator/stats',
    '/api/simulator/stations',
    '/api/simulator/health',
    '/api/auth/info',
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const res = http.get(`${BASE_URL}${endpoint}`);
    const duration = Date.now() - startTime;

    const success = check(res, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 500ms`]: (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    throughput.add(1);

    sleep(0.1);
  }
}

