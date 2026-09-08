import { describe, it, expect } from 'vitest';
import { UberGeohashSimulator } from '../../engine/scenarios/simulators/UberGeohashSimulator';

describe('UberGeohashSimulator', () => {
  it('should initialize and report correct scenarioId', () => {
    const sim = new UberGeohashSimulator();
    expect(sim.scenarioId).toBe('uber-ride-matching');
    expect(sim.isRunning()).toBe(false);
  });

  it('should process driver location pings and match rider dispatches', () => {
    const sim = new UberGeohashSimulator();
    sim.start();

    sim.step(1000);
    const stats = sim.getStats();

    expect(stats.totalCompleted).toBeGreaterThan(0);
    expect(stats.cacheHitRatio).toBeGreaterThan(0.9); // Match success rate
    expect(stats.currentQps).toBe(8500);
  });

  it('should trigger surge multiplier during high demand', () => {
    const sim = new UberGeohashSimulator();
    sim.start();

    sim.injectAnomaly('stadium-surge');
    const stats = sim.getStats();

    expect(stats.queueDepth).toBeGreaterThan(900);
    expect(stats.avgLatencyMs).toBeGreaterThan(30);
  });

  it('should handle geospatial shard partitions', () => {
    const sim = new UberGeohashSimulator();
    sim.start();

    sim.injectAnomaly('geohash-partition');
    const stats = sim.getStats();

    expect(stats.droppedRequests).toBeGreaterThanOrEqual(350);
  });

  it('should reset clean baseline state', () => {
    const sim = new UberGeohashSimulator();
    sim.start();
    sim.step(1000);
    sim.injectAnomaly('stadium-surge');

    sim.reset();
    const stats = sim.getStats();

    expect(stats.droppedRequests).toBe(0);
    expect(stats.queueDepth).toBe(180);
    expect(stats.avgLatencyMs).toBe(24);
  });
});
