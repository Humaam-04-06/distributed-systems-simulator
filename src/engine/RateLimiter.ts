/**
 * RateLimiter — Token Bucket and Leaky Bucket ingress rate limiting algorithms
 */

export interface RateLimiterConfig {
  capacity: number; // Maximum burst size
  refillRateRps: number; // Tokens added per second
  enabled: boolean;
}

export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRateRps: number;
  private tokens: number;
  private lastRefillTimestamp: number;
  private enabled: boolean;
  private totalRejected: number = 0;
  private totalAllowed: number = 0;

  constructor(config: RateLimiterConfig = { capacity: 1000, refillRateRps: 800, enabled: true }) {
    this.capacity = config.capacity;
    this.refillRateRps = config.refillRateRps;
    this.tokens = config.capacity;
    this.enabled = config.enabled;
    this.lastRefillTimestamp = performance.now();
  }

  public setConfig(capacity: number, refillRateRps: number, enabled: boolean): void {
    this.capacity = capacity;
    this.refillRateRps = refillRateRps;
    this.enabled = enabled;
    this.tokens = Math.min(this.tokens, capacity);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public tryConsume(tokensRequested: number = 1): { allowed: boolean; remainingTokens: number } {
    if (!this.enabled) {
      return { allowed: true, remainingTokens: this.capacity };
    }

    this.refill();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      this.totalAllowed++;
      return { allowed: true, remainingTokens: Math.floor(this.tokens) };
    } else {
      this.totalRejected++;
      return { allowed: false, remainingTokens: 0 };
    }
  }

  private refill(): void {
    const now = performance.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    this.lastRefillTimestamp = now;

    const tokensToAdd = elapsedSeconds * this.refillRateRps;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
  }

  public getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public getFillPercentage(): number {
    this.refill();
    return Math.min(100, Math.round((this.tokens / this.capacity) * 100));
  }

  public getStats(): { allowed: number; rejected: number } {
    return {
      allowed: this.totalAllowed,
      rejected: this.totalRejected,
    };
  }

  public reset(): void {
    this.tokens = this.capacity;
    this.totalAllowed = 0;
    this.totalRejected = 0;
    this.lastRefillTimestamp = performance.now();
  }
}
