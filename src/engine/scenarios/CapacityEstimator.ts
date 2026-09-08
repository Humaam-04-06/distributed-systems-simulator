/**
 * CapacityEstimator — Napkin-Math System Design Capacity Estimation Engine
 * 
 * Computes QPS, Peak QPS, Daily/5-Year Storage, Ingress/Egress Bandwidth,
 * and Memory Cache Sizing using industry-standard back-of-the-envelope formulas.
 */

import { CapacityEstimateResult, ScenarioId } from './ScenarioTypes';

export interface CapacityParameters {
  dailyActiveUsers: number;
  writesPerUserPerDay: number;
  readsPerUserPerDay: number;
  avgWriteSizeBytes: number;
  avgReadSizeBytes: number;
  peakMultiplier: number;
  retentionYears: number;
  cacheHotRatio: number; // e.g. 0.20 (80/20 rule)
}

export class CapacityEstimator {
  /**
   * Computes complete back-of-the-envelope estimates based on input parameters
   */
  public static calculate(params: CapacityParameters): CapacityEstimateResult & {
    cacheMemoryRequiredGb: number;
    writesPerDay: number;
    readsPerDay: number;
  } {
    const SECONDS_PER_DAY = 86400;

    const writesPerDay = params.dailyActiveUsers * params.writesPerUserPerDay;
    const readsPerDay = params.dailyActiveUsers * params.readsPerUserPerDay;

    const writeQps = Math.round(writesPerDay / SECONDS_PER_DAY);
    const readQps = Math.round(readsPerDay / SECONDS_PER_DAY);
    const peakQps = Math.round((writeQps + readQps) * params.peakMultiplier);

    // Storage calculations
    const dailyWriteBytes = writesPerDay * params.avgWriteSizeBytes;
    const storagePerDayGb = Number((dailyWriteBytes / 1e9).toFixed(2));
    const storageFiveYearsTb = Number(
      ((dailyWriteBytes * 365 * params.retentionYears) / 1e12).toFixed(2)
    );

    // Bandwidth in Gigabits per second (Gbps = Bytes * 8 / 1e9)
    const ingressBandwidthGbps = Number(
      ((writeQps * params.avgWriteSizeBytes * 8) / 1e9).toFixed(3)
    );
    const egressBandwidthGbps = Number(
      ((readQps * params.avgReadSizeBytes * 8) / 1e9).toFixed(3)
    );

    // Memory Cache Sizing (80/20 Pareto rule: 20% of daily read volume cached in RAM)
    const dailyReadBytes = readsPerDay * params.avgReadSizeBytes;
    const cacheMemoryRequiredGb = Number(
      ((dailyReadBytes * params.cacheHotRatio) / 1e9).toFixed(1)
    );

    return {
      dailyActiveUsers: params.dailyActiveUsers,
      writeQps,
      readQps,
      peakQpsMultiplier: params.peakMultiplier,
      peakQps,
      storagePerDayGb,
      storageFiveYearsTb,
      ingressBandwidthGbps,
      egressBandwidthGbps,
      cacheMemoryRequiredGb,
      writesPerDay,
      readsPerDay,
    };
  }

  /**
   * Returns standard interview baseline defaults for a given scenario
   */
  public static getDefaultParameters(scenarioId: ScenarioId): CapacityParameters {
    switch (scenarioId) {
      case 'twitter-feed':
        return {
          dailyActiveUsers: 300_000_000,
          writesPerUserPerDay: 2, // 2 tweets/day
          readsPerUserPerDay: 100, // 100 timeline refreshes/day
          avgWriteSizeBytes: 600, // Tweet JSON + metadata
          avgReadSizeBytes: 10_000, // 20 tweets hydrated
          peakMultiplier: 3.5,
          retentionYears: 5,
          cacheHotRatio: 0.2,
        };

      case 'uber-ride-matching':
        return {
          dailyActiveUsers: 120_000_000,
          writesPerUserPerDay: 180, // Driver GPS ping every 4s during shift
          readsPerUserPerDay: 12, // Match lookups
          avgWriteSizeBytes: 128, // lat, lon, bearing, timestamp
          avgReadSizeBytes: 1024,
          peakMultiplier: 2.5,
          retentionYears: 3,
          cacheHotRatio: 0.8, // Active drivers hot in RAM
        };

      case 'black-friday-sale':
        return {
          dailyActiveUsers: 85_000_000,
          writesPerUserPerDay: 1.2, // Checkout reservation
          readsPerUserPerDay: 15,
          avgWriteSizeBytes: 1024,
          avgReadSizeBytes: 2048,
          peakMultiplier: 20.0, // Extreme 20x spike at midnight
          retentionYears: 5,
          cacheHotRatio: 1.0, // All sale inventory in Redis
        };

      case 'netflix-streaming':
        return {
          dailyActiveUsers: 260_000_000,
          writesPerUserPerDay: 1, // Video bookmark / progress
          readsPerUserPerDay: 1200, // Video chunks per viewing session
          avgWriteSizeBytes: 256,
          avgReadSizeBytes: 4_000_000, // 4MB per 4-sec 1080p video segment
          peakMultiplier: 2.8,
          retentionYears: 7,
          cacheHotRatio: 0.15,
        };

      case 'url-shortener':
        return {
          dailyActiveUsers: 70_000_000,
          writesPerUserPerDay: 0.05, // 100M writes/month
          readsPerUserPerDay: 5, // 10B reads/month
          avgWriteSizeBytes: 500, // Long URL + Short URL
          avgReadSizeBytes: 500,
          peakMultiplier: 3.0,
          retentionYears: 10,
          cacheHotRatio: 0.2,
        };

      case 'whatsapp-chat':
        return {
          dailyActiveUsers: 500_000_000,
          writesPerUserPerDay: 40, // 40 messages sent/day
          readsPerUserPerDay: 40, // 40 messages received/day
          avgWriteSizeBytes: 200, // text message + envelope
          avgReadSizeBytes: 200,
          peakMultiplier: 3.2,
          retentionYears: 5,
          cacheHotRatio: 0.1,
        };

      default:
        return {
          dailyActiveUsers: 100_000_000,
          writesPerUserPerDay: 5,
          readsPerUserPerDay: 50,
          avgWriteSizeBytes: 500,
          avgReadSizeBytes: 2000,
          peakMultiplier: 3.0,
          retentionYears: 5,
          cacheHotRatio: 0.2,
        };
    }
  }
}
