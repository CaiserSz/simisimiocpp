import process from 'node:process';
import logger from '../utils/logger.js';
import { startMockCsmsServer } from './csms.mock.js';

const port = Number(process.env.MOCK_CSMS_PORT || process.env.CSMS_PORT || 9220);
const host = process.env.MOCK_CSMS_HOST || '0.0.0.0';
const controlPort = Number(process.env.MOCK_CSMS_CONTROL_PORT || (port + 100));

let server;

const start = async() => {
    try {
        server = await startMockCsmsServer({ port, host, controlPort });
        logger.info(`🧪 Mock CSMS ready on ws://${host}:${port} (control http://${host}:${controlPort})`);
    } catch (error) {
        logger.error('Failed to start mock CSMS server:', error);
        process.exit(1);
    }
};

const shutdown = async(signal) => {
    logger.info(`🛑 Received ${signal}. Stopping mock CSMS...`);
    try {
        if (server) {
            await server.stop();
        }
        process.exit(0);
    } catch (error) {
        logger.error('Error shutting down mock CSMS:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
