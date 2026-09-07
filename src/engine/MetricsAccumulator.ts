/**
 * MetricsAccumulator — High-performance sliding-window statistical telemetry collector
 */

import {
  LatencyPercentiles,
  Packet,
  SimulationMetrics,
  TimeseriesPoint,
} from './types';

export class MetricsAccumulator {
  private recentLatencies: number[] = [];
  private maxLatenciesSample: number = 500;

  // Windowed counters for per-second rates
  private windowStartTimestamp: number = performance.now();
  private requestsInWindow: number = 0;
  private successInWindow: number = 0;
  private errorsInWindow: number = 0;

  // Real-time rates
  private currentRps: number = 0;
  private successfulRps: number = 0;
  private errorRps: number = 0;

  // Lifetime cumulative totals
  private totalProcessed: number = 0;
  private totalErrors: number = 0;
  private totalRateLimited: number = 0;
  private totalCircuitBroken: number = 0;

  // History buffer for sparklines
  private history: TimeseriesPoint[] = [];
  private maxHistoryLength: number = 40;
  private lastHistorySnapshot: number = 0;

  public recordCompleted(packet: Packet): void {
    this.totalProcessed++;
    this.requestsInWindow++;

    const isError =
      packet.status === 'error_500' ||
      packet.status === 'rate_limited_429' ||
      packet.status === 'circuit_broken_503' ||
      packet.status === 'timeout_504';

    if (isError) {
      this.totalErrors++;
      this.errorsInWindow++;
      if (packet.status === 'rate_limited_429') this.totalRateLimited++;
      if (packet.status === 'circuit_broken_503') this.totalCircuitBroken++;
    } else {
      this.successInWindow++;
    }

    if (packet.totalLatencyMs !== undefined) {
      this.recentLatencies.push(packet.totalLatencyMs);
      if (this.recentLatencies.length > this.maxLatenciesSample) {
        this.recentLatencies.shift();
      }
    }
  }

  public tick(now: number, activeServers: number): void {
    const elapsed = (now - this.windowStartTimestamp) / 1000;

    // Recalculate RPS every 500ms
    if (elapsed >= 0.5) {
      this.currentRps = Math.round(this.requestsInWindow / elapsed);
      this.successfulRps = Math.round(this.successInWindow / elapsed);
      this.errorRps = Math.round(this.errorsInWindow / elapsed);

      this.requestsInWindow = 0;
      this.successInWindow = 0;
      this.errorsInWindow = 0;
      this.windowStartTimestamp = now;

      // Add timeseries point every 1 second
      if (now - this.lastHistorySnapshot >= 1000) {
        this.lastHistorySnapshot = now;
        const latencies = this.computePercentiles();
        const errorRate =
          this.currentRps > 0 ? (this.errorRps / this.currentRps) * 100 : 0;

        this.history.push({
          timestamp: now,
          rps: this.currentRps,
          p99Latency: latencies.p99,
          p50Latency: latencies.p50,
          errorRate,
          activeServers,
        });

        if (this.history.length > this.maxHistoryLength) {
          this.history.shift();
        }
      }
    }
  }

  public computePercentiles(): LatencyPercentiles {
    if (this.recentLatencies.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
    }

    const sorted = [...this.recentLatencies].sort((a, b) => a - b);
    const len = sorted.length;

    const getP = (p: number) => {
      const idx = Math.min(len - 1, Math.floor(len * p));
      return Math.round(sorted[idx]);
    };

    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      p50: getP(0.5),
      p90: getP(0.9),
      p95: getP(0.95),
      p99: getP(0.99),
      avg: Math.round(sum / len),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[len - 1]),
    };
  }

  public getSnapshot(): SimulationMetrics {
    const latencies = this.computePercentiles();
    const errorRatePercentage =
      this.totalProcessed > 0 ? (this.totalErrors / this.totalProcessed) * 100 : 0;

    return {
      currentRps: this.currentRps,
      successfulRps: this.successfulRps,
      errorRps: this.errorRps,
      errorRatePercentage,
      latencies,
      totalProcessed: this.totalProcessed,
      totalErrors: this.totalErrors,
      totalRateLimited: this.totalRateLimited,
      totalCircuitBroken: this.totalCircuitBroken,
      history: [...this.history],
    };
  }

  public reset(): void {
    this.recentLatencies = [];
    this.requestsInWindow = 0;
    this.successInWindow = 0;
    this.errorsInWindow = 0;
    this.currentRps = 0;
    this.successfulRps = 0;
    this.errorRps = 0;
    this.totalProcessed = 0;
    this.totalErrors = 0;
    this.totalRateLimited = 0;
    this.totalCircuitBroken = 0;
    this.history = [];
    this.windowStartTimestamp = performance.now();
  }
}
