/**
 * ThreadPoolBulkhead — Implements isolated thread pool partitions per domain to prevent resource exhaustion
 */

export type BulkheadDomain = 'checkout' | 'catalog' | 'analytics';

export interface BulkheadPoolConfig {
  domain: BulkheadDomain;
  name: string;
  maxConcurrency: number;
  maxQueueDepth: number;
  priority: 'critical' | 'standard' | 'background';
}

export interface BulkheadPoolMetrics {
  domain: BulkheadDomain;
  name: string;
  maxConcurrency: number;
  activeConcurrency: number;
  maxQueueDepth: number;
  queueDepth: number;
  utilizationPercentage: number;
  rejectedCount: number;
  processedCount: number;
  saturationState: 'nominal' | 'elevated' | 'saturated';
  priority: 'critical' | 'standard' | 'background';
}

export class ThreadPoolBulkhead {
  private pools: Map<BulkheadDomain, {
    config: BulkheadPoolConfig;
    active: number;
    queued: number;
    rejected: number;
    processed: number;
  }> = new Map();

  constructor() {
    this.initializeDefaultPools();
  }

  private initializeDefaultPools(): void {
    const defaults: BulkheadPoolConfig[] = [
      {
        domain: 'checkout',
        name: 'Payment & Checkout (Tier 0)',
        maxConcurrency: 30,
        maxQueueDepth: 25,
        priority: 'critical',
      },
      {
        domain: 'catalog',
        name: 'Product Catalog & Search (Tier 1)',
        maxConcurrency: 45,
        maxQueueDepth: 60,
        priority: 'standard',
      },
      {
        domain: 'analytics',
        name: 'Batch Analytics & Reports (Tier 2)',
        maxConcurrency: 15,
        maxQueueDepth: 15,
        priority: 'background',
      },
    ];

    for (const d of defaults) {
      this.pools.set(d.domain, {
        config: d,
        active: 0,
        queued: 0,
        rejected: 0,
        processed: 0,
      });
    }
  }

  public tryAcquire(domain: BulkheadDomain): {
    accepted: boolean;
    reason?: string;
    queued: boolean;
  } {
    const pool = this.pools.get(domain);
    if (!pool) {
      return { accepted: true, queued: false };
    }

    // 1. Thread immediately available
    if (pool.active < pool.config.maxConcurrency) {
      pool.active++;
      return { accepted: true, queued: false };
    }

    // 2. Thread pool full; check waiting queue buffer
    if (pool.queued < pool.config.maxQueueDepth) {
      pool.queued++;
      return { accepted: true, queued: true };
    }

    // 3. Compartment flooded! Reject to protect other compartments
    pool.rejected++;
    return {
      accepted: false,
      queued: false,
      reason: `Bulkhead compartment [${domain.toUpperCase()}] saturated! Thread capacity (${pool.config.maxConcurrency}) & Queue (${pool.config.maxQueueDepth}) exhausted.`,
    };
  }

  public release(domain: BulkheadDomain): void {
    const pool = this.pools.get(domain);
    if (!pool) return;

    pool.processed++;

    if (pool.queued > 0) {
      pool.queued--;
      // Transferred from queue to active thread
    } else if (pool.active > 0) {
      pool.active--;
    }
  }

  public step(deltaMs: number): void {
    // Process queued requests as active work completes
    const stepSeconds = deltaMs / 1000;
    for (const pool of this.pools.values()) {
      if (pool.active > 0) {
        // Natural throughput release rate
        const releaseRate = pool.config.maxConcurrency * 1.5 * stepSeconds;
        const toRelease = Math.min(pool.active, Math.ceil(releaseRate));
        for (let i = 0; i < toRelease; i++) {
          pool.processed++;
          if (pool.queued > 0) {
            pool.queued--;
          } else if (pool.active > 0) {
            pool.active--;
          }
        }
      }
    }
  }

  public getPoolMetrics(domain: BulkheadDomain): BulkheadPoolMetrics {
    const pool = this.pools.get(domain)!;
    const util = Number(((pool.active / pool.config.maxConcurrency) * 100).toFixed(1));
    const saturationState =
      util >= 90 || pool.queued >= pool.config.maxQueueDepth * 0.8
        ? 'saturated'
        : util >= 65
        ? 'elevated'
        : 'nominal';

    return {
      domain,
      name: pool.config.name,
      maxConcurrency: pool.config.maxConcurrency,
      activeConcurrency: pool.active,
      maxQueueDepth: pool.config.maxQueueDepth,
      queueDepth: pool.queued,
      utilizationPercentage: Math.min(100, util),
      rejectedCount: pool.rejected,
      processedCount: pool.processed,
      saturationState,
      priority: pool.config.priority,
    };
  }

  public getAllPoolMetrics(): BulkheadPoolMetrics[] {
    return Array.from(this.pools.keys()).map((domain) => this.getPoolMetrics(domain));
  }

  public setPoolCapacity(
    domain: BulkheadDomain,
    maxConcurrency: number,
    maxQueueDepth: number
  ): void {
    const pool = this.pools.get(domain);
    if (pool) {
      pool.config.maxConcurrency = Math.max(5, Math.min(100, maxConcurrency));
      pool.config.maxQueueDepth = Math.max(5, Math.min(150, maxQueueDepth));
    }
  }

  public reset(): void {
    for (const pool of this.pools.values()) {
      pool.active = 0;
      pool.queued = 0;
      pool.rejected = 0;
      pool.processed = 0;
    }
  }
}
