import { jest } from '@jest/globals';
import { OCPP201Simulator } from '../../../simulator/protocols/OCPP201Simulator.js';

describe('OCPP 2.0.1 Compliance Tests', () => {
    let simulator;

    beforeEach(() => {
        simulator = new OCPP201Simulator({
            stationId: 'TEST_OCPP201_001',
            csmsUrl: 'ws://mock-csms:9220'
        });
        simulator.isConnected = true;
    });

    describe('BootNotification', () => {
        test('should send BootNotification with required fields', async() => {
            const sendSpy = jest.spyOn(simulator, 'sendMessage').mockResolvedValue({
                status: 'Accepted',
                currentTime: new Date().toISOString(),
                interval: 300
            });

            await simulator.sendBootNotification();

            expect(sendSpy).toHaveBeenCalledWith('BootNotification', expect.objectContaining({
                reason: expect.any(String),
                chargingStation: expect.objectContaining({
                    serialNumber: expect.any(String),
                    model: expect.any(String),
                    vendorName: expect.any(String)
                })
            }));

            sendSpy.mockRestore();
        });
    });

    describe('Heartbeat', () => {
        test('should send Heartbeat request', async() => {
            const sendSpy = jest.spyOn(simulator, 'sendMessage').mockResolvedValue({
                currentTime: new Date().toISOString()
            });

            await simulator.sendHeartbeat();

            expect(sendSpy).toHaveBeenCalledWith('Heartbeat', {});
            sendSpy.mockRestore();
        });
    });

    describe('StatusNotification', () => {
        test('should send StatusNotification with components', async() => {
            const sendSpy = jest.spyOn(simulator, 'sendMessage').mockResolvedValue({});

            await simulator.sendStatusNotification({
                timestamp: new Date().toISOString(),
                connectorStatus: [{
                    connectorId: 1,
                    status: 'Available',
                    evseId: 1
                }]
            });

            expect(sendSpy).toHaveBeenCalledWith('StatusNotification', expect.objectContaining({
                timestamp: expect.any(String),
                connectorStatus: expect.arrayContaining([
                    expect.objectContaining({
                        connectorId: expect.any(Number),
                        status: expect.any(String)
                    })
                ])
            }));

            sendSpy.mockRestore();
        });
    });

    describe('MeterValues', () => {
        test('should send MeterValues with sampled data', async() => {
            const sendSpy = jest.spyOn(simulator, 'sendMessage').mockResolvedValue({});

            await simulator.sendMeterValues({
                evseId: 1,
                meterValue: [{
                    timestamp: new Date().toISOString(),
                    sampledValue: [{
                        value: '7.4',
                        measurand: 'Power.Active.Import',
                        phase: 'L1',
                        unitOfMeasure: { unit: 'kW' }
                    }]
                }]
            });

            expect(sendSpy).toHaveBeenCalledWith('MeterValues', expect.objectContaining({
                meterValue: expect.arrayContaining([
                    expect.objectContaining({
                        sampledValue: expect.arrayContaining([
                            expect.objectContaining({
                                value: expect.any(String),
                                measurand: expect.any(String)
                            })
                        ])
                    })
                ])
            }));

            sendSpy.mockRestore();
        });
    });

    describe('Smart Charging', () => {
        test('should store charging profile when SetChargingProfile called', () => {
            const response = simulator.handleSetChargingProfile({
                evseId: 1,
                chargingProfile: {
                    id: 99,
                    stackLevel: 1,
                    chargingProfileKind: 'Absolute',
                    chargingSchedule: {
                        chargingSchedulePeriod: [{
                            startPeriod: 0,
                            limit: 32
                        }]
                    }
                }
            });

            expect(response.status).toBe('Accepted');
            expect(simulator.chargingProfiles.has(99)).toBe(true);
        });

        test('should return matching profiles from GetChargingProfiles', () => {
            const chargingProfile = {
                id: 101,
                stackLevel: 1,
                chargingProfileKind: 'Absolute',
                chargingSchedule: {
                    chargingSchedulePeriod: [{
                        startPeriod: 0,
                        limit: 16
                    }]
                }
            };

            simulator.handleSetChargingProfile({ evseId: 2, chargingProfile });

            const response = simulator.handleGetChargingProfiles({ evseId: 2 });

            expect(response.status).toBe('Accepted');
            expect(response.chargingProfiles).toEqual(expect.arrayContaining([chargingProfile]));
        });

        test('should clear charging profiles', () => {
            simulator.handleSetChargingProfile({
                evseId: 3,
                chargingProfile: { id: 77, stackLevel: 1, chargingProfileKind: 'Absolute' }
            });

            const response = simulator.handleClearChargingProfile({ chargingProfileId: 77 });

            expect(response.status).toBe('Accepted');
            expect(simulator.chargingProfiles.has(77)).toBe(false);
        });
    });

    describe('Device Management', () => {
        test('should report UnknownVariable when configuration missing', () => {
            const result = simulator.handleGetVariables({
                getVariableData: [{
                    component: { name: 'ChargingStation' },
                    variable: { name: 'UnknownSetting' },
                    attributeType: 'Actual'
                }]
            });

            expect(result.getVariableResult[0].attributeStatus).toBe('UnknownVariable');
        });

        test('should respond to TriggerMessage with NotImplemented for unsupported actions', async() => {
            const response = await simulator.handleTriggerMessage({
                requestedMessage: 'FirmwareStatusNotification',
                evse: null
            });

            expect(response.status).toBe('NotImplemented');
        });
    });

    describe('Error handling', () => {
        test('should propagate sendMessage errors', async() => {
            const sendSpy = jest.spyOn(simulator, 'sendMessage').mockRejectedValue(new Error('network error'));

            await expect(simulator.sendTransactionEvent({})).rejects.toThrow('network error');

            sendSpy.mockRestore();
        });
    });
});
