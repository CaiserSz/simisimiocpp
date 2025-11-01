#!/bin/bash

# EV Charging Station Simulator - Comprehensive Test Runner
# Usage: ./scripts/run-tests.sh [test-type] [options]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_TYPE="${1:-all}"
COVERAGE_ENABLED="${2:-true}"
REPORT_FORMAT="${3:-console}"

echo -e "${BLUE}🧪 EV Simulator Test Suite${NC}"
echo "=========================="

# Test configuration
export NODE_ENV=test
export CSMS_URL=ws://localhost:9220
export MONGODB_URI=mongodb://localhost:27017/ev_simulator_test
export REDIS_URL=redis://localhost:6379/1
export JWT_SECRET=test_secret_key_for_testing_only

# Ensure test dependencies are available
echo -e "${YELLOW}🔍 Checking test dependencies...${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "Node.js: $NODE_VERSION"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Start test databases if needed
echo -e "${YELLOW}🗄️ Starting test services...${NC}"

# MongoDB
if ! docker ps | grep -q mongo-test; then
    echo "Starting test MongoDB..."
    docker run -d --name mongo-test \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=test \
        -e MONGO_INITDB_ROOT_PASSWORD=test \
        mongo:6.0 >/dev/null
    
    # Wait for MongoDB to be ready
    sleep 5
fi

# Redis
if ! docker ps | grep -q redis-test; then
    echo "Starting test Redis..."
    docker run -d --name redis-test \
        -p 6379:6379 \
        redis:alpine >/dev/null
    
    # Wait for Redis to be ready
    sleep 2
fi

# Test CSMS (mock server)
if ! docker ps | grep -q csms-test; then
    echo "Starting test CSMS..."
    docker run -d --name csms-test \
        -p 9220:9220 \
        -e MOCK_MODE=true \
        ev-simulator:latest node test/mock-csms.js >/dev/null || true
fi

echo -e "${GREEN}✅ Test services ready${NC}"

# Run tests based on type
case $TEST_TYPE in
    "unit")
        echo -e "${YELLOW}🔬 Running unit tests...${NC}"
        npm run test:unit
        ;;
    
    "integration")
        echo -e "${YELLOW}🔗 Running integration tests...${NC}"
        npm run test:integration
        ;;
    
    "csms")
        echo -e "${YELLOW}🔌 Running CSMS integration tests...${NC}"
        npm run test:csms
        ;;
    
    "performance")
        echo -e "${YELLOW}⚡ Running performance tests...${NC}"
        
        # Start application for performance testing
        echo "Starting application for performance tests..."
        docker-compose up -d simulator
        
        # Wait for application to be ready
        sleep 10
        
        # Run K6 performance tests
        if command -v k6 &> /dev/null; then
            echo "Running load tests with K6..."
            k6 run performance-tests/load-test.js
            k6 run performance-tests/benchmark.js
        else
            echo -e "${YELLOW}⚠️ K6 not found, skipping performance tests${NC}"
            echo "Install K6: https://k6.io/docs/get-started/installation/"
        fi
        
        # Stop application
        docker-compose down
        ;;
    
    "all"|*)
        echo -e "${YELLOW}🎯 Running all test suites...${NC}"
        
        # Unit tests
        echo -e "${BLUE}Running unit tests...${NC}"
        npm run test:unit
        
        # Integration tests
        echo -e "${BLUE}Running integration tests...${NC}"
        npm run test:integration
        
        # CSMS tests
        echo -e "${BLUE}Running CSMS tests...${NC}"
        npm run test:csms
        
        # Coverage report
        if [ "$COVERAGE_ENABLED" = "true" ]; then
            echo -e "${BLUE}Generating coverage report...${NC}"
            npm run test:coverage
        fi
        ;;
esac

# Generate test reports
echo -e "${YELLOW}📊 Generating test reports...${NC}"

# JUnit XML report for CI/CD
if [ -f "coverage/clover.xml" ]; then
    echo "Coverage report: coverage/clover.xml"
fi

if [ -f "test-results.xml" ]; then
    echo "Test results: test-results.xml"
fi

# HTML coverage report
if [ -d "coverage/lcov-report" ]; then
    echo "HTML coverage report: coverage/lcov-report/index.html"
fi

# Test summary
echo ""
echo -e "${GREEN}📋 Test Summary${NC}"
echo "=================="

# Parse test results (if available)
if [ -f "test-results.json" ]; then
    TOTAL_TESTS=$(jq '.numTotalTests' test-results.json 2>/dev/null || echo "N/A")
    PASSED_TESTS=$(jq '.numPassedTests' test-results.json 2>/dev/null || echo "N/A")
    FAILED_TESTS=$(jq '.numFailedTests' test-results.json 2>/dev/null || echo "N/A")
    
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
fi

# Coverage summary (if available)
if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "N/A")
    echo "Code Coverage: $COVERAGE%"
fi

# Cleanup test services
echo -e "${YELLOW}🧹 Cleaning up test services...${NC}"

# Stop and remove test containers
docker stop mongo-test redis-test csms-test 2>/dev/null || true
docker rm mongo-test redis-test csms-test 2>/dev/null || true

# Check test results
if [ -f "test-results.json" ]; then
    FAILED_TESTS=$(jq '.numFailedTests' test-results.json 2>/dev/null || echo "0")
    if [ "$FAILED_TESTS" != "0" ]; then
        echo -e "${RED}❌ Some tests failed${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ All tests completed successfully${NC}"

# Deployment readiness check
echo ""
echo -e "${BLUE}🚀 Deployment Readiness${NC}"
echo "======================="

# Check critical requirements
READY=true

# Coverage threshold (80%)
if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null)
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
        echo -e "${RED}❌ Code coverage below 80%: $COVERAGE%${NC}"
        READY=false
    else
        echo -e "${GREEN}✅ Code coverage OK: $COVERAGE%${NC}"
    fi
fi

# Security scan (if available)
if command -v npm audit &> /dev/null; then
    echo "Running security audit..."
    if npm audit --audit-level=high; then
        echo -e "${GREEN}✅ No high-severity vulnerabilities${NC}"
    else
        echo -e "${RED}❌ Security vulnerabilities found${NC}"
        READY=false
    fi
fi

# Performance check results
if [ -f "benchmark-summary.json" ]; then
    RESPONSE_TIME=$(jq -r '.metrics.http_req_duration.avg' benchmark-summary.json 2>/dev/null)
    if (( $(echo "$RESPONSE_TIME > 500" | bc -l) )); then
        echo -e "${RED}❌ High response time: ${RESPONSE_TIME}ms${NC}"
        READY=false
    else
        echo -e "${GREEN}✅ Response time OK: ${RESPONSE_TIME}ms${NC}"
    fi
fi

if [ "$READY" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 Ready for deployment!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Not ready for deployment - fix issues above${NC}"
    exit 1
fi
