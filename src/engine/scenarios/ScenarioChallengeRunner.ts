/**
 * ScenarioChallengeRunner — Interactive System Design Interview Session Orchestrator
 * 
 * Drives the step-by-step interview progression from Problem Clarification,
 * Capacity Estimation, High-Level Architecture, Deep Dives, to Final Review.
 */

import {
  ScenarioId,
  InterviewStep,
  SystemDesignScenario,
  ArchitectureEvaluationResult,
} from './ScenarioTypes';
import { globalScenarioCatalog } from './ScenarioCatalog';
import { CapacityEstimator, CapacityParameters } from './CapacityEstimator';
import { ArchitectureEvaluator, EvaluationInput } from './ArchitectureEvaluator';

export interface InterviewSessionState {
  activeScenarioId: ScenarioId;
  currentStep: InterviewStep;
  completedSteps: Set<InterviewStep>;
  completedChecklistIds: Set<string>;
  capacityParams: CapacityParameters;
  latestEvaluation: ArchitectureEvaluationResult | null;
  startedAtMs: number;
}

export class ScenarioChallengeRunner {
  private state: InterviewSessionState;

  constructor(initialScenarioId: ScenarioId = 'twitter-feed') {
    this.state = this.createInitialState(initialScenarioId);
  }

  private createInitialState(scenarioId: ScenarioId): InterviewSessionState {
    return {
      activeScenarioId: scenarioId,
      currentStep: 'clarification',
      completedSteps: new Set<InterviewStep>(),
      completedChecklistIds: new Set<string>(),
      capacityParams: CapacityEstimator.getDefaultParameters(scenarioId),
      latestEvaluation: null,
      startedAtMs: Date.now(),
    };
  }

  public getActiveScenario(): SystemDesignScenario {
    return (
      globalScenarioCatalog.getById(this.state.activeScenarioId) ||
      globalScenarioCatalog.getAll()[0]
    );
  }

  public getState(): InterviewSessionState {
    return {
      ...this.state,
      completedSteps: new Set(this.state.completedSteps),
      completedChecklistIds: new Set(this.state.completedChecklistIds),
    };
  }

  public selectScenario(scenarioId: ScenarioId): void {
    this.state = this.createInitialState(scenarioId);
  }

  public setStep(step: InterviewStep): void {
    this.state.completedSteps.add(this.state.currentStep);
    this.state.currentStep = step;
  }

  public nextStep(): InterviewStep {
    const steps: InterviewStep[] = [
      'clarification',
      'estimation',
      'high-level-design',
      'deep-dive',
      'failure-scenarios',
      'final-review',
    ];
    const currentIndex = steps.indexOf(this.state.currentStep);
    if (currentIndex < steps.length - 1) {
      this.state.completedSteps.add(this.state.currentStep);
      this.state.currentStep = steps[currentIndex + 1];
    }
    return this.state.currentStep;
  }

  public prevStep(): InterviewStep {
    const steps: InterviewStep[] = [
      'clarification',
      'estimation',
      'high-level-design',
      'deep-dive',
      'failure-scenarios',
      'final-review',
    ];
    const currentIndex = steps.indexOf(this.state.currentStep);
    if (currentIndex > 0) {
      this.state.currentStep = steps[currentIndex - 1];
    }
    return this.state.currentStep;
  }

  public toggleChecklistItem(itemId: string): boolean {
    if (this.state.completedChecklistIds.has(itemId)) {
      this.state.completedChecklistIds.delete(itemId);
      return false;
    } else {
      this.state.completedChecklistIds.add(itemId);
      return true;
    }
  }

  public updateCapacityParams(params: Partial<CapacityParameters>): void {
    this.state.capacityParams = {
      ...this.state.capacityParams,
      ...params,
    };
  }

  public evaluateArchitecture(
    engineContext: Omit<EvaluationInput, 'scenarioId'>
  ): ArchitectureEvaluationResult {
    const evaluation = ArchitectureEvaluator.evaluate({
      scenarioId: this.state.activeScenarioId,
      ...engineContext,
    });
    this.state.latestEvaluation = evaluation;
    return evaluation;
  }

  public getProgressPercentage(): number {
    const steps: InterviewStep[] = [
      'clarification',
      'estimation',
      'high-level-design',
      'deep-dive',
      'failure-scenarios',
      'final-review',
    ];
    const completedCount = this.state.completedSteps.size;
    return Math.min(100, Math.round((completedCount / steps.length) * 100));
  }

  public reset(): void {
    this.state = this.createInitialState(this.state.activeScenarioId);
  }
}
