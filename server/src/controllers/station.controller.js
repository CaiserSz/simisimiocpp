import stationManager from '../services/StationManager.js';
import { ocppService } from '../services/ocpp.service.js';
import logger from '../utils/logger.js';
import { validationResult } from 'express-validator';

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
 * Get all stations
 */
export const getStations = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { status, location, distance, limit = 50, page = 1 } = req.query;
    
    // Get stations from both managers and merge
    const managerStations = stationManager.getAllStations();
    const connectedStations = ocppService.getConnectedStations();
    
    let stations = managerStations.length > 0 ? managerStations : connectedStations;
    
    // Apply filters
    if (status) {
      stations = stations.filter(s => s.status === status);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedStations = stations.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({ 
      success: true, 
      data: paginatedStations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stations.length,
        totalPages: Math.ceil(stations.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting stations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve stations',
      details: error.message 
    });
  }
};

/**
 * Get a single station by ID
 */
export const getStation = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { id } = req.params;
    
    // Try to get from manager first, then from ocpp service
    let station;
    try {
      station = stationManager.getStation(id);
    } catch (e) {
      // Try OCPP service
      const connectedStations = ocppService.getConnectedStations();
      station = connectedStations.find(s => s.id === id || s.stationId === id);
      if (!station) {
        throw new Error('Station not found');
      }
    }
    
    res.json({ success: true, data: station });
  } catch (error) {
    logger.error(`Error getting station ${req.params.id}:`, error);
    res.status(404).json({ 
      success: false, 
      error: 'Station not found',
      details: error.message 
    });
  }
};

/**
 * Create a new station
 */
export const createStation = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const stationConfig = {
      ...req.body,
      createdBy: req.user?.id,
      createdAt: new Date()
    };
    
    const station = await stationManager.createStation(stationConfig);
    
    res.status(201).json({ 
      success: true, 
      message: 'Station created successfully',
      data: station 
    });
  } catch (error) {
    logger.error('Error creating station:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Failed to create station',
      details: error.message 
    });
  }
};

/**
 * Update a station
 */
export const updateStation = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id,
      updatedAt: new Date()
    };
    
    // For now, return not implemented
    res.status(501).json({ 
      success: false, 
      error: 'Station update not implemented yet',
      details: 'This feature will be implemented in the next sprint'
    });
  } catch (error) {
    logger.error(`Error updating station ${req.params.id}:`, error);
    res.status(400).json({ 
      success: false, 
      error: 'Failed to update station',
      details: error.message 
    });
  }
};

/**
 * Delete a station
 */
export const deleteStation = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { id } = req.params;
    await stationManager.removeStation(id);
    
    res.json({ 
      success: true, 
      message: 'Station deleted successfully' 
    });
  } catch (error) {
    logger.error(`Error deleting station ${req.params.id}:`, error);
    res.status(400).json({ 
      success: false, 
      error: 'Failed to delete station',
      details: error.message 
    });
  }
};

/**
 * Get station connectors
 */
export const getStationConnectors = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId } = req.params;
    const station = stationManager.getStation(stationId);
    
    res.json({
      success: true,
      data: station.connectors || []
    });
  } catch (error) {
    logger.error(`Error getting connectors for station ${req.params.stationId}:`, error);
    res.status(404).json({
      success: false,
      error: 'Station not found',
      details: error.message
    });
  }
};

/**
 * Get specific station connector
 */
export const getStationConnector = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId, connectorId } = req.params;
    const station = stationManager.getStation(stationId);
    const connector = station.connectors?.find(c => c.id === parseInt(connectorId));
    
    if (!connector) {
      return res.status(404).json({
        success: false,
        error: 'Connector not found'
      });
    }
    
    res.json({
      success: true,
      data: connector
    });
  } catch (error) {
    logger.error(`Error getting connector ${req.params.connectorId} for station ${req.params.stationId}:`, error);
    res.status(404).json({
      success: false,
      error: 'Connector not found',
      details: error.message
    });
  }
};

/**
 * Add connector to station
 */
export const addConnector = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Add connector not implemented yet'
    });
  } catch (error) {
    logger.error('Error adding connector:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to add connector',
      details: error.message
    });
  }
};

/**
 * Update connector
 */
export const updateConnector = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Update connector not implemented yet'
    });
  } catch (error) {
    logger.error('Error updating connector:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update connector',
      details: error.message
    });
  }
};

/**
 * Remove connector
 */
export const removeConnector = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Remove connector not implemented yet'
    });
  } catch (error) {
    logger.error('Error removing connector:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to remove connector',
      details: error.message
    });
  }
};

/**
 * Get station transactions
 */
export const getStationTransactions = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId } = req.params;
    const { status, startDate, endDate, limit = 50, page = 1 } = req.query;
    
    // Mock implementation - replace with actual transaction service
    res.json({
      success: true,
      data: [],
      message: 'Transaction service not yet implemented'
    });
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      details: error.message
    });
  }
};

/**
 * Start transaction
 */
export const startTransaction = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId } = req.params;
    const { connectorId, idTag } = req.body;
    
    const result = await ocppService.sendRemoteStartTransaction(stationId, connectorId, idTag);
    
    res.json({
      success: true,
      message: 'Transaction start request sent',
      data: result
    });
  } catch (error) {
    logger.error('Error starting transaction:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to start transaction',
      details: error.message
    });
  }
};

/**
 * Stop transaction
 */
export const stopTransaction = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId } = req.params;
    const { transactionId } = req.body;
    
    const result = await ocppService.sendRemoteStopTransaction(stationId, transactionId);
    
    res.json({
      success: true,
      message: 'Transaction stop request sent',
      data: result
    });
  } catch (error) {
    logger.error('Error stopping transaction:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to stop transaction',
      details: error.message
    });
  }
};

/**
 * Get station status
 */
export const getStationStatus = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { id } = req.params;
    const status = ocppService.getStationStatus(id);
    
    res.json({
      success: true,
      data: { status }
    });
  } catch (error) {
    logger.error(`Error getting status for station ${req.params.id}:`, error);
    res.status(404).json({
      success: false,
      error: 'Station not found',
      details: error.message
    });
  }
};

/**
 * Update station status
 */
export const updateStationStatus = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Update station status not implemented yet'
    });
  } catch (error) {
    logger.error('Error updating station status:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update station status',
      details: error.message
    });
  }
};

/**
 * Get station meter values
 */
export const getStationMeterValues = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Get meter values not implemented yet'
    });
  } catch (error) {
    logger.error('Error getting meter values:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meter values',
      details: error.message
    });
  }
};

/**
 * Get station OCPP logs
 */
export const getStationOcppLogs = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Get OCPP logs not implemented yet'
    });
  } catch (error) {
    logger.error('Error getting OCPP logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get OCPP logs',
      details: error.message
    });
  }
};

/**
 * Remote start transaction
 */
export const remoteStartTransaction = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId } = req.params;
    const { connectorId, idTag, chargingProfile } = req.body;
    
    const result = await ocppService.sendRemoteStartTransaction(stationId, connectorId, idTag);
    
    res.json({
      success: true,
      message: 'Remote start transaction request sent',
      data: result
    });
  } catch (error) {
    logger.error('Error sending remote start transaction:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to send remote start transaction',
      details: error.message
    });
  }
};

/**
 * Remote stop transaction
 */
export const remoteStopTransaction = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    const { stationId } = req.params;
    const { transactionId } = req.body;
    
    const result = await ocppService.sendRemoteStopTransaction(stationId, transactionId);
    
    res.json({
      success: true,
      message: 'Remote stop transaction request sent',
      data: result
    });
  } catch (error) {
    logger.error('Error sending remote stop transaction:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to send remote stop transaction',
      details: error.message
    });
  }
};

/**
 * Reset station
 */
export const resetStation = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Reset station not implemented yet'
    });
  } catch (error) {
    logger.error('Error resetting station:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to reset station',
      details: error.message
    });
  }
};

/**
 * Update firmware
 */
export const updateFirmware = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Update firmware not implemented yet'
    });
  } catch (error) {
    logger.error('Error updating firmware:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update firmware',
      details: error.message
    });
  }
};

/**
 * Get diagnostics
 */
export const getDiagnostics = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Get diagnostics not implemented yet'
    });
  } catch (error) {
    logger.error('Error getting diagnostics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get diagnostics',
      details: error.message
    });
  }
};

/**
 * Get configuration
 */
export const getConfiguration = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Get configuration not implemented yet'
    });
  } catch (error) {
    logger.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      details: error.message
    });
  }
};

/**
 * Change configuration
 */
export const changeConfiguration = async (req, res) => {
  try {
    handleValidationErrors(req, res, () => {});
    
    res.status(501).json({
      success: false,
      error: 'Change configuration not implemented yet'
    });
  } catch (error) {
    logger.error('Error changing configuration:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to change configuration',
      details: error.message
    });
  }
};
