/**
 * RetryEngine — Exponential backoff with Full/Decorrelated Jitter & Idempotency Safeguards
 */

export type BackoffStrategy = 'exponential' | 'full_jitter' | 'decorrelated_jitter' | 'linear';

export interface RetryConfig {
  maxAttempts: number; // e.g. 3 attempts
  baseDelayMs: number; // e.g. 100ms
  maxDelayMs: number; // e.g. 2000ms
  strategy: BackoffStrategy;
  retryOn5xxOnly: boolean;
  enforceIdempotency: boolean;
}

export interface RetryEvaluation {
  shouldRetry: boolean;
  delayMs: number;
  attempt: number;
  reason: string;
  isIdempotentSafe: boolean;
}

export interface RetryMetrics {
  totalRetryAttempts: number;
  successfulRetries: number;
  exhaustedRetries: number;
  unsafeBlockedCount: number;
  averageDelayMs: number;
  strategy: BackoffStrategy;
}

export class RetryEngine {
  private config: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 80,
    maxDelayMs: 2500,
    strategy: 'full_jitter',
    retryOn5xxOnly: true,
    enforceIdempotency: true,
  };

  private totalAttempts: number = 0;
  private successfulRetries: number = 0;
  private exhaustedRetries: number = 0;
  private unsafeBlockedCount: number = 0;
  private accumulatedDelaysMs: number = 0;
  private lastDelayMs: number = 80;

  constructor(initialConfig?: Partial<RetryConfig>) {
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
      this.lastDelayMs = this.config.baseDelayMs;
    }
  }

  public getConfig(): RetryConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public setStrategy(strategy: BackoffStrategy): void {
    this.config.strategy = strategy;
  }

  /**
   * Evaluates whether a failed request should be retried, computing backoff delay with jitter.
   */
  public evaluateRetry(
    attempt: number,
    isRead: boolean,
    hasIdempotencyKey: boolean = false,
    statusCode: number = 500
  ): RetryEvaluation {
    // Check attempt limit
    if (attempt >= this.config.maxAttempts) {
      this.exhaustedRetries++;
      return {
        shouldRetry: false,
        delayMs: 0,
        attempt,
        reason: `Exhausted maximum retry budget (${this.config.maxAttempts} attempts)`,
        isIdempotentSafe: isRead || hasIdempotencyKey,
      };
    }

    // Check status code eligibility
    if (this.config.retryOn5xxOnly && statusCode < 500) {
      return {
        shouldRetry: false,
        delayMs: 0,
        attempt,
        reason: `Client error HTTP ${statusCode} is non-retryable`,
        isIdempotentSafe: isRead || hasIdempotencyKey,
      };
    }

    // Idempotency safety check
    const isSafe = isRead || hasIdempotencyKey;
    if (this.config.enforceIdempotency && !isSafe) {
      this.unsafeBlockedCount++;
      return {
        shouldRetry: false,
        delayMs: 0,
        attempt,
        reason: 'Unsafe non-idempotent write mutation blocked to prevent duplicate transactions',
        isIdempotentSafe: false,
      };
    }

    // Compute backoff delay based on selected strategy
    const delay = this.computeDelay(attempt);
    this.totalAttempts++;
    this.accumulatedDelaysMs += delay;
    this.lastDelayMs = delay;

    return {
      shouldRetry: true,
      delayMs: delay,
      attempt: attempt + 1,
      reason: `Retrying (${this.config.strategy.replace('_', ' ')}) after ${delay}ms delay`,
      isIdempotentSafe: true,
    };
  }

  public recordSuccessAfterRetry(): void {
    this.successfulRetries++;
  }

  public getMetrics(): RetryMetrics {
    const avgDelay =
      this.totalAttempts > 0
        ? Math.round(this.accumulatedDelaysMs / this.totalAttempts)
        : 0;

    return {
      totalRetryAttempts: this.totalAttempts,
      successfulRetries: this.successfulRetries,
      exhaustedRetries: this.exhaustedRetries,
      unsafeBlockedCount: this.unsafeBlockedCount,
      averageDelayMs: avgDelay,
      strategy: this.config.strategy,
    };
  }

  public reset(): void {
    this.totalAttempts = 0;
    this.successfulRetries = 0;
    this.exhaustedRetries = 0;
    this.unsafeBlockedCount = 0;
    this.accumulatedDelaysMs = 0;
    this.lastDelayMs = this.config.baseDelayMs;
  }

  private computeDelay(attempt: number): number {
    const { baseDelayMs, maxDelayMs, strategy } = this.config;

    switch (strategy) {
      case 'linear':
        return Math.min(maxDelayMs, baseDelayMs * (attempt + 1));

      case 'exponential': {
        const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
        return Math.round(exp);
      }

      case 'full_jitter': {
        // AWS Full Jitter: Sleep = rand(0, min(maxDelay, base * 2^attempt))
        const expCap = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
        return Math.round(Math.random() * expCap);
      }

      case 'decorrelated_jitter': {
        // Decorrelated Jitter: Sleep = min(maxDelay, rand(base, lastSleep * 3))
        const low = baseDelayMs;
        const high = Math.min(maxDelayMs, this.lastDelayMs * 3);
        const randRange = high > low ? high - low : baseDelayMs;
        return Math.round(Math.min(maxDelayMs, low + Math.random() * randRange));
      }

      default:
        return baseDelayMs;
    }
  }
}
