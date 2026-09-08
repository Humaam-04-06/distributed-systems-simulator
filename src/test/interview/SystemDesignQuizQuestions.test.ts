import { describe, it, expect } from 'vitest';
import {
  SystemDesignQuizCatalog,
  SYSTEM_DESIGN_QUIZ_QUESTIONS,
} from '../../engine/scenarios/SystemDesignQuizQuestions';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('SystemDesignQuizCatalog', () => {
  it('should contain 18 total questions (3 per scenario)', () => {
    expect(SYSTEM_DESIGN_QUIZ_QUESTIONS.length).toBe(18);
    expect(SystemDesignQuizCatalog.getAll().length).toBe(18);
  });

  it('should have 3 valid questions for each scenario', () => {
    const scenarios: ScenarioId[] = [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];

    scenarios.forEach((s) => {
      const questions = SystemDesignQuizCatalog.getByScenario(s);
      expect(questions.length).toBe(3);

      questions.forEach((q) => {
        expect(q.scenarioId).toBe(s);
        expect(q.question.length).toBeGreaterThan(15);
        expect(q.options.length).toBe(4);
        expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswerIndex).toBeLessThan(4);
        expect(q.explanation.length).toBeGreaterThan(20);
        expect(q.conceptTag.length).toBeGreaterThan(0);
      });
    });
  });

  it('should retrieve individual question by ID', () => {
    const q = SystemDesignQuizCatalog.getById('tw-q1');
    expect(q).toBeDefined();
    expect(q?.conceptTag).toBe('Fanout Strategies');
    expect(q?.correctAnswerIndex).toBe(1);
  });
});
