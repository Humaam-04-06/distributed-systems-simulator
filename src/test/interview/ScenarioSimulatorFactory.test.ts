import { describe, it, expect } from 'vitest';
import { ScenarioSimulatorFactory } from '../../engine/scenarios/simulators/ScenarioSimulatorFactory';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('ScenarioSimulatorFactory', () => {
  it('should list all 6 supported scenarios', () => {
    const supported = ScenarioSimulatorFactory.getSupportedScenarios();
    expect(supported.length).toBe(6);
    expect(supported).toContain('twitter-feed');
    expect(supported).toContain('uber-ride-matching');
    expect(supported).toContain('black-friday-sale');
    expect(supported).toContain('netflix-streaming');
    expect(supported).toContain('url-shortener');
    expect(supported).toContain('whatsapp-chat');
  });

  it('should create and cache singleton instances via getSimulator', () => {
    const scenarios: ScenarioId[] = ScenarioSimulatorFactory.getSupportedScenarios();

    scenarios.forEach((id) => {
      const sim1 = ScenarioSimulatorFactory.getSimulator(id);
      const sim2 = ScenarioSimulatorFactory.getSimulator(id);

      expect(sim1).toBeDefined();
      expect(sim1.scenarioId).toBe(id);
      expect(sim1).toBe(sim2); // Same singleton instance
    });
  });

  it('should create distinct fresh instances via createSimulator', () => {
    const sim1 = ScenarioSimulatorFactory.createSimulator('black-friday-sale');
    const sim2 = ScenarioSimulatorFactory.createSimulator('black-friday-sale');

    expect(sim1).not.toBe(sim2);
  });

  it('should reset all cached simulators', () => {
    const twitterSim = ScenarioSimulatorFactory.getSimulator('twitter-feed');
    twitterSim.start();
    expect(twitterSim.isRunning()).toBe(true);

    ScenarioSimulatorFactory.resetAll();
    const freshSim = ScenarioSimulatorFactory.getSimulator('twitter-feed');
    expect(freshSim.isRunning()).toBe(false);
  });
});
