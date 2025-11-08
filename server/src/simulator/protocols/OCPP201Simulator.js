import logger from '../../utils/logger.js';
import metricsCollector from '../../middleware/metrics.js';
import { BaseOCPPSimulator } from './BaseOCPPSimulator.js';

/**
 * OCPP 2.0.1 Station Simulator Client
 * Connects to CSMS as a charging station would
 * 
 * Refactored: 2025-01-11
 * Extends BaseOCPPSimulator to reduce code duplication
 */
export class OCPP201Simulator extends BaseOCPPSimulator {
    constructor(config) {
        super(config);

        this.config = config;

        // OCPP 2.0.1 Configuration Variables
        this.configurationVariables = {
            // Connectivity
            'NetworkConnectionProfiles': {
                value: JSON.stringify([{
                    configurationSlot: 1,
                    connectionData: {
                        messageTimeout: 30,
                        ocppVersion: 'OCPP20',
                        ocppTransport: 'JSON',
                        ocppCsmsUrl: this.csmsUrl,
                        securityProfile: 0
                    }
                }])
            },
            'NetworkProfileConnectionAttempts': { value: '3' },
            'NetworkProfileConnectionRetryBackOffRandomRange': { value: '10' },
            'NetworkProfileConnectionRetryBackOffRepeatTimes': { value: '2' },
            'NetworkProfileConnectionRetryBackOffWaitMinimum': { value: '5' },
            // Heartbeat
            'HeartbeatInterval': { value: config.heartbeatInterval?.toString() || '300' },

            // Authorization
            'AuthCtrlrEnabled': { value: 'true' },
            'AuthCacheCtrlrEnabled': { value: 'false' },
            'LocalAuthorizeOffline': { value: 'true' },
            'LocalPreAuthorize': { value: 'false' },

            // Transaction
            'TxCtrlrEnabled': { value: 'true' },
            'TxStartPoint': { value: 'Authorized' },
            'TxStopPoint': { value: 'Authorized' },
            'StopTransactionOnEVSideDisconnect': { value: 'true' },
            'StopTransactionOnInvalidId': { value: 'true' },

            // Meter Values
            'SampledDataCtrlrEnabled': { value: 'true' },
            'SampledDataCtrlrAvailable': { value: 'true' },
            'SampledDataTxUpdatedMeasurands': { value: 'Energy.Active.Import.Register,Power.Active.Import,Current.Import,Voltage' },
            'SampledDataTxUpdatedInterval': { value: '60' },
            'SampledDataSignReadings': { value: 'false' },

            // Station Info
            'ChargingStationVendorName': { value: config.vendor || 'Simulator Corp' },
            'ChargingStationModel': { value: config.model || 'SimCharger Pro 2.0' },
            'ChargingStationSerialNumber': { value: config.serialNumber || 'SIM201' },
            'FirmwareVersion': { value: config.firmwareVersion || '2.0.1' },

            // Connectors & EVSEs
            'NumberOfConnectors': { value: '2' },
            'EvseId': { value: '1,2' },

            // Security
            'SecurityCtrlrEnabled': { value: 'true' },
            'SecurityCtrlrIdentity': { value: this.stationId },

            // Display
            'DisplayMessageCtrlrEnabled': { value: 'true' },
            'DisplayMessageCtrlrAvailable': { value: 'true' },

            // Reservations  
            'ReservationCtrlrEnabled': { value: 'false' },

            // Smart Charging
            'SmartChargingCtrlrEnabled': { value: 'true' },
            'SmartChargingCtrlrAvailable': { value: 'true' },

            // Tariff and Cost
            'TariffCostCtrlrEnabled': { value: 'false' },

            // ISO 15118
            'ISO15118CtrlrEnabled': { value: 'false' }
        };

        // OCPP 2.0.1 specific
        this.chargingProfiles = new Map();
        this.transactions = new Map();
    }

    /**
     * Get protocol version string
     */
    getProtocolVersion() {
        return '2.0.1';
    }

    /**
     * Get WebSocket sub-protocol
     */
    getSubProtocol() {
        return 'ocpp2.0.1';
    }

    /**
     * Send BootNotification (OCPP 2.0.1 specific)
     */
    async sendBootNotification() {
        const payload = {
            reason: 'PowerUp',
            chargingStation: {
                serialNumber: this.configurationVariables['ChargingStationSerialNumber'].value,
                model: this.configurationVariables['ChargingStationModel'].value,
                vendorName: this.configurationVariables['ChargingStationVendorName'].value,
                firmwareVersion: this.configurationVariables['FirmwareVersion'].value,
                modem: {
                    iccid: '',
                    imsi: ''
                }
            }
        };

        const response = await this.sendMessage('BootNotification', payload);

        this.bootNotificationStatus = response.status;

        if (response.status === 'Accepted') {
            logger.info(`✅ Boot notification accepted for ${this.stationId}`);

            // Update heartbeat interval if provided
            if (response.interval) {
                this.configurationVariables['HeartbeatInterval'].value = response.interval.toString();
            }
        } else {
            logger.warn(`⚠️ Boot notification ${response.status} for ${this.stationId}`);
        }

        return response;
    }

    /**
     * Handle CALL messages from CSMS (OCPP 2.0.1 specific actions)
     */
    async handleCall(messageId, action, payload) {
        const startTime = Date.now();
        logger.info(`📞 Received CALL: ${action} (${messageId})`);

        try {
            let response;

            switch (action) {
                case 'RequestStartTransaction':
                    response = await this.handleRequestStartTransaction(payload);
                    break;
                case 'RequestStopTransaction':
                    response = await this.handleRequestStopTransaction(payload);
                    break;
                case 'UnlockConnector':
                    response = await this.handleUnlockConnector(payload);
                    break;
                case 'Reset':
                    response = await this.handleReset(payload);
                    break;
                case 'GetVariables':
                    response = this.handleGetVariables(payload);
                    break;
                case 'SetVariables':
                    response = this.handleSetVariables(payload);
                    break;
                case 'ChangeAvailability':
                    response = this.handleChangeAvailability(payload);
                    break;
                case 'SetChargingProfile':
                    response = this.handleSetChargingProfile(payload);
                    break;
                case 'GetChargingProfiles':
                    response = this.handleGetChargingProfiles(payload);
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
                case 'SetDisplayMessage':
                    response = this.handleSetDisplayMessage(payload);
                    break;
                case 'GetDisplayMessages':
                    response = this.handleGetDisplayMessages(payload);
                    break;
                case 'ClearDisplayMessage':
                    response = this.handleClearDisplayMessage(payload);
                    break;
                default:
                    logger.warn(`❓ Unhandled CALL action: ${action}`);
                    response = { status: 'NotSupported' };
            }

            // Send CALLRESULT
            await this.sendCallResult(messageId, response);

            // Record latency
            const latency = (Date.now() - startTime) / 1000;
            metricsCollector.recordOCPPLatency(action, '2.0.1', latency);

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
                metricsCollector.recordOCPPLatency(pendingRequest.action, '2.0.1', latency);
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
    // OCPP 2.0.1 Message Handlers

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
     * Send TransactionEvent
     */
    async sendTransactionEvent(payload) {
        return await this.sendMessage('TransactionEvent', payload);
    }

    /**
     * Send MeterValues
     */
    async sendMeterValues(payload) {
        return await this.sendMessage('MeterValues', payload);
    }

    /**
     * Send NotifyReport
     */
    async sendNotifyReport(payload) {
        return await this.sendMessage('NotifyReport', payload);
    }

    // Command Handlers (from CSMS)

    async handleRequestStartTransaction(payload) {
        logger.info(`🚗 Request start transaction: EVSE ${payload.evseId}, idToken: ${payload.idToken?.idToken}`);

        // Forward to station simulator
        return { status: 'Accepted' }; // Will be overridden by station simulator
    }

    async handleRequestStopTransaction(payload) {
        logger.info(`🛑 Request stop transaction: ${payload.transactionId}`);

        // Forward to station simulator  
        return { status: 'Accepted' }; // Will be overridden by station simulator
    }

    async handleUnlockConnector(payload) {
        logger.info(`🔓 Unlock connector requested: EVSE ${payload.evseId}, connector ${payload.connectorId}`);
        return { status: 'Unlocked' };
    }

    async handleReset(payload) {
        logger.info(`🔄 Reset requested: ${payload.type}`);

        // Simulate reset delay
        setTimeout(() => {
            this.emit('resetRequested', payload);
        }, 1000);

        return { status: 'Accepted' };
    }

    handleGetVariables(payload) {
        const getVariableResult = [];

        for (const getVariableData of payload.getVariableData) {
            const { component, variable, attributeType = 'Actual' } = getVariableData;
            const variableKey = `${component.name}${variable.name}`;

            if (this.configurationVariables[variableKey]) {
                getVariableResult.push({
                    attributeStatus: 'Accepted',
                    component,
                    variable,
                    attributeType,
                    attributeValue: this.configurationVariables[variableKey].value
                });
            } else {
                getVariableResult.push({
                    attributeStatus: 'UnknownVariable',
                    component,
                    variable,
                    attributeType
                });
            }
        }

        return { getVariableResult };
    }

    handleSetVariables(payload) {
        const setVariableResult = [];

        for (const setVariableData of payload.setVariableData) {
            const { component, variable, attributeValue, attributeType = 'Actual' } = setVariableData;
            const variableKey = `${component.name}${variable.name}`;

            if (this.configurationVariables[variableKey]) {
                // Validate value (simplified)
                this.configurationVariables[variableKey].value = attributeValue;

                setVariableResult.push({
                    attributeStatus: 'Accepted',
                    component,
                    variable,
                    attributeType
                });

                logger.info(`⚙️ Variable set: ${variableKey} = ${attributeValue}`);
            } else {
                setVariableResult.push({
                    attributeStatus: 'UnknownVariable',
                    component,
                    variable,
                    attributeType
                });
            }
        }

        return { setVariableResult };
    }

    handleChangeAvailability(payload) {
        logger.info(`🔄 Change availability: EVSE ${payload.evseId}, operational status: ${payload.operationalStatus}`);

        // Simulate availability change
        return { status: 'Accepted' };
    }

    handleSetChargingProfile(payload) {
        logger.info('⚡ Set charging profile requested:', payload);

        const { evseId, chargingProfile } = payload;

        // Store charging profile
        this.chargingProfiles.set(chargingProfile.id, {
            evseId,
            profile: chargingProfile,
            setAt: new Date()
        });

        return { status: 'Accepted' };
    }

    handleGetChargingProfiles(payload) {
        logger.info('📊 Get charging profiles requested:', payload);

        const chargingProfiles = [];

        for (const [profileId, profileData] of this.chargingProfiles) {
            if (!payload.evseId || profileData.evseId === payload.evseId) {
                chargingProfiles.push(profileData.profile);
            }
        }

        return {
            status: 'Accepted',
            chargingProfiles
        };
    }

    handleClearChargingProfile(payload) {
        logger.info('🗑️ Clear charging profile requested:', payload);

        if (payload.chargingProfileId) {
            this.chargingProfiles.delete(payload.chargingProfileId);
        } else {
            // Clear all profiles for EVSE
            for (const [profileId, profileData] of this.chargingProfiles) {
                if (!payload.evseId || profileData.evseId === payload.evseId) {
                    this.chargingProfiles.delete(profileId);
                }
            }
        }

        return { status: 'Accepted' };
    }

    handleGetCompositeSchedule(payload) {
        logger.info('📊 Get composite schedule requested:', payload);

        return {
            status: 'Accepted',
            schedule: {
                evseId: payload.evseId,
                duration: payload.duration,
                scheduleStart: new Date().toISOString(),
                chargingSchedule: {
                    id: 1,
                    chargingRateUnit: 'W',
                    chargingSchedulePeriod: [{
                        startPeriod: 0,
                        limit: 11000
                    }]
                }
            }
        };
    }

    async handleTriggerMessage(payload) {
        const { requestedMessage, evse } = payload;

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
                if (evse) {
                    await this.sendStatusNotification({
                        timestamp: new Date().toISOString(),
                        connectorStatus: 'Available',
                        evseId: evse.id,
                        connectorId: evse.connectorId || 1
                    });
                }
                break;
            default:
                return { status: 'NotImplemented' };
        }

        return { status: 'Accepted' };
    }

    handleSetDisplayMessage(payload) {
        logger.info('📱 Set display message requested:', payload);
        return { status: 'Accepted' };
    }

    handleGetDisplayMessages(payload) {
        logger.info('📱 Get display messages requested:', payload);
        return {
            status: 'Accepted',
            displayMessage: []
        };
    }

    handleClearDisplayMessage(payload) {
        logger.info('📱 Clear display message requested:', payload);
        return { status: 'Accepted' };
    }

    /**
     * Send transaction event (OCPP 2.0.1 equivalent of StartTransaction/StopTransaction)
     */
    async sendTransactionStarted(transactionData) {
        const payload = {
            eventType: 'Started',
            timestamp: new Date().toISOString(),
            triggerReason: 'Authorized',
            seqNo: 0,
            transactionInfo: {
                transactionId: transactionData.transactionId,
                chargingState: 'Charging',
                timeSpentCharging: 0,
                remoteStartId: transactionData.remoteStartId
            },
            evse: {
                id: transactionData.evseId,
                connectorId: transactionData.connectorId
            },
            idToken: {
                idToken: transactionData.idTag,
                type: 'ISO14443'
            },
            meterValue: [{
                timestamp: new Date().toISOString(),
                sampledValue: [{
                    value: transactionData.meterStart,
                    context: 'Transaction.Begin',
                    measurand: 'Energy.Active.Import.Register',
                    unit: 'Wh'
                }]
            }]
        };

        return await this.sendMessage('TransactionEvent', payload);
    }

    async sendTransactionEnded(transactionData) {
        const payload = {
            eventType: 'Ended',
            timestamp: new Date().toISOString(),
            triggerReason: 'StopAuthorized',
            seqNo: transactionData.seqNo || 1,
            transactionInfo: {
                transactionId: transactionData.transactionId,
                chargingState: 'Idle',
                timeSpentCharging: transactionData.duration || 0,
                stoppedReason: transactionData.reason || 'Local'
            },
            evse: {
                id: transactionData.evseId,
                connectorId: transactionData.connectorId
            },
            idToken: transactionData.idTag ? {
                idToken: transactionData.idTag,
                type: 'ISO14443'
            } : undefined,
            meterValue: [{
                timestamp: new Date().toISOString(),
                sampledValue: [{
                    value: transactionData.meterStop,
                    context: 'Transaction.End',
                    measurand: 'Energy.Active.Import.Register',
                    unit: 'Wh'
                }]
            }]
        };

        return await this.sendMessage('TransactionEvent', payload);
    }

    getStatus() {
        return {
            protocol: 'OCPP 2.0.1',
            connected: this.isConnected,
            bootStatus: this.bootNotificationStatus,
            lastHeartbeat: this.lastHeartbeat,
            csmsUrl: this.csmsUrl,
            reconnectAttempts: this.reconnectAttempts,
            chargingProfiles: this.chargingProfiles.size,
            transactions: this.transactions.size
        };
    }
}
