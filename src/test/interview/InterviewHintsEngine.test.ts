import { describe, it, expect } from 'vitest';
import {
  InterviewHintsEngine,
  SCENARIO_HINTS,
} from '../../engine/scenarios/InterviewHintsEngine';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('InterviewHintsEngine', () => {
  it('should have 18 progressive hints total across 6 scenarios (3 tiers each)', () => {
    expect(SCENARIO_HINTS.length).toBe(18);
  });

  it('should have level 1, 2, and 3 hints for every scenario with proper penalties', () => {
    const engine = new InterviewHintsEngine();
    const scenarios: ScenarioId[] = [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];

    scenarios.forEach((s) => {
      const hints = engine.getHintsForScenario(s);
      expect(hints.length).toBe(3);

      const h1 = engine.getHintByLevel(s, 1);
      const h2 = engine.getHintByLevel(s, 2);
      const h3 = engine.getHintByLevel(s, 3);

      expect(h1?.scorePenalty).toBe(2);
      expect(h2?.scorePenalty).toBe(5);
      expect(h3?.scorePenalty).toBe(10);

      expect(h1?.tradeOffInsight.length).toBeGreaterThan(0);
      expect(h2?.tradeOffInsight.length).toBeGreaterThan(0);
      expect(h3?.tradeOffInsight.length).toBeGreaterThan(0);
    });
  });

  it('should track hint revelation and accumulate score penalties', () => {
    const engine = new InterviewHintsEngine();
    expect(engine.getTotalPenalty()).toBe(0);

    const hint1 = engine.revealHint('tw-hint-1');
    expect(hint1).toBeDefined();
    expect(engine.isHintRevealed('tw-hint-1')).toBe(true);
    expect(engine.getTotalPenalty('twitter-feed')).toBe(2);

    engine.revealHint('tw-hint-2');
    expect(engine.getTotalPenalty('twitter-feed')).toBe(7); // 2 + 5

    engine.revealHint('tw-hint-3');
    expect(engine.getTotalPenalty('twitter-feed')).toBe(17); // 2 + 5 + 10
  });

  it('should reset hints and penalties back to 0', () => {
    const engine = new InterviewHintsEngine();
    engine.revealHint('ub-hint-1');
    engine.revealHint('ub-hint-2');

    expect(engine.getTotalPenalty()).toBe(7);

    engine.reset();
    expect(engine.getTotalPenalty()).toBe(0);
    expect(engine.isHintRevealed('ub-hint-1')).toBe(false);
  });
});
