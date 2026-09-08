import { describe, it, expect } from 'vitest';
import { ScenarioChallengeRunner } from '../../engine/scenarios/ScenarioChallengeRunner';

describe('ScenarioChallengeRunner', () => {
  it('should initialize with default scenario and clarification step', () => {
    const runner = new ScenarioChallengeRunner('twitter-feed');
    const state = runner.getState();

    expect(state.activeScenarioId).toBe('twitter-feed');
    expect(state.currentStep).toBe('clarification');
    expect(state.completedSteps.size).toBe(0);
    expect(state.latestEvaluation).toBeNull();
  });

  it('should advance and backtrack through interview steps correctly', () => {
    const runner = new ScenarioChallengeRunner('uber-ride-matching');

    expect(runner.getState().currentStep).toBe('clarification');

    const step2 = runner.nextStep();
    expect(step2).toBe('estimation');
    expect(runner.getState().completedSteps.has('clarification')).toBe(true);

    const step3 = runner.nextStep();
    expect(step3).toBe('high-level-design');

    const prev = runner.prevStep();
    expect(prev).toBe('estimation');
  });

  it('should toggle checklist items', () => {
    const runner = new ScenarioChallengeRunner('black-friday-sale');

    const added = runner.toggleChecklistItem('check-waiting-room');
    expect(added).toBe(true);
    expect(runner.getState().completedChecklistIds.has('check-waiting-room')).toBe(true);

    const removed = runner.toggleChecklistItem('check-waiting-room');
    expect(removed).toBe(false);
    expect(runner.getState().completedChecklistIds.has('check-waiting-room')).toBe(false);
  });

  it('should switch scenarios and reset progress', () => {
    const runner = new ScenarioChallengeRunner('netflix-streaming');
    runner.nextStep();
    runner.toggleChecklistItem('some-task');

    expect(runner.getState().completedSteps.size).toBeGreaterThan(0);

    runner.selectScenario('whatsapp-chat');
    const newState = runner.getState();

    expect(newState.activeScenarioId).toBe('whatsapp-chat');
    expect(newState.currentStep).toBe('clarification');
    expect(newState.completedSteps.size).toBe(0);
    expect(newState.completedChecklistIds.size).toBe(0);
  });

  it('should compute completion progress percentage accurately', () => {
    const runner = new ScenarioChallengeRunner('url-shortener');
    expect(runner.getProgressPercentage()).toBe(0);

    runner.nextStep(); // 1 completed
    expect(runner.getProgressPercentage()).toBe(17); // 1/6 = 16.66% -> 17%

    runner.nextStep(); // 2 completed
    expect(runner.getProgressPercentage()).toBe(33); // 2/6 = 33%
  });
});
