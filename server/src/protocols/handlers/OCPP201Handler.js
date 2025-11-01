const BaseProtocolHandler = require('./BaseProtocolHandler');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

/**
 * OCPP 2.0.1 Protocol Handler
 * Implements OCPP 2.0.1 protocol specific functionality
 */
class OCPP201Handler extends BaseProtocolHandler {
  constructor(options = {}) {
    super(options);
    this.protocolVersion = 'ocpp2.0.1';
    this.pendingCalls = new Map();
    this.heartbeatInterval = null;
    this.supportedProfiles = [
      'Core',
      'FirmwareManagement',
      'LocalAuthListManagement',
      'RemoteTrigger',
      'Reservation',
      'SmartCharging',
      'TariffCost'
    ];
  }

  /**
   * Connect to the charging station
   * @param {object} params - Connection parameters
   * @returns {Promise<boolean>} Connection status
   */
  async connect(params = {}) {
    try {
      this.connectionParams = params;
      
      // Initialize WebSocket connection with OCPP 2.0.1 subprotocol
      await this.initializeWebSocket({
        ...params,
        protocols: ['ocpp2.0.1']
      });
      
      // Send BootNotification with OCPP 2.0.1 specific fields
      const bootNotification = await this.sendBootNotification();
      
      if (bootNotification.status === 'Accepted' || bootNotification.status === 'Pending') {
        this.connected = true;
        
        // Start heartbeat if interval is provided
        if (bootNotification.interval) {
          this.startHeartbeat(bootNotification.interval);
        }
        
        this.emit('connected', { 
          protocol: this.protocolVersion,
          status: bootNotification.status,
          currentTime: bootNotification.currentTime,
          interval: bootNotification.interval
        });
        
        return true;
      }
      
      throw new Error(`BootNotification rejected with status: ${bootNotification.status}`);
    } catch (error) {
      logger.error('OCPP 2.0.1 connection failed:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Send BootNotification with OCPP 2.0.1 specific fields
   * @private
   */
  async sendBootNotification() {
    const bootNotification = {
      chargingStation: {
        serialNumber: this.connectionParams.serialNumber,
        model: this.connectionParams.model || 'Simulator-2.0',
        vendorName: this.connectionParams.vendor || 'Simulator',
        firmwareVersion: this.connectionParams.firmwareVersion || '1.0.0',
        modem: {
          iccid: this.connectionParams.iccid,
          imsi: this.connectionParams.imsi
        }
      },
      reason: 'PowerUp', // Or 'FirmwareUpdate', 'Reset', etc.
      // Additional OCPP 2.0.1 specific fields
      bootReason: 'PowerUp',
      chargingStationCertHash: this.connectionParams.certHash,
      hashAlgorithm: this.connectionParams.hashAlgorithm || 'SHA256'
    };
    
    return this.sendCommand('BootNotification', bootNotification);
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
      // Store the promise resolvers with timestamp for timeout
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(messageId);
        reject(new Error(`Command ${command} timed out`));
      }, this.options.timeout || 30000);

      this.pendingCalls.set(messageId, { resolve, reject, timeout });
      
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
      
      if (!Array.isArray(parsedMessage) || parsedMessage.length < 3) {
        throw new Error('Invalid message format');
      }
      
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
          logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle incoming call (OCPP 2.0.1 specific)
   * @private
   */
  handleIncomingCall([messageType, messageId, action, params]) {
    // Handle OCPP 2.0.1 specific calls
    switch (action) {
      case 'BootNotification':
      case 'Heartbeat':
        // These are handled by the connection management
        break;
        
      case 'StatusNotification':
        this.emit('status', params);
        this.respondToCall(messageId, {});
        break;
        
      case 'MeterValues':
        this.emit('meter', params);
        this.respondToCall(messageId, {});
        break;
        
      case 'DataTransfer':
        this.handleDataTransfer(messageId, params);
        break;
        
      default:
        // Emit generic call event
        this.emit('call', { 
          action, 
          params, 
          respond: (response) => this.respondToCall(messageId, response)
        });
    }
  }

  /**
   * Handle DataTransfer message (OCPP 2.0.1 specific)
   * @private
   */
  handleDataTransfer(messageId, { vendorId, messageId: dataMessageId, data, ...rest }) {
    // Handle data transfer based on vendor ID and message ID
    this.emit('data', { 
      vendorId, 
      messageId: dataMessageId, 
      data,
      ...rest
    });
    
    // Respond with default accepted status
    this.respondToCall(messageId, {
      status: 'Accepted',
      data: {}
    });
  }

  /**
   * Respond to an incoming call
   * @private
   */
  respondToCall(messageId, response) {
    const responseMessage = [3, messageId, response];
    this.ws.send(JSON.stringify(responseMessage));
  }

  /**
   * Handle call result
   * @private
   */
  handleCallResult([messageType, messageId, result]) {
    const pendingCall = this.pendingCalls.get(messageId);
    if (pendingCall) {
      const { resolve, timeout } = pendingCall;
      clearTimeout(timeout);
      resolve(result);
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
      const { reject, timeout } = pendingCall;
      clearTimeout(timeout);
      const error = new Error(`OCPP 2.0.1 Error (${errorCode}): ${errorDescription}`);
      error.code = errorCode;
      error.details = errorDetails;
      reject(error);
      this.pendingCalls.delete(messageId);
    }
  }

  /**
   * Get supported features and profiles
   * @returns {object} Supported features and profiles
   */
  getSupportedFeatures() {
    return {
      protocol: 'ocpp2.0.1',
      profiles: this.supportedProfiles,
      // Add other supported features
    };
  }
  
  /**
   * Clean up resources
   */
  async cleanup() {
    await super.cleanup();
    // Additional cleanup for OCPP 2.0.1
    this.pendingCalls.clear();
  }
}

module.exports = OCPP201Handler;
