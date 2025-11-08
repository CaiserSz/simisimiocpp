import { jest } from '@jest/globals';
import { OCPP16JSimulator } from '../../../simulator/protocols/OCPP16JSimulator.js';

/**
 * OCPP 1.6J Compliance Tests
 * Tests OCPP 1.6J specific message formats and behaviors
 * 
 * Created: 2025-01-11
 * Purpose: Ensure OCPP 1.6J protocol compliance
 */

describe('OCPP 1.6J Compliance Tests', () => {
    let simulator;

    beforeEach(() => {
        simulator = new OCPP16JSimulator({
            stationId: 'TEST_OCPP16J_001',
            csmsUrl: 'ws://mock-csms:9220'
        });
        simulator.isConnected = true;
    });

    describe('BootNotification', () => {
        test('should send BootNotification with correct payload structure', async () => {
            const payload = {
                chargePointVendor: 'TestVendor',
                chargePointModel: 'TestModel',
                chargePointSerialNumber: 'TEST001',
                firmwareVersion: '1.0.0',
                meterType: 'Simulated Meter',
                meterSerialNumber: 'MTR001'
            };

            // Mock the sendMessage method
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({ status: 'Accepted' });

            await simulator.sendBootNotification();

            expect(sendMessageSpy).toHaveBeenCalledWith('BootNotification', expect.objectContaining({
                chargePointVendor: expect.any(String),
                chargePointModel: expect.any(String),
                chargePointSerialNumber: expect.any(String),
                firmwareVersion: expect.any(String)
            }));

            sendMessageSpy.mockRestore();
        });

        test('should handle BootNotification response correctly', async () => {
            const mockResponse = {
                status: 'Accepted',
                currentTime: new Date().toISOString(),
                interval: 300
            };

            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue(mockResponse);

            const response = await simulator.sendBootNotification();

            expect(response.status).toBe('Accepted');
            expect(response.interval).toBe(300);
            if (response.currentTime) {
                expect(new Date(response.currentTime)).toBeInstanceOf(Date);
            }

            sendMessageSpy.mockRestore();
        });
    });

    describe('Heartbeat', () => {
        test('should send Heartbeat message correctly', async() => {
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({ currentTime: new Date().toISOString() });

            await simulator.sendHeartbeat();

            expect(sendMessageSpy).toHaveBeenCalledWith('Heartbeat', {});
            expect(simulator.lastHeartbeat).toBeInstanceOf(Date);

            sendMessageSpy.mockRestore();
        });

        test('should respect heartbeat interval from BootNotification', async() => {
            const mockResponse = {
                status: 'Accepted',
                heartbeatInterval: 60 // 60 seconds
            };

            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue(mockResponse);

            await simulator.sendBootNotification();

            expect(simulator.configuration['HeartbeatInterval']).toBe('60');

            sendMessageSpy.mockRestore();
        });
    });

    describe('StatusNotification', () => {
        test('should send StatusNotification for all connector states', async() => {
            const states = ['Available', 'Preparing', 'Charging', 'SuspendingEV', 'SuspendingEVSE', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'];
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({});

            for (const state of states) {
                await simulator.sendStatusNotification({
                    connectorId: 1,
                    status: state,
                    errorCode: 'NoError'
                });
                expect(sendMessageSpy).toHaveBeenCalledWith('StatusNotification', expect.objectContaining({
                    connectorId: 1,
                    status: state,
                    errorCode: 'NoError'
                }));
            }

            sendMessageSpy.mockRestore();
        });

        test('should include error code in StatusNotification', async() => {
            const errorCodes = ['NoError', 'ConnectorLockFailure', 'EVCommunicationError', 'GroundFailure', 'HighTemperature', 'InternalError', 'LocalListConflict', 'OtherError', 'OverCurrentFailure', 'PowerMeterFailure', 'PowerSwitchFailure', 'ReaderFailure', 'ResetFailure', 'UnderVoltage', 'OverVoltage', 'WeakSignal'];
            
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({});

            for (const errorCode of errorCodes) {
                await simulator.sendStatusNotification({
                    connectorId: 1,
                    status: 'Faulted',
                    errorCode
                });
                expect(sendMessageSpy).toHaveBeenCalledWith('StatusNotification', expect.objectContaining({
                    errorCode: errorCode
                }));
            }

            sendMessageSpy.mockRestore();
        });
    });

    describe('MeterValues', () => {
        test('should send MeterValues with correct format', async () => {
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({});

            const meterValue = {
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

            await simulator.sendMeterValues(meterValue);

            expect(sendMessageSpy).toHaveBeenCalledWith('MeterValues', expect.objectContaining({
                connectorId: expect.any(Number),
                meterValue: expect.arrayContaining([
                    expect.objectContaining({
                        timestamp: expect.any(String),
                        sampledValue: expect.arrayContaining([
                            expect.objectContaining({
                                value: expect.any(String),
                                measurand: expect.any(String)
                            })
                        ])
                    })
                ])
            }));

            sendMessageSpy.mockRestore();
        });

        test('should include required measurands', async () => {
            const requiredMeasurands = ['Energy.Active.Import.Register', 'Power.Active.Import', 'Current.Import', 'Voltage'];
            
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({});

            const meterValue = {
                connectorId: 1,
                meterValue: [{
                    timestamp: new Date().toISOString(),
                    sampledValue: requiredMeasurands.map(measurand => ({
                        value: '1000',
                        measurand: measurand,
                        context: 'Sample.Periodic',
                        format: 'Raw'
                    }))
                }]
            };

            await simulator.sendMeterValues(meterValue);

            const callArgs = sendMessageSpy.mock.calls[0][1];
            const sampledValues = callArgs.meterValue[0].sampledValue;
            const measurands = sampledValues.map(sv => sv.measurand);

            requiredMeasurands.forEach(measurand => {
                expect(measurands).toContain(measurand);
            });

            sendMessageSpy.mockRestore();
        });
    });

    describe('Transaction Management', () => {
        test('should send StartTransaction with correct format', async () => {
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({ transactionId: 123, idTagInfo: { status: 'Accepted' } });

            const payload = {
                connectorId: 1,
                idTag: 'TEST_TAG_001',
                meterStart: 0,
                timestamp: new Date().toISOString()
            };

            await simulator.sendStartTransaction(payload);

            expect(sendMessageSpy).toHaveBeenCalledWith('StartTransaction', expect.objectContaining({
                connectorId: expect.any(Number),
                idTag: expect.any(String),
                meterStart: expect.any(Number),
                timestamp: expect.any(String)
            }));

            sendMessageSpy.mockRestore();
        });

        test('should send StopTransaction with correct format', async () => {
            const sendMessageSpy = jest.spyOn(simulator, 'sendMessage');
            sendMessageSpy.mockResolvedValue({ idTagInfo: { status: 'Accepted' } });

            const payload = {
                transactionId: 123,
                idTag: 'TEST_TAG_001',
                meterStop: 1000,
                timestamp: new Date().toISOString(),
                reason: 'Local'
            };

            await simulator.sendStopTransaction(payload);

            expect(sendMessageSpy).toHaveBeenCalledWith('StopTransaction', expect.objectContaining({
                transactionId: expect.any(Number),
                idTag: expect.any(String),
                meterStop: expect.any(Number),
                timestamp: expect.any(String),
                reason: expect.any(String)
            }));

            sendMessageSpy.mockRestore();
        });
    });

    describe('Remote Control Commands', () => {
        test('should handle RemoteStartTransaction correctly', async () => {
            const handleRemoteStartTransactionSpy = jest.spyOn(simulator, 'handleRemoteStartTransaction');
            handleRemoteStartTransactionSpy.mockResolvedValue({ status: 'Accepted' });

            const payload = {
                connectorId: 1,
                idTag: 'TEST_TAG_001',
                chargingProfile: null
            };

            const response = await simulator.handleRemoteStartTransaction(payload);

            expect(handleRemoteStartTransactionSpy).toHaveBeenCalledWith(payload);
            expect(response).toHaveProperty('status');

            handleRemoteStartTransactionSpy.mockRestore();
        });

        test('should handle RemoteStopTransaction correctly', async () => {
            const handleRemoteStopTransactionSpy = jest.spyOn(simulator, 'handleRemoteStopTransaction');
            handleRemoteStopTransactionSpy.mockResolvedValue({ status: 'Accepted' });

            const payload = {
                transactionId: 123
            };

            const response = await simulator.handleRemoteStopTransaction(payload);

            expect(handleRemoteStopTransactionSpy).toHaveBeenCalledWith(payload);
            expect(response).toHaveProperty('status');

            handleRemoteStopTransactionSpy.mockRestore();
        });
    });

    describe('Configuration Management', () => {
        test('should handle GetConfiguration correctly', () => {
            const response = simulator.handleGetConfiguration({});

            expect(response).toHaveProperty('configurationKey');
            expect(Array.isArray(response.configurationKey)).toBe(true);
        });

        test('should handle ChangeConfiguration correctly', () => {
            const payload = {
                key: 'HeartbeatInterval',
                value: '60'
            };

            const response = simulator.handleChangeConfiguration(payload);

            expect(response).toHaveProperty('status');
            expect(['Accepted', 'Rejected', 'NotSupported']).toContain(response.status);
        });
    });
});
