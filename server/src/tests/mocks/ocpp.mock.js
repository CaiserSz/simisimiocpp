/**
 * Test Mocks - OCPP
 * 
 * Created: 2025-01-11
 * Purpose: Mock OCPP messages and responses for testing
 */

export const mockOCPPMessages = {
    bootNotification: {
        request: [2, 'unique-message-id', 'BootNotification', {
            chargePointVendor: 'TestVendor',
            chargePointModel: 'TestModel',
            chargePointSerialNumber: 'TEST001'
        }],
        response: [3, 'unique-message-id', {
            status: 'Accepted',
            currentTime: new Date().toISOString(),
            heartbeatInterval: 300
        }]
    },
    heartbeat: {
        request: [2, 'heartbeat-id', 'Heartbeat', {}],
        response: [3, 'heartbeat-id', {
            currentTime: new Date().toISOString()
        }]
    },
    statusNotification: {
        request: [2, 'status-id', 'StatusNotification', {
            connectorId: 1,
            status: 'Available',
            errorCode: 'NoError'
        }],
        response: [3, 'status-id', {}]
    }
};

export const mockOCPPError = {
    message: [4, 'error-id', 'NotSupported', 'Action not supported', {}]
};

export default {
    mockOCPPMessages,
    mockOCPPError
};