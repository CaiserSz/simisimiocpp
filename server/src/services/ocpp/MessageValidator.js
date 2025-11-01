import Joi from 'joi';
import logger from '../../utils/logger.js';

/**
 * OCPP Message Validator
 * Validates OCPP messages according to protocol specifications
 */
class MessageValidator {
  constructor() {
    this.schemas = {
      '1.6': this.getOCPP16Schemas(),
      '2.0.1': this.getOCPP201Schemas()
    };
  }

  /**
   * Validate OCPP message
   */
  validate(message, protocolVersion = '1.6', messageType = 'CALL') {
    try {
      if (!Array.isArray(message) || message.length < 3) {
        throw new Error('Invalid OCPP message format');
      }

      const [messageTypeId, messageId, action, payload] = message;
      
      // Validate message structure
      this.validateMessageStructure(messageTypeId, messageId, action, messageType);
      
      // Validate payload based on action and protocol version
      if (payload && action) {
        return this.validatePayload(action, payload, protocolVersion, messageType);
      }

      return { valid: true };
    } catch (error) {
      logger.error('Message validation failed:', error);
      return {
        valid: false,
        error: error.message,
        details: error.details || []
      };
    }
  }

  /**
   * Validate message structure
   */
  validateMessageStructure(messageTypeId, messageId, action, messageType) {
    // Message Type validation
    const validMessageTypes = {
      'CALL': 2,
      'CALLRESULT': 3,
      'CALLERROR': 4
    };

    if (!Object.values(validMessageTypes).includes(messageTypeId)) {
      throw new Error(`Invalid message type ID: ${messageTypeId}`);
    }

    // Message ID validation
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Message ID is required and must be a string');
    }

    // Action validation for CALL messages
    if (messageTypeId === 2 && (!action || typeof action !== 'string')) {
      throw new Error('Action is required for CALL messages');
    }
  }

  /**
   * Validate payload based on action
   */
  validatePayload(action, payload, protocolVersion, messageType) {
    const schemas = this.schemas[protocolVersion];
    
    if (!schemas || !schemas[messageType] || !schemas[messageType][action]) {
      logger.warn(`No validation schema found for ${protocolVersion} ${messageType} ${action}`);
      return { valid: true, warning: 'No validation schema available' };
    }

    const schema = schemas[messageType][action];
    const { error, value } = schema.validate(payload, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true 
    });

    if (error) {
      throw new Error(`Payload validation failed for ${action}: ${error.message}`);
    }

    return { 
      valid: true, 
      validatedPayload: value 
    };
  }

  /**
   * OCPP 1.6 Validation Schemas
   */
  getOCPP16Schemas() {
    return {
      CALL: {
        // BootNotification
        BootNotification: Joi.object({
          chargePointVendor: Joi.string().max(20).required(),
          chargePointModel: Joi.string().max(20).required(),
          chargePointSerialNumber: Joi.string().max(25).optional(),
          chargeBoxSerialNumber: Joi.string().max(25).optional(),
          firmwareVersion: Joi.string().max(50).optional(),
          iccid: Joi.string().max(20).optional(),
          imsi: Joi.string().max(20).optional(),
          meterType: Joi.string().max(25).optional(),
          meterSerialNumber: Joi.string().max(25).optional()
        }),

        // Heartbeat
        Heartbeat: Joi.object({}),

        // StatusNotification
        StatusNotification: Joi.object({
          connectorId: Joi.number().integer().min(0).required(),
          errorCode: Joi.string().valid(
            'ConnectorLockFailure', 'EVCommunicationError', 'GroundFailure',
            'HighTemperature', 'InternalError', 'LocalListConflict',
            'NoError', 'OtherError', 'OverCurrentFailure', 'PowerMeterFailure',
            'PowerSwitchFailure', 'ReaderFailure', 'ResetFailure',
            'UnderVoltage', 'OverVoltage', 'WeakSignal'
          ).required(),
          status: Joi.string().valid(
            'Available', 'Preparing', 'Charging', 'SuspendedEVSE',
            'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'
          ).required(),
          info: Joi.string().max(50).optional(),
          timestamp: Joi.date().iso().optional(),
          vendorId: Joi.string().max(255).optional(),
          vendorErrorCode: Joi.string().max(50).optional()
        }),

        // MeterValues
        MeterValues: Joi.object({
          connectorId: Joi.number().integer().min(0).required(),
          transactionId: Joi.number().integer().optional(),
          meterValue: Joi.array().items(
            Joi.object({
              timestamp: Joi.date().iso().required(),
              sampledValue: Joi.array().items(
                Joi.object({
                  value: Joi.string().required(),
                  context: Joi.string().valid(
                    'Interruption.Begin', 'Interruption.End', 'Sample.Clock',
                    'Sample.Periodic', 'Transaction.Begin', 'Transaction.End',
                    'Trigger', 'Other'
                  ).optional(),
                  format: Joi.string().valid('Raw', 'SignedData').optional(),
                  measurand: Joi.string().optional(),
                  phase: Joi.string().valid('L1', 'L2', 'L3', 'N', 'L1-N', 'L2-N', 'L3-N', 'L1-L2', 'L2-L3', 'L3-L1').optional(),
                  location: Joi.string().valid('Cable', 'EV', 'Inlet', 'Outlet', 'Body').optional(),
                  unit: Joi.string().optional()
                })
              ).min(1).required()
            })
          ).min(1).required()
        }),

        // StartTransaction
        StartTransaction: Joi.object({
          connectorId: Joi.number().integer().min(1).required(),
          idTag: Joi.string().max(20).required(),
          meterStart: Joi.number().integer().min(0).required(),
          timestamp: Joi.date().iso().required(),
          reservationId: Joi.number().integer().optional()
        }),

        // StopTransaction
        StopTransaction: Joi.object({
          idTag: Joi.string().max(20).optional(),
          meterStop: Joi.number().integer().min(0).required(),
          timestamp: Joi.date().iso().required(),
          transactionId: Joi.number().integer().required(),
          reason: Joi.string().valid(
            'EmergencyStop', 'EVDisconnected', 'HardReset', 'Local',
            'Other', 'PowerLoss', 'Reboot', 'Remote', 'SoftReset',
            'UnlockCommand', 'DeAuthorized'
          ).optional(),
          transactionData: Joi.array().optional()
        }),

        // Authorize
        Authorize: Joi.object({
          idTag: Joi.string().max(20).required()
        }),

        // DataTransfer
        DataTransfer: Joi.object({
          vendorId: Joi.string().max(255).required(),
          messageId: Joi.string().max(50).optional(),
          data: Joi.string().optional()
        })
      },

      CALLRESULT: {
        // BootNotification Response
        BootNotification: Joi.object({
          status: Joi.string().valid('Accepted', 'Pending', 'Rejected').required(),
          currentTime: Joi.date().iso().required(),
          heartbeatInterval: Joi.number().integer().min(0).required()
        }),

        // Heartbeat Response
        Heartbeat: Joi.object({
          currentTime: Joi.date().iso().required()
        }),

        // StatusNotification Response
        StatusNotification: Joi.object({}),

        // MeterValues Response
        MeterValues: Joi.object({}),

        // StartTransaction Response
        StartTransaction: Joi.object({
          transactionId: Joi.number().integer().required(),
          idTagInfo: Joi.object({
            status: Joi.string().valid(
              'Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx'
            ).required(),
            expiryDate: Joi.date().iso().optional(),
            parentIdTag: Joi.string().max(20).optional()
          }).required()
        }),

        // StopTransaction Response
        StopTransaction: Joi.object({
          idTagInfo: Joi.object({
            status: Joi.string().valid(
              'Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx'
            ).required(),
            expiryDate: Joi.date().iso().optional(),
            parentIdTag: Joi.string().max(20).optional()
          }).optional()
        }),

        // Authorize Response
        Authorize: Joi.object({
          idTagInfo: Joi.object({
            status: Joi.string().valid(
              'Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx'
            ).required(),
            expiryDate: Joi.date().iso().optional(),
            parentIdTag: Joi.string().max(20).optional()
          }).required()
        }),

        // DataTransfer Response
        DataTransfer: Joi.object({
          status: Joi.string().valid('Accepted', 'Rejected', 'UnknownMessageId', 'UnknownVendorId').required(),
          data: Joi.string().optional()
        })
      }
    };
  }

  /**
   * OCPP 2.0.1 Validation Schemas (Partial implementation)
   */
  getOCPP201Schemas() {
    return {
      CALL: {
        // BootNotification
        BootNotification: Joi.object({
          reason: Joi.string().valid('ApplicationReset', 'FirmwareUpdate', 'LocalReset', 'PowerUp', 'RemoteReset', 'ScheduledReset', 'Triggered', 'Unknown', 'Watchdog').required(),
          chargingStation: Joi.object({
            serialNumber: Joi.string().max(20).optional(),
            model: Joi.string().max(20).required(),
            vendorName: Joi.string().max(50).required(),
            firmwareVersion: Joi.string().max(50).optional(),
            modem: Joi.object({
              iccid: Joi.string().max(20).optional(),
              imsi: Joi.string().max(20).optional()
            }).optional()
          }).required()
        }),

        // Heartbeat
        Heartbeat: Joi.object({}),

        // StatusNotification
        StatusNotification: Joi.object({
          timestamp: Joi.date().iso().required(),
          connectorStatus: Joi.string().valid(
            'Available', 'Occupied', 'Reserved', 'Unavailable', 'Faulted'
          ).required(),
          evseId: Joi.number().integer().min(1).required(),
          connectorId: Joi.number().integer().min(1).required()
        })
      },

      CALLRESULT: {
        // BootNotification Response
        BootNotification: Joi.object({
          currentTime: Joi.date().iso().required(),
          interval: Joi.number().integer().min(0).required(),
          status: Joi.string().valid('Accepted', 'Pending', 'Rejected').required()
        }),

        // Heartbeat Response
        Heartbeat: Joi.object({
          currentTime: Joi.date().iso().required()
        }),

        // StatusNotification Response
        StatusNotification: Joi.object({})
      }
    };
  }
}

export default new MessageValidator();
