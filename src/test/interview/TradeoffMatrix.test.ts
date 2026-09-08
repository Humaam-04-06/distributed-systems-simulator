import { describe, it, expect } from 'vitest';
import { ARCHITECTURAL_TRADEOFFS } from '../../components/interview/TradeoffMatrixView';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('Architectural Tradeoff Matrix', () => {
  it('should contain 6 comprehensive scenario trade-offs', () => {
    expect(ARCHITECTURAL_TRADEOFFS.length).toBe(6);
  });

  it('should have a detailed trade-off breakdown for all 6 scenarios', () => {
    const requiredScenarios: ScenarioId[] = [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];

    requiredScenarios.forEach((scenarioId) => {
      const item = ARCHITECTURAL_TRADEOFFS.find((t) => t.scenarioId === scenarioId);
      expect(item).toBeDefined();
      expect(item?.topic.length).toBeGreaterThan(5);

      // Option A
      expect(item?.optionA.name.length).toBeGreaterThan(0);
      expect(item?.optionA.pros.length).toBeGreaterThanOrEqual(2);
      expect(item?.optionA.cons.length).toBeGreaterThanOrEqual(2);
      expect(item?.optionA.readLatency.length).toBeGreaterThan(0);
      expect(item?.optionA.writeLatency.length).toBeGreaterThan(0);

      // Option B
      expect(item?.optionB.name.length).toBeGreaterThan(0);
      expect(item?.optionB.pros.length).toBeGreaterThanOrEqual(2);
      expect(item?.optionB.cons.length).toBeGreaterThanOrEqual(2);
      expect(item?.optionB.readLatency.length).toBeGreaterThan(0);
      expect(item?.optionB.writeLatency.length).toBeGreaterThan(0);

      // Staff Verdict
      expect(item?.staffRecommendation.length).toBeGreaterThan(15);
    });
  });
});
