import { EventEmitter } from 'events';
import ProtocolFactory from '../protocols/ProtocolFactory.js';
import logger from '../utils/logger.js';

/**
 * Manages multiple charging stations with different OCPP protocols
 */
class StationManager extends EventEmitter {
  constructor() {
    super();
    this.stations = new Map(); // stationId -> station instance
    this.stationHandlers = new Map(); // stationId -> protocol handler
  }

  /**
   * Create and register a new station
   * @param {object} config - Station configuration
   * @returns {object} Created station
   */
  async createStation(config) {
    try {
      // Validate required fields
      if (!config.id || !config.protocol) {
        throw new Error('Station ID and protocol are required');
      }

      // Check if station already exists
      if (this.stations.has(config.id)) {
        throw new Error(`Station with ID ${config.id} already exists`);
      }

      // Create protocol handler
      const handler = ProtocolFactory.createHandler(config.protocol, {
        timeout: config.timeout || 30000,
        // Other protocol-specific options
      });

      // Create station object
      const station = {
        id: config.id,
        name: config.name || `Station-${config.id}`,
        protocol: config.protocol,
        status: 'disconnected',
        config,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add other station properties
      };

      // Store station and handler
      this.stations.set(station.id, station);
      this.stationHandlers.set(station.id, handler);

      // Set up event listeners
      this.setupHandlerEvents(handler, station.id);

      logger.info(`Created station ${station.id} with protocol ${station.protocol}`);
      return station;
    } catch (error) {
      logger.error(`Error creating station: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Connect to a station
   * @param {string} stationId - Station ID
   * @param {object} connectionParams - Connection parameters
   * @returns {Promise<object>} Connected station
   */
  async connectStation(stationId, connectionParams = {}) {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    try {
      const handler = this.stationHandlers.get(stationId);
      if (!handler) {
        throw new Error(`No handler found for station ${stationId}`);
      }

      await handler.connect(connectionParams);
      
      // Update station status
      station.status = 'connected';
      station.connectedAt = new Date();
      station.updatedAt = new Date();
      
      logger.info(`Connected to station ${stationId}`);
      return station;
    } catch (error) {
      station.status = 'error';
      station.lastError = error.message;
      station.updatedAt = new Date();
      
      logger.error(`Error connecting to station ${stationId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a station
   * @param {string} stationId - Station ID
   * @returns {Promise<object>} Disconnected station
   */
  async disconnectStation(stationId) {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    try {
      const handler = this.stationHandlers.get(stationId);
      if (handler) {
        await handler.disconnect();
      }
      
      // Update station status
      station.status = 'disconnected';
      station.disconnectedAt = new Date();
      station.updatedAt = new Date();
      
      logger.info(`Disconnected from station ${stationId}`);
      return station;
    } catch (error) {
      station.status = 'error';
      station.lastError = error.message;
      station.updatedAt = new Date();
      
      logger.error(`Error disconnecting from station ${stationId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Send a command to a station
   * @param {string} stationId - Station ID
   * @param {string} command - Command name
   * @param {object} params - Command parameters
   * @returns {Promise<object>} Command response
   */
  async sendCommand(stationId, command, params = {}) {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    const handler = this.stationHandlers.get(stationId);
    if (!handler) {
      throw new Error(`No handler found for station ${stationId}`);
    }

    try {
      const response = await handler.sendCommand(command, params);
      
      // Update last activity
      station.lastActivity = new Date();
      station.updatedAt = new Date();
      
      return response;
    } catch (error) {
      station.lastError = error.message;
      station.updatedAt = new Date();
      
      logger.error(`Error sending command to station ${stationId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get station by ID
   * @param {string} stationId - Station ID
   * @returns {object} Station
   */
  getStation(stationId) {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }
    return { ...station };
  }

  /**
   * Get all stations
   * @returns {Array} List of stations
   */
  getAllStations() {
    return Array.from(this.stations.values()).map(station => ({
      ...station,
      // Ensure we don't expose sensitive data
      config: undefined,
      lastError: undefined
    }));
  }

  /**
   * Remove a station
   * @param {string} stationId - Station ID
   * @returns {boolean} Success status
   */
  async removeStation(stationId) {
    const station = this.stations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    try {
      // Disconnect if connected
      if (station.status === 'connected') {
        await this.disconnectStation(stationId);
      }
      
      // Clean up handler
      const handler = this.stationHandlers.get(stationId);
      if (handler && typeof handler.cleanup === 'function') {
        await handler.cleanup();
      }
      
      // Remove from maps
      this.stations.delete(stationId);
      this.stationHandlers.delete(stationId);
      
      logger.info(`Removed station ${stationId}`);
      return true;
    } catch (error) {
      logger.error(`Error removing station ${stationId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Set up event listeners for a station handler
   * @private
   */
  setupHandlerEvents(handler, stationId) {
    // Forward events from handler to station manager
    const events = ['connected', 'disconnected', 'error', 'call', 'status', 'meter', 'data'];
    
    events.forEach(event => {
      handler.on(event, (data) => {
        // Update station status based on event
        const station = this.stations.get(stationId);
        if (station) {
          station.updatedAt = new Date();
          
          if (event === 'error') {
            station.lastError = data?.message || 'Unknown error';
          } else if (event === 'status') {
            station.lastStatus = data;
          }
          
          // Emit event with station context
          this.emit('station:' + event, { stationId, ...data });
        }
      });
    });
  }
}

// Export singleton instance
export default new StationManager();
