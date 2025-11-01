import express from 'express';
import { body, param } from 'express-validator';
import stationController from '../controllers/StationController';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all stations
router.get('/stations', authorize(['admin', 'operator', 'viewer']), stationController.getAllStations);

// Get a single station
router.get('/stations/:id', 
  [
    param('id').isString().withMessage('Station ID is required'),
    authorize(['admin', 'operator', 'viewer'])
  ], 
  stationController.getStation
);

// Create a new station
router.post('/stations', 
  [
    body('id').isString().withMessage('Station ID is required'),
    body('protocol').isIn(['ocpp1.6j', 'ocpp2.0.1']).withMessage('Invalid protocol version'),
    body('name').optional().isString(),
    authorize(['admin', 'operator'])
  ], 
  stationController.createStation
);

// Update a station
router.put('/stations/:id', 
  [
    param('id').isString().withMessage('Station ID is required'),
    authorize(['admin', 'operator'])
  ], 
  stationController.updateStation
);

// Delete a station
router.delete('/stations/:id', 
  [
    param('id').isString().withMessage('Station ID is required'),
    authorize(['admin'])
  ], 
  stationController.deleteStation
);

// Connect to a station
router.post('/stations/:id/connect', 
  [
    param('id').isString().withMessage('Station ID is required'),
    body('connectionParams').optional().isObject(),
    authorize(['admin', 'operator'])
  ], 
  stationController.connectStation
);

// Disconnect from a station
router.post('/stations/:id/disconnect', 
  [
    param('id').isString().withMessage('Station ID is required'),
    authorize(['admin', 'operator'])
  ], 
  stationController.disconnectStation
);

// Send command to a station
router.post('/stations/:id/command', 
  [
    param('id').isString().withMessage('Station ID is required'),
    body('command').isString().withMessage('Command is required'),
    body('params').optional().isObject(),
    authorize(['admin', 'operator'])
  ], 
  stationController.sendCommand
);

// Get supported protocol versions
router.get('/protocols', 
  authorize(['admin', 'operator', 'viewer']), 
  (req, res) => {
    const ProtocolFactory = require('../protocols/ProtocolFactory');
    res.json({ 
      success: true, 
      data: ProtocolFactory.getSupportedVersions() 
    });
  }
);

export default router;
