import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * EV Charging Station Simulator - Load Test Suite
 * Tests API performance under various load conditions
 */

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
    stages: [
        { duration: '1m', target: 10 },   // Ramp up to 10 users
        { duration: '2m', target: 10 },   // Stay at 10 users
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '2m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 500 },  // Ramp up to 500 users
        { duration: '5m', target: 500 },  // Stay at 500 users
        { duration: '1m', target: 1000 }, // Ramp up to 1000 users
        { duration: '5m', target: 1000 }, // Stay at 1000 users
        { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(50)<100', 'p(95)<200', 'p(99)<500'],
        http_req_failed: ['rate<0.01'],
        errors: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
    // Test health endpoint
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
        'health check status is 200': (r) => r.status === 200,
        'health check response time < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(healthRes.status !== 200);
    responseTime.add(healthRes.timings.duration);
    
    sleep(1);
    
    // Test detailed health endpoint
    const detailedHealthRes = http.get(`${BASE_URL}/health/detailed`);
    check(detailedHealthRes, {
        'detailed health status is 200': (r) => r.status === 200,
    });
    errorRate.add(detailedHealthRes.status !== 200);
    responseTime.add(detailedHealthRes.timings.duration);
    
    sleep(1);
    
    // Test API health endpoint
    const apiHealthRes = http.get(`${BASE_URL}/api/health`);
    check(apiHealthRes, {
        'API health status is 200': (r) => r.status === 200,
    });
    errorRate.add(apiHealthRes.status !== 200);
    responseTime.add(apiHealthRes.timings.duration);
    
    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'load-test-results.json': JSON.stringify(data),
    };
}

function textSummary(data, options) {
    const indent = options.indent || '';
    const enableColors = options.enableColors || false;
    
    let summary = '\n';
    summary += `${indent}Load Test Summary\n`;
    summary += `${indent}==================\n\n`;
    summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
    summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
    summary += `${indent}Response Time (P50): ${data.metrics.http_req_duration.values.p50}ms\n`;
    summary += `${indent}Response Time (P95): ${data.metrics.http_req_duration.values.p95}ms\n`;
    summary += `${indent}Response Time (P99): ${data.metrics.http_req_duration.values.p99}ms\n`;
    summary += `${indent}Throughput: ${data.metrics.http_reqs.values.rate} req/s\n`;
    
    return summary;
}

