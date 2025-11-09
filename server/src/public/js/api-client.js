const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 500;
const DEFAULT_RETRYABLE_STATUS = [500, 502, 503, 504];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch wrapper with retry support for transient server or network errors.
 * @param {RequestInfo} url
 * @param {RequestInit} options
 * @param {Object} retryConfig
 * @param {number} retryConfig.retries - Number of retry attempts on failure.
 * @param {number} retryConfig.retryDelay - Base delay (ms) between retries.
 * @param {number[]} retryConfig.retryOn - Status codes that should trigger a retry.
 * @param {Function} retryConfig.onRetry - Optional callback invoked before each retry.
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
    const {
        retries = DEFAULT_RETRIES,
        retryDelay = DEFAULT_RETRY_DELAY_MS,
        retryOn = DEFAULT_RETRYABLE_STATUS,
        onRetry,
    } = retryConfig;

    let attempt = 0;
    let lastError;

    while (attempt <= retries) {
        try {
            const response = await fetch(url, options);

            if (retryOn.includes(response.status)) {
                if (attempt < retries) {
                    if (typeof onRetry === 'function') {
                        onRetry({ attempt, response });
                    }
                    await sleep(retryDelay * (attempt + 1));
                    attempt += 1;
                    continue;
                }

                throw new Error(`Server error (${response.status})`);
            }

            return response;
        } catch (error) {
            lastError = error;

            if (attempt >= retries) {
                throw error;
            }

            if (typeof onRetry === 'function') {
                onRetry({ attempt, error });
            }

            await sleep(retryDelay * (attempt + 1));
            attempt += 1;
        }
    }

    throw lastError;
}

export const RETRYABLE_STATUS = DEFAULT_RETRYABLE_STATUS;
export const DEFAULT_RETRY_DELAY = DEFAULT_RETRY_DELAY_MS;
export const DEFAULT_MAX_RETRIES = DEFAULT_RETRIES;

const DashboardApi = {
    fetchWithRetry,
    RETRYABLE_STATUS,
    DEFAULT_RETRY_DELAY,
    DEFAULT_MAX_RETRIES,
};

if (typeof globalThis !== 'undefined') {
    globalThis.DashboardApi = DashboardApi;
}

export default DashboardApi;
