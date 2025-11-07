import logger from '../../utils/logger.js';
import metricsCollector from '../../middleware/metrics.js';
import { BaseOCPPSimulator } from './BaseOCPPSimulator.js';

/**
 * OCPP 1.6J Station Simulator Client
 * Connects to CSMS as a charging station would
 * 
 * Refactored: 2025-01-11
 * Extends BaseOCPPSimulator to reduce code duplication
 */
export class OCPP16JSimulator extends BaseOCPPSimulator {
    constructor(config) {
        super(config);

        this.config = config;

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
            'HeartbeatInterval': config.heartbeatInterval ? .toString() || '300',
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

    }

    /**
     * Get protocol version string
     */
    getProtocolVersion() {
        return '1.6J';
    }

    /**
     * Get WebSocket sub-protocol
     */
    getSubProtocol() {
        return 'ocpp1.6';
    }

    /**
     * Send BootNotification (OCPP 1.6J specific)
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
     * Handle CALL messages from CSMS (OCPP 1.6J specific actions)
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

    // OCPP 1.6J Message Handlers

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
                chargingSchedulePeriod: [{
                    startPeriod: 0,
                    limit: 7400
                }]
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