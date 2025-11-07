import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are blocked
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 */
export class CircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.name = options.name || 'circuit-breaker';
        this.failureThreshold = options.failureThreshold || 5; // Open after 5 failures
        this.successThreshold = options.successThreshold || 2; // Close after 2 successes
        this.timeout = options.timeout || 60000; // 60 seconds timeout
        this.resetTimeout = options.resetTimeout || 30000; // 30 seconds before half-open
        
        // State tracking
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        
        // Statistics
        this.stats = {
            totalRequests: 0,
            totalFailures: 0,
            totalSuccesses: 0,
            totalRejected: 0,
            stateChanges: []
        };
    }

    /**
     * Execute function with circuit breaker protection
     */
    async execute(fn, ...args) {
        this.stats.totalRequests++;
        
        // Check if circuit is open
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttemptTime) {
                this.stats.totalRejected++;
                this.emit('rejected', {
                    name: this.name,
                    state: this.state,
                    reason: 'Circuit is open',
                    nextAttemptTime: this.nextAttemptTime
                });
                throw new Error(`Circuit breaker ${this.name} is OPEN. Service unavailable.`);
            }
            
            // Transition to HALF_OPEN
            this.transitionToHalfOpen();
        }
        
        // Execute the function
        try {
            const result = await Promise.race([
                fn(...args),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
                )
            ]);
            
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    /**
     * Handle successful execution
     */
    onSuccess() {
        this.stats.totalSuccesses++;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            
            if (this.successCount >= this.successThreshold) {
                this.transitionToClosed();
            }
        } else {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed execution
     */
    onFailure(error) {
        this.stats.totalFailures++;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        this.emit('failure', {
            name: this.name,
            error: error.message,
            failureCount: this.failureCount,
            state: this.state
        });
        
        if (this.state === 'HALF_OPEN') {
            // Failed during half-open, go back to open
            this.transitionToOpen();
        } else if (this.failureCount >= this.failureThreshold) {
            // Too many failures, open the circuit
            this.transitionToOpen();
        }
    }

    /**
     * Transition to OPEN state
     */
    transitionToOpen() {
        const previousState = this.state;
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        this.successCount = 0;
        
        this.stats.stateChanges.push({
            from: previousState,
            to: 'OPEN',
            timestamp: new Date().toISOString(),
            reason: `Failure threshold reached (${this.failureCount} failures)`
        });
        
        logger.warn(`🔴 Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
        
        this.emit('open', {
            name: this.name,
            failureCount: this.failureCount,
            nextAttemptTime: this.nextAttemptTime
        });
    }

    /**
     * Transition to HALF_OPEN state
     */
    transitionToHalfOpen() {
        const previousState = this.state;
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.failureCount = 0;
        
        this.stats.stateChanges.push({
            from: previousState,
            to: 'HALF_OPEN',
            timestamp: new Date().toISOString(),
            reason: 'Testing if service recovered'
        });
        
        logger.info(`🟡 Circuit breaker ${this.name} half-open - testing recovery`);
        
        this.emit('halfOpen', {
            name: this.name
        });
    }

    /**
     * Transition to CLOSED state
     */
    transitionToClosed() {
        const previousState = this.state;
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        
        this.stats.stateChanges.push({
            from: previousState,
            to: 'CLOSED',
            timestamp: new Date().toISOString(),
            reason: 'Service recovered'
        });
        
        logger.info(`🟢 Circuit breaker ${this.name} closed - service recovered`);
        
        this.emit('closed', {
            name: this.name
        });
    }

    /**
     * Reset circuit breaker to CLOSED state
     */
    reset() {
        this.transitionToClosed();
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            stats: { ...this.stats }
        };
    }

    /**
     * Check if circuit is open
     */
    isOpen() {
        return this.state === 'OPEN';
    }

    /**
     * Check if circuit is closed
     */
    isClosed() {
        return this.state === 'CLOSED';
    }

    /**
     * Check if circuit is half-open
     */
    isHalfOpen() {
        return this.state === 'HALF_OPEN';
    }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers
 */
class CircuitBreakerManager {
    constructor() {
        this.breakers = new Map();
    }

    /**
     * Get or create a circuit breaker
     */
    getBreaker(name, options = {}) {
        if (!this.breakers.has(name)) {
            const breaker = new CircuitBreaker({ name, ...options });
            this.breakers.set(name, breaker);
        }
        return this.breakers.get(name);
    }

    /**
     * Get all circuit breakers
     */
    getAllBreakers() {
        return Array.from(this.breakers.values()).map(breaker => breaker.getState());
    }

    /**
     * Reset a circuit breaker
     */
    resetBreaker(name) {
        const breaker = this.breakers.get(name);
        if (breaker) {
            breaker.reset();
        }
    }

    /**
     * Reset all circuit breakers
     */
    resetAll() {
        this.breakers.forEach(breaker => breaker.reset());
    }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
export default circuitBreakerManager;

