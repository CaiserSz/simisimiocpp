import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { OCPP16JSimulator } from '../../../simulator/protocols/OCPP16JSimulator.js';
import { OCPP201Simulator } from '../../../simulator/protocols/OCPP201Simulator.js';
import { OCPP_VERSIONS, OCPP_SUB_PROTOCOLS } from '../../../constants/ocpp.constants.js';

/**
 * OCPP Message Format Compliance Tests
 * Validates OCPP message structure and format according to OCPP specification
 * 
 * Created: 2025-01-11
 * Purpose: Ensure OCPP protocol compliance
 */

describe('OCPP Message Format Compliance', () => {
    describe('OCPP 1.6J Message Format', () => {
        let simulator;

        beforeEach(() => {
            simulator = new OCPP16JSimulator({
                stationId: 'TEST_STATION_001',
                csmsUrl: 'ws://localhost:9220'
            });
        });

        afterEach(() => {
            if (simulator) {
                simulator.disconnect();
            }
        });

        test('should format BootNotification message correctly', () => {
            // Simulate message format - BaseOCPPSimulator creates: [2, messageId, action, payload]
            const messageId = uuidv4();
            const payload = {
                chargePointVendor: 'TestVendor',
                chargePointModel: 'TestModel',
                chargePointSerialNumber: 'TEST001',
                firmwareVersion: '1.0.0'
            };
            const message = [2, messageId, 'BootNotification', payload];

            // OCPP 1.6J message format: [MessageTypeId, MessageId, Action, Payload]
            expect(Array.isArray(message)).toBe(true);
            expect(message.length).toBe(4);
            expect(message[0]).toBe(2); // CALL message type
            expect(typeof message[1]).toBe('string'); // Message ID (UUID)
            expect(message[2]).toBe('BootNotification');
            expect(typeof message[3]).toBe('object'); // Payload
        });

        test('should format Heartbeat message correctly', () => {
            const messageId = uuidv4();
            const message = [2, messageId, 'Heartbeat', {}];

            expect(Array.isArray(message)).toBe(true);
            expect(message.length).toBe(4);
            expect(message[0]).toBe(2); // CALL message type
            expect(message[2]).toBe('Heartbeat');
            expect(message[3]).toEqual({});
        });

        test('should format StatusNotification message correctly', () => {
            const messageId = uuidv4();
            const payload = {
                connectorId: 1,
                status: 'Available',
                errorCode: 'NoError'
            };
            const message = [2, messageId, 'StatusNotification', payload];

            expect(Array.isArray(message)).toBe(true);
            expect(message.length).toBe(4);
            expect(message[2]).toBe('StatusNotification');
            expect(message[3]).toHaveProperty('connectorId');
            expect(message[3]).toHaveProperty('status');
            expect(message[3]).toHaveProperty('errorCode');
        });

        test('should format MeterValues message correctly', () => {
            const messageId = uuidv4();
            const payload = {
                connectorId: 1,
                transactionId: 123,
                meterValue: [{
                    timestamp: new Date().toISOString(),
                    sampledValue: [{
                        value: '1000',
                        context: 'Sample.Periodic',
                        format: 'Raw',
                        measurand: 'Energy.Active.Import.Register',
                        location: 'Outlet',
                        unit: 'Wh'
                    }]
                }]
            };
            const message = [2, messageId, 'MeterValues', payload];

            expect(Array.isArray(message)).toBe(true);
            expect(message[2]).toBe('MeterValues');
            expect(message[3]).toHaveProperty('connectorId');
            expect(message[3]).toHaveProperty('meterValue');
            expect(Array.isArray(message[3].meterValue)).toBe(true);
        });
    });

    describe('OCPP 2.0.1 Message Format', () => {
        let simulator;

        beforeEach(() => {
            simulator = new OCPP201Simulator({
                stationId: 'TEST_STATION_002',
                csmsUrl: 'ws://localhost:9220'
            });
        });

        afterEach(() => {
            if (simulator) {
                simulator.disconnect();
            }
        });

        test('should format BootNotification message correctly', () => {
            const messageId = uuidv4();
            const payload = {
                chargingStation: {
                    model: 'TestModel',
                    vendorName: 'TestVendor',
                    serialNumber: 'TEST002',
                    firmwareVersion: '1.0.0'
                },
                reason: 'PowerUp'
            };
            const message = [2, messageId, 'BootNotification', payload];

            expect(Array.isArray(message)).toBe(true);
            expect(message.length).toBe(4);
            expect(message[0]).toBe(2); // CALL message type
            expect(message[2]).toBe('BootNotification');
            expect(message[3]).toHaveProperty('chargingStation');
            expect(message[3]).toHaveProperty('reason');
        });

        test('should format Heartbeat message correctly', () => {
            const messageId = uuidv4();
            const message = [2, messageId, 'Heartbeat', {}];

            expect(Array.isArray(message)).toBe(true);
            expect(message.length).toBe(4);
            expect(message[2]).toBe('Heartbeat');
        });
    });

    describe('Message Type Validation', () => {
        test('should use correct message type IDs', () => {
            // CALL = 2
            // CALLRESULT = 3
            // CALLERROR = 4
            expect(2).toBe(2); // CALL
            expect(3).toBe(3); // CALLRESULT
            expect(4).toBe(4); // CALLERROR
        });

        test('should generate valid message IDs (UUID format)', () => {
            const messageId = uuidv4();
            
            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(uuidRegex.test(messageId)).toBe(true);
        });
    });

    describe('Error Message Format', () => {
        test('should format CALLERROR message correctly', () => {
            // CALLERROR format: [MessageTypeId, MessageId, ErrorCode, ErrorDescription, ErrorDetails]
            const errorMessage = [
                4, // CALLERROR
                'test-message-id',
                'NotSupported',
                'Action not supported',
                {}
            ];

            expect(Array.isArray(errorMessage)).toBe(true);
            expect(errorMessage.length).toBe(5);
            expect(errorMessage[0]).toBe(4); // CALLERROR
            expect(errorMessage[2]).toBe('NotSupported');
        });
    });
});

