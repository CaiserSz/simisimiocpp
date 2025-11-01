import { SimulationManager } from '../simulator/SimulationManager.js';
import logger from '../utils/logger.js';
import { validationResult } from 'express-validator';
import { asyncHandler } from '../utils/errorHandler.js';

// Global simulation manager instance
const simulationManager = new SimulationManager();

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Get simulation overview
 */
export const getSimulationOverview = asyncHandler(async (req, res) => {
  const overview = {
    statistics: simulationManager.getStatistics(),
    stations: simulationManager.getAllStationsStatus(),
    profiles: simulationManager.getProfiles(),
    scenarios: simulationManager.getScenarios()
  };

  res.json({
    success: true,
    data: overview
  });
});

/**
 * Get all stations
 */
export const getStations = asyncHandler(async (req, res) => {
  const stations = simulationManager.getAllStationsStatus();
  
  res.json({
    success: true,
    data: {
      stations,
      count: Object.keys(stations).length,
      statistics: simulationManager.getStatistics()
    }
  });
});

/**
 * Get specific station
 */
export const getStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  const stationStatus = station.getStatus();
  const vehicleStatus = station.vehicleSimulator.getAllVehiclesStatus();

  res.json({
    success: true,
    data: {
      station: stationStatus,
      vehicles: vehicleStatus,
      ocppStatus: station.ocppClient?.getStatus()
    }
  });
});

/**
 * Create new station
 */
export const createStation = asyncHandler(async (req, res) => {
  handleValidationErrors(req, res, () => {});

  const config = req.body;
  
  try {
    const station = await simulationManager.createStation(config);
    
    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error('Error creating station:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create station',
      details: error.message
    });
  }
});

/**
 * Create stations from profile
 */
export const createStationsFromProfile = asyncHandler(async (req, res) => {
  handleValidationErrors(req, res, () => {});

  const { profileId, count, options = {} } = req.body;
  
  try {
    const stations = await simulationManager.createStationsFromProfile(profileId, count, options);
    
    res.status(201).json({
      success: true,
      message: `${count} stations created from profile ${profileId}`,
      data: {
        stations: stations.map(s => s.getStatus()),
        count: stations.length
      }
    });
  } catch (error) {
    logger.error('Error creating stations from profile:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create stations from profile',
      details: error.message
    });
  }
});

/**
 * Start station
 */
export const startStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.start();
    
    res.json({
      success: true,
      message: 'Station started successfully',
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error(`Error starting station ${stationId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to start station',
      details: error.message
    });
  }
});

/**
 * Stop station
 */
export const stopStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.stop();
    
    res.json({
      success: true,
      message: 'Station stopped successfully',
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error(`Error stopping station ${stationId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to stop station',
      details: error.message
    });
  }
});

/**
 * Remove station
 */
export const removeStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  
  try {
    await simulationManager.removeStation(stationId);
    
    res.json({
      success: true,
      message: 'Station removed successfully'
    });
  } catch (error) {
    logger.error(`Error removing station ${stationId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to remove station',
      details: error.message
    });
  }
});

/**
 * Start all stations
 */
export const startAllStations = asyncHandler(async (req, res) => {
  try {
    await simulationManager.startAllStations();
    
    res.json({
      success: true,
      message: 'All stations started successfully',
      data: {
        statistics: simulationManager.getStatistics()
      }
    });
  } catch (error) {
    logger.error('Error starting all stations:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to start all stations',
      details: error.message
    });
  }
});

/**
 * Stop all stations
 */
export const stopAllStations = asyncHandler(async (req, res) => {
  try {
    await simulationManager.stopAllStations();
    
    res.json({
      success: true,
      message: 'All stations stopped successfully',
      data: {
        statistics: simulationManager.getStatistics()
      }
    });
  } catch (error) {
    logger.error('Error stopping all stations:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to stop all stations',
      details: error.message
    });
  }
});

/**
 * Remove all stations
 */
export const removeAllStations = asyncHandler(async (req, res) => {
  try {
    await simulationManager.removeAllStations();
    
    res.json({
      success: true,
      message: 'All stations removed successfully'
    });
  } catch (error) {
    logger.error('Error removing all stations:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to remove all stations',
      details: error.message
    });
  }
});

/**
 * Switch station protocol
 */
export const switchStationProtocol = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const { protocol } = req.body;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.switchProtocol(protocol);
    
    res.json({
      success: true,
      message: `Station protocol switched to ${protocol}`,
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error(`Error switching protocol for station ${stationId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to switch protocol',
      details: error.message
    });
  }
});

/**
 * Update station configuration
 */
export const updateStationConfig = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const newConfig = req.body;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    station.updateConfiguration(newConfig);
    
    res.json({
      success: true,
      message: 'Station configuration updated',
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error(`Error updating config for station ${stationId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to update station configuration',
      details: error.message
    });
  }
});

/**
 * Simulate vehicle connection
 */
export const simulateVehicleConnection = asyncHandler(async (req, res) => {
  const { stationId, connectorId } = req.params;
  const options = req.body;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    const vehicle = await station.vehicleSimulator.connectVehicle(parseInt(connectorId), options);
    
    res.json({
      success: true,
      message: 'Vehicle connected successfully',
      data: {
        vehicle: station.vehicleSimulator.getVehicleStatus(parseInt(connectorId))
      }
    });
  } catch (error) {
    logger.error(`Error connecting vehicle to station ${stationId}, connector ${connectorId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to connect vehicle',
      details: error.message
    });
  }
});

/**
 * Simulate vehicle disconnection
 */
export const simulateVehicleDisconnection = asyncHandler(async (req, res) => {
  const { stationId, connectorId } = req.params;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.vehicleSimulator.disconnectVehicle(parseInt(connectorId));
    
    res.json({
      success: true,
      message: 'Vehicle disconnected successfully'
    });
  } catch (error) {
    logger.error(`Error disconnecting vehicle from station ${stationId}, connector ${connectorId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to disconnect vehicle',
      details: error.message
    });
  }
});

/**
 * Start charging session
 */
export const startChargingSession = asyncHandler(async (req, res) => {
  const { stationId, connectorId } = req.params;
  const { idTag, chargingProfile } = req.body;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.startChargingSession(parseInt(connectorId), idTag, chargingProfile);
    
    res.json({
      success: true,
      message: 'Charging session started successfully',
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error(`Error starting charging session on station ${stationId}, connector ${connectorId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to start charging session',
      details: error.message
    });
  }
});

/**
 * Stop charging session
 */
export const stopChargingSession = asyncHandler(async (req, res) => {
  const { stationId, connectorId } = req.params;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.stopChargingSession(parseInt(connectorId));
    
    res.json({
      success: true,
      message: 'Charging session stopped successfully',
      data: {
        station: station.getStatus()
      }
    });
  } catch (error) {
    logger.error(`Error stopping charging session on station ${stationId}, connector ${connectorId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to stop charging session',
      details: error.message
    });
  }
});

/**
 * Simulate user scenario
 */
export const simulateUserScenario = asyncHandler(async (req, res) => {
  const { stationId, connectorId } = req.params;
  const { scenario } = req.body;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  try {
    await station.vehicleSimulator.simulateUserScenario(parseInt(connectorId), scenario);
    
    res.json({
      success: true,
      message: `User scenario '${scenario}' executed successfully`
    });
  } catch (error) {
    logger.error(`Error executing user scenario on station ${stationId}, connector ${connectorId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to execute user scenario',
      details: error.message
    });
  }
});

/**
 * Run predefined scenario
 */
export const runScenario = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  const options = req.body;
  
  try {
    await simulationManager.runScenario(scenarioId, options);
    
    res.json({
      success: true,
      message: `Scenario '${scenarioId}' started successfully`,
      data: {
        statistics: simulationManager.getStatistics()
      }
    });
  } catch (error) {
    logger.error(`Error running scenario ${scenarioId}:`, error);
    res.status(400).json({
      success: false,
      error: 'Failed to run scenario',
      details: error.message
    });
  }
});

/**
 * Get available profiles
 */
export const getProfiles = asyncHandler(async (req, res) => {
  const profiles = simulationManager.getProfiles();
  
  res.json({
    success: true,
    data: {
      profiles,
      count: Object.keys(profiles).length
    }
  });
});

/**
 * Get available scenarios
 */
export const getScenarios = asyncHandler(async (req, res) => {
  const scenarios = simulationManager.getScenarios();
  
  res.json({
    success: true,
    data: {
      scenarios,
      count: Object.keys(scenarios).length
    }
  });
});

/**
 * Get simulation statistics
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const statistics = simulationManager.getStatistics();
  
  res.json({
    success: true,
    data: statistics
  });
});

/**
 * Export simulation configuration
 */
export const exportConfiguration = asyncHandler(async (req, res) => {
  const config = simulationManager.exportConfiguration();
  
  res.json({
    success: true,
    data: config
  });
});

/**
 * Import simulation configuration
 */
export const importConfiguration = asyncHandler(async (req, res) => {
  const config = req.body;
  
  try {
    await simulationManager.importConfiguration(config);
    
    res.json({
      success: true,
      message: 'Configuration imported successfully',
      data: {
        statistics: simulationManager.getStatistics()
      }
    });
  } catch (error) {
    logger.error('Error importing configuration:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to import configuration',
      details: error.message
    });
  }
});

// Export simulation manager for WebSocket integration
export { simulationManager };
