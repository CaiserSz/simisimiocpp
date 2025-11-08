import { SimulationManager } from '../../simulator/SimulationManager.js';
import { VehicleSimulator } from '../../simulator/VehicleSimulator.js';
import { StationSimulator } from '../../simulator/StationSimulator.js';

const CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';
const runSimulatorSuite = process.env.SIM_FUNCTIONAL_TESTS === 'true';
const describeOrSkip = runSimulatorSuite ? describe : describe.skip;

describeOrSkip('Simulator Functionality Tests', () => {
  let simulationManager;

  beforeAll(() => {
    simulationManager = new SimulationManager();
  });

  afterEach(async () => {
    // Clean up after each test
    await simulationManager.removeAllStations();
  });

  describe('Station Creation and Management', () => {
    test('Should create station with custom configuration', async () => {
      const config = {
        stationId: 'SIM_TEST_001',
        vendor: 'TestVendor',
        model: 'TestModel',
        ocppVersion: '1.6J',
        connectorCount: 2,
        maxPower: 22000,
        csmsUrl: CSMS_URL
      };

      const station = await simulationManager.createStation(config);

      expect(station.stationId).toBe(config.stationId);
      expect(station.config.vendor).toBe(config.vendor);
      expect(station.config.ocppVersion).toBe(config.ocppVersion);
      expect(station.connectors).toHaveLength(2);
    });

    test('Should create stations from predefined profile', async () => {
      const stations = await simulationManager.createStationsFromProfile('urban_ac', 3, {
        csmsUrl: CSMS_URL
      });

      expect(stations).toHaveLength(3);
      stations.forEach(station => {
        expect(station.config.maxPower).toBe(7400); // Urban AC power
        expect(station.config.connectorCount).toBe(2);
        expect(station.config.ocppVersion).toBe('1.6J');
      });
    });

    test('Should get all station profiles', () => {
      const profiles = simulationManager.getProfiles();
      
      expect(profiles).toHaveProperty('urban_ac');
      expect(profiles).toHaveProperty('urban_dc_fast');
      expect(profiles).toHaveProperty('highway_ultra_fast');
      expect(profiles).toHaveProperty('workplace_ac');
      expect(profiles).toHaveProperty('home_wallbox');
    });

    test('Should get all predefined scenarios', () => {
      const scenarios = simulationManager.getScenarios();
      
      expect(scenarios).toHaveProperty('urban_mixed');
      expect(scenarios).toHaveProperty('highway_corridor');
      expect(scenarios).toHaveProperty('workplace_daily');
      expect(scenarios).toHaveProperty('load_test');
    });
  });

  describe('Vehicle Simulation', () => {
    let testStation;

    beforeEach(async () => {
      testStation = await simulationManager.createStation({
        stationId: 'VEHICLE_TEST',
        ocppVersion: '1.6J',
        connectorCount: 2,
        csmsUrl: CSMS_URL
      });
    });

    test('Should connect vehicle with different profiles', async () => {
      const vehicleTypes = ['compact', 'sedan', 'suv', 'delivery'];

      for (const vehicleType of vehicleTypes) {
        const vehicle = await testStation.vehicleSimulator.connectVehicle(1, {
          vehicleType,
          initialSoC: 30,
          targetSoC: 80
        });

        expect(vehicle.profile.name).toBeTruthy();
        expect(vehicle.currentSoC).toBe(30);
        expect(vehicle.targetSoC).toBe(80);
        expect(vehicle.cableConnected).toBe(true);

        // Disconnect for next test
        await testStation.vehicleSimulator.disconnectVehicle(1);
      }
    });

    test('Should simulate realistic charging curves', async () => {
      const vehicle = await testStation.vehicleSimulator.connectVehicle(1, {
        vehicleType: 'sedan',
        initialSoC: 20,
        targetSoC: 90
      });

      // Check charging power at different SoC levels
      const power20 = testStation.vehicleSimulator.getChargingPower(1);
      
      // Simulate SoC increase
      vehicle.currentSoC = 80;
      const power80 = testStation.vehicleSimulator.getChargingPower(1);
      
      vehicle.currentSoC = 95;
      const power95 = testStation.vehicleSimulator.getChargingPower(1);

      // Power should decrease as SoC increases
      expect(power80).toBeLessThan(power20);
      expect(power95).toBeLessThan(power80);
    });

    test('Should handle vehicle scenarios', async () => {
      await testStation.vehicleSimulator.connectVehicle(1, {
        vehicleType: 'compact',
        initialSoC: 50,
        targetSoC: 80
      });

      // Test emergency stop scenario
      await testStation.vehicleSimulator.simulateUserScenario(1, 'emergency_stop');
      
      const vehicleStatus = testStation.vehicleSimulator.getVehicleStatus(1);
      expect(vehicleStatus.chargingEnabled).toBe(false);
    });
  });

  describe('Charging Session Management', () => {
    let testStation;

    beforeEach(async () => {
      testStation = await simulationManager.createStation({
        stationId: 'CHARGING_TEST',
        ocppVersion: '1.6J',
        connectorCount: 2,
        csmsUrl: 'ws://localhost:9220'
      });
    });

    test('Should start and stop charging session', async () => {
      // Connect vehicle
      await testStation.vehicleSimulator.connectVehicle(1, {
        vehicleType: 'sedan',
        initialSoC: 25,
        targetSoC: 85,
        idTag: 'TEST_RFID_123'
      });

      // Start charging
      await testStation.startChargingSession(1, 'TEST_RFID_123');

      const connector = testStation.getConnector(1);
      expect(connector.status).toBe('Occupied');
      expect(connector.transaction).toBeTruthy();
      expect(connector.transaction.idTag).toBe('TEST_RFID_123');

      // Stop charging
      await testStation.stopChargingSession(1);

      expect(connector.status).toBe('Available');
      expect(connector.transaction).toBeNull();
    });

    test('Should handle multiple connectors', async () => {
      // Connect vehicles to both connectors
      await testStation.vehicleSimulator.connectVehicle(1, {
        vehicleType: 'compact',
        idTag: 'RFID_001'
      });

      await testStation.vehicleSimulator.connectVehicle(2, {
        vehicleType: 'suv', 
        idTag: 'RFID_002'
      });

      // Start charging on both
      await testStation.startChargingSession(1, 'RFID_001');
      await testStation.startChargingSession(2, 'RFID_002');

      const connector1 = testStation.getConnector(1);
      const connector2 = testStation.getConnector(2);

      expect(connector1.status).toBe('Occupied');
      expect(connector2.status).toBe('Occupied');
      expect(connector1.transaction.idTag).toBe('RFID_001');
      expect(connector2.transaction.idTag).toBe('RFID_002');
    });
  });

  describe('Statistics and Monitoring', () => {
    test('Should track simulation statistics', async () => {
      // Create multiple stations
      await simulationManager.createStationsFromProfile('urban_ac', 3);
      await simulationManager.createStationsFromProfile('urban_dc_fast', 2);

      const stats = simulationManager.getStatistics();

      expect(stats.totalStations).toBe(5);
      expect(stats.protocolDistribution['OCPP 1.6J']).toBe(3);
      expect(stats.protocolDistribution['OCPP 2.0.1']).toBe(2);
    });

    test('Should export and import configuration', async () => {
      // Create test configuration
      await simulationManager.createStation({
        stationId: 'EXPORT_TEST',
        vendor: 'ExportVendor',
        model: 'ExportModel',
        ocppVersion: '2.0.1'
      });

      // Export configuration
      const config = simulationManager.exportConfiguration();

      expect(config.stations).toHaveLength(1);
      expect(config.stations[0].stationId).toBe('EXPORT_TEST');

      // Clear and import
      await simulationManager.removeAllStations();
      await simulationManager.importConfiguration(config);

      // Verify import
      const station = simulationManager.getStation('EXPORT_TEST');
      expect(station).toBeTruthy();
      expect(station.config.vendor).toBe('ExportVendor');
    });
  });

  describe('Protocol Switching', () => {
    test('Should switch protocol on stopped station', async () => {
      const station = await simulationManager.createStation({
        stationId: 'PROTOCOL_SWITCH_TEST',
        ocppVersion: '1.6J',
        csmsUrl: 'ws://localhost:9220'
      });

      expect(station.config.ocppVersion).toBe('1.6J');

      // Switch to 2.0.1
      await station.switchProtocol('2.0.1');
      expect(station.config.ocppVersion).toBe('2.0.1');

      // Switch back to 1.6J
      await station.switchProtocol('1.6J');
      expect(station.config.ocppVersion).toBe('1.6J');
    });

    test('Should reject protocol switch on running station', async () => {
      const station = await simulationManager.createStation({
        stationId: 'RUNNING_PROTOCOL_TEST',
        ocppVersion: '1.6J',
        csmsUrl: 'ws://localhost:9220'
      });

      // Simulate running state
      station.isOnline = true;

      await expect(station.switchProtocol('2.0.1')).rejects.toThrow(
        'Cannot switch protocol while station is online'
      );
    });
  });

  describe('Scenario Execution', () => {
    test('Should run predefined scenario', async () => {
      // Run urban mixed scenario
      await simulationManager.runScenario('urban_mixed', {
        clearExisting: true,
        manualStop: true // Don't auto-stop for test
      });

      const stats = simulationManager.getStatistics();
      
      // Urban mixed scenario should create 13 stations (10 AC + 3 DC)
      expect(stats.totalStations).toBe(13);
      expect(stats.protocolDistribution['OCPP 1.6J']).toBe(10); // Urban AC
      expect(stats.protocolDistribution['OCPP 2.0.1']).toBe(3); // Urban DC Fast
    });

    test('Should handle scenario events', async () => {
      let eventFired = false;

      simulationManager.on('scenarioEvent', (event) => {
        if (event.action === 'peak_hour_start') {
          eventFired = true;
        }
      });

      // Create a simple scenario event
      simulationManager.executeScenarioEvent({ action: 'peak_hour_start' });

      expect(eventFired).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid station creation', async () => {
      await expect(
        simulationManager.createStation({
          // Missing required fields
          stationId: 'INVALID_TEST'
          // No CSMS URL
        })
      ).rejects.toThrow();
    });

    test('Should handle invalid profile ID', async () => {
      await expect(
        simulationManager.createStationsFromProfile('non_existent_profile', 1)
      ).rejects.toThrow('Profile not found');
    });

    test('Should handle invalid scenario ID', async () => {
      await expect(
        simulationManager.runScenario('non_existent_scenario')
      ).rejects.toThrow('Scenario not found');
    });

    test('Should handle vehicle connection to non-existent connector', async () => {
      const station = await simulationManager.createStation({
        stationId: 'ERROR_TEST',
        connectorCount: 2,
        csmsUrl: 'ws://localhost:9220'
      });

      await expect(
        station.vehicleSimulator.connectVehicle(5, { vehicleType: 'sedan' })
      ).rejects.toThrow();
    });
  });
});
