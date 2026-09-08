import { describe, it, expect } from 'vitest';
import {
  CapacityPresetProfilesCatalog,
} from '../../engine/scenarios/CapacityPresetProfiles';
import { CapacityParameters } from '../../engine/scenarios/CapacityEstimator';

describe('CapacityPresetProfilesCatalog', () => {
  const baseParams: CapacityParameters = {
    dailyActiveUsers: 500_000,
    writesPerUserPerDay: 2,
    readsPerUserPerDay: 50,
    avgWriteSizeBytes: 600,
    avgReadSizeBytes: 2000,
    peakMultiplier: 2.0,
    retentionYears: 5,
    cacheHotRatio: 0.2,
  };

  it('should list all 4 scale profiles', () => {
    const all = CapacityPresetProfilesCatalog.getAll();
    expect(all.length).toBe(4);
    expect(all.map((p) => p.id)).toContain('mvp-startup');
    expect(all.map((p) => p.id)).toContain('growth-scale');
    expect(all.map((p) => p.id)).toContain('global-faang');
    expect(all.map((p) => p.id)).toContain('flash-spike');
  });

  it('should scale parameters down for MVP startup profile', () => {
    const scaled = CapacityPresetProfilesCatalog.applyProfile(baseParams, 'mvp-startup');
    expect(scaled.dailyActiveUsers).toBe(100_000);
    expect(scaled.peakMultiplier).toBe(1.5);
    expect(scaled.retentionYears).toBe(1);
    expect(scaled.avgWriteSizeBytes).toBe(600); // Unchanged
  });

  it('should scale parameters up for Global FAANG profile', () => {
    const scaled = CapacityPresetProfilesCatalog.applyProfile(baseParams, 'global-faang');
    expect(scaled.dailyActiveUsers).toBe(300_000_000);
    expect(scaled.peakMultiplier).toBe(3.5);
    expect(scaled.retentionYears).toBe(5);
  });

  it('should return untouched params if profile not found', () => {
    const fallback = CapacityPresetProfilesCatalog.applyProfile(baseParams, 'non-existent');
    expect(fallback.dailyActiveUsers).toBe(baseParams.dailyActiveUsers);
  });
});
