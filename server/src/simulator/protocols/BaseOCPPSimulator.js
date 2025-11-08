import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import metricsCollector from '../../middleware/metrics.js';
import circuitBreakerManager from '../../utils/circuitBreaker.js';
import logger from '../../utils/logger.js';

/**
 * Base OCPP Simulator Class
 * Common functionality shared between OCPP 1.6J and 2.0.1 simulators
 * 
 * Created: 2025-01-11
 * Purpose: Reduce code duplication between OCPP protocol implementations
 */
export class BaseOCPPSimulator extends EventEmitter {
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

        // Station status
        this.bootNotificationStatus = null;
        this.lastHeartbeat = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000; // 5 seconds
        this.reconnectTimer = null; // Store reconnect timer for cleanup
        this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting, failed
        this.lastConnectionError = null;
        this.reconnectBackoffMultiplier = 1; // Exponential backoff multiplier

        // Circuit breaker for CSMS connection
        this.circuitBreaker = circuitBreakerManager.getBreaker(`ocpp-${this.stationId}`, {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 30000,
            resetTimeout: 60000
        });
        this.circuitBreaker.setMaxListeners?.(20);

        // Listen to circuit breaker events
        this.circuitBreaker.on('open', () => {
            logger.warn(`🔴 Circuit breaker opened for ${this.stationId} - CSMS unavailable`);
            this.emit('circuitBreakerOpen', { stationId: this.stationId });
        });

        this.circuitBreaker.on('closed', () => {
            logger.info(`🟢 Circuit breaker closed for ${this.stationId} - CSMS recovered`);
            this.emit('circuitBreakerClosed', { stationId: this.stationId });
        });
    }

    /**
     * Get protocol version string (must be implemented by subclasses)
     * @abstract
     * @returns {string} Protocol version (e.g., '1.6J' or '2.0.1')
     */
    getProtocolVersion() {
        throw new Error('getProtocolVersion() must be implemented by subclass');
    }

    /**
     * Get WebSocket sub-protocol (must be implemented by subclasses)
     * @abstract
     * @returns {string} Sub-protocol string (e.g., 'ocpp1.6' or 'ocpp2.0.1')
     */
    getSubProtocol() {
        throw new Error('getSubProtocol() must be implemented by subclass');
    }

    /**
     * Send boot notification (must be implemented by subclasses)
     * @abstract
     */
    async sendBootNotification() {
        throw new Error('sendBootNotification() must be implemented by subclass');
    }

    /**
     * Handle CALL messages (must be implemented by subclasses)
     * @abstract
     * @param {string} messageId - Message identifier
     * @param {string} action - OCPP action name
     * @param {object} payload - Action payload
     */
    async handleCall(messageId, action, payload) {
        throw new Error('handleCall() must be implemented by subclass');
    }

    /**
     * Connect to CSMS
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `${this.csmsUrl}/${this.stationId}`;
                const protocolVersion = this.getProtocolVersion();
                const subProtocol = this.getSubProtocol();

                logger.info(`🔗 Connecting OCPP ${protocolVersion} client to CSMS: ${wsUrl}`);

                this.ws = new WebSocket(wsUrl, [subProtocol]);

                this.ws.on('open', async() => {
                    logger.info(`✅ OCPP ${protocolVersion} WebSocket connected: ${this.stationId}`);
                    this.isConnected = true;

                    // Reset reconnect attempts on successful connection
                    const wasReconnecting = this.reconnectAttempts > 0;
                    this.reconnectAttempts = 0;
                    this.reconnectBackoffMultiplier = 1;
                    this.connectionState = 'connected';
                    this.lastConnectionError = null;

                    // Send boot notification
                    try {
                        await this.sendBootNotification();
                        this.emit('connected');

                        // Emit reconnection success if this was a reconnection
                        if (wasReconnecting) {
                            this.emit('reconnectionSuccess', {
                                stationId: this.stationId,
                                timestamp: new Date().toISOString()
                            });
                        }

                        resolve();
                    } catch (error) {
                        logger.error('Boot notification failed:', error);
                        this.connectionState = 'failed';
                        reject(error);
                    }
                });

                this.ws.on('message', (data) => {
                    this.handleMessage(data.toString());
                });

                this.ws.on('close', (code, reason) => {
                    const protocolVersion = this.getProtocolVersion();
                    logger.warn(`🔌 OCPP ${protocolVersion} WebSocket closed: ${code} - ${reason}`);
                    this.isConnected = false;

                    // Update connection state
                    if (this.connectionState === 'connected') {
                        this.connectionState = 'reconnecting';
                    }

                    this.emit('disconnected', {
                        code,
                        reason: reason.toString(),
                        stationId: this.stationId,
                        reconnectAttempts: this.reconnectAttempts,
                        maxReconnectAttempts: this.maxReconnectAttempts
                    });

                    // Attempt reconnection if not manually disconnected
                    if (this.connectionState !== 'disconnected') {
                        this.attemptReconnection();
                    }
                });

                this.ws.on('error', (error) => {
                    const protocolVersion = this.getProtocolVersion();
                    logger.error(`❌ OCPP ${protocolVersion} WebSocket error:`, error);
                    this.lastConnectionError = {
                        message: error.message,
                        code: error.code,
                        timestamp: new Date().toISOString()
                    };
                    this.emit('error', error);

                    if (!this.isConnected) {
                        reject(error);
                    }
                });

                // Connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (!this.isConnected) {
                        this.ws.close();
                        reject(new Error('Connection timeout'));
                    }
                }, 10000); // 10 seconds
                connectionTimeout.unref?.();

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
        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Reset reconnection state
        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.reconnectBackoffMultiplier = 1;

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
            this.connectionState = 'failed';
            this.emit('reconnectionFailed', {
                stationId: this.stationId,
                attempts: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts,
                lastError: this.lastConnectionError,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectAttempts++;
        this.connectionState = 'reconnecting';

        // Exponential backoff with jitter
        const baseDelay = this.reconnectInterval * this.reconnectBackoffMultiplier;
        const jitter = Math.random() * 1000; // 0-1 second jitter
        const delay = baseDelay + jitter;

        // Increase backoff multiplier for next attempt (max 32x)
        this.reconnectBackoffMultiplier = Math.min(this.reconnectBackoffMultiplier * 2, 32);

        logger.info(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} for ${this.stationId} (delay: ${Math.round(delay)}ms)`);

        // Emit reconnection attempt event
        this.emit('reconnectionAttempt', {
            stationId: this.stationId,
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts,
            delay: Math.round(delay),
            timestamp: new Date().toISOString()
        });

        this.reconnectTimer = setTimeout(async() => {
            try {
                this.connectionState = 'connecting';
                await this.connect();
            } catch (error) {
                logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
                this.lastConnectionError = {
                    message: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString()
                };

                // Retry if not max attempts
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnection();
                }
            }
        }, delay);
        this.reconnectTimer.unref?.();
    }

    /**
     * Handle incoming OCPP messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            const protocolVersion = this.getProtocolVersion();
            logger.debug(`📨 Received OCPP ${protocolVersion} message:`, message);

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
                const protocolVersion = this.getProtocolVersion();
                metricsCollector.recordOCPPLatency(pendingRequest.action, protocolVersion, latency);
                // Record successful message
                metricsCollector.recordOCPPMessage(pendingRequest.action, 'success', protocolVersion);
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
            // Record failed message
            const protocolVersion = this.getProtocolVersion();
            if (pendingRequest.action) {
                metricsCollector.recordOCPPMessage(pendingRequest.action, 'failure', protocolVersion);
            }
            const error = new Error(errorDescription || errorCode);
            error.code = errorCode;
            error.details = errorDetails;
            pendingRequest.reject(error);
        }
    }

    /**
     * Send OCPP message to CSMS with circuit breaker protection
     */
    async sendMessage(action, payload) {
        // Use circuit breaker to protect against CSMS failures
        return await this.circuitBreaker.execute(async() => {
            return new Promise((resolve, reject) => {
                if (!this.isConnected) {
                    reject(new Error('Not connected to CSMS'));
                    return;
                }

                const messageId = uuidv4();
                const message = [2, messageId, action, payload];
                const startTime = Date.now();
                const protocolVersion = this.getProtocolVersion();

                logger.debug(`📤 Sending OCPP ${protocolVersion} message: ${action}`, payload);

                // Record OCPP message metric
                metricsCollector.recordOCPPMessage(action, 'sent', protocolVersion);

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
}

export default BaseOCPPSimulator;