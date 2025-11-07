import { SimulationManager } from '../../../simulator/SimulationManager.js';
import { StationSimulator } from '../../../simulator/StationSimulator.js';
import { OCPP16JSimulator } from '../../../simulator/protocols/OCPP16JSimulator.js';
import { OCPP201Simulator } from '../../../simulator/protocols/OCPP201Simulator.js';
import logger from '../../../utils/logger.js';

describe('CSMS Integration Tests', () => {
  let simulationManager;
  let testStation16J;
  let testStation201;

  // CSMS Configuration
  const CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';
  const TEST_TIMEOUT = 30000; // 30 seconds

  beforeAll(async () => {
    simulationManager = new SimulationManager();
  });

  afterAll(async () => {
    // Clean up all test stations
    await simulationManager.removeAllStations();
  });

  describe('OCPP 1.6J Integration', () => {
    beforeEach(async () => {
      // Create OCPP 1.6J test station
      testStation16J = await simulationManager.createStation({
        stationId: 'TEST_OCPP16J_001',
        vendor: 'TestVendor',
        model: 'TestModel16J',
        ocppVersion: '1.6J',
        connectorCount: 2,
        maxPower: 22000,
        csmsUrl: CSMS_URL,
        heartbeatInterval: 60
      });
    });

    afterEach(async () => {
      if (testStation16J) {
        await testStation16J.stop();
        await simulationManager.removeStation(testStation16J.stationId);
      }
    });

    test('Should connect to CSMS with OCPP 1.6J', async () => {
      await testStation16J.start();
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, TEST_TIMEOUT);

        testStation16J.on('csmsConnected', () => {
          clearTimeout(timeout);
          resolve();
        });

        testStation16J.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      expect(testStation16J.isOnline).toBe(true);
      expect(testStation16J.ocppClient.getStatus().connected).toBe(true);
    }, TEST_TIMEOUT);

    test('Should send BootNotification and receive Accepted', async () => {
      await testStation16J.start();

      // Wait for boot notification acceptance
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Boot notification timeout'));
        }, TEST_TIMEOUT);

        testStation16J.on('csmsConnected', () => {
          // Check boot notification status
          const ocppStatus = testStation16J.ocppClient.getStatus();
          if (ocppStatus.bootStatus === 'Accepted') {
            clearTimeout(timeout);
            resolve();
          } else {
            clearTimeout(timeout);
            reject(new Error(`Boot notification ${ocppStatus.bootStatus}`));
          }
        });
      });

      const status = testStation16J.ocppClient.getStatus();
      expect(status.bootStatus).toBe('Accepted');
    }, TEST_TIMEOUT);

    test('Should send heartbeat messages', async () => {
      await testStation16J.start();

      // Wait for initial connection
      await new Promise(resolve => {
        testStation16J.on('csmsConnected', resolve);
      });

      // Wait for at least one heartbeat
      await new Promise((resolve) => {
        setTimeout(() => {
          const status = testStation16J.ocppClient.getStatus();
          expect(status.lastHeartbeat).toBeTruthy();
          resolve();
        }, 65000); // Wait slightly longer than heartbeat interval
      });
    }, 70000);

    test('Should handle vehicle connection and charging flow', async () => {
      await testStation16J.start();

      // Wait for connection
      await new Promise(resolve => {
        testStation16J.on('csmsConnected', resolve);
      });

      // Connect vehicle
      await testStation16J.vehicleSimulator.connectVehicle(1, {
        vehicleType: 'sedan',
        initialSoC: 30,
        targetSoC: 80,
        idTag: 'TEST_RFID_001'
      });

      // Start charging
      await testStation16J.startChargingSession(1, 'TEST_RFID_001');

      // Verify charging started
      const connector = testStation16J.getConnector(1);
      expect(connector.status).toBe('Occupied');
      expect(connector.transaction).toBeTruthy();
      expect(connector.transaction.idTag).toBe('TEST_RFID_001');

      // Stop charging
      await testStation16J.stopChargingSession(1);

      // Verify charging stopped
      expect(connector.status).toBe('Available');
      expect(connector.transaction).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('OCPP 2.0.1 Integration', () => {
    beforeEach(async () => {
      // Create OCPP 2.0.1 test station
      testStation201 = await simulationManager.createStation({
        stationId: 'TEST_OCPP201_001',
        vendor: 'TestVendor',
        model: 'TestModel201',
        ocppVersion: '2.0.1',
        connectorCount: 2,
        maxPower: 50000,
        csmsUrl: CSMS_URL,
        heartbeatInterval: 60
      });
    });

    afterEach(async () => {
      if (testStation201) {
        await testStation201.stop();
        await simulationManager.removeStation(testStation201.stationId);
      }
    });

    test('Should connect to CSMS with OCPP 2.0.1', async () => {
      await testStation201.start();
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, TEST_TIMEOUT);

        testStation201.on('csmsConnected', () => {
          clearTimeout(timeout);
          resolve();
        });

        testStation201.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      expect(testStation201.isOnline).toBe(true);
      expect(testStation201.ocppClient.getStatus().connected).toBe(true);
    }, TEST_TIMEOUT);

    test('Should send BootNotification and receive Accepted', async () => {
      await testStation201.start();

      // Wait for boot notification acceptance
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Boot notification timeout'));
        }, TEST_TIMEOUT);

        testStation201.on('csmsConnected', () => {
          const ocppStatus = testStation201.ocppClient.getStatus();
          if (ocppStatus.bootStatus === 'Accepted') {
            clearTimeout(timeout);
            resolve();
          } else {
            clearTimeout(timeout);
            reject(new Error(`Boot notification ${ocppStatus.bootStatus}`));
          }
        });
      });

      const status = testStation201.ocppClient.getStatus();
      expect(status.bootStatus).toBe('Accepted');
    }, TEST_TIMEOUT);

    test('Should handle TransactionEvent messages', async () => {
      await testStation201.start();

      // Wait for connection
      await new Promise(resolve => {
        testStation201.on('csmsConnected', resolve);
      });

      // Connect vehicle and start charging
      await testStation201.vehicleSimulator.connectVehicle(1, {
        vehicleType: 'suv',
        initialSoC: 20,
        targetSoC: 90,
        idTag: 'TEST_TOKEN_201'
      });

      await testStation201.startChargingSession(1, 'TEST_TOKEN_201');

      // Verify transaction started
      const connector = testStation201.getConnector(1);
      expect(connector.status).toBe('Occupied');
      expect(connector.transaction).toBeTruthy();

      // Stop charging
      await testStation201.stopChargingSession(1);
      expect(connector.status).toBe('Available');
    }, TEST_TIMEOUT);
  });

  describe('Protocol Switching', () => {
    test('Should switch from OCPP 1.6J to 2.0.1', async () => {
      // Create 1.6J station
      const station = await simulationManager.createStation({
        stationId: 'TEST_PROTOCOL_SWITCH',
        ocppVersion: '1.6J',
        csmsUrl: CSMS_URL
      });

      // Start with 1.6J
      await station.start();
      await new Promise(resolve => station.on('csmsConnected', resolve));
      
      expect(station.config.ocppVersion).toBe('1.6J');
      expect(station.ocppClient.getStatus().protocol).toBe('OCPP 1.6J');

      // Stop station
      await station.stop();

      // Switch to 2.0.1
      await station.switchProtocol('2.0.1');
      expect(station.config.ocppVersion).toBe('2.0.1');

      // Start with 2.0.1
      await station.start();
      await new Promise(resolve => station.on('csmsConnected', resolve));
      
      expect(station.ocppClient.getStatus().protocol).toBe('OCPP 2.0.1');

      // Cleanup
      await station.stop();
      await simulationManager.removeStation(station.stationId);
    }, 60000);
  });

  describe('Multi-Station Load Test', () => {
    test('Should handle multiple concurrent stations', async () => {
      const stationCount = 5;
      const stations = [];

      try {
        // Create multiple stations
        for (let i = 0; i < stationCount; i++) {
          const station = await simulationManager.createStation({
            stationId: `LOAD_TEST_${i}`,
            ocppVersion: i % 2 === 0 ? '1.6J' : '2.0.1',
            csmsUrl: CSMS_URL,
            connectorCount: 1,
            maxPower: 7400
          });
          stations.push(station);
        }

        // Start all stations
        await Promise.all(stations.map(station => station.start()));

        // Wait for all connections
        await Promise.all(stations.map(station => 
          new Promise(resolve => station.on('csmsConnected', resolve))
        ));

        // Verify all connected
        stations.forEach(station => {
          expect(station.isOnline).toBe(true);
        });

        // Start charging on all stations
        await Promise.all(stations.map(async (station, index) => {
          await station.vehicleSimulator.connectVehicle(1, {
            vehicleType: 'compact',
            idTag: `LOAD_TEST_TAG_${index}`
          });
          await station.startChargingSession(1, `LOAD_TEST_TAG_${index}`);
        }));

        // Verify all charging
        stations.forEach(station => {
          const connector = station.getConnector(1);
          expect(connector.status).toBe('Occupied');
          expect(connector.transaction).toBeTruthy();
        });

      } finally {
        // Cleanup all stations
        await Promise.all(stations.map(async station => {
          await station.stop();
          await simulationManager.removeStation(station.stationId);
        }));
      }
    }, 120000); // 2 minutes timeout for load test
  });

  describe('Error Handling', () => {
    test('Should handle CSMS disconnection gracefully', async () => {
      const station = await simulationManager.createStation({
        stationId: 'TEST_DISCONNECT',
        ocppVersion: '1.6J',
        csmsUrl: 'ws://localhost:9999', // Invalid CSMS URL
        heartbeatInterval: 60
      });

      // Attempt to start with invalid CSMS
      await expect(station.start()).rejects.toThrow();
      
      expect(station.isOnline).toBe(false);

      // Update to correct CSMS URL
      station.config.csmsUrl = CSMS_URL;
      await station.initializeOCPPClient();

      // Should connect successfully now
      await station.start();
      await new Promise(resolve => station.on('csmsConnected', resolve));
      
      expect(station.isOnline).toBe(true);

      // Cleanup
      await station.stop();
      await simulationManager.removeStation(station.stationId);
    }, TEST_TIMEOUT);

    test('Should handle invalid OCPP messages', async () => {
      const station = await simulationManager.createStation({
        stationId: 'TEST_INVALID_MSG',
        ocppVersion: '1.6J',
        csmsUrl: CSMS_URL
      });

      await station.start();
      await new Promise(resolve => station.on('csmsConnected', resolve));

      // Test sending invalid message (this should be handled gracefully)
      try {
        await station.ocppClient.sendMessage('InvalidAction', {});
      } catch (error) {
        expect(error.message).toContain('timeout');
      }

      // Station should still be connected
      expect(station.isOnline).toBe(true);

      // Cleanup
      await station.stop();
      await simulationManager.removeStation(station.stationId);
    }, TEST_TIMEOUT);
  });
});
