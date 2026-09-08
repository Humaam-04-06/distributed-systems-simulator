import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../engine/SimulationEngine';

describe('SimulationEngine Scenario Integration', () => {
  it('should expose challengeRunner and hintsEngine on engine instance', () => {
    const engine = new SimulationEngine();
    expect(engine.challengeRunner).toBeDefined();
    expect(engine.hintsEngine).toBeDefined();
    expect(engine.challengeRunner.getActiveScenario().id).toBe('twitter-feed');
  });

  it('should load naive architecture preset and configure cluster nodes with SPOFs', () => {
    const engine = new SimulationEngine();
    const loaded = engine.loadArchitecturePreset('twitter-naive');

    expect(loaded).toBe(true);
    expect(engine.serverNodes.length).toBe(1);
    expect(engine.config.cacheEnabled).toBe(false);
    expect(engine.dbNode.syncReplication).toBe(false);
    expect(engine.dbNode.connectedReplicas.length).toBe(0);

    const evaluation = engine.evaluateCurrentArchitecture('twitter-feed');
    expect(evaluation.spofsDetected.length).toBeGreaterThan(0);
  });

  it('should load production architecture preset with multi-servers and sync replicas', () => {
    const engine = new SimulationEngine();
    const loaded = engine.loadArchitecturePreset('twitter-production');

    expect(loaded).toBe(true);
    expect(engine.serverNodes.length).toBe(6);
    expect(engine.config.cacheEnabled).toBe(true);
    expect(engine.dbNode.syncReplication).toBe(true);
    expect(engine.dbNode.connectedReplicas.length).toBeGreaterThan(0);

    const evaluation = engine.evaluateCurrentArchitecture('twitter-feed');
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(70);
  });
});
