import { describe, it, expect } from 'vitest';
import { UrlShortenerSimulator } from '../../engine/scenarios/simulators/UrlShortenerSimulator';

describe('UrlShortenerSimulator', () => {
  it('should initialize and report correct scenarioId', () => {
    const sim = new UrlShortenerSimulator();
    expect(sim.scenarioId).toBe('url-shortener');
    expect(sim.isRunning()).toBe(false);
  });

  it('should process URL writes and reads with high read-to-write ratio', () => {
    const sim = new UrlShortenerSimulator();
    sim.start();

    sim.step(1000);
    const stats = sim.getStats();

    expect(stats.totalCompleted).toBeGreaterThan(0);
    expect(stats.cacheHitRatio).toBeGreaterThanOrEqual(0.85);
    expect(stats.statusSummary).toContain('Shortened:');
    expect(stats.statusSummary).toContain('Redirects:');
  });

  it('should intercept 404 misses using Bloom filter', () => {
    const sim = new UrlShortenerSimulator();
    sim.start();

    sim.step(2000);
    const stats = sim.getStats();

    expect(stats.statusSummary).toContain('Bloom Filter Intercepts:');
  });

  it('should degrade latency during cache-stampede anomaly', () => {
    const sim = new UrlShortenerSimulator();
    sim.start();

    sim.injectAnomaly('cache-stampede');
    const stats = sim.getStats();

    expect(stats.avgLatencyMs).toBeGreaterThan(30);
  });

  it('should reset clean shortener baseline state', () => {
    const sim = new UrlShortenerSimulator();
    sim.start();
    sim.step(1000);
    sim.injectAnomaly('cache-stampede');

    sim.reset();
    const stats = sim.getStats();

    expect(stats.avgLatencyMs).toBe(6);
    expect(stats.p99LatencyMs).toBe(18);
    expect(stats.queueDepth).toBe(40);
  });
});
