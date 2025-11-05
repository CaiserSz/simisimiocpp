import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';
import metricsCollector from '../../middleware/metrics.middleware.js';

/**
 * OCPP 1.6J Station Simulator Client
 * Connects to CSMS as a charging station would
 */
export class OCPP16JSimulator extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = config;
    this.stationId = config.stationId;
    this.csmsUrl = config.csmsUrl;
    this.ws = null;
    this.isConnected = false;
    
    // Message handling
    this.pendingRequests = new Map(); // messageId -> Promise resolver
    this.messageQueue = [];
    
    // OCPP 1.6J Configuration
    this.configuration = {
      // Core Profile
      'AllowOfflineTxForUnknownId': 'false',
      'AuthorizationCacheEnabled': 'false',
      'AuthorizeRemoteTxRequests': 'true',
      'BlinkRepeat': '1',
      'ClockAlignedDataInterval': '0',
      'ConnectionTimeOut': '60',
      'ConnectorPhaseRotation': 'NotApplicable',
      'ConnectorPhaseRotationMaxLength': '1',
      'GetConfigurationMaxKeys': '50',
      'HeartbeatInterval': config.heartbeatInterval?.toString() || '300',
      'LightIntensity': '50',
      'LocalAuthorizeOffline': 'true',
      'LocalPreAuthorize': 'false',
      'MaxEnergyOnInvalidId': '0',
      'MeterValuesAlignedData': 'Energy.Active.Import.Register',
      'MeterValuesAlignedDataMaxLength': '16',
      'MeterValuesSampledData': 'Energy.Active.Import.Register,Power.Active.Import,Current.Import,Voltage',
      'MeterValuesSampledDataMaxLength': '16',
      'MeterValueSampleInterval': '60',
      'MinimumStatusDuration': '0',
      'NumberOfConnectors': '2',
      'ResetRetries': '3',
      'StopTransactionOnEVSideDisconnect': 'true',
      'StopTransactionOnInvalidId': 'true',
      'StopTxnAlignedData': 'Energy.Active.Import.Register',
      'StopTxnAlignedDataMaxLength': '16',
      'StopTxnSampledData': 'Energy.Active.Import.Register',
      'StopTxnSampledDataMaxLength': '16',
      'SupportedFeatureProfiles': 'Core,FirmwareManagement,LocalAuthListManagement,Reservation,SmartCharging',
      'SupportedFeatureProfilesMaxLength': '100',
      'TransactionMessageAttempts': '3',
      'TransactionMessageRetryInterval': '60',
      'UnlockConnectorOnEVSideDisconnect': 'true',
      'WebSocketPingInterval': '0',
      
      // Vendor specific
      'VendorName': config.vendor || 'Simulator Corp',
      'ChargePointModel': config.model || 'SimCharger Pro',
      'ChargePointSerialNumber': config.serialNumber || 'SIM001',
      'ChargePointVendor': config.vendor || 'Simulator Corp',
      'FirmwareVersion': config.firmwareVersion || '1.0.0',
      'Iccid': '',
      'Imsi': '',
      'MeterSerialNumber': `MTR${config.serialNumber || 'SIM001'}`,
      'MeterType': 'Simulated Meter'
    };

    // Station status
    this.bootNotificationStatus = null;
    this.lastHeartbeat = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
  }

  /**
   * Connect to CSMS
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.csmsUrl}/${this.stationId}`;
        logger.info(`🔗 Connecting OCPP 1.6J client to CSMS: ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl, ['ocpp1.6']);
        
        this.ws.on('open', async () => {
          logger.info(`✅ OCPP 1.6J WebSocket connected: ${this.stationId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send boot notification
          try {
            await this.sendBootNotification();
            this.emit('connected');
            resolve();
          } catch (error) {
            logger.error('Boot notification failed:', error);
            reject(error);
          }
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', (code, reason) => {
          logger.warn(`🔌 OCPP 1.6J WebSocket closed: ${code} - ${reason}`);
          this.isConnected = false;
          this.emit('disconnected', { code, reason });
          
          // Attempt reconnection
          this.attemptReconnection();
        });

        this.ws.on('error', (error) => {
          logger.error(`❌ OCPP 1.6J WebSocket error:`, error);
          this.emit('error', error);
          
          if (!this.isConnected) {
            reject(error);
          }
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 seconds

      } catch (error) {
        logger.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from CSMS
   */
  async disconnect() {
    if (this.ws && this.isConnected) {
      this.ws.close();
      this.isConnected = false;
    }
  }

  /**
   * Attempt reconnection to CSMS
   */
  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`❌ Max reconnection attempts reached for ${this.stationId}`);
      return;
    }

    this.reconnectAttempts++;
    logger.info(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} for ${this.stationId}`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      }
    }, this.reconnectInterval * this.reconnectAttempts); // Exponential backoff
  }

  /**
   * Handle incoming OCPP messages
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      logger.debug(`📨 Received OCPP 1.6J message:`, message);

      const [messageType, messageId, ...payload] = message;

      switch (messageType) {
        case 2: // CALL
          this.handleCall(messageId, payload[0], payload[1]);
          break;
        case 3: // CALLRESULT
          this.handleCallResult(messageId, payload[0]);
          break;
        case 4: // CALLERROR
          this.handleCallError(messageId, payload[0], payload[1], payload[2]);
          break;
        default:
          logger.warn(`Unknown OCPP message type: ${messageType}`);
      }
    } catch (error) {
      logger.error('Error parsing OCPP message:', error);
    }
  }

  /**
   * Handle CALL messages from CSMS
   */
  async handleCall(messageId, action, payload) {
    const startTime = Date.now();
    logger.info(`📞 Received CALL: ${action} (${messageId})`);

    try {
      let response;

      switch (action) {
        case 'RemoteStartTransaction':
          response = await this.handleRemoteStartTransaction(payload);
          break;
        case 'RemoteStopTransaction':
          response = await this.handleRemoteStopTransaction(payload);
          break;
        case 'UnlockConnector':
          response = await this.handleUnlockConnector(payload);
          break;
        case 'Reset':
          response = await this.handleReset(payload);
          break;
        case 'GetConfiguration':
          response = this.handleGetConfiguration(payload);
          break;
        case 'ChangeConfiguration':
          response = this.handleChangeConfiguration(payload);
          break;
        case 'ClearCache':
          response = this.handleClearCache(payload);
          break;
        case 'SetChargingProfile':
          response = this.handleSetChargingProfile(payload);
          break;
        case 'ClearChargingProfile':
          response = this.handleClearChargingProfile(payload);
          break;
        case 'GetCompositeSchedule':
          response = this.handleGetCompositeSchedule(payload);
          break;
        case 'TriggerMessage':
          response = await this.handleTriggerMessage(payload);
          break;
        default:
          logger.warn(`❓ Unhandled CALL action: ${action}`);
          response = { status: 'NotSupported' };
      }

      // Send CALLRESULT
      await this.sendCallResult(messageId, response);

      // Record latency
      const latency = (Date.now() - startTime) / 1000;
      metricsCollector.recordOCPPLatency(action, '1.6J', latency);

      // Emit command event for station simulator
      this.emit('commandReceived', { action, payload, messageId, response });

    } catch (error) {
      logger.error(`❌ Error handling CALL ${action}:`, error);
      await this.sendCallError(messageId, 'InternalError', error.message);
    }
  }

  /**
   * Handle CALLRESULT messages
   */
  handleCallResult(messageId, payload) {
    logger.debug(`✅ Received CALLRESULT for message ${messageId}:`, payload);

    const pendingRequest = this.pendingRequests.get(messageId);
    if (pendingRequest) {
      this.pendingRequests.delete(messageId);
      
      // Record latency if startTime is available
      if (pendingRequest.startTime && pendingRequest.action) {
        const latency = (Date.now() - pendingRequest.startTime) / 1000;
        metricsCollector.recordOCPPLatency(pendingRequest.action, '1.6J', latency);
      }
      
      pendingRequest.resolve(payload);
    } else {
      logger.warn(`No pending request found for message ${messageId}`);
    }
  }

  /**
   * Handle CALLERROR messages
   */
  handleCallError(messageId, errorCode, errorDescription, errorDetails) {
    logger.error(`❌ Received CALLERROR for message ${messageId}: ${errorCode} - ${errorDescription}`);

    const pendingRequest = this.pendingRequests.get(messageId);
    if (pendingRequest) {
      this.pendingRequests.delete(messageId);
      const error = new Error(errorDescription || errorCode);
      error.code = errorCode;
      error.details = errorDetails;
      pendingRequest.reject(error);
    }
  }

  /**
   * Send OCPP message to CSMS
   */
  async sendMessage(action, payload) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to CSMS'));
        return;
      }

      const messageId = uuidv4();
      const message = [2, messageId, action, payload];
      const startTime = Date.now();

      logger.debug(`📤 Sending OCPP 1.6J message: ${action}`, payload);

      try {
        this.ws.send(JSON.stringify(message));

        // Store pending request with start time for latency calculation
        this.pendingRequests.set(messageId, { 
          resolve, 
          reject, 
          startTime,
          action 
        });

        // Set timeout for response
        setTimeout(() => {
          if (this.pendingRequests.has(messageId)) {
            this.pendingRequests.delete(messageId);
            reject(new Error(`Timeout waiting for response to ${action}`));
          }
        }, 30000); // 30 seconds timeout

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send CALLRESULT
   */
  async sendCallResult(messageId, payload) {
    const message = [3, messageId, payload];
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send CALLERROR
   */
  async sendCallError(messageId, errorCode, errorDescription, errorDetails = {}) {
    const message = [4, messageId, errorCode, errorDescription, errorDetails];
    this.ws.send(JSON.stringify(message));
  }

  // OCPP 1.6J Message Handlers

  /**
   * Send BootNotification
   */
  async sendBootNotification() {
    const payload = {
      chargePointVendor: this.configuration['ChargePointVendor'],
      chargePointModel: this.configuration['ChargePointModel'],
      chargePointSerialNumber: this.configuration['ChargePointSerialNumber'],
      firmwareVersion: this.configuration['FirmwareVersion'],
      iccid: this.configuration['Iccid'] || undefined,
      imsi: this.configuration['Imsi'] || undefined,
      meterType: this.configuration['MeterType'],
      meterSerialNumber: this.configuration['MeterSerialNumber']
    };

    const response = await this.sendMessage('BootNotification', payload);
    
    this.bootNotificationStatus = response.status;
    
    if (response.status === 'Accepted') {
      logger.info(`✅ Boot notification accepted for ${this.stationId}`);
      
      // Update heartbeat interval if provided
      if (response.heartbeatInterval) {
        this.configuration['HeartbeatInterval'] = response.heartbeatInterval.toString();
      }
    } else {
      logger.warn(`⚠️ Boot notification ${response.status} for ${this.stationId}`);
    }

    return response;
  }

  /**
   * Send Heartbeat
   */
  async sendHeartbeat() {
    const response = await this.sendMessage('Heartbeat', {});
    this.lastHeartbeat = new Date();
    return response;
  }

  /**
   * Send StatusNotification
   */
  async sendStatusNotification(payload) {
    return await this.sendMessage('StatusNotification', payload);
  }

  /**
   * Send Authorize
   */
  async sendAuthorize(payload) {
    return await this.sendMessage('Authorize', payload);
  }

  /**
   * Send StartTransaction
   */
  async sendStartTransaction(payload) {
    return await this.sendMessage('StartTransaction', payload);
  }

  /**
   * Send StopTransaction
   */
  async sendStopTransaction(payload) {
    return await this.sendMessage('StopTransaction', payload);
  }

  /**
   * Send MeterValues
   */
  async sendMeterValues(payload) {
    return await this.sendMessage('MeterValues', payload);
  }

  // Command Handlers (from CSMS)

  handleRemoteStartTransaction(payload) {
    // Forward to station simulator
    return { status: 'Accepted' }; // Will be overridden by station simulator
  }

  handleRemoteStopTransaction(payload) {
    // Forward to station simulator  
    return { status: 'Accepted' }; // Will be overridden by station simulator
  }

  handleUnlockConnector(payload) {
    logger.info(`🔓 Unlock connector requested: ${payload.connectorId}`);
    return { status: 'Unlocked' };
  }

  handleReset(payload) {
    logger.info(`🔄 Reset requested: ${payload.type}`);
    
    // Simulate reset delay
    setTimeout(() => {
      this.emit('resetRequested', payload);
    }, 1000);
    
    return { status: 'Accepted' };
  }

  handleGetConfiguration(payload) {
    const requestedKeys = payload.key || [];
    const configurationKey = [];
    const unknownKey = [];

    if (requestedKeys.length === 0) {
      // Return all configuration
      for (const [key, value] of Object.entries(this.configuration)) {
        configurationKey.push({
          key,
          readonly: this.isReadOnlyKey(key),
          value: value
        });
      }
    } else {
      // Return requested keys
      for (const key of requestedKeys) {
        if (this.configuration.hasOwnProperty(key)) {
          configurationKey.push({
            key,
            readonly: this.isReadOnlyKey(key),
            value: this.configuration[key]
          });
        } else {
          unknownKey.push(key);
        }
      }
    }

    return {
      configurationKey,
      unknownKey: unknownKey.length > 0 ? unknownKey : undefined
    };
  }

  handleChangeConfiguration(payload) {
    const { key, value } = payload;

    if (!this.configuration.hasOwnProperty(key)) {
      return { status: 'NotSupported' };
    }

    if (this.isReadOnlyKey(key)) {
      return { status: 'Rejected' };
    }

    // Validate value (simplified)
    if (key === 'HeartbeatInterval') {
      const interval = parseInt(value);
      if (isNaN(interval) || interval < 0) {
        return { status: 'Rejected' };
      }
    }

    this.configuration[key] = value;
    logger.info(`⚙️ Configuration changed: ${key} = ${value}`);

    return { status: 'Accepted' };
  }

  handleClearCache(payload) {
    logger.info('🗑️ Clear cache requested');
    return { status: 'Accepted' };
  }

  handleSetChargingProfile(payload) {
    logger.info('⚡ Set charging profile requested:', payload);
    return { status: 'Accepted' };
  }

  handleClearChargingProfile(payload) {
    logger.info('🗑️ Clear charging profile requested:', payload);
    return { status: 'Accepted' };
  }

  handleGetCompositeSchedule(payload) {
    logger.info('📊 Get composite schedule requested:', payload);
    return { 
      status: 'Accepted',
      connectorId: payload.connectorId,
      scheduleStart: new Date().toISOString(),
      chargingSchedule: {
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [
          {
            startPeriod: 0,
            limit: 7400
          }
        ]
      }
    };
  }

  async handleTriggerMessage(payload) {
    const { requestedMessage, connectorId } = payload;
    
    logger.info(`📲 Trigger message requested: ${requestedMessage}`);

    // Simulate triggered message
    switch (requestedMessage) {
      case 'BootNotification':
        await this.sendBootNotification();
        break;
      case 'Heartbeat':
        await this.sendHeartbeat();
        break;
      case 'StatusNotification':
        if (connectorId !== undefined) {
          await this.sendStatusNotification({
            connectorId,
            status: 'Available',
            errorCode: 'NoError',
            timestamp: new Date().toISOString()
          });
        }
        break;
      default:
        return { status: 'NotImplemented' };
    }

    return { status: 'Accepted' };
  }

  // Utility methods

  isReadOnlyKey(key) {
    const readOnlyKeys = [
      'ChargePointVendor',
      'ChargePointModel', 
      'ChargePointSerialNumber',
      'FirmwareVersion',
      'SupportedFeatureProfiles',
      'NumberOfConnectors'
    ];
    return readOnlyKeys.includes(key);
  }

  getStatus() {
    return {
      protocol: 'OCPP 1.6J',
      connected: this.isConnected,
      bootStatus: this.bootNotificationStatus,
      lastHeartbeat: this.lastHeartbeat,
      csmsUrl: this.csmsUrl,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
