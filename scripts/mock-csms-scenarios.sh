#!/bin/bash

# Mock CSMS Control API Automation Scripts
# Scenario-based examples for automated testing
#
# Created: 2025-01-11
# Purpose: Automate Mock CSMS control API for testing scenarios

set -e

MOCK_CSMS_URL="${MOCK_CSMS_URL:-http://localhost:9221}"
STATION_ID="${STATION_ID:-TEST_STATION_001}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Mock CSMS is running
check_mock_csms() {
    if ! curl -s "${MOCK_CSMS_URL}/mock/state" > /dev/null; then
        error "Mock CSMS is not running at ${MOCK_CSMS_URL}"
        exit 1
    fi
    log "Mock CSMS is running"
}

# Reset Mock CSMS to default state
reset_mock_csms() {
    log "Resetting Mock CSMS to default state..."
    curl -s -X POST "${MOCK_CSMS_URL}/mock/reset" > /dev/null
    log "Mock CSMS reset complete"
}

# Configure latency
configure_latency() {
    local min_ms="${1:-10}"
    local max_ms="${2:-50}"
    log "Configuring latency: ${min_ms}ms - ${max_ms}ms"
    curl -s -X POST "${MOCK_CSMS_URL}/mock/latency" \
        -H "Content-Type: application/json" \
        -d "{\"min\": ${min_ms}, \"max\": ${max_ms}}" > /dev/null
    log "Latency configured"
}

# Inject error for specific action
inject_error() {
    local action="${1:-BootNotification}"
    local error_code="${2:-InternalError}"
    local error_description="${3:-Mock error}"
    log "Injecting error for ${action}: ${error_code}"
    curl -s -X POST "${MOCK_CSMS_URL}/mock/error" \
        -H "Content-Type: application/json" \
        -d "{
            \"action\": \"${action}\",
            \"errorCode\": \"${error_code}\",
            \"errorDescription\": \"${error_description}\"
        }" > /dev/null
    log "Error injection configured"
}

# Register message pattern
register_pattern() {
    local pattern="${1:-BootNotification}"
    local behavior="${2:-DROP}"
    log "Registering pattern: ${pattern} -> ${behavior}"
    curl -s -X POST "${MOCK_CSMS_URL}/mock/pattern/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"pattern\": \"${pattern}\",
            \"behavior\": \"${behavior}\"
        }" > /dev/null
    log "Pattern registered"
}

# Set connection state
set_connection_state() {
    local state="${1:-stable}"
    log "Setting connection state: ${state}"
    curl -s -X POST "${MOCK_CSMS_URL}/mock/connection/state" \
        -H "Content-Type: application/json" \
        -d "{\"state\": \"${state}\"}" > /dev/null
    log "Connection state set"
}

# Scenario 1: Normal operation
scenario_normal() {
    log "=== Scenario 1: Normal Operation ==="
    reset_mock_csms
    configure_latency 10 50
    log "Scenario 1 configured: Normal operation with low latency"
}

# Scenario 2: High latency
scenario_high_latency() {
    log "=== Scenario 2: High Latency ==="
    reset_mock_csms
    configure_latency 500 2000
    log "Scenario 2 configured: High latency (500-2000ms)"
}

# Scenario 3: Intermittent errors
scenario_intermittent_errors() {
    log "=== Scenario 3: Intermittent Errors ==="
    reset_mock_csms
    inject_error "BootNotification" "InternalError" "Intermittent error"
    set_connection_state "intermittent"
    log "Scenario 3 configured: Intermittent errors"
}

# Scenario 4: Connection drops
scenario_connection_drops() {
    log "=== Scenario 4: Connection Drops ==="
    reset_mock_csms
    set_connection_state "unreliable"
    register_pattern "Heartbeat" "DROP"
    log "Scenario 4 configured: Connection drops"
}

# Scenario 5: CSMS unavailable
scenario_csms_unavailable() {
    log "=== Scenario 5: CSMS Unavailable ==="
    reset_mock_csms
    register_pattern "*" "DISCONNECT"
    set_connection_state "unreliable"
    log "Scenario 5 configured: CSMS unavailable"
}

# Scenario 6: Protocol errors
scenario_protocol_errors() {
    log "=== Scenario 6: Protocol Errors ==="
    reset_mock_csms
    inject_error "StartTransaction" "ProtocolError" "Invalid payload"
    inject_error "StopTransaction" "ProtocolError" "Invalid payload"
    log "Scenario 6 configured: Protocol errors"
}

# Main execution
main() {
    local scenario="${1:-normal}"
    
    check_mock_csms
    
    case "${scenario}" in
        normal)
            scenario_normal
            ;;
        high-latency)
            scenario_high_latency
            ;;
        intermittent-errors)
            scenario_intermittent_errors
            ;;
        connection-drops)
            scenario_connection_drops
            ;;
        csms-unavailable)
            scenario_csms_unavailable
            ;;
        protocol-errors)
            scenario_protocol_errors
            ;;
        reset)
            reset_mock_csms
            ;;
        *)
            error "Unknown scenario: ${scenario}"
            echo "Available scenarios:"
            echo "  normal              - Normal operation"
            echo "  high-latency        - High latency simulation"
            echo "  intermittent-errors - Intermittent errors"
            echo "  connection-drops    - Connection drops"
            echo "  csms-unavailable    - CSMS unavailable"
            echo "  protocol-errors     - Protocol errors"
            echo "  reset               - Reset to default"
            exit 1
            ;;
    esac
    
    log "Scenario '${scenario}' executed successfully"
}

# Run main function
main "$@"

