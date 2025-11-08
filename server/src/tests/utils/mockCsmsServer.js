import { startMockCsmsServer } from '../../mock/csms.mock.js';

let serverInstance = null;

const parsePortFromUrl = (urlString) => {
    try {
        const parsed = new URL(urlString);
        return parsed.port ? Number(parsed.port) : (parsed.protocol === 'wss:' ? 443 : 80);
    } catch (error) {
        return 9220;
    }
};

export const ensureMockCsms = async(csmsUrl) => {
    if (serverInstance) {
        return serverInstance;
    }

    const port = parsePortFromUrl(csmsUrl);
    serverInstance = await startMockCsmsServer({ port });
    return serverInstance;
};

export const shutdownMockCsms = async() => {
    if (!serverInstance) {
        return;
    }

    await serverInstance.stop();
    serverInstance = null;
};

const controlBaseUrl = () => {
    if (!serverInstance) {
        throw new Error('Mock CSMS not started');
    }
    const port = serverInstance.controlPort || serverInstance.port + 100;
    return `http://127.0.0.1:${port}`;
};

export const configureLatency = async({ minMs = 0, maxMs = 0 } = {}) => {
    await fetch(`${controlBaseUrl()}/mock/behavior/latency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minMs, maxMs })
    });
};

export const injectError = async(type, options = {}) => {
    await fetch(`${controlBaseUrl()}/mock/behavior/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...options })
    });
};

export const resetMockBehavior = async() => {
    await fetch(`${controlBaseUrl()}/mock/behavior/reset`, {
        method: 'POST'
    });
};
