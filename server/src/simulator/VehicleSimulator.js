import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * EV Vehicle Simulator
 * Simulates electric vehicle behavior and interactions with charging station
 */
export class VehicleSimulator {
  constructor(stationSimulator) {
    this.station = stationSimulator;
    this.connectedVehicles = new Map(); // connectorId -> vehicle
    
    // Vehicle profiles for different simulation scenarios
    this.vehicleProfiles = {
      'compact': {
        name: 'Compact EV',
        batteryCapacity: 40, // kWh
        maxChargingPower: 7400, // W (AC)
        chargingCurve: this.generateChargingCurve('compact'),
        plugType: 'Type2',
        efficiency: 5.5, // km/kWh
        range: 220 // km
      },
      'sedan': {
        name: 'Sedan EV',
        batteryCapacity: 75, // kWh
        maxChargingPower: 11000, // W (AC)
        chargingCurve: this.generateChargingCurve('sedan'),
        plugType: 'Type2',
        efficiency: 4.8, // km/kWh
        range: 360 // km
      },
      'suv': {
        name: 'SUV EV',
        batteryCapacity: 95, // kWh
        maxChargingPower: 22000, // W (AC)
        chargingCurve: this.generateChargingCurve('suv'),
        plugType: 'Type2',
        efficiency: 4.2, // km/kWh
        range: 400 // km
      },
      'delivery': {
        name: 'Delivery Van',
        batteryCapacity: 60, // kWh
        maxChargingPower: 11000, // W (AC)
        chargingCurve: this.generateChargingCurve('delivery'),
        plugType: 'Type2',
        efficiency: 3.8, // km/kWh
        range: 228 // km
      }
    };
  }

  /**
   * Generate realistic charging curve for vehicle type
   */
  generateChargingCurve(vehicleType) {
    // Realistic charging curves (Power % based on SoC %)
    const curves = {
      'compact': [
        { soc: 0, powerPercent: 100 },
        { soc: 50, powerPercent: 100 },
        { soc: 80, powerPercent: 60 },
        { soc: 90, powerPercent: 30 },
        { soc: 95, powerPercent: 15 },
        { soc: 100, powerPercent: 0 }
      ],
      'sedan': [
        { soc: 0, powerPercent: 100 },
        { soc: 60, powerPercent: 100 },
        { soc: 80, powerPercent: 70 },
        { soc: 90, powerPercent: 40 },
        { soc: 95, powerPercent: 20 },
        { soc: 100, powerPercent: 0 }
      ],
      'suv': [
        { soc: 0, powerPercent: 100 },
        { soc: 70, powerPercent: 100 },
        { soc: 85, powerPercent: 75 },
        { soc: 92, powerPercent: 45 },
        { soc: 97, powerPercent: 25 },
        { soc: 100, powerPercent: 0 }
      ],
      'delivery': [
        { soc: 0, powerPercent: 100 },
        { soc: 55, powerPercent: 100 },
        { soc: 75, powerPercent: 80 },
        { soc: 85, powerPercent: 50 },
        { soc: 92, powerPercent: 25 },
        { soc: 100, powerPercent: 0 }
      ]
    };

    return curves[vehicleType];
  }

  /**
   * Connect vehicle to charging station
   */
  async connectVehicle(connectorId, options = {}) {
    // Input validation
    if (!connectorId || connectorId < 1) {
      throw new Error('Invalid connector ID');
    }
    
    const vehicleProfile = options.vehicleType || 'sedan';
    if (!this.vehicleProfiles[vehicleProfile]) {
      throw new Error(`Invalid vehicle type: ${vehicleProfile}`);
    }
    
    const initialSoC = options.initialSoC !== undefined ? options.initialSoC : this.randomBetween(10, 60);
    const targetSoC = options.targetSoC !== undefined ? options.targetSoC : this.randomBetween(80, 100);
    
    // Validate SoC values
    if (initialSoC < 0 || initialSoC > 100) {
      throw new Error('Initial SoC must be between 0 and 100');
    }
    if (targetSoC < 0 || targetSoC > 100) {
      throw new Error('Target SoC must be between 0 and 100');
    }
    if (initialSoC >= targetSoC) {
      throw new Error('Target SoC must be greater than initial SoC');
    }
    
    const vehicle = {
      id: options.vehicleId || `EV_${uuidv4().substring(0, 8)}`,
      profile: this.vehicleProfiles[vehicleProfile],
      connectorId,
      
      // Battery state
      currentSoC: initialSoC, // Current State of Charge (%)
      targetSoC: targetSoC, // Target State of Charge (%)
      
      // Charging session info
      idTag: options.idTag || `TAG_${Date.now()}`,
      connectionTime: new Date(),
      chargingStartTime: null,
      
      // Physical connection
      cableConnected: false,
      authenticated: false,
      chargingEnabled: false,
      
      // Simulation state
      connectionDelay: options.connectionDelay || this.randomBetween(2, 8), // seconds
      authDelay: options.authDelay || this.randomBetween(1, 3), // seconds
      
      // User behavior simulation
      userPresent: options.userPresent !== false, // Default: user is present
      userScenario: options.userScenario || 'normal' // normal, hasty, careful
    };

    this.connectedVehicles.set(connectorId, vehicle);

    logger.info(`🚗 Vehicle connected to connector ${connectorId}: ${vehicle.profile.name} (SoC: ${initialSoC}%)`);

    // Simulate physical connection process
    await this.simulateConnectionProcess(vehicle);

    return vehicle;
  }

  /**
   * Simulate the physical connection process
   */
  async simulateConnectionProcess(vehicle) {
    const { connectorId, connectionDelay, authDelay } = vehicle;

    // Phase 1: Cable connection
    logger.info(`🔌 Simulating cable connection for connector ${connectorId}...`);
    
    await this.sleep(connectionDelay * 1000);
    
    vehicle.cableConnected = true;
    this.station.emit('vehicleCableConnected', {
      stationId: this.station.stationId,
      connectorId,
      vehicleId: vehicle.id
    });

    // Update connector status to Preparing
    const connector = this.station.getConnector(connectorId);
    if (connector) {
      connector.status = 'Preparing';
      await this.station.sendStatusNotification(connectorId, 'Preparing', 'NoError');
    }

    // Phase 2: Authentication simulation
    if (vehicle.userPresent) {
      logger.info(`👤 Simulating user authentication for connector ${connectorId}...`);
      
      await this.sleep(authDelay * 1000);
      
      vehicle.authenticated = true;
      this.station.emit('vehicleAuthenticated', {
        stationId: this.station.stationId,
        connectorId,
        vehicleId: vehicle.id,
        idTag: vehicle.idTag
      });

      // Send Authorize request to CSMS
      try {
        const authResponse = await this.station.ocppClient.sendAuthorize({
          idTag: vehicle.idTag
        });

        if (authResponse.idTagInfo?.status === 'Accepted') {
          vehicle.chargingEnabled = true;
          logger.info(`✅ Vehicle authorized for charging: ${vehicle.id}`);
        } else {
          logger.warn(`❌ Vehicle authorization failed: ${vehicle.id}`);
          vehicle.chargingEnabled = false;
        }
      } catch (error) {
        logger.error('Authorization error:', error);
        vehicle.chargingEnabled = false;
      }
    }
  }

  /**
   * Disconnect vehicle from charging station
   */
  async disconnectVehicle(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) {
      logger.warn(`No vehicle connected to connector ${connectorId}`);
      return;
    }

    logger.info(`🚗 Disconnecting vehicle ${vehicle.id} from connector ${connectorId}`);

    // Simulate disconnection process
    await this.simulateDisconnectionProcess(vehicle);

    // Remove vehicle from connected vehicles
    this.connectedVehicles.delete(connectorId);

    this.station.emit('vehicleDisconnected', {
      stationId: this.station.stationId,
      connectorId,
      vehicleId: vehicle.id,
      finalSoC: vehicle.currentSoC,
      chargingDuration: vehicle.chargingStartTime ? 
        (new Date() - vehicle.chargingStartTime) / 1000 : 0
    });
  }

  /**
   * Simulate disconnection process
   */
  async simulateDisconnectionProcess(vehicle) {
    const { connectorId } = vehicle;

    // Different disconnection scenarios based on user behavior
    let disconnectionDelay = 2; // seconds

    switch (vehicle.userScenario) {
      case 'hasty':
        disconnectionDelay = 1; // Quick disconnection
        break;
      case 'careful':
        disconnectionDelay = 5; // Careful disconnection
        break;
      case 'normal':
      default:
        disconnectionDelay = this.randomBetween(2, 4);
    }

    logger.info(`🔌 Simulating cable disconnection for connector ${connectorId}...`);
    await this.sleep(disconnectionDelay * 1000);

    vehicle.cableConnected = false;
  }

  /**
   * Get charging power based on vehicle profile and current SoC
   */
  getChargingPower(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle || !vehicle.chargingEnabled) {
      return 0;
    }

    const { profile, currentSoC } = vehicle;
    
    // Find appropriate point in charging curve
    const chargingCurve = profile.chargingCurve;
    let powerPercent = 0;

    for (let i = 0; i < chargingCurve.length - 1; i++) {
      const current = chargingCurve[i];
      const next = chargingCurve[i + 1];

      if (currentSoC >= current.soc && currentSoC <= next.soc) {
        // Linear interpolation
        const socRange = next.soc - current.soc;
        const powerRange = next.powerPercent - current.powerPercent;
        const socPosition = (currentSoC - current.soc) / socRange;
        
        powerPercent = current.powerPercent + (powerRange * socPosition);
        break;
      }
    }

    // Calculate actual power
    const maxPower = Math.min(profile.maxChargingPower, this.station.config.maxPower);
    const actualPower = maxPower * (powerPercent / 100);

    // Add some realistic variation (±2%)
    const variation = (Math.random() - 0.5) * 0.04;
    return actualPower * (1 + variation);
  }

  /**
   * Update vehicle SoC based on charging
   */
  updateVehicleSoC(connectorId, energyDelivered) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return;

    const { profile } = vehicle;
    
    // Calculate SoC increase
    const socIncrease = (energyDelivered / profile.batteryCapacity) * 100;
    vehicle.currentSoC = Math.min(vehicle.currentSoC + socIncrease, 100);

    // Check if target SoC reached
    if (vehicle.currentSoC >= vehicle.targetSoC) {
      this.station.emit('vehicleTargetSoCReached', {
        stationId: this.station.stationId,
        connectorId,
        vehicleId: vehicle.id,
        currentSoC: vehicle.currentSoC,
        targetSoC: vehicle.targetSoC
      });
    }
  }

  /**
   * Simulate user scenarios and behaviors
   */
  async simulateUserScenario(connectorId, scenario) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return;

    switch (scenario) {
      case 'emergency_stop':
        await this.simulateEmergencyStop(connectorId);
        break;
        
      case 'user_disconnect':
        await this.simulateUserDisconnect(connectorId);
        break;
        
      case 'change_target_soc':
        await this.simulateTargetSoCChange(connectorId);
        break;
        
      case 'payment_issue':
        await this.simulatePaymentIssue(connectorId);
        break;
        
      default:
        logger.warn(`Unknown user scenario: ${scenario}`);
    }
  }

  /**
   * Simulate emergency stop scenario
   */
  async simulateEmergencyStop(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return;

    logger.warn(`🚨 Emergency stop simulated for connector ${connectorId}`);
    
    // Immediately disable charging
    vehicle.chargingEnabled = false;
    
    this.station.emit('emergencyStop', {
      stationId: this.station.stationId,
      connectorId,
      vehicleId: vehicle.id,
      reason: 'User Emergency Stop'
    });
  }

  /**
   * Simulate user disconnection during charging
   */
  async simulateUserDisconnect(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return;

    logger.info(`👤 User disconnect simulated for connector ${connectorId}`);
    
    // Stop charging and disconnect
    await this.station.stopChargingSession(connectorId);
    await this.disconnectVehicle(connectorId);
  }

  /**
   * Simulate target SoC change during charging
   */
  async simulateTargetSoCChange(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return;

    const newTarget = this.randomBetween(
      Math.max(vehicle.currentSoC + 5, 80), 
      100
    );
    
    logger.info(`🎯 Target SoC changed for connector ${connectorId}: ${vehicle.targetSoC}% → ${newTarget}%`);
    
    vehicle.targetSoC = newTarget;
    
    this.station.emit('targetSoCChanged', {
      stationId: this.station.stationId,
      connectorId,
      vehicleId: vehicle.id,
      newTargetSoC: newTarget
    });
  }

  /**
   * Simulate payment or authorization issue
   */
  async simulatePaymentIssue(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return;

    logger.warn(`💳 Payment issue simulated for connector ${connectorId}`);
    
    vehicle.chargingEnabled = false;
    
    this.station.emit('paymentIssue', {
      stationId: this.station.stationId,
      connectorId,
      vehicleId: vehicle.id,
      reason: 'Payment Authorization Failed'
    });
  }

  /**
   * Get vehicle status
   */
  getVehicleStatus(connectorId) {
    const vehicle = this.connectedVehicles.get(connectorId);
    if (!vehicle) return null;

    return {
      vehicleId: vehicle.id,
      profile: vehicle.profile,
      currentSoC: Math.round(vehicle.currentSoC * 10) / 10, // Round to 1 decimal
      targetSoC: vehicle.targetSoC,
      cableConnected: vehicle.cableConnected,
      authenticated: vehicle.authenticated,
      chargingEnabled: vehicle.chargingEnabled,
      connectionTime: vehicle.connectionTime,
      estimatedRange: Math.round(vehicle.currentSoC / 100 * vehicle.profile.range),
      estimatedChargingTime: this.calculateEstimatedChargingTime(vehicle)
    };
  }

  /**
   * Calculate estimated charging time to target SoC
   */
  calculateEstimatedChargingTime(vehicle) {
    const { profile, currentSoC, targetSoC } = vehicle;
    
    if (currentSoC >= targetSoC) return 0;

    const energyNeeded = (targetSoC - currentSoC) / 100 * profile.batteryCapacity; // kWh
    const averagePower = profile.maxChargingPower * 0.7; // Assume 70% average power
    const timeHours = energyNeeded / (averagePower / 1000); // hours
    
    return Math.round(timeHours * 60); // minutes
  }

  /**
   * Get all connected vehicles status
   */
  getAllVehiclesStatus() {
    const status = {};
    
    for (const [connectorId, vehicle] of this.connectedVehicles) {
      status[connectorId] = this.getVehicleStatus(connectorId);
    }
    
    return status;
  }

  // Utility methods
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create predefined vehicle scenarios for testing
   */
  getPredefinedScenarios() {
    return {
      'quick_charge': {
        vehicleType: 'compact',
        initialSoC: 20,
        targetSoC: 80,
        userScenario: 'hasty',
        connectionDelay: 2,
        authDelay: 1
      },
      'full_charge': {
        vehicleType: 'sedan',
        initialSoC: 15,
        targetSoC: 100,
        userScenario: 'normal',
        connectionDelay: 5,
        authDelay: 2
      },
      'top_up': {
        vehicleType: 'suv',
        initialSoC: 70,
        targetSoC: 90,
        userScenario: 'careful',
        connectionDelay: 3,
        authDelay: 2
      },
      'delivery_charge': {
        vehicleType: 'delivery',
        initialSoC: 25,
        targetSoC: 95,
        userScenario: 'normal',
        connectionDelay: 4,
        authDelay: 3
      }
    };
  }
}
