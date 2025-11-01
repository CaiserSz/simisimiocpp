import BaseProtocolHandler from './BaseProtocolHandler.js';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import logger from '../../utils/logger.js';

/**
 * OCPP 1.6J Protocol Handler
 * Implements OCPP 1.6J protocol specific functionality
 */
class OCPP16JHandler extends BaseProtocolHandler {
  constructor(options = {}) {
    super(options);
    this.protocolVersion = 'ocpp1.6j';
    this.pendingCalls = new Map();
    this.heartbeatInterval = null;
  }

  /**
   * Connect to the charging station
   * @param {object} params - Connection parameters
   * @returns {Promise<boolean>} Connection status
   */
  async connect(params = {}) {
    try {
      this.connectionParams = params;
      
      // Initialize WebSocket connection
      await this.initializeWebSocket(params);
      
      // Send BootNotification
      const bootNotification = await this.sendBootNotification();
      
      if (bootNotification.status === 'Accepted') {
        this.connected = true;
        this.startHeartbeat(bootNotification.heartbeatInterval || 60);
        this.emit('connected', { protocol: this.protocolVersion });
        return true;
      }
      
      throw new Error(`BootNotification rejected: ${bootNotification.status}`);
    } catch (error) {
      logger.error('OCPP 1.6J connection failed:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection
   * @private
   */
  async initializeWebSocket(params) {
    return new Promise((resolve, reject) => {
      try {
        // WebSocket is already imported
        const wsUrl = params.url || `ws://localhost:${params.port || 8080}/${params.stationId}`;
        
        logger.info(`Connecting to WebSocket: ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl, ['ocpp1.6']);
        
        this.ws.on('open', () => {
          logger.info('WebSocket connection established');
          this.setupMessageHandlers();
          resolve();
        });
        
        this.ws.on('error', (error) => {
          logger.error('WebSocket error:', error);
          reject(error);
        });
        
        this.ws.on('close', (code, reason) => {
          logger.info(`WebSocket connection closed: ${code} - ${reason}`);
          this.connected = false;
          this.emit('disconnected', { code, reason });
        });
        
        // Set connection timeout
        setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, params.timeout || 10000);
        
      } catch (error) {
        logger.error('Error initializing WebSocket:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Setup message handlers for WebSocket
   * @private
   */
  setupMessageHandlers() {
    if (!this.ws) return;
    
    this.ws.on('message', (data) => {
      try {
        logger.debug('Received WebSocket message:', data.toString());
        this.handleMessage(data.toString());
      } catch (error) {
        logger.error('Error handling WebSocket message:', error);
        this.emit('error', error);
      }
    });
    
    this.ws.on('pong', () => {
      logger.debug('Received WebSocket pong');
    });
  }

  /**
   * Send BootNotification
   * @private
   */
  async sendBootNotification() {
    const bootNotification = {
      chargePointVendor: this.connectionParams.vendor || 'Simulator',
      chargePointModel: this.connectionParams.model || 'Simulator-1.0',
      // Add other required fields
    };
    
    return this.sendCommand('BootNotification', bootNotification);
  }

  /**
   * Start heartbeat mechanism
   * @param {number} interval - Heartbeat interval in seconds
   * @private
   */
  startHeartbeat(interval) {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendCommand('Heartbeat', {});
      } catch (error) {
        logger.error('Heartbeat failed:', error);
        this.emit('error', error);
      }
    }, interval * 1000);
  }

  /**
   * Stop heartbeat mechanism
   * @private
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect from the charging station
   * @returns {Promise<boolean>} Disconnection status
   */
  async disconnect() {
    this.stopHeartbeat();
    this.connected = false;
    
    // Close WebSocket connection if exists
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.emit('disconnected');
    return true;
  }

  /**
   * Send a command to the charging station
   * @param {string} command - Command name
   * @param {object} params - Command parameters
   * @returns {Promise<object>} Command response
   */
  async sendCommand(command, params = {}) {
    if (!this.connected) {
      throw new Error('Not connected to charging station');
    }

    const messageId = uuidv4();
    const message = [
      2, // CALL
      messageId,
      command,
      params
    ];

    return new Promise((resolve, reject) => {
      // Store the promise resolvers
      this.pendingCalls.set(messageId, { resolve, reject });
      
      // Set timeout for the call
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(messageId);
        reject(new Error(`Command ${command} timed out`));
      }, this.options.timeout || 30000);

      // Send the message
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.pendingCalls.delete(messageId);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message
   * @param {object} message - Incoming message
   */
  handleMessage(message) {
    try {
      // Parse message if it's a string
      const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Handle different message types
      if (Array.isArray(parsedMessage) && parsedMessage.length >= 3) {
        const [messageType, messageId] = parsedMessage;
        
        switch (messageType) {
          case 2: // CALL
            this.handleIncomingCall(parsedMessage);
            break;
            
          case 3: // CALLRESULT
            this.handleCallResult(parsedMessage);
            break;
            
          case 4: // CALLERROR
            this.handleCallError(parsedMessage);
            break;
            
          default:
            logger.warn('Unknown message type:', messageType);
        }
      } else {
        logger.warn('Invalid message format:', message);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle incoming call
   * @private
   */
  handleIncomingCall([messageType, messageId, action, params]) {
    // Handle incoming OCPP calls from the charging station
    this.emit('call', { action, params, respond: (response) => {
      const responseMessage = [3, messageId, response];
      this.ws.send(JSON.stringify(responseMessage));
    }});
  }

  /**
   * Handle call result
   * @private
   */
  handleCallResult([messageType, messageId, result]) {
    const pendingCall = this.pendingCalls.get(messageId);
    if (pendingCall) {
      clearTimeout(pendingCall.timeout);
      pendingCall.resolve(result);
      this.pendingCalls.delete(messageId);
    }
  }

  /**
   * Handle call error
   * @private
   */
  handleCallError([messageType, messageId, errorCode, errorDescription, errorDetails]) {
    const pendingCall = this.pendingCalls.get(messageId);
    if (pendingCall) {
      clearTimeout(pendingCall.timeout);
      const error = new Error(`OCPP Error (${errorCode}): ${errorDescription}`);
      error.code = errorCode;
      error.details = errorDetails;
      pendingCall.reject(error);
      this.pendingCalls.delete(messageId);
    }
  }
}

export default OCPP16JHandler;
