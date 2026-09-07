/**
 * CircuitBreakerManager — Implements Netflix Hystrix pattern with Closed, Open, and Half-Open states
 */

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  failureThresholdPercentage: number; // e.g. 50%
  consecutiveFailureThreshold: number; // e.g. 5
  sleepWindowMs: number; // e.g. 5000ms in OPEN before trying HALF_OPEN
  halfOpenMaxSuccesses: number; // e.g. 3 consecutive successes in HALF_OPEN to CLOSE
  rollingWindowMs: number; // e.g. 10000ms window for failure rate calculation
  minRequestsInWindow: number; // minimum requests before evaluating failure rate (e.g. 8)
}

export interface CircuitBreakerMetrics {
  id: string;
  state: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalRequests: number;
  totalFailures: number;
  failureRatePercentage: number;
  trippedCount: number;
  lastTrippedAt: number | null;
  lastStateChangeAt: number;
  canaryAttempts: number;
  canaryMax: number;
}

interface RequestRecord {
  timestamp: number;
  success: boolean;
}

export class CircuitBreaker {
  public readonly id: string;
  private state: CircuitState = 'closed';
  private config: CircuitBreakerConfig;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private trippedCount: number = 0;
  private lastTrippedAt: number | null = null;
  private lastStateChangeAt: number = performance.now();
  private canaryAttempts: number = 0;
  private requestHistory: RequestRecord[] = [];

  constructor(id: string, config: CircuitBreakerConfig) {
    this.id = id;
    this.config = config;
  }

  public getState(): CircuitState {
    return this.state;
  }

  public updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public canExecute(now: number = performance.now()): {
    allowed: boolean;
    state: CircuitState;
    reason?: string;
  } {
    // 1. If CLOSED, allow all requests
    if (this.state === 'closed') {
      return { allowed: true, state: 'closed' };
    }

    // 2. If OPEN, check if sleep window has elapsed to transition to HALF_OPEN
    if (this.state === 'open') {
      const elapsedSinceTrip = now - this.lastStateChangeAt;
      if (elapsedSinceTrip >= this.config.sleepWindowMs) {
        // Transition to HALF_OPEN to test downstream canary health
        this.transitionTo('half_open', now);
        this.canaryAttempts = 1;
        return { allowed: true, state: 'half_open', reason: 'Canary probe permitted' };
      }
      return {
        allowed: false,
        state: 'open',
        reason: `Circuit OPEN. Failsafe active for next ${Math.max(
          0,
          Math.round((this.config.sleepWindowMs - elapsedSinceTrip) / 100) / 10
        )}s`,
      };
    }

    // 3. If HALF_OPEN, permit limited canary probes
    if (this.state === 'half_open') {
      if (this.canaryAttempts < this.config.halfOpenMaxSuccesses) {
        this.canaryAttempts++;
        return { allowed: true, state: 'half_open', reason: 'Canary probe in-flight' };
      }
      return {
        allowed: false,
        state: 'half_open',
        reason: 'Canary concurrency limit reached, awaiting probe verification',
      };
    }

    return { allowed: true, state: this.state };
  }

  public recordSuccess(now: number = performance.now()): void {
    this.totalRequests++;
    this.recordHistory(true, now);

    if (this.state === 'half_open') {
      this.consecutiveSuccesses++;
      // If required consecutive canary successes reached, fully recover!
      if (this.consecutiveSuccesses >= this.config.halfOpenMaxSuccesses) {
        this.transitionTo('closed', now);
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.canaryAttempts = 0;
      }
    } else if (this.state === 'closed') {
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses++;
    }
  }

  public recordFailure(now: number = performance.now()): void {
    this.totalRequests++;
    this.totalFailures++;
    this.recordHistory(false, now);

    if (this.state === 'half_open') {
      // Any failure during canary trial immediately trips back to OPEN
      this.transitionTo('open', now);
      this.trippedCount++;
      this.lastTrippedAt = now;
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;
      this.canaryAttempts = 0;
    } else if (this.state === 'closed') {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;

      // Evaluate whether to trip based on consecutive failures or failure rate
      const shouldTripConsecutive =
        this.consecutiveFailures >= this.config.consecutiveFailureThreshold;
      const failureRate = this.computeRollingFailureRate(now);
      const shouldTripRate =
        this.requestHistory.length >= this.config.minRequestsInWindow &&
        failureRate >= this.config.failureThresholdPercentage;

      if (shouldTripConsecutive || shouldTripRate) {
        this.transitionTo('open', now);
        this.trippedCount++;
        this.lastTrippedAt = now;
      }
    }
  }

  public trip(now: number = performance.now()): void {
    this.transitionTo('open', now);
    this.trippedCount++;
    this.lastTrippedAt = now;
    this.consecutiveFailures++;
  }

  public reset(now: number = performance.now()): void {
    this.transitionTo('closed', now);
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.canaryAttempts = 0;
    this.requestHistory = [];
  }

  public tick(now: number = performance.now()): void {
    // Check if OPEN state should automatically become HALF_OPEN
    if (this.state === 'open') {
      if (now - this.lastStateChangeAt >= this.config.sleepWindowMs) {
        this.transitionTo('half_open', now);
        this.canaryAttempts = 0;
        this.consecutiveSuccesses = 0;
      }
    }

    // Prune expired records outside rolling window
    const windowStart = now - this.config.rollingWindowMs;
    this.requestHistory = this.requestHistory.filter((r) => r.timestamp >= windowStart);
  }

  public getMetrics(now: number = performance.now()): CircuitBreakerMetrics {
    const failureRate = this.computeRollingFailureRate(now);
    return {
      id: this.id,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      failureRatePercentage: Number(failureRate.toFixed(1)),
      trippedCount: this.trippedCount,
      lastTrippedAt: this.lastTrippedAt,
      lastStateChangeAt: this.lastStateChangeAt,
      canaryAttempts: this.canaryAttempts,
      canaryMax: this.config.halfOpenMaxSuccesses,
    };
  }

  private transitionTo(newState: CircuitState, now: number): void {
    this.state = newState;
    this.lastStateChangeAt = now;
  }

  private recordHistory(success: boolean, now: number): void {
    this.requestHistory.push({ timestamp: now, success });
    // Keep max 100 historical samples
    if (this.requestHistory.length > 100) {
      this.requestHistory.shift();
    }
  }

  private computeRollingFailureRate(now: number): number {
    const windowStart = now - this.config.rollingWindowMs;
    const windowSamples = this.requestHistory.filter((r) => r.timestamp >= windowStart);
    if (windowSamples.length === 0) return 0;
    const failures = windowSamples.filter((r) => !r.success).length;
    return (failures / windowSamples.length) * 100;
  }
}

export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig = {
    failureThresholdPercentage: 50,
    consecutiveFailureThreshold: 5,
    sleepWindowMs: 5000,
    halfOpenMaxSuccesses: 3,
    rollingWindowMs: 8000,
    minRequestsInWindow: 6,
  };

  constructor(initialConfig?: Partial<CircuitBreakerConfig>) {
    if (initialConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...initialConfig };
    }
  }

  public getBreaker(id: string): CircuitBreaker {
    let breaker = this.breakers.get(id);
    if (!breaker) {
      breaker = new CircuitBreaker(id, { ...this.defaultConfig });
      this.breakers.set(id, breaker);
    }
    return breaker;
  }

  public canExecute(id: string, now: number = performance.now()) {
    return this.getBreaker(id).canExecute(now);
  }

  public recordSuccess(id: string, now: number = performance.now()): void {
    this.getBreaker(id).recordSuccess(now);
  }

  public recordFailure(id: string, now: number = performance.now()): void {
    this.getBreaker(id).recordFailure(now);
  }

  public trip(id: string, now: number = performance.now()): void {
    this.getBreaker(id).trip(now);
  }

  public reset(id: string, now: number = performance.now()): void {
    this.getBreaker(id).reset(now);
  }

  public resetAll(now: number = performance.now()): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset(now);
    }
  }

  public tick(now: number = performance.now()): void {
    for (const breaker of this.breakers.values()) {
      breaker.tick(now);
    }
  }

  public getMetrics(id: string, now: number = performance.now()): CircuitBreakerMetrics {
    return this.getBreaker(id).getMetrics(now);
  }

  public getAllMetrics(now: number = performance.now()): CircuitBreakerMetrics[] {
    return Array.from(this.breakers.values()).map((b) => b.getMetrics(now));
  }

  public updateDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    for (const breaker of this.breakers.values()) {
      breaker.updateConfig(config);
    }
  }

  public getDefaultConfig(): CircuitBreakerConfig {
    return { ...this.defaultConfig };
  }
}
