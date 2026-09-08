import { describe, it, expect } from 'vitest';
import {
  CapacityEstimator,
  CapacityParameters,
} from '../../engine/scenarios/CapacityEstimator';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('CapacityEstimator', () => {
  it('should generate default capacity parameters for all 6 scenarios', () => {
    const scenarios: ScenarioId[] = [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];

    scenarios.forEach((s) => {
      const params = CapacityEstimator.getDefaultParameters(s);
      expect(params.dailyActiveUsers).toBeGreaterThan(0);
      expect(params.peakMultiplier).toBeGreaterThanOrEqual(1.5);
      expect(params.retentionYears).toBeGreaterThanOrEqual(1);
      expect(params.cacheHotRatio).toBeGreaterThan(0);
    });
  });

  it('should accurately calculate write and read QPS', () => {
    const customParams: CapacityParameters = {
      dailyActiveUsers: 86400, // 86400 seconds per day -> 1 DAU per second
      writesPerUserPerDay: 10,
      readsPerUserPerDay: 50,
      avgWriteSizeBytes: 500,
      avgReadSizeBytes: 2000,
      peakMultiplier: 2.0,
      retentionYears: 5,
      cacheHotRatio: 0.2,
    };

    const estimate = CapacityEstimator.calculate(customParams);

    expect(estimate.writeQps).toBe(10);
    expect(estimate.readQps).toBe(50);
    expect(estimate.peakQps).toBe(120); // (10 + 50) * 2.0
  });

  it('should accurately compute 5-year storage requirements', () => {
    const params: CapacityParameters = {
      dailyActiveUsers: 1000000,
      writesPerUserPerDay: 2,
      readsPerUserPerDay: 20,
      avgWriteSizeBytes: 1000, // 1 KB
      avgReadSizeBytes: 1000,
      peakMultiplier: 2.0,
      retentionYears: 5,
      cacheHotRatio: 0.2,
    };

    const estimate = CapacityEstimator.calculate(params);
    // 2M writes * 1000 bytes = 2GB/day -> 2GB * 365 * 5 = 3650GB -> ~3.65 TB
    expect(estimate.storagePerDayGb).toBeCloseTo(2.0, 1);
    expect(estimate.storageFiveYearsTb).toBeGreaterThanOrEqual(3.5);
    expect(estimate.storageFiveYearsTb).toBeLessThanOrEqual(4.0);
  });

  it('should size memory cache based on the 80/20 rule', () => {
    const params: CapacityParameters = {
      dailyActiveUsers: 500000,
      writesPerUserPerDay: 1,
      readsPerUserPerDay: 100,
      avgWriteSizeBytes: 500,
      avgReadSizeBytes: 1000,
      peakMultiplier: 2.0,
      retentionYears: 1,
      cacheHotRatio: 0.2, // 20%
    };

    const estimate = CapacityEstimator.calculate(params);
    expect(estimate.cacheMemoryRequiredGb).toBeGreaterThan(0);
  });

  it('should compute non-zero ingress and egress bandwidth', () => {
    const params = CapacityEstimator.getDefaultParameters('netflix-streaming');
    const estimate = CapacityEstimator.calculate(params);

    expect(estimate.ingressBandwidthGbps).toBeGreaterThan(0);
    expect(estimate.egressBandwidthGbps).toBeGreaterThan(estimate.ingressBandwidthGbps);
  });
});
