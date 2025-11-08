import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
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

        this.behavior = {
            latency: { min: 0, max: 0 },
            failNextBoot: false,
            callError: null,
            dropNextResponse: false,
            disconnectAfterResponse: false
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
            const stationId = request.url?.split('/').pop() || 'unknown-station';
            logger.debug(`🔌 Mock CSMS: station connected (${stationId})`);

            const connectionContext = {
                stationId,
                socket,
                bootNotified: false
            };

            this.connections.add(connectionContext);

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

        app.post('/mock/behavior/latency', (req, res) => {
            const { minMs = 0, maxMs = 0 } = req.body || {};
            this.behavior.latency = {
                min: Math.max(0, Number(minMs)),
                max: Math.max(0, Number(maxMs))
            };
            logger.info(`🛠️  Mock CSMS latency set to ${this.behavior.latency.min}-${this.behavior.latency.max}ms`);
            res.json({ success: true, latency: this.behavior.latency });
        });

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
            timer.unref?.();
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

    async handleCall(context, { messageId, action, payload }) {
        const { socket, stationId } = context;

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
                remoteStartTimer.unref?.();
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
