import { describe, it, expect } from 'vitest';
import {
  ScenarioBenchmarkRunner,
  BenchmarkConfig,
} from '../../engine/scenarios/ScenarioBenchmarkRunner';

describe('ScenarioBenchmarkRunner', () => {
  it('should run a simulated load benchmark and compute percentiles', () => {
    const config: BenchmarkConfig = {
      scenarioId: 'twitter-feed',
      durationSeconds: 2,
      targetQps: 6000,
      simulatedConcurrency: 20,
    };

    const report = ScenarioBenchmarkRunner.runBenchmark(config);

    expect(report.scenarioId).toBe('twitter-feed');
    expect(report.totalRequests).toBeGreaterThan(0);
    expect(report.durationMs).toBe(2000);
    expect(report.p50LatencyMs).toBeGreaterThan(0);
    expect(report.p90LatencyMs).toBeGreaterThanOrEqual(report.p50LatencyMs);
    expect(report.p99LatencyMs).toBeGreaterThanOrEqual(report.p90LatencyMs);
    expect(report.availabilityPercentage).toBeGreaterThan(0);
    expect(report.bottleneckSummary.length).toBeGreaterThan(0);
  });

  it('should evaluate SLA compliance flags against scenario target', () => {
    const config: BenchmarkConfig = {
      scenarioId: 'url-shortener',
      durationSeconds: 1,
      targetQps: 10000,
      simulatedConcurrency: 15,
    };

    const report = ScenarioBenchmarkRunner.runBenchmark(config);

    expect(typeof report.slaCompliant).toBe('boolean');
    expect(report.targetSlaPercentage).toBeGreaterThanOrEqual(99.0);
  });
});
