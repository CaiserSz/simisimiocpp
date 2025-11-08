import { OCPP16JSimulator } from '../../simulator/protocols/OCPP16JSimulator.js';
import {
    ensureMockCsms,
    resetMockBehavior,
    shutdownMockCsms
} from '../utils/mockCsmsServer.js';

const CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';
const CONTROL_API_URL = 'http://localhost:9320';

describe('Mock CSMS Advanced Features', () => {
    let simulator;

    const createSimulator = () => new OCPP16JSimulator({
        stationId: `ADV_TEST_${Date.now()}`,
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

    describe('Message Pattern Matching', () => {
        test('can register and match exact pattern', async() => {
            simulator = createSimulator();
            await simulator.connect();

            // Register pattern handler
            const response = await fetch(`${CONTROL_API_URL}/mock/pattern/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pattern: 'Heartbeat',
                    handler: 'custom'
                })
            });
            expect(response.ok).toBe(true);

            // Test that pattern is registered
            const stateResponse = await fetch(`${CONTROL_API_URL}/mock/state`);
            const state = await stateResponse.json();
            expect(state.data.patterns).toContain('Heartbeat');
        });

        test('can register wildcard pattern', async() => {
            simulator = createSimulator();
            await simulator.connect();

            const response = await fetch(`${CONTROL_API_URL}/mock/pattern/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pattern: 'Boot*',
                    handler: 'custom'
                })
            });
            expect(response.ok).toBe(true);
        });
    });

    describe('Connection State Simulation', () => {
        test('can configure stable connection state', async() => {
            simulator = createSimulator();
            const stationId = simulator.stationId;
            await simulator.connect();

            const response = await fetch(`${CONTROL_API_URL}/mock/connection/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stationId,
                    type: 'stable',
                    disconnectProbability: 0,
                    messageDropProbability: 0
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.data.state.type).toBe('stable');
        });

        test('can configure intermittent connection state', async() => {
            simulator = createSimulator();
            const stationId = simulator.stationId;
            await simulator.connect();

            const response = await fetch(`${CONTROL_API_URL}/mock/connection/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stationId,
                    type: 'intermittent',
                    disconnectProbability: 0.1,
                    reconnectDelay: 2000,
                    messageDropProbability: 0.05
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.data.state.type).toBe('intermittent');
            expect(data.data.state.disconnectProbability).toBe(0.1);
        });

        test('can reset connection state', async() => {
            simulator = createSimulator();
            const stationId = simulator.stationId;
            await simulator.connect();

            // Set state
            await fetch(`${CONTROL_API_URL}/mock/connection/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stationId, type: 'intermittent' })
            });

            // Reset state
            const response = await fetch(`${CONTROL_API_URL}/mock/connection/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stationId })
            });

            expect(response.ok).toBe(true);
        });
    });

    describe('State API', () => {
        test('can get current mock CSMS state', async() => {
            simulator = createSimulator();
            await simulator.connect();

            const response = await fetch(`${CONTROL_API_URL}/mock/state`);
            expect(response.ok).toBe(true);

            const state = await response.json();
            expect(state.data).toHaveProperty('behavior');
            expect(state.data).toHaveProperty('patterns');
            expect(state.data).toHaveProperty('connections');
            expect(state.data).toHaveProperty('connectionStates');
        });
    });
});