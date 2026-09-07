/**
 * ConnectionPoolBulkhead — Manages database connection pool lease isolation, acquisition queues & leak detection
 */

export interface LeasedConnection {
  connectionId: string;
  clientId: string;
  leasedAt: number;
  expectedDurationMs: number;
}

export interface ConnectionPoolConfig {
  maxPoolSize: number; // e.g. 50
  minIdle: number; // e.g. 10
  maxWaitQueue: number; // e.g. 30
  acquisitionTimeoutMs: number; // e.g. 1500ms
  leakThresholdMs: number; // e.g. 4000ms
}

export interface ConnectionPoolMetrics {
  maxPoolSize: number;
  activeLeased: number;
  idleCount: number;
  queuedRequests: number;
  maxWaitQueue: number;
  poolUtilizationPercentage: number;
  exhaustionCount: number;
  timeoutsCount: number;
  leaksDetectedCount: number;
  totalLeasesFulfilled: number;
}

export class ConnectionPoolBulkhead {
  private config: ConnectionPoolConfig;
  private activeLeases: Map<string, LeasedConnection> = new Map();
  private waitQueue: { clientId: string; queuedAt: number }[] = [];
  private nextConnId: number = 1;
  private exhaustionCount: number = 0;
  private timeoutsCount: number = 0;
  private leaksDetectedCount: number = 0;
  private totalLeasesFulfilled: number = 0;

  constructor(initialConfig?: Partial<ConnectionPoolConfig>) {
    this.config = {
      maxPoolSize: 50,
      minIdle: 10,
      maxWaitQueue: 30,
      acquisitionTimeoutMs: 1500,
      leakThresholdMs: 4000,
      ...initialConfig,
    };
  }

  public acquireConnection(
    clientId: string,
    expectedDurationMs: number = 35,
    now: number = performance.now()
  ): {
    success: boolean;
    connectionId?: string;
    queued: boolean;
    error?: string;
  } {
    // 1. Connection available in pool
    if (this.activeLeases.size < this.config.maxPoolSize) {
      const connId = `conn-${this.nextConnId++}`;
      this.activeLeases.set(connId, {
        connectionId: connId,
        clientId,
        leasedAt: now,
        expectedDurationMs,
      });
      this.totalLeasesFulfilled++;
      return { success: true, connectionId: connId, queued: false };
    }

    // 2. Pool full; check wait queue buffer
    if (this.waitQueue.length < this.config.maxWaitQueue) {
      this.waitQueue.push({ clientId, queuedAt: now });
      return { success: true, queued: true };
    }

    // 3. Pool completely exhausted
    this.exhaustionCount++;
    return {
      success: false,
      queued: false,
      error: `Database connection pool EXHAUSTED! Max connections (${this.config.maxPoolSize}) & Wait queue (${this.config.maxWaitQueue}) saturated.`,
    };
  }

  public releaseConnection(connectionId: string): void {
    this.activeLeases.delete(connectionId);

    // If requests are waiting in queue, fulfill the next one
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      const newConnId = `conn-${this.nextConnId++}`;
      this.activeLeases.set(newConnId, {
        connectionId: newConnId,
        clientId: next.clientId,
        leasedAt: performance.now(),
        expectedDurationMs: 35,
      });
      this.totalLeasesFulfilled++;
    }
  }

  public step(_deltaMs: number, now: number = performance.now()): void {
    // 1. Automatically return completed leased connections based on expected duration
    const expiredConns: string[] = [];
    for (const [connId, lease] of this.activeLeases.entries()) {
      const elapsed = now - lease.leasedAt;

      // Leak detection check
      if (elapsed > this.config.leakThresholdMs) {
        this.leaksDetectedCount++;
      }

      if (elapsed >= lease.expectedDurationMs) {
        expiredConns.push(connId);
      }
    }

    for (const id of expiredConns) {
      this.releaseConnection(id);
    }

    // 2. Check timeouts in wait queue
    const validQueue: { clientId: string; queuedAt: number }[] = [];
    for (const item of this.waitQueue) {
      if (now - item.queuedAt > this.config.acquisitionTimeoutMs) {
        this.timeoutsCount++;
      } else {
        validQueue.push(item);
      }
    }
    this.waitQueue = validQueue;
  }

  public getMetrics(): ConnectionPoolMetrics {
    const active = this.activeLeases.size;
    const max = this.config.maxPoolSize;
    const idle = Math.max(0, max - active);
    const util = max > 0 ? Number(((active / max) * 100).toFixed(1)) : 0;

    return {
      maxPoolSize: max,
      activeLeased: active,
      idleCount: idle,
      queuedRequests: this.waitQueue.length,
      maxWaitQueue: this.config.maxWaitQueue,
      poolUtilizationPercentage: Math.min(100, util),
      exhaustionCount: this.exhaustionCount,
      timeoutsCount: this.timeoutsCount,
      leaksDetectedCount: this.leaksDetectedCount,
      totalLeasesFulfilled: this.totalLeasesFulfilled,
    };
  }

  public setPoolCapacity(maxPoolSize: number, maxWaitQueue: number): void {
    this.config.maxPoolSize = Math.max(10, Math.min(200, maxPoolSize));
    this.config.maxWaitQueue = Math.max(5, Math.min(100, maxWaitQueue));
  }

  public reset(): void {
    this.activeLeases.clear();
    this.waitQueue = [];
    this.exhaustionCount = 0;
    this.timeoutsCount = 0;
    this.leaksDetectedCount = 0;
    this.totalLeasesFulfilled = 0;
  }
}
