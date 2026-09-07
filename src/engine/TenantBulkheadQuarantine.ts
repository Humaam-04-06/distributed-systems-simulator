/**
 * TenantBulkheadQuarantine — Multi-tenant quota enforcement, quarantine sandbox & Noisy Neighbor protection
 */

export type TenantTier = 'enterprise' | 'pro' | 'free';

export interface TenantQuota {
  tier: TenantTier;
  displayName: string;
  slaTarget: string;
  concurrencyLimit: number;
  burstAllowance: number;
  activeConcurrency: number;
  isQuarantined: boolean;
  rejectedCount: number;
  processedCount: number;
  noisyNeighborShedCount: number;
}

export class TenantBulkheadQuarantine {
  private tenants: Map<TenantTier, TenantQuota> = new Map();
  private isNoisyNeighborActive: boolean = false;
  private noisyNeighborExpiresAt: number = 0;

  constructor() {
    this.initializeDefaultQuotas();
  }

  private initializeDefaultQuotas(): void {
    this.tenants.set('enterprise', {
      tier: 'enterprise',
      displayName: 'Enterprise Tier (Gold)',
      slaTarget: '99.99%',
      concurrencyLimit: 60,
      burstAllowance: 20,
      activeConcurrency: 0,
      isQuarantined: false,
      rejectedCount: 0,
      processedCount: 0,
      noisyNeighborShedCount: 0,
    });

    this.tenants.set('pro', {
      tier: 'pro',
      displayName: 'Professional Tier (Silver)',
      slaTarget: '99.9%',
      concurrencyLimit: 30,
      burstAllowance: 10,
      activeConcurrency: 0,
      isQuarantined: false,
      rejectedCount: 0,
      processedCount: 0,
      noisyNeighborShedCount: 0,
    });

    this.tenants.set('free', {
      tier: 'free',
      displayName: 'Free Tier (Sandbox)',
      slaTarget: '99.0%',
      concurrencyLimit: 15,
      burstAllowance: 0,
      activeConcurrency: 0,
      isQuarantined: false,
      rejectedCount: 0,
      processedCount: 0,
      noisyNeighborShedCount: 0,
    });
  }

  public tryAcquire(tier: TenantTier): {
    accepted: boolean;
    reason?: string;
    isQuarantined: boolean;
  } {
    const quota = this.tenants.get(tier);
    if (!quota) return { accepted: true, isQuarantined: false };

    // 1. Quarantined tier has heavily restricted execution ceiling
    const effectiveLimit = quota.isQuarantined
      ? Math.max(3, Math.floor(quota.concurrencyLimit * 0.2))
      : quota.concurrencyLimit + quota.burstAllowance;

    if (quota.activeConcurrency >= effectiveLimit) {
      quota.rejectedCount++;
      if (this.isNoisyNeighborActive && tier === 'free') {
        quota.noisyNeighborShedCount++;
      }
      return {
        accepted: false,
        isQuarantined: quota.isQuarantined,
        reason: `Tenant quota exceeded for ${quota.displayName}. Capacity capped at ${effectiveLimit} concurrency.`,
      };
    }

    quota.activeConcurrency++;
    return { accepted: true, isQuarantined: quota.isQuarantined };
  }

  public release(tier: TenantTier): void {
    const quota = this.tenants.get(tier);
    if (!quota) return;

    quota.processedCount++;
    if (quota.activeConcurrency > 0) {
      quota.activeConcurrency--;
    }
  }

  public triggerNoisyNeighborSurge(durationMs: number = 8000, now: number = performance.now()): void {
    this.isNoisyNeighborActive = true;
    this.noisyNeighborExpiresAt = now + durationMs;

    // Immediately quarantine the rogue free tier tenant
    const freeTier = this.tenants.get('free');
    if (freeTier) {
      freeTier.isQuarantined = true;
      freeTier.activeConcurrency = freeTier.concurrencyLimit;
    }
  }

  public toggleQuarantine(tier: TenantTier): boolean {
    const quota = this.tenants.get(tier);
    if (!quota) return false;
    quota.isQuarantined = !quota.isQuarantined;
    return quota.isQuarantined;
  }

  public step(deltaMs: number, now: number = performance.now()): void {
    if (this.isNoisyNeighborActive && now >= this.noisyNeighborExpiresAt) {
      this.isNoisyNeighborActive = false;
      const freeTier = this.tenants.get('free');
      if (freeTier) {
        freeTier.isQuarantined = false;
      }
    }

    // Natural processing step decay
    const stepRatio = deltaMs / 1000;
    for (const quota of this.tenants.values()) {
      if (quota.activeConcurrency > 0) {
        const released = Math.min(
          quota.activeConcurrency,
          Math.ceil(quota.concurrencyLimit * 1.8 * stepRatio)
        );
        quota.processedCount += released;
        quota.activeConcurrency = Math.max(0, quota.activeConcurrency - released);
      }
    }
  }

  public getQuotas(): TenantQuota[] {
    return Array.from(this.tenants.values()).map((q) => ({ ...q }));
  }

  public getQuota(tier: TenantTier): TenantQuota | undefined {
    const q = this.tenants.get(tier);
    return q ? { ...q } : undefined;
  }

  public isNoisyNeighborSurgeActive(): boolean {
    return this.isNoisyNeighborActive;
  }

  public reset(): void {
    this.isNoisyNeighborActive = false;
    this.noisyNeighborExpiresAt = 0;
    for (const quota of this.tenants.values()) {
      quota.activeConcurrency = 0;
      quota.rejectedCount = 0;
      quota.processedCount = 0;
      quota.noisyNeighborShedCount = 0;
      quota.isQuarantined = false;
    }
  }
}
