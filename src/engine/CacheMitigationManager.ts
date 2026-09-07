/**
 * CacheMitigationManager — Implements Mutex Single-Flight and XFetch Probabilistic Early Expiration
 */

export type StampedeMitigationStrategy = 'none' | 'mutex' | 'xfetch';

export interface MutexLock {
  key: string;
  lockedAt: number;
  lockTtlMs: number;
  workerId: string;
}

export class CacheMitigationManager {
  private strategy: StampedeMitigationStrategy = 'none';
  private locks: Map<string, MutexLock> = new Map();
  private beta: number = 1.0; // Aggressiveness parameter for XFetch

  public getStrategy(): StampedeMitigationStrategy {
    return this.strategy;
  }

  public setStrategy(strategy: StampedeMitigationStrategy): void {
    this.strategy = strategy;
  }

  public getBeta(): number {
    return this.beta;
  }

  public setBeta(beta: number): void {
    this.beta = Math.max(0.1, Math.min(5.0, beta));
  }

  /**
   * Mutex Single-Flight Locking:
   * Only the first worker node gets the lock to compute the expired key from the DB.
   * All other workers must wait or return fallback.
   */
  public tryAcquireMutex(
    key: string,
    workerId: string,
    lockTtlMs: number = 3000,
    now: number = performance.now()
  ): boolean {
    const existingLock = this.locks.get(key);
    if (existingLock) {
      if (now - existingLock.lockedAt < existingLock.lockTtlMs) {
        // Lock currently held by another worker
        return false;
      }
    }

    // Acquire lock
    this.locks.set(key, {
      key,
      lockedAt: now,
      lockTtlMs,
      workerId,
    });
    return true;
  }

  public releaseMutex(key: string): void {
    this.locks.delete(key);
  }

  public isKeyLocked(key: string, now: number = performance.now()): boolean {
    const lock = this.locks.get(key);
    if (!lock) return false;
    if (now - lock.lockedAt >= lock.lockTtlMs) {
      this.locks.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Probabilistic Early Expiration (XFetch algorithm):
   * Computes whether a client request should proactively recompute the key before TTL expiry.
   *
   * Formula: -beta * delta * ln(random()) > ttlRemaining
   */
  public shouldEarlyRecompute(
    ttlRemainingMs: number,
    computeDeltaMs: number = 45
  ): boolean {
    if (this.strategy !== 'xfetch') return false;
    if (ttlRemainingMs <= 0) return true;

    // Uniform random float in (0, 1)
    const rand = Math.max(0.0001, Math.random());
    const xfetchThreshold = -this.beta * computeDeltaMs * Math.log(rand);

    return xfetchThreshold > ttlRemainingMs;
  }

  public getLockedKeys(): string[] {
    return Array.from(this.locks.keys());
  }

  public clear(): void {
    this.locks.clear();
  }
}
