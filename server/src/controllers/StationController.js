const stationManager = require('../services/StationManager');
const logger = require('../utils/logger');

class StationController {
  /**
   * Get all stations
   */
  async getAllStations(req, res) {
    try {
      const stations = stationManager.getAllStations();
      res.json({ success: true, data: stations });
    } catch (error) {
      logger.error('Error getting stations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve stations',
        details: error.message 
      });
    }
  }

  /**
   * Get a single station by ID
   */
  async getStation(req, res) {
    try {
      const station = stationManager.getStation(req.params.id);
      res.json({ success: true, data: station });
    } catch (error) {
      logger.error(`Error getting station ${req.params.id}:`, error);
      res.status(404).json({ 
        success: false, 
        error: 'Station not found',
        details: error.message 
      });
    }
  }

  /**
   * Create a new station
   */
  async createStation(req, res) {
    try {
      const station = await stationManager.createStation(req.body);
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
  }

  /**
   * Update a station
   */
  async updateStation(req, res) {
    try {
      // Implementation depends on what can be updated
      res.status(501).json({ 
        success: false, 
        error: 'Not implemented' 
      });
    } catch (error) {
      logger.error(`Error updating station ${req.params.id}:`, error);
      res.status(400).json({ 
        success: false, 
        error: 'Failed to update station',
        details: error.message 
      });
    }
  }

  /**
   * Delete a station
   */
  async deleteStation(req, res) {
    try {
      await stationManager.removeStation(req.params.id);
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
  }

  /**
   * Connect to a station
   */
  async connectStation(req, res) {
    try {
      const station = await stationManager.connectStation(
        req.params.id, 
        req.body.connectionParams || {}
      );
      
      res.json({ 
        success: true, 
        message: 'Connected to station successfully',
        data: station 
      });
    } catch (error) {
      logger.error(`Error connecting to station ${req.params.id}:`, error);
      res.status(400).json({ 
        success: false, 
        error: 'Failed to connect to station',
        details: error.message 
      });
    }
  }

  /**
   * Disconnect from a station
   */
  async disconnectStation(req, res) {
    try {
      const station = await stationManager.disconnectStation(req.params.id);
      res.json({ 
        success: true, 
        message: 'Disconnected from station successfully',
        data: station 
      });
    } catch (error) {
      logger.error(`Error disconnecting from station ${req.params.id}:`, error);
      res.status(400).json({ 
        success: false, 
        error: 'Failed to disconnect from station',
        details: error.message 
      });
    }
  }

  /**
   * Send a command to a station
   */
  async sendCommand(req, res) {
    try {
      const { command, params = {} } = req.body;
      
      if (!command) {
        throw new Error('Command is required');
      }

      const result = await stationManager.sendCommand(
        req.params.id,
        command,
        params
      );
      
      res.json({ 
        success: true, 
        message: 'Command sent successfully',
        data: result 
      });
    } catch (error) {
      logger.error(`Error sending command to station ${req.params.id}:`, error);
      res.status(400).json({ 
        success: false, 
        error: 'Failed to send command',
        details: error.message 
      });
    }
  }
}

// Export singleton instance
module.exports = new StationController();
