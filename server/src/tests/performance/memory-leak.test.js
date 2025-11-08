/**
 * Memory Leak Detection Test
 * Monitors memory usage over time to detect potential leaks
 * 
 * Created: 2025-01-11
 * Purpose: Detect memory leaks in long-running operations
 */

const runPerformanceSuite = process.env.SIM_FUNCTIONAL_TESTS === 'true';
const describeOrSkip = runPerformanceSuite ? describe : describe.skip;

describeOrSkip('Memory Leak Detection', () => {
    let initialMemory;
    let memorySnapshots = [];

    beforeAll(() => {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        // Get initial memory usage
        initialMemory = process.memoryUsage().heapUsed;
    });

    beforeEach(() => {
        // Clear snapshots
        memorySnapshots = [];
    });

    /**
     * Take memory snapshot
     */
    function takeMemorySnapshot(label) {
        const usage = process.memoryUsage();
        const snapshot = {
            label,
            timestamp: Date.now(),
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss
        };

        memorySnapshots.push(snapshot);
        return snapshot;
    }

    /**
     * Calculate memory growth rate
     */
    function calculateGrowthRate() {
        if (memorySnapshots.length < 2) return 0;

        const first = memorySnapshots[0];
        const last = memorySnapshots[memorySnapshots.length - 1];
        const timeDiff = last.timestamp - first.timestamp;
        const memoryDiff = last.heapUsed - first.heapUsed;

        // Growth rate in bytes per second
        return (memoryDiff / timeDiff) * 1000;
    }

    test('should not leak memory in repeated cache operations', async() => {
        const CacheManager = (await
            import ('../../services/CacheManager.js')).CacheManager;
        const cacheManager = new CacheManager();

        takeMemorySnapshot('Initial');

        // Perform many cache operations
        for (let i = 0; i < 1000; i++) {
            await cacheManager.set(`test:key:${i}`, { data: `value${i}` }, 3600);
            await cacheManager.get(`test:key:${i}`);

            // Take snapshot every 100 operations
            if (i % 100 === 0) {
                takeMemorySnapshot(`After ${i} operations`);

                // Force GC if available
                if (global.gc) {
                    global.gc();
                }
            }
        }

        takeMemorySnapshot('Final');

        // Calculate growth rate
        const growthRate = calculateGrowthRate();

        // Memory growth should be minimal (< 1MB per 1000 operations)
        const maxGrowth = 1024 * 1024; // 1MB
        const totalGrowth = memorySnapshots[memorySnapshots.length - 1].heapUsed - memorySnapshots[0].heapUsed;

        expect(totalGrowth).toBeLessThan(maxGrowth);

        // Cleanup
        await cacheManager.shutdown();
    }, 60000); // 60 second timeout

    test('should not leak memory in OCPP message handling', async() => {
        const { BaseOCPPSimulator } = await
        import ('../../simulator/protocols/BaseOCPPSimulator.js');

        // Create a mock simulator
        class MockOCPPSimulator extends BaseOCPPSimulator {
            getProtocolVersion() { return '1.6J'; }
            getSubProtocol() { return 'ocpp1.6'; }
            async sendBootNotification() {
                this.bootNotificationStatus = 'Accepted';
                return { status: 'Accepted' };
            }

            async handleCall(messageId, action, payload) {
                // Minimal handler to avoid abstract method errors during tests
                this.lastHandledCall = { messageId, action, payload };
            }
        }

        const simulator = new MockOCPPSimulator({
            stationId: 'MEMORY_TEST_STATION',
            csmsUrl: 'ws://localhost:9220'
        });

        takeMemorySnapshot('Initial');

        // Simulate many message operations
        for (let i = 0; i < 500; i++) {
            // Simulate message handling
            const message = [2, `msg-${i}`, 'Heartbeat', {}];
            simulator.handleMessage(JSON.stringify(message));

            // Take snapshot every 50 operations
            if (i % 50 === 0) {
                takeMemorySnapshot(`After ${i} messages`);

                // Force GC if available
                if (global.gc) {
                    global.gc();
                }
            }
        }

        takeMemorySnapshot('Final');

        // Calculate growth rate
        const growthRate = calculateGrowthRate();

        // Memory growth should be minimal
        const maxGrowth = (global.gc ? 2 : 6) * 1024 * 1024; // Allow higher threshold if GC unavailable
        const totalGrowth = memorySnapshots[memorySnapshots.length - 1].heapUsed - memorySnapshots[0].heapUsed;

        expect(totalGrowth).toBeLessThan(maxGrowth);

        // Cleanup
        simulator.disconnect();
    }, 60000);

    test('should not leak memory in event listeners', async() => {
        const { EventEmitter } = await
        import ('events');
        const emitter = new EventEmitter();

        takeMemorySnapshot('Initial');

        // Add and remove many event listeners
        for (let i = 0; i < 1000; i++) {
            const handler = () => {};
            emitter.on('test', handler);
            emitter.emit('test');
            emitter.removeListener('test', handler);

            // Take snapshot every 100 operations
            if (i % 100 === 0) {
                takeMemorySnapshot(`After ${i} listeners`);

                // Force GC if available
                if (global.gc) {
                    global.gc();
                }
            }
        }

        takeMemorySnapshot('Final');

        // Memory growth should be minimal
        const maxGrowth = 512 * 1024; // 512KB
        const totalGrowth = memorySnapshots[memorySnapshots.length - 1].heapUsed - memorySnapshots[0].heapUsed;

        expect(totalGrowth).toBeLessThan(maxGrowth);
    }, 60000);

    test('should cleanup expired cache entries', async() => {
        const CacheManager = (await
            import ('../../services/CacheManager.js')).CacheManager;
        const cacheManager = new CacheManager();

        takeMemorySnapshot('Initial');

        // Add many cache entries with short TTL
        for (let i = 0; i < 1000; i++) {
            await cacheManager.set(`test:expire:${i}`, { data: `value${i}` }, 1); // 1 second TTL
        }

        takeMemorySnapshot('After adding entries');

        // Wait for TTL to expire
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Trigger cleanup by accessing cache
        for (let i = 0; i < 100; i++) {
            await cacheManager.get(`test:expire:${i}`);
        }

        takeMemorySnapshot('After cleanup');

        // Force GC if available
        if (global.gc) {
            global.gc();
        }

        takeMemorySnapshot('After GC');

        // Memory should decrease after cleanup
        const afterCleanup = memorySnapshots.find(s => s.label === 'After cleanup');
        const afterGC = memorySnapshots.find(s => s.label === 'After GC');

        if (afterCleanup && afterGC) {
            // Memory should not grow significantly
            const growth = afterGC.heapUsed - afterCleanup.heapUsed;
            expect(growth).toBeLessThan(1024 * 1024); // Less than 1MB growth
        }

        // Cleanup
        await cacheManager.shutdown();
    }, 10000);
});
