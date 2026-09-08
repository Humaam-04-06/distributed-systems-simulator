import { describe, it, expect } from 'vitest';
import { NetflixStreamingSimulator } from '../../engine/scenarios/simulators/NetflixStreamingSimulator';

describe('NetflixStreamingSimulator', () => {
  it('should initialize and report correct scenarioId and initial streams', () => {
    const sim = new NetflixStreamingSimulator();
    expect(sim.scenarioId).toBe('netflix-streaming');
    expect(sim.isRunning()).toBe(false);
  });

  it('should serve majority of video chunks from Edge CDN POPs', () => {
    const sim = new NetflixStreamingSimulator();
    sim.start();

    sim.step(1000);
    const stats = sim.getStats();

    expect(stats.totalCompleted).toBeGreaterThan(0);
    expect(stats.cacheHitRatio).toBeGreaterThanOrEqual(0.92); // >92% CDN hit rate
    expect(stats.statusSummary).toContain('Tbps');
  });

  it('should scale bandwidth and stream concurrency with load multiplier', () => {
    const sim = new NetflixStreamingSimulator();
    sim.start();
    sim.injectLoadMultiplier(2.0);
    sim.step(1000);

    const stats = sim.getStats();
    expect(stats.statusSummary).toContain('Streams: 480,000');
    expect(stats.statusSummary).toContain('6.4 Tbps');
  });

  it('should track rebuffering and origin stalls during anomalies', () => {
    const sim = new NetflixStreamingSimulator();
    sim.start();

    sim.injectAnomaly('cdn-cache-eviction');
    let stats = sim.getStats();
    expect(stats.avgLatencyMs).toBeGreaterThan(30);

    sim.injectAnomaly('transcoding-stall');
    stats = sim.getStats();
    expect(stats.droppedRequests).toBeGreaterThan(0); // rebuffering events
  });

  it('should reset clean streaming baseline state', () => {
    const sim = new NetflixStreamingSimulator();
    sim.start();
    sim.step(1000);
    sim.injectAnomaly('transcoding-stall');

    sim.reset();
    const stats = sim.getStats();
    expect(stats.droppedRequests).toBe(0);
    expect(stats.avgLatencyMs).toBe(14);
    expect(stats.p99LatencyMs).toBe(38);
  });
});
