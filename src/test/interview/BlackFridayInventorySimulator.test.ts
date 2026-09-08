import { describe, it, expect } from 'vitest';
import { BlackFridayInventorySimulator } from '../../engine/scenarios/simulators/BlackFridayInventorySimulator';

describe('BlackFridayInventorySimulator', () => {
  it('should initialize with 5,000 inventory items and report black-friday-sale ID', () => {
    const sim = new BlackFridayInventorySimulator();
    expect(sim.scenarioId).toBe('black-friday-sale');
    expect(sim.initialInventory).toBe(5000);
  });

  it('should decrement inventory atomically and never oversell below 0', () => {
    const sim = new BlackFridayInventorySimulator();
    sim.start();

    // Step multiple times with extreme load to simulate inventory depletion
    sim.injectLoadMultiplier(4.0);
    for (let i = 0; i < 30; i++) {
      sim.step(1000);
    }

    const stats = sim.getStats();
    expect(stats.totalCompleted).toBeGreaterThan(0);
    expect(stats.totalCompleted).toBeLessThanOrEqual(5000); // Strict oversell prevention
  });

  it('should filter bot traffic and track blocked bots', () => {
    const sim = new BlackFridayInventorySimulator();
    sim.start();
    sim.step(1000);

    const stats = sim.getStats();
    expect(stats.statusSummary).toContain('Bots Filtered:');
  });

  it('should handle botnet-ddos and redlock-timeout anomalies', () => {
    const sim = new BlackFridayInventorySimulator();
    sim.start();

    sim.injectAnomaly('botnet-ddos');
    let stats = sim.getStats();
    expect(stats.avgLatencyMs).toBeGreaterThan(50);

    sim.injectAnomaly('redlock-timeout');
    stats = sim.getStats();
    expect(stats.avgLatencyMs).toBeGreaterThan(100);
  });

  it('should reset inventory back to initial 5,000 units', () => {
    const sim = new BlackFridayInventorySimulator();
    sim.start();
    sim.step(1000);
    sim.injectAnomaly('redlock-timeout');

    sim.reset();
    const stats = sim.getStats();
    expect(stats.statusSummary).toContain('Stock: 5000 / 5000');
    expect(stats.droppedRequests).toBe(0);
  });
});
