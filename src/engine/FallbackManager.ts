/**
 * FallbackManager — Graceful degradation strategies when downstream services or circuits trip
 */

export type FallbackStrategy =
  | 'stale_cache'
  | 'mock_default'
  | 'read_only_degraded'
  | 'fail_silent'
  | 'fail_fast';

export interface FallbackResult {
  served: boolean;
  strategy: FallbackStrategy;
  statusCode: number;
  payload: string;
  isDegraded: boolean;
  latencyMs: number;
  message: string;
}

export interface FallbackMetrics {
  totalFallbacksServed: number;
  staleCacheServed: number;
  mockDefaultsServed: number;
  degradedReadsServed: number;
  failFastCount: number;
  strategy: FallbackStrategy;
}

export class FallbackManager {
  private strategy: FallbackStrategy = 'stale_cache';
  private totalFallbacksServed: number = 0;
  private staleCacheServed: number = 0;
  private mockDefaultsServed: number = 0;
  private degradedReadsServed: number = 0;
  private failFastCount: number = 0;

  private staticStubs: Map<string, string> = new Map([
    ['user:profile', '{"id":"guest","status":"degraded_view","tier":"standard"}'],
    ['product:catalog', '{"items":[{"id":"cached_1","name":"Standard Catalog"}],"cached":true}'],
    ['leaderboard', '{"leaders":["Offline Snapshot"],"timestamp":1672531199}'],
  ]);

  constructor(initialStrategy: FallbackStrategy = 'stale_cache') {
    this.strategy = initialStrategy;
  }

  public getStrategy(): FallbackStrategy {
    return this.strategy;
  }

  public setStrategy(strategy: FallbackStrategy): void {
    this.strategy = strategy;
  }

  public executeFallback(
    requestType: 'read' | 'write',
    endpointOrKey: string = 'user:profile'
  ): FallbackResult {
    this.totalFallbacksServed++;

    switch (this.strategy) {
      case 'stale_cache': {
        this.staleCacheServed++;
        const stub = this.staticStubs.get(endpointOrKey) || '{"cached":"stale_snapshot"}';
        return {
          served: true,
          strategy: 'stale_cache',
          statusCode: 200,
          payload: stub,
          isDegraded: true,
          latencyMs: 4,
          message: 'Served from stale in-memory snapshot while primary node is offline',
        };
      }

      case 'mock_default': {
        this.mockDefaultsServed++;
        return {
          served: true,
          strategy: 'mock_default',
          statusCode: 200,
          payload: '{"default_stub":true,"personalized":false}',
          isDegraded: true,
          latencyMs: 2,
          message: 'Served deterministic static fallback stub',
        };
      }

      case 'read_only_degraded': {
        if (requestType === 'write') {
          this.failFastCount++;
          return {
            served: false,
            strategy: 'read_only_degraded',
            statusCode: 503,
            payload: '{"error":"Service in read-only degraded maintenance mode"}',
            isDegraded: true,
            latencyMs: 5,
            message: 'Write rejected: Cluster is operating in Read-Only degraded mode',
          };
        }
        this.degradedReadsServed++;
        return {
          served: true,
          strategy: 'read_only_degraded',
          statusCode: 200,
          payload: '{"read_only_data":true}',
          isDegraded: true,
          latencyMs: 8,
          message: 'Read request fulfilled in degraded mode',
        };
      }

      case 'fail_silent': {
        this.mockDefaultsServed++;
        return {
          served: true,
          strategy: 'fail_silent',
          statusCode: 200,
          payload: '{"items":[],"count":0}',
          isDegraded: true,
          latencyMs: 1,
          message: 'Gracefully suppressed error; returned empty dataset',
        };
      }

      case 'fail_fast':
      default: {
        this.failFastCount++;
        return {
          served: false,
          strategy: 'fail_fast',
          statusCode: 503,
          payload: '{"error":"Service Unavailable","retry_after_seconds":5}',
          isDegraded: false,
          latencyMs: 2,
          message: 'Fast-failed with HTTP 503 Service Unavailable (Circuit Breaker Tripped)',
        };
      }
    }
  }

  public getMetrics(): FallbackMetrics {
    return {
      totalFallbacksServed: this.totalFallbacksServed,
      staleCacheServed: this.staleCacheServed,
      mockDefaultsServed: this.mockDefaultsServed,
      degradedReadsServed: this.degradedReadsServed,
      failFastCount: this.failFastCount,
      strategy: this.strategy,
    };
  }

  public reset(): void {
    this.totalFallbacksServed = 0;
    this.staleCacheServed = 0;
    this.mockDefaultsServed = 0;
    this.degradedReadsServed = 0;
    this.failFastCount = 0;
  }
}
