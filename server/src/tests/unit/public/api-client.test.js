import { jest } from '@jest/globals';
import { fetchWithRetry, DEFAULT_MAX_RETRIES, RETRYABLE_STATUS } from '../../../public/js/api-client.js';

describe('DashboardApi fetchWithRetry', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.clearAllMocks();
    });

    test('returns response on first attempt without retry', async() => {
        const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
        global.fetch.mockResolvedValue(mockResponse);

        const response = await fetchWithRetry('/api/test');

        expect(response).toBe(mockResponse);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('retries on retryable status and resolves on subsequent success', async() => {
        const errorResponse = new Response('Server Error', { status: RETRYABLE_STATUS[0] });
        const successResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
        global.fetch
            .mockResolvedValueOnce(errorResponse)
            .mockResolvedValueOnce(successResponse);

        const response = await fetchWithRetry('/api/test', {}, { retries: 2, retryDelay: 10 });

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(response.status).toBe(200);
    });

    test('throws after exhausting retries on network error', async() => {
        const networkError = new TypeError('Network failure');
        global.fetch.mockRejectedValue(networkError);

        await expect(fetchWithRetry('/api/test', {}, { retries: 1, retryDelay: 10 }))
            .rejects.toThrow('Network failure');

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('uses default retry count when not provided', async() => {
        const errorResponse = new Response('Server Error', { status: RETRYABLE_STATUS[0] });
        global.fetch.mockResolvedValue(errorResponse);

        await expect(fetchWithRetry('/api/test')).rejects.toThrow('Server error (500)');
        expect(global.fetch).toHaveBeenCalledTimes(DEFAULT_MAX_RETRIES + 1);
    });
});
