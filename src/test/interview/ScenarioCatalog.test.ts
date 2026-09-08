import { describe, it, expect } from 'vitest';
import {
  globalScenarioCatalog,
  ALL_SYSTEM_DESIGN_SCENARIOS,
} from '../../engine/scenarios/ScenarioCatalog';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('ScenarioCatalog', () => {
  it('should index exactly 6 system design interview scenarios', () => {
    expect(ALL_SYSTEM_DESIGN_SCENARIOS.length).toBe(6);
    expect(globalScenarioCatalog.getAll().length).toBe(6);
  });

  it('should contain all required scenario IDs', () => {
    const requiredIds: ScenarioId[] = [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];

    const registeredIds = globalScenarioCatalog.getIds();
    requiredIds.forEach((id) => {
      expect(registeredIds).toContain(id);
      const scenario = globalScenarioCatalog.getById(id);
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe(id);
    });
  });

  it('should have complete requirement specifications for each scenario', () => {
    globalScenarioCatalog.getAll().forEach((scenario) => {
      expect(scenario.title.length).toBeGreaterThan(0);
      expect(scenario.summary.length).toBeGreaterThan(0);
      expect(scenario.requirements.functional.length).toBeGreaterThanOrEqual(3);
      expect(scenario.requirements.nonFunctional.length).toBeGreaterThanOrEqual(3);
      expect(scenario.requirements.targetAvailabilitySla).toBeGreaterThanOrEqual(99.0);
      expect(scenario.requirements.targetP99Ms).toBeGreaterThan(0);
      expect(scenario.keyConcepts.length).toBeGreaterThanOrEqual(3);
      expect(scenario.suggestedComponents.length).toBeGreaterThanOrEqual(3);
      expect(scenario.tradeOffs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should filter scenarios by difficulty tier', () => {
    const hardScenarios = globalScenarioCatalog.getByDifficulty('hard');
    const staffScenarios = globalScenarioCatalog.getByDifficulty('staff-level');
    expect(hardScenarios.length + staffScenarios.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter scenarios by category', () => {
    const social = globalScenarioCatalog.getByCategory('social-media');
    expect(social.length).toBe(1);
    expect(social[0].id).toBe('twitter-feed');

    const streaming = globalScenarioCatalog.getByCategory('streaming-media');
    expect(streaming.length).toBe(1);
    expect(streaming[0].id).toBe('netflix-streaming');
  });
});
