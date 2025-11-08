import express from 'express';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import logger from '../utils/logger.js';

const DEFAULT_BOOT_RESPONSE = {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
    heartbeatInterval: 300
};

const DEFAULT_HEARTBEAT_RESPONSE = {
    currentTime: new Date().toISOString()
};

const REMOTE_START_TEMPLATE = {
    connectorId: 1,
    idTag: 'MOCK_REMOTE_START',
    chargingProfile: null
};

/**
 * Lightweight mock CSMS with optional error injection and latency controls.
 * Enhanced with message pattern matching and connection state simulation.
 */
export class MockCsmsServer {
    constructor(options = {}) {
        const {
            port = 9220,
                host = '0.0.0.0',
                controlPort = 0,
                enableRemoteStart = true,
                protocols = ['ocpp1.6', 'ocpp2.0.1']
        } = options;

        this.port = port;
        this.host = host;
        this.controlPort = controlPort || port + 100;
        this.protocols = protocols;
        this.enableRemoteStart = enableRemoteStart;

        this.wss = null;
        this.httpServer = null;
        this.connections = new Set();

        // Basic behavior controls
        this.behavior = {
            latency: { min: 0, max: 0 },
            failNextBoot: false,
            callError: null,
            dropNextResponse: false,
            disconnectAfterResponse: false
        };

        // Advanced features: Message pattern matching
        this.messagePatterns = new Map(); // pattern -> handler function

        // Advanced features: Connection state simulation
        this.connectionStates = new Map(); // stationId -> state config
        this.defaultConnectionState = {
            type: 'stable', // 'stable', 'intermittent', 'unreliable'
            disconnectProbability: 0, // 0-1
            reconnectDelay: 1000, // ms
            messageDropProbability: 0 // 0-1
        };
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.initializeWebSocketServer();
                this.initializeControlApi();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    initializeWebSocketServer() {
        this.wss = new WebSocketServer({
            port: this.port,
            host: this.host,
            handleProtocols: (protocols) => {
                for (const protocol of protocols) {
                    if (this.protocols.includes(protocol)) {
                        return protocol;
                    }
                }
                return false;
            }
        });

        this.wss.on('connection', (socket, request) => {
            const stationId = request.url ? .split('/').pop() || 'unknown-station';
            logger.debug(`🔌 Mock CSMS: station connected (${stationId})`);

            const connectionContext = {
                stationId,
                socket,
                bootNotified: false,
                messageCount: 0,
                lastMessageTime: Date.now()
            };

            this.connections.add(connectionContext);

            // Initialize connection state
            this.initializeConnectionState(stationId);

            socket.on('message', (raw) => {
                this.handleMessage(connectionContext, raw.toString());
            });

            socket.on('close', () => {
                this.connections.delete(connectionContext);
                logger.debug(`🔌 Mock CSMS: station disconnected (${stationId})`);
            });
        });

        this.wss.on('listening', () => {
            logger.info(`🧪 Mock CSMS listening on ws://${this.host}:${this.port}`);
        });

        this.wss.on('error', (error) => {
            logger.error('Mock CSMS WebSocket error:', error);
        });
    }

    initializeControlApi() {
        const app = express();
        app.use(express.json());

        // Basic latency control
        app.post('/mock/behavior/latency', (req, res) => {
            const { minMs = 0, maxMs = 0 } = req.body || {};
            this.behavior.latency = {
                min: Math.max(0, Number(minMs)),
                max: Math.max(0, Number(maxMs))
            };
            logger.info(`🛠️  Mock CSMS latency set to ${this.behavior.latency.min}-${this.behavior.latency.max}ms`);
            res.json({ success: true, latency: this.behavior.latency });
        });

        // Basic error injection
        app.post('/mock/behavior/error', (req, res) => {
            const { type, code = 'InternalError', description = 'Mock error' } = req.body || {};
            switch (type) {
                case 'rejectBoot':
                    this.behavior.failNextBoot = true;
                    break;
                case 'callError':
                    this.behavior.callError = { code, description };
                    break;
                case 'dropResponse':
                    this.behavior.dropNextResponse = true;
                    break;
                case 'disconnect':
                    this.behavior.disconnectAfterResponse = true;
                    break;
                default:
                    return res.status(400).json({ success: false, error: 'Unknown error type' });
            }

            logger.info(`🛠️  Mock CSMS error injection configured: ${type}`);
            res.json({ success: true });
        });

        // Reset behavior
        app.post('/mock/behavior/reset', (_req, res) => {
            this.behavior = {
                latency: { min: 0, max: 0 },
                failNextBoot: false,
                callError: null,
                dropNextResponse: false,
                disconnectAfterResponse: false
            };
            res.json({ success: true });
        });

        // Advanced: Message pattern matching
        app.post('/mock/pattern/register', (req, res) => {
            const { pattern, handler } = req.body || {};
            if (!pattern || !handler) {
                return res.status(400).json({ success: false, error: 'Pattern and handler required' });
            }

            // Store pattern handler
            this.messagePatterns.set(pattern, handler);
            logger.info(`🛠️  Mock CSMS pattern registered: ${pattern}`);
            res.json({ success: true, pattern });
        });

        app.post('/mock/pattern/clear', (_req, res) => {
            this.messagePatterns.clear();
            res.json({ success: true });
        });

        // Advanced: Connection state simulation
        app.post('/mock/connection/state', (req, res) => {
            const { stationId, type, disconnectProbability, reconnectDelay, messageDropProbability } = req.body || {};

            if (!stationId) {
                return res.status(400).json({ success: false, error: 'stationId required' });
            }

            const stateConfig = {
                type: type || 'stable',
                disconnectProbability: disconnectProbability || 0,
                reconnectDelay: reconnectDelay || 1000,
                messageDropProbability: messageDropProbability || 0
            };

            this.connectionStates.set(stationId, stateConfig);
            logger.info(`🛠️  Mock CSMS connection state configured for ${stationId}: ${type}`);
            res.json({ success: true, state: stateConfig });
        });

        app.post('/mock/connection/reset', (req, res) => {
            const { stationId } = req.body || {};
            if (stationId) {
                this.connectionStates.delete(stationId);
            } else {
                this.connectionStates.clear();
            }
            res.json({ success: true });
        });

        // Get current state
        app.get('/mock/state', (_req, res) => {
            res.json({
                success: true,
                behavior: this.behavior,
                patterns: Array.from(this.messagePatterns.keys()),
                connections: Array.from(this.connections).map(c => ({
                    stationId: c.stationId,
                    bootNotified: c.bootNotified,
                    messageCount: c.messageCount
                })),
                connectionStates: Object.fromEntries(this.connectionStates)
            });
        });

        this.httpServer = http.createServer(app);
        this.httpServer.listen(this.controlPort, this.host, () => {
            logger.info(`🛠️ Mock CSMS control API listening on http://${this.host}:${this.controlPort}`);
        });
    }

    async stop() {
        for (const connection of this.connections) {
            try {
                connection.socket.close();
            } catch (error) {
                logger.warn('Mock CSMS connection close error:', error);
            }
        }

        this.connections.clear();

        if (this.wss) {
            await new Promise((resolve) => {
                this.wss.close(() => resolve());
            });
            this.wss = null;
        }

        if (this.httpServer) {
            await new Promise((resolve) => this.httpServer.close(() => resolve()));
            this.httpServer = null;
        }

        logger.info('🧪 Mock CSMS stopped');
    }

    /**
     * Initialize connection state for a station
     */
    initializeConnectionState(stationId) {
        if (!this.connectionStates.has(stationId)) {
            this.connectionStates.set(stationId, {...this.defaultConnectionState });
        }
    }

    /**
     * Check if connection should be dropped based on state
     */
    shouldDropConnection(stationId) {
        const state = this.connectionStates.get(stationId) || this.defaultConnectionState;
        return Math.random() < state.disconnectProbability;
    }

    /**
     * Check if message should be dropped based on state
     */
    shouldDropMessage(stationId) {
        const state = this.connectionStates.get(stationId) || this.defaultConnectionState;
        return Math.random() < state.messageDropProbability;
    }

    async applyBehaviorDelay() {
        const { latency } = this.behavior;
        if (!latency || (latency.min === 0 && latency.max === 0)) {
            return;
        }

        const delay = latency.min === latency.max ?
            latency.min :
            latency.min + Math.random() * Math.max(0, latency.max - latency.min);

        await new Promise((resolve) => {
            const timer = setTimeout(resolve, delay);
            timer.unref ? .();
        });
    }

    handleMessage(context, rawMessage) {
        let parsed;

        try {
            parsed = JSON.parse(rawMessage);
        } catch (error) {
            logger.error('Mock CSMS received invalid JSON:', rawMessage);
            return;
        }

        const [messageType, messageId, action, payload] = parsed;

        // Check for message pattern match
        const patternMatch = this.matchMessagePattern(action, payload);
        if (patternMatch && patternMatch.handler) {
            patternMatch.handler(context, { messageId, action, payload });
            return;
        }

        // Check if message should be dropped based on connection state
        if (this.shouldDropMessage(context.stationId)) {
            logger.warn(`🧪 Dropping message for ${context.stationId} due to connection state`);
            return;
        }

        // Update context
        context.messageCount++;
        context.lastMessageTime = Date.now();

        switch (messageType) {
            case 2:
                this.handleCall(context, { messageId, action, payload });
                break;
            case 3:
                logger.debug(`Mock CSMS received CALLRESULT for ${messageId}:`, payload);
                break;
            case 4:
                logger.warn(`Mock CSMS received CALLERROR for ${messageId}:`, payload);
                break;
            default:
                logger.warn('Mock CSMS received unknown message type:', parsed);
        }
    }

    /**
     * Match message against registered patterns
     */
    matchMessagePattern(action, payload) {
        for (const [pattern, handler] of this.messagePatterns.entries()) {
            if (this.patternMatches(pattern, action, payload)) {
                return { pattern, handler };
            }
        }
        return null;
    }

    /**
     * Check if pattern matches message
     * Supports:
     * - Exact match: "BootNotification"
     * - Wildcard: "Boot*"
     * - JSON path: "MeterValues.connectorId=1"
     */
    patternMatches(pattern, action, payload) {
        // Exact match
        if (pattern === action) {
            return true;
        }

        // Wildcard match
        if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            return action.startsWith(prefix);
        }

        // JSON path match (simple implementation)
        if (pattern.includes('.')) {
            const [actionPattern, ...pathParts] = pattern.split('.');
            if (actionPattern === action || actionPattern.endsWith('*') && action.startsWith(actionPattern.slice(0, -1))) {
                const path = pathParts.join('.');
                if (path.includes('=')) {
                    const [key, value] = path.split('=');
                    return this.getNestedValue(payload, key) == value;
                }
                return this.getNestedValue(payload, path) !== undefined;
            }
        }

        return false;
    }

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current ? .[key], obj);
    }

    async handleCall(context, { messageId, action, payload }) {
        const { socket, stationId } = context;

        // Check connection state for disconnection
        if (this.shouldDropConnection(stationId)) {
            const state = this.connectionStates.get(stationId);
            logger.warn(`🧪 Simulating disconnection for ${stationId} (${state.type})`);
            setTimeout(() => {
                socket.close();
            }, state.reconnectDelay || 1000);
            return;
        }

        if (this.behavior.dropNextResponse) {
            logger.warn(`🧪 Dropping response for ${action}`);
            this.behavior.dropNextResponse = false;
            return;
        }

        if (this.behavior.callError) {
            const { code, description } = this.behavior.callError;
            this.behavior.callError = null;
            await this.applyBehaviorDelay();
            this.sendCallError(socket, messageId, code, description, {});
            return;
        }

        switch (action) {
            case 'BootNotification':
                logger.debug(`Mock CSMS BootNotification from ${stationId}`, payload);
                context.bootNotified = true;
                await this.applyBehaviorDelay();
                if (this.behavior.failNextBoot) {
                    this.behavior.failNextBoot = false;
                    this.sendCallResult(socket, messageId, {
                        status: 'Rejected',
                        currentTime: new Date().toISOString()
                    });
                    break;
                }

                this.sendCallResult(socket, messageId, {
                    ...DEFAULT_BOOT_RESPONSE,
                    currentTime: new Date().toISOString()
                });

                if (this.enableRemoteStart) {
                    const remoteStartTimer = setTimeout(() => {
                        this.sendRemoteStart(socket);
                    }, 500);
                    remoteStartTimer.unref ? .();
                }
                break;
            case 'Heartbeat':
                await this.applyBehaviorDelay();
                this.sendCallResult(socket, messageId, {
                    ...DEFAULT_HEARTBEAT_RESPONSE,
                    currentTime: new Date().toISOString()
                });
                break;
            case 'StatusNotification':
            case 'Authorize':
            case 'StartTransaction':
            case 'StopTransaction':
            case 'MeterValues':
                await this.applyBehaviorDelay();
                this.sendCallResult(socket, messageId, {});
                break;
            default:
                logger.debug(`Mock CSMS received unhandled action ${action} from ${stationId}`);
                await this.applyBehaviorDelay();
                this.sendCallResult(socket, messageId, {});
        }

        if (this.behavior.disconnectAfterResponse) {
            this.behavior.disconnectAfterResponse = false;
            setTimeout(() => {
                socket.close();
            }, 50);
        }
    }

    sendCallResult(socket, messageId, payload) {
        const response = [3, messageId, payload];
        socket.send(JSON.stringify(response));
    }

    sendCallError(socket, messageId, errorCode, description, details = {}) {
        const message = [4, messageId, errorCode, description, details];
        socket.send(JSON.stringify(message));
    }

    sendRemoteStart(socket, overrides = {}) {
        const messageId = uuidv4();
        const payload = {
            ...REMOTE_START_TEMPLATE,
            ...overrides
        };

        const message = [2, messageId, 'RemoteStartTransaction', payload];
        socket.send(JSON.stringify(message));
    }
}

export const startMockCsmsServer = async(options) => {
    const server = new MockCsmsServer(options);
    await server.start();
    return server;
};