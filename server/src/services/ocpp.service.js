import { WebSocketServer } from 'ws';
import { OCPPServer } from 'ocpp-rpc';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class OCPPService {
  constructor() {
    this.connectedStations = new Map();
    this.initialize();
  }

  initialize() {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      port: config.ocpp.port,
      maxPayload: 1024 * 1024, // 1MB
    });

    // Create OCPP server
    this.ocppServer = new OCPPServer({
      protocols: [config.ocpp.protocol],
      strictMode: true,
      disableOptimization: false,
    });

    this.setupEventHandlers();
    this.logServerInfo();
  }

  setupEventHandlers() {
    // WebSocket server events
    this.wss.on('connection', (ws, req) => {
      const stationId = this.extractStationId(req);
      logger.info(`New WebSocket connection from ${stationId}`);

      // Handle OCPP messages
      ws.on('message', (message) => {
        try {
          this.handleOCPPMessage(ws, message, stationId);
        } catch (error) {
          logger.error(`Error processing message from ${stationId}:`, error);
        }
      });

      // Handle connection close
      ws.on('close', () => {
        this.handleDisconnect(stationId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for ${stationId}:`, error);
        this.handleDisconnect(stationId);
      });
    });

    // OCPP server events
    this.ocppServer.on('connection', (client) => {
      const stationId = client.id;
      logger.info(`OCPP client connected: ${stationId}`);
      
      this.connectedStations.set(stationId, {
        client,
        lastSeen: new Date(),
        status: 'Available',
      });

      // Handle OCPP messages
      client.on('request', (command, payload, callback) => {
        this.handleOCPPRequest(client, command, payload, callback);
      });

      // Handle client disconnection
      client.on('close', () => {
        this.handleDisconnect(stationId);
      });
    });
  }

  extractStationId(req) {
    // Extract station ID from URL or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('stationId') || 'unknown';
  }

  async handleOCPPMessage(ws, message, stationId) {
    try {
      const parsedMessage = JSON.parse(message);
      logger.debug(`Received message from ${stationId}:`, parsedMessage);
      
      // Process OCPP message here
      // This is a simplified example - in a real implementation, you would
      // route the message to the appropriate handler based on the message type
      
      // For now, just log the message and send a response
      const response = [
        parsedMessage[0], // MessageType
        parsedMessage[1], // Message ID
        {}
      ];
      
      ws.send(JSON.stringify(response));
    } catch (error) {
      logger.error(`Error processing message from ${stationId}:`, error);
      ws.send(JSON.stringify([
        3, // CALLERROR
        'NotImplemented',
        'Message processing not implemented',
        {}
      ]));
    }
  }

  async handleOCPPRequest(client, command, payload, callback) {
    const stationId = client.id;
    logger.debug(`Received OCPP ${command} from ${stationId}:`, payload);

    try {
      // Update last seen timestamp
      if (this.connectedStations.has(stationId)) {
        this.connectedStations.get(stationId).lastSeen = new Date();
      }

      // Route the command to the appropriate handler
      const handler = this.getCommandHandler(command);
      const response = await handler(client, payload);
      callback(null, response);
    } catch (error) {
      logger.error(`Error handling OCPP ${command} from ${stationId}:`, error);
      callback({
        code: 'InternalError',
        description: error.message,
        details: {}
      });
    }
  }

  getCommandHandler(command) {
    const handlers = {
      'BootNotification': this.handleBootNotification.bind(this),
      'Heartbeat': this.handleHeartbeat.bind(this),
      'StatusNotification': this.handleStatusNotification.bind(this),
      'Authorize': this.handleAuthorize.bind(this),
      'StartTransaction': this.handleStartTransaction.bind(this),
      'StopTransaction': this.handleStopTransaction.bind(this),
      'MeterValues': this.handleMeterValues.bind(this),
    };

    return handlers[command] || this.handleUnsupportedCommand;
  }

  // Command handlers
  async handleBootNotification(client, payload) {
    const { chargePointModel, chargePointVendor, firmwareVersion } = payload;
    
    // Store station information
    if (this.connectedStations.has(client.id)) {
      const station = this.connectedStations.get(client.id);
      station.model = chargePointModel;
      station.vendor = chargePointVendor;
      station.firmware = firmwareVersion;
    }

    return {
      currentTime: new Date().toISOString(),
      interval: 300, // 5 minutes
      status: 'Accepted',
    };
  }

  async handleHeartbeat() {
    return {
      currentTime: new Date().toISOString(),
    };
  }

  async handleStatusNotification(client, payload) {
    const { connectorId, errorCode, status } = payload;
    
    if (this.connectedStations.has(client.id)) {
      const station = this.connectedStations.get(client.id);
      station.status = status;
      station.lastStatusUpdate = new Date();
      
      logger.info(`Station ${client.id} status updated to ${status} (${errorCode})`);
    }
    
    return {}; // Empty response as per OCPP spec
  }

  async handleAuthorize(client, payload) {
    // In a real implementation, you would validate the ID tag
    // against your user database
    return {
      idTagInfo: {
        status: 'Accepted',
        expiryDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      },
    };
  }

  async handleStartTransaction(client, payload) {
    // In a real implementation, you would create a new transaction
    // in your database
    return {
      transactionId: Math.floor(Math.random() * 1000000),
      idTagInfo: {
        status: 'Accepted',
      },
    };
  }

  async handleStopTransaction(client, payload) {
    // In a real implementation, you would update the transaction
    // in your database
    return {
      idTagInfo: {
        status: 'Accepted',
      },
    };
  }

  async handleMeterValues(client, payload) {
    // In a real implementation, you would store the meter values
    // in your database
    return {}; // Empty response as per OCPP spec
  }

  async handleUnsupportedCommand() {
    throw new Error('Unsupported command');
  }

  handleDisconnect(stationId) {
    if (this.connectedStations.has(stationId)) {
      logger.info(`Station ${stationId} disconnected`);
      this.connectedStations.delete(stationId);
    }
  }

  logServerInfo() {
    logger.info(`OCPP Server started on port ${config.ocpp.port}`);
    logger.info(`Supported OCPP version: ${config.ocpp.protocol}`);
  }

  // Public API
  getConnectedStations() {
    return Array.from(this.connectedStations.entries()).map(([id, data]) => ({
      id,
      ...data,
      connected: true,
    }));
  }

  getStationStatus(stationId) {
    const station = this.connectedStations.get(stationId);
    return station ? station.status : 'Disconnected';
  }

  sendRemoteStartTransaction(stationId, connectorId, idTag) {
    const station = this.connectedStations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    return station.client.call('RemoteStartTransaction', {
      connectorId,
      idTag,
    });
  }

  sendRemoteStopTransaction(stationId, transactionId) {
    const station = this.connectedStations.get(stationId);
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }

    return station.client.call('RemoteStopTransaction', {
      transactionId,
    });
  }

  async close() {
    // Close all WebSocket connections
    for (const [id, { client }] of this.connectedStations) {
      try {
        await client.close();
      } catch (error) {
        logger.error(`Error closing connection for station ${id}:`, error);
      }
    }

    // Close the WebSocket server
    return new Promise((resolve, reject) => {
      this.wss.close((error) => {
        if (error) {
          logger.error('Error closing WebSocket server:', error);
          reject(error);
        } else {
          logger.info('WebSocket server closed');
          resolve();
        }
      });
    });
  }
}

// Create a singleton instance
export const ocppService = new OCPPService();

export default ocppService;
