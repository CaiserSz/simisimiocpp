import { OCPP16JSimulator } from '../../simulator/protocols/OCPP16JSimulator.js';
import {
    ensureMockCsms,
    shutdownMockCsms,
    configureLatency,
    injectError,
    resetMockBehavior
} from '../utils/mockCsmsServer.js';

const CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';

describe('Mock CSMS Behavior Controls', () => {
    let simulator;

    const createSimulator = () => new OCPP16JSimulator({
        stationId: `MOCK_TEST_${Date.now()}`,
        csmsUrl: CSMS_URL
    });

    beforeAll(async() => {
        await ensureMockCsms(CSMS_URL);
    });

    afterAll(async() => {
        await shutdownMockCsms();
    });

    afterEach(async() => {
        await resetMockBehavior().catch(() => {});
        if (simulator) {
            try {
                await simulator.disconnect();
            } catch (error) {
                // ignore disconnect errors
            }
            simulator = null;
        }
    });

    test('can reject next BootNotification', async() => {
        await injectError('rejectBoot');

        simulator = createSimulator();
        await simulator.connect();

        expect(simulator.bootNotificationStatus).toBe('Rejected');
    });

    test('can inject CALLERROR for next request', async() => {
        simulator = createSimulator();
        await simulator.connect();

        await injectError('callError', { code: 'InternalError', description: 'Mock failure' });

        await expect(simulator.sendHeartbeat()).rejects.toThrow('Mock failure');
    });

    test('applies artificial latency to responses', async() => {
        simulator = createSimulator();
        await simulator.connect();

        await configureLatency({ minMs: 100, maxMs: 150 });

        const start = Date.now();
        await simulator.sendHeartbeat();
        const duration = Date.now() - start;

        expect(duration).toBeGreaterThanOrEqual(90);
    });

    test('can drop connection after response', async() => {
        simulator = createSimulator();
        await simulator.connect();

        await injectError('disconnect');
        await simulator.sendHeartbeat().catch(() => {});

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(simulator.isConnected).toBe(false);
    });
});
