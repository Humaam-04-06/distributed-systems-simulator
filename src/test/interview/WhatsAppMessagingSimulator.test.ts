import { describe, it, expect } from 'vitest';
import { WhatsAppMessagingSimulator } from '../../engine/scenarios/simulators/WhatsAppMessagingSimulator';

describe('WhatsAppMessagingSimulator', () => {
  it('should initialize and report correct scenarioId and WebSockets', () => {
    const sim = new WhatsAppMessagingSimulator();
    expect(sim.scenarioId).toBe('whatsapp-chat');
    expect(sim.isRunning()).toBe(false);
  });

  it('should process messages and emit dual-ACK state machine updates', () => {
    const sim = new WhatsAppMessagingSimulator();
    sim.start();

    sim.step(1000);
    const stats = sim.getStats();

    expect(stats.totalCompleted).toBeGreaterThan(0);
    expect(stats.statusSummary).toContain('Delivered:');
    expect(stats.statusSummary).toContain('Read:');
    expect(stats.statusSummary).toContain('Active WebSockets:');
  });

  it('should handle gateway file descriptor cap exhaustion anomaly', () => {
    const sim = new WhatsAppMessagingSimulator();
    sim.start();

    sim.injectAnomaly('gateway-fd-exhaustion');
    const stats = sim.getStats();

    expect(stats.queueDepth).toBeGreaterThan(900);
    expect(stats.avgLatencyMs).toBeGreaterThan(50);
  });

  it('should simulate Cassandra compaction lag', () => {
    const sim = new WhatsAppMessagingSimulator();
    sim.start();

    sim.injectAnomaly('cassandra-compaction-lag');
    const stats = sim.getStats();

    expect(stats.avgLatencyMs).toBeGreaterThan(40);
  });

  it('should reset clean chat baseline state', () => {
    const sim = new WhatsAppMessagingSimulator();
    sim.start();
    sim.step(1000);
    sim.injectAnomaly('gateway-fd-exhaustion');

    sim.reset();
    const stats = sim.getStats();

    expect(stats.queueDepth).toBe(140);
    expect(stats.avgLatencyMs).toBe(16);
    expect(stats.p99LatencyMs).toBe(42);
  });
});
