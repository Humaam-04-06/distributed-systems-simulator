/**
 * CacheStampedeSimulator — Models Thundering Herd / Cache Stampede spikes on expired hot keys
 */

export interface StampedeEvent {
  id: string;
  targetKey: string;
  surgeRequestCount: number;
  startedAt: number;
  resolvedAt?: number;
  dbPressureMultiplier: number;
  peakLatencyMs: number;
  mitigated: boolean;
  mitigationStrategy?: 'none' | 'mutex' | 'xfetch';
}

export class CacheStampedeSimulator {
  private activeStampede: StampedeEvent | null = null;
  private history: StampedeEvent[] = [];
  private nextId: number = 1;
  private defaultDurationMs: number = 6000; // 6 second stampede duration before DB stabilizes

  public triggerStampede(
    key: string = 'leaderboard:top10',
    requestCount: number = 850,
    mitigationStrategy: 'none' | 'mutex' | 'xfetch' = 'none',
    now: number = performance.now()
  ): StampedeEvent {
    const isMitigated = mitigationStrategy !== 'none';
    const dbMultiplier = isMitigated ? (mitigationStrategy === 'mutex' ? 1.4 : 1.1) : 8.5;
    const peakLatency = isMitigated ? (mitigationStrategy === 'mutex' ? 45 : 18) : 480;

    const event: StampedeEvent = {
      id: `stampede-${this.nextId++}`,
      targetKey: key,
      surgeRequestCount: requestCount,
      startedAt: now,
      dbPressureMultiplier: dbMultiplier,
      peakLatencyMs: peakLatency,
      mitigated: isMitigated,
      mitigationStrategy,
    };

    this.activeStampede = event;
    this.history.unshift(event);
    return event;
  }

  public tick(now: number): {
    isActive: boolean;
    dbPressureMultiplier: number;
    extraLatencyMs: number;
    targetKey: string | null;
  } {
    if (!this.activeStampede) {
      return {
        isActive: false,
        dbPressureMultiplier: 1.0,
        extraLatencyMs: 0,
        targetKey: null,
      };
    }

    const elapsed = now - this.activeStampede.startedAt;
    if (elapsed >= this.defaultDurationMs) {
      // Stampede naturally resolves as cache recomputes
      this.activeStampede.resolvedAt = now;
      const key = this.activeStampede.targetKey;
      this.activeStampede = null;
      return {
        isActive: false,
        dbPressureMultiplier: 1.0,
        extraLatencyMs: 0,
        targetKey: key,
      };
    }

    // Decay pressure over the duration
    const remainingFraction = Math.max(0, 1 - elapsed / this.defaultDurationMs);
    const currentMultiplier =
      1.0 + (this.activeStampede.dbPressureMultiplier - 1.0) * remainingFraction;
    const currentExtraLatency = Math.round(
      this.activeStampede.peakLatencyMs * remainingFraction
    );

    return {
      isActive: true,
      dbPressureMultiplier: Number(currentMultiplier.toFixed(2)),
      extraLatencyMs: currentExtraLatency,
      targetKey: this.activeStampede.targetKey,
    };
  }

  public getActiveStampede(): StampedeEvent | null {
    return this.activeStampede;
  }

  public getHistory(): StampedeEvent[] {
    return [...this.history];
  }

  public recover(now: number = performance.now()): void {
    if (this.activeStampede) {
      this.activeStampede.resolvedAt = now;
      this.activeStampede = null;
    }
  }
}
