/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping operations after consecutive failures
 * and implementing exponential backoff before retry attempts.
 */

export interface CircuitBreakerConfig {
  readonly failureThreshold: number      // Number of consecutive failures before opening circuit
  readonly recoveryTimeoutMs: number     // Time to wait before attempting recovery
  readonly backoffMultiplier: number     // Exponential backoff multiplier
  readonly maxBackoffMs: number          // Maximum backoff delay
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private lastFailureTime?: number
  private currentBackoffMs = 1000 // Initial backoff

  constructor(private readonly config: CircuitBreakerConfig) {}

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime
      if (timeSinceLastFailure >= this.config.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN'
        console.log('🔌 [CIRCUIT_BREAKER] Transitioning from OPEN to HALF_OPEN')
      }
    }

    return this.state
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.failureCount = 0
    this.currentBackoffMs = 1000 // Reset backoff
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      console.log('✅ [CIRCUIT_BREAKER] Circuit closed after successful operation')
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    // Calculate next backoff with exponential increase
    this.currentBackoffMs = Math.min(
      this.currentBackoffMs * this.config.backoffMultiplier,
      this.config.maxBackoffMs
    )

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN'
      console.error(`🚫 [CIRCUIT_BREAKER] Circuit opened after ${this.failureCount} consecutive failures`)
    }
  }

  /**
   * Check if operation should proceed
   */
  canProceed(): boolean {
    const state = this.getState()
    return state === 'CLOSED' || state === 'HALF_OPEN'
  }

  /**
   * Get current backoff delay in milliseconds
   */
  getBackoffDelay(): number {
    return this.currentBackoffMs
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.lastFailureTime = undefined
    this.currentBackoffMs = 1000
    console.log('🔄 [CIRCUIT_BREAKER] Circuit breaker reset')
  }

  /**
   * Get diagnostic information
   */
  getDiagnostics(): {
    state: CircuitState
    failureCount: number
    lastFailureTime?: number
    currentBackoffMs: number
  } {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      currentBackoffMs: this.currentBackoffMs,
    }
  }
}
