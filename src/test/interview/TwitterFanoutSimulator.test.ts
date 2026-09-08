import { describe, it, expect } from 'vitest';
import { TwitterFanoutSimulator } from '../../engine/scenarios/simulators/TwitterFanoutSimulator';

describe('TwitterFanoutSimulator', () => {
  it('should start and stop correctly', () => {
    const sim = new TwitterFanoutSimulator();
    expect(sim.isRunning()).toBe(false);

    sim.start();
    expect(sim.isRunning()).toBe(true);

    sim.stop();
    expect(sim.isRunning()).toBe(false);
  });

  it('should process tweets and timeline reads on step', () => {
    const sim = new TwitterFanoutSimulator();
    sim.start();

    sim.step(1000); // 1 second step
    const stats = sim.getStats();

    expect(stats.totalCompleted).toBeGreaterThan(0);
    expect(stats.currentQps).toBeGreaterThan(0);
    expect(stats.cacheHitRatio).toBeGreaterThan(0.8);
  });

  it('should handle load scaling', () => {
    const sim = new TwitterFanoutSimulator();
    sim.start();
    sim.injectLoadMultiplier(2.5);

    const stats = sim.getStats();
    expect(stats.currentQps).toBe(Math.round(4500 * 2.5));
  });

  it('should react to celebrity-storm anomaly', () => {
    const sim = new TwitterFanoutSimulator();
    sim.start();

    const baselineStats = sim.getStats();
    sim.injectAnomaly('celebrity-storm');
    const stormStats = sim.getStats();

    expect(stormStats.queueDepth).toBeGreaterThan(baselineStats.queueDepth);
    expect(stormStats.avgLatencyMs).toBeGreaterThan(baselineStats.avgLatencyMs);
  });

  it('should reset to clean baseline state', () => {
    const sim = new TwitterFanoutSimulator();
    sim.start();
    sim.step(1000);
    sim.injectAnomaly('redis-node-failover');

    sim.reset();
    const stats = sim.getStats();

    expect(stats.droppedRequests).toBe(0);
    expect(stats.queueDepth).toBe(120);
    expect(stats.avgLatencyMs).toBe(18);
  });
});
