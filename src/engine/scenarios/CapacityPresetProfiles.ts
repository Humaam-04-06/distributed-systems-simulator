/**
 * CapacityPresetProfiles — Workload Scale Profiles for Capacity Estimator
 * 
 * Provides predefined scale tiers from MVP Startup to Global FAANG Scale,
 * allowing instant back-of-the-envelope workload scaling.
 */

import { CapacityParameters } from './CapacityEstimator';

export interface CapacityScaleProfile {
  id: string;
  name: string;
  description: string;
  dauOverride?: number;
  peakMultiplierOverride?: number;
  retentionYearsOverride?: number;
  badgeText: string;
}

export const CAPACITY_SCALE_PROFILES: CapacityScaleProfile[] = [
  {
    id: 'mvp-startup',
    name: 'Early-Stage Startup (MVP)',
    description: '100k daily active users. Cost-conscious design prioritizing rapid time-to-market over extreme HA.',
    dauOverride: 100_000,
    peakMultiplierOverride: 1.5,
    retentionYearsOverride: 1,
    badgeText: 'SEED STAGE',
  },
  {
    id: 'growth-scale',
    name: 'Growth-Stage Scaleup (Series B)',
    description: '10M daily active users. Requires caching tiers, read replicas, and horizontal auto-scaling.',
    dauOverride: 10_000_000,
    peakMultiplierOverride: 2.5,
    retentionYearsOverride: 3,
    badgeText: 'SERIES B',
  },
  {
    id: 'global-faang',
    name: 'Global Enterprise Scale (FAANG / Tier 1)',
    description: '300M+ daily active users. Multi-region active-active deployment, edge POPs and sub-20ms SLA.',
    dauOverride: 300_000_000,
    peakMultiplierOverride: 3.5,
    retentionYearsOverride: 5,
    badgeText: 'STAFF LEVEL',
  },
  {
    id: 'flash-spike',
    name: 'Viral Event / Black Friday Burst',
    description: '50M concurrent ingress peak. Demands virtual waiting room queue admission and atomic locks.',
    dauOverride: 50_000_000,
    peakMultiplierOverride: 6.0,
    retentionYearsOverride: 2,
    badgeText: 'VIRAL BURST',
  },
];

export class CapacityPresetProfilesCatalog {
  public static getAll(): CapacityScaleProfile[] {
    return CAPACITY_SCALE_PROFILES;
  }

  public static getById(id: string): CapacityScaleProfile | undefined {
    return CAPACITY_SCALE_PROFILES.find((p) => p.id === id);
  }

  public static applyProfile(
    baseParams: CapacityParameters,
    profileId: string
  ): CapacityParameters {
    const profile = this.getById(profileId);
    if (!profile) return { ...baseParams };

    return {
      ...baseParams,
      dailyActiveUsers: profile.dauOverride ?? baseParams.dailyActiveUsers,
      peakMultiplier: profile.peakMultiplierOverride ?? baseParams.peakMultiplier,
      retentionYears: profile.retentionYearsOverride ?? baseParams.retentionYears,
    };
  }
}
