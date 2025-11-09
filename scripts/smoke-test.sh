#!/bin/bash

# Smoke Test Script
# Temel fonksiyonelliği test eder
#
# Created: 2025-11-09
# Purpose: Production-ready validation

set -e

echo "================================================"
echo "SMOKE TEST BAŞLIYOR"
echo "================================================"
echo ""

cd "$(dirname "$0")/../server"

# Kill existing processes
pkill -f "node.*app.js" 2>/dev/null || true
sleep 2

echo "1. Server başlatılıyor..."
npm start > /tmp/simulator-smoke-test.log 2>&1 &
SERVER_PID=$!
echo "   PID: $SERVER_PID"

sleep 10

echo "2. Health check..."
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Health endpoint OK"
else
    echo "   ❌ Health endpoint FAIL"
    cat /tmp/simulator-smoke-test.log
    kill $SERVER_PID
    exit 1
fi

echo "3. Dashboard check..."
if curl -f -s http://localhost:3001/dashboard > /dev/null; then
    echo "   ✅ Dashboard OK"
else
    echo "   ❌ Dashboard FAIL"
    kill $SERVER_PID
    exit 1
fi

echo "4. Metrics check..."
if curl -f -s http://localhost:3001/metrics > /dev/null; then
    echo "   ✅ Metrics endpoint OK"
else
    echo "   ❌ Metrics endpoint FAIL"
    kill $SERVER_PID
    exit 1
fi

echo "5. API check..."
# GET stations (auth disabled in dev)
if curl -f -s http://localhost:3001/api/simulator/stations > /dev/null; then
    echo "   ✅ API endpoint OK"
else
    echo "   ❌ API endpoint FAIL"
    kill $SERVER_PID
    exit 1
fi

# Cleanup
kill $SERVER_PID
rm -f /tmp/simulator-smoke-test.log

echo ""
echo "================================================"
echo "✅ TÜM SMOKE TESTLER BAŞARILI"
echo "================================================"
echo ""
echo "Proje server'a kurulabilir!"

