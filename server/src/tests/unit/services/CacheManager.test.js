import { jest } from '@jest/globals';
import { CacheManager } from '../../../services/CacheManager.js';

/**
 * CacheManager Test Suite
 * Tests critical caching functionality including race condition protection
 * 
 * Created: 2025-01-11
 * Purpose: Improve test coverage for CacheManager.getOrSet and other critical methods
 */

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        cacheManager = new CacheManager();
        // Mock Redis connection for testing
        cacheManager.isConnected = false; // Use memory cache only for tests
    });

    afterEach(async() => {
        if (cacheManager) {
            await cacheManager.shutdown();
        }
    });

    describe('getOrSet - Race Condition Protection', () => {
        test('should return cached value if exists', async() => {
            const key = 'test:key';
            const value = { data: 'test' };

            // Set value first
            await cacheManager.set(key, value, 3600);

            // Fetch function should not be called
            const fetchFn = jest.fn();

            const result = await cacheManager.getOrSet(key, fetchFn);

            expect(result).toEqual(value);
            expect(fetchFn).not.toHaveBeenCalled();
        });

        test('should call fetch function and cache result on cache miss', async() => {
            const key = 'test:miss';
            const value = { data: 'fetched' };

            const fetchFn = jest.fn().mockResolvedValue(value);

            const result = await cacheManager.getOrSet(key, fetchFn, 3600);

            expect(result).toEqual(value);
            expect(fetchFn).toHaveBeenCalledTimes(1);

            // Verify value is cached
            const cached = await cacheManager.get(key);
            expect(cached).toEqual(value);
        });

        test('should prevent race condition with lock mechanism', async() => {
            const key = 'test:race';
            const value = { data: 'race-protected' };

            let fetchCallCount = 0;
            const fetchFn = jest.fn().mockImplementation(async() => {
                fetchCallCount++;
                // Simulate slow fetch
                await new Promise(resolve => setTimeout(resolve, 100));
                return value;
            });

            // Simulate concurrent requests
            const promises = Array(5).fill(null).map(() =>
                cacheManager.getOrSet(key, fetchFn, 3600)
            );

            const results = await Promise.all(promises);

            // All should return same value
            results.forEach(result => {
                expect(result).toEqual(value);
            });

            // Fetch function should be called only once (race condition prevented)
            expect(fetchCallCount).toBe(1);
        });

        test('should handle double-check locking correctly', async() => {
            const key = 'test:double-check';
            const value = { data: 'cached-value' };

            let fetchCallCount = 0;
            const fetchFn = jest.fn().mockImplementation(async() => {
                fetchCallCount++;
                // Simulate slow fetch
                await new Promise(resolve => setTimeout(resolve, 100));
                return value;
            });

            // First request starts fetching
            const promise1 = cacheManager.getOrSet(key, fetchFn, 3600);

            // Small delay to let first request acquire lock
            await new Promise(resolve => setTimeout(resolve, 50));

            // Second request should wait for lock, then get cached value (double-check)
            const promise2 = cacheManager.getOrSet(key, fetchFn, 3600);

            const [result1, result2] = await Promise.all([promise1, promise2]);

            // Both should return same value
            expect(result1).toEqual(value);
            expect(result2).toEqual(value);
            // Fetch function should be called only once (race condition prevented)
            expect(fetchCallCount).toBe(1);
        });

        test('should release lock even if fetch function throws error', async() => {
            const key = 'test:error';
            const error = new Error('Fetch failed');

            const fetchFn = jest.fn().mockRejectedValue(error);

            await expect(cacheManager.getOrSet(key, fetchFn)).rejects.toThrow('Fetch failed');

            // Lock should be released, verify by trying again
            const fetchFn2 = jest.fn().mockResolvedValue({ data: 'success' });
            const result = await cacheManager.getOrSet(key, fetchFn2);

            expect(result).toEqual({ data: 'success' });
            expect(fetchFn).toHaveBeenCalledTimes(1);
            expect(fetchFn2).toHaveBeenCalledTimes(1);
        });

        test('should respect TTL when caching', async() => {
            const key = 'test:ttl';
            const value = { data: 'ttl-test' };

            const fetchFn = jest.fn().mockResolvedValue(value);

            await cacheManager.getOrSet(key, fetchFn, 1); // 1 second TTL

            // Should be cached
            const cached = await cacheManager.get(key);
            expect(cached).toEqual(value);
            expect(fetchFn).toHaveBeenCalledTimes(1);

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should fetch again
            const fetchFn2 = jest.fn().mockResolvedValue(value);
            await cacheManager.getOrSet(key, fetchFn2);

            expect(fetchFn2).toHaveBeenCalledTimes(1);
        });
    });

    describe('Lock Management', () => {
        test('should acquire and release lock correctly', async() => {
            const key = 'test:lock';

            const lockKey = await cacheManager.acquireLock(key);

            expect(lockKey).toBeDefined();
            expect(typeof lockKey).toBe('string');

            // Verify lock exists
            const lockExists = cacheManager.locks.has(lockKey);
            expect(lockExists).toBe(true);

            // Release lock
            await cacheManager.releaseLock(lockKey);

            // Lock should be cleaned up
            const lockExistsAfter = cacheManager.locks.has(lockKey);
            expect(lockExistsAfter).toBe(false);
        });

        test('should handle concurrent lock acquisition', async() => {
            const key1 = 'test:concurrent-lock-1';
            const key2 = 'test:concurrent-lock-2';
            const key3 = 'test:concurrent-lock-3';

            // Try to acquire locks for different keys concurrently
            const promises = [
                cacheManager.acquireLock(key1),
                cacheManager.acquireLock(key2),
                cacheManager.acquireLock(key3)
            ];

            const lockKeys = await Promise.all(promises);

            // All should get different lock keys (different keys = different lock keys)
            const uniqueKeys = new Set(lockKeys);
            expect(uniqueKeys.size).toBe(3);

            // Verify each lock exists
            lockKeys.forEach(lockKey => {
                expect(cacheManager.locks.has(lockKey)).toBe(true);
            });

            // Release all locks
            await Promise.all(lockKeys.map(lockKey =>
                cacheManager.releaseLock(lockKey)
            ));
        });

        test('should clean up expired locks', () => {
            const key = 'test:expired-lock';

            // Manually add expired lock
            const expiredLockKey = 'expired-lock-key';
            cacheManager.locks.set(expiredLockKey, {
                key,
                expires: Date.now() - 1000 // Expired 1 second ago
            });

            // Add valid lock
            const validLockKey = 'valid-lock-key';
            cacheManager.locks.set(validLockKey, {
                key,
                expires: Date.now() + 5000 // Valid for 5 seconds
            });

            expect(cacheManager.locks.size).toBe(2);

            // Cleanup should remove expired lock
            cacheManager.cleanupLocks();

            expect(cacheManager.locks.size).toBe(1);
            expect(cacheManager.locks.has(validLockKey)).toBe(true);
            expect(cacheManager.locks.has(expiredLockKey)).toBe(false);
        });
    });

    describe('Cache Statistics', () => {
        test('should track cache hits and misses', async() => {
            const key = 'test:stats';
            const value = { data: 'stats' };

            // Set value
            await cacheManager.set(key, value);

            // Get value (hit)
            await cacheManager.get(key);

            // Get non-existent key (miss)
            await cacheManager.get('non-existent');

            const stats = cacheManager.getStats();

            expect(stats.hits).toBeGreaterThan(0);
            expect(stats.misses).toBeGreaterThan(0);
        });

        test('should calculate hit rate correctly', async() => {
            const key = 'test:hit-rate';
            const value = { data: 'hit-rate' };

            // Set value
            await cacheManager.set(key, value);

            // Make 3 hits
            await cacheManager.get(key);
            await cacheManager.get(key);
            await cacheManager.get(key);

            // Make 1 miss
            await cacheManager.get('non-existent');

            const stats = cacheManager.getStats();

            // Hit rate should be 75% (3 hits / 4 total)
            expect(parseFloat(stats.hitRate)).toBeGreaterThanOrEqual(75);
        });
    });

    describe('Edge Cases', () => {
        test('should handle null values', async() => {
            const key = 'test:null';
            const fetchFn = jest.fn().mockResolvedValue(null);

            const result = await cacheManager.getOrSet(key, fetchFn);

            expect(result).toBeNull();

            // Should be cached (null is a valid value)
            const cached = await cacheManager.get(key);
            expect(cached).toBeNull();
        });

        test('should handle undefined values', async() => {
            const key = 'test:undefined';
            const fetchFn = jest.fn().mockResolvedValue(undefined);

            const result = await cacheManager.getOrSet(key, fetchFn);

            expect(result).toBeUndefined();
        });

        test('should handle empty string keys', async() => {
            const key = '';
            const value = { data: 'empty-key' };
            const fetchFn = jest.fn().mockResolvedValue(value);

            const result = await cacheManager.getOrSet(key, fetchFn);

            expect(result).toEqual(value);
        });

        test('should handle very long keys', async() => {
            const key = 'test:' + 'a'.repeat(1000);
            const value = { data: 'long-key' };
            const fetchFn = jest.fn().mockResolvedValue(value);

            const result = await cacheManager.getOrSet(key, fetchFn);

            expect(result).toEqual(value);
        });
    });
});