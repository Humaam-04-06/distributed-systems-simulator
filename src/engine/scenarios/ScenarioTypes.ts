/**
 * ScenarioTypes — Data structures and domain models for the System Design
 * Interview Scenario Engine and Architecture Evaluation Sandbox.
 */

export type ScenarioId =
  | 'twitter-feed'
  | 'uber-ride-matching'
  | 'black-friday-sale'
  | 'netflix-streaming'
  | 'url-shortener'
  | 'whatsapp-chat';

export type ScenarioDifficulty = 'easy' | 'medium' | 'hard' | 'staff-level';

export type ScenarioCategory =
  | 'social-media'
  | 'geospatial'
  | 'e-commerce'
  | 'streaming-media'
  | 'core-infrastructure'
  | 'real-time-chat';

export type InterviewStep =
  | 'clarification'
  | 'estimation'
  | 'high-level-design'
  | 'deep-dive'
  | 'failure-scenarios'
  | 'final-review';

export interface RequirementSpec {
  functional: string[];
  nonFunctional: string[];
  dauEstimate: number;
  readWriteRatio: string;
  targetP99Ms: number;
  targetAvailabilitySla: number;
  maxMonthlyBudgetUsd: number;
}

export type ArchitectureGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SpofVulnerability {
  id: string;
  subsystem: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
}

export interface CapacityEstimateResult {
  dailyActiveUsers: number;
  writeQps: number;
  readQps: number;
  peakQpsMultiplier: number;
  peakQps: number;
  storagePerDayGb: number;
  storageFiveYearsTb: number;
  ingressBandwidthGbps: number;
  egressBandwidthGbps: number;
}

export interface EvaluationMetric {
  name: string;
  score: number; // 0 - 100
  weight: number; // 0.0 - 1.0
  verdict: 'passed' | 'warning' | 'failed';
  feedback: string;
}

export interface ArchitectureEvaluationResult {
  scenarioId: ScenarioId;
  overallScore: number;
  grade: ArchitectureGrade;
  availabilityScore: number;
  latencyScore: number;
  resilienceScore: number;
  costEfficiencyScore: number;
  spofsDetected: SpofVulnerability[];
  bottlenecks: string[];
  strengths: string[];
  interviewerVerdict: string;
  estimatedMonthlyCostUsd: number;
  metrics: EvaluationMetric[];
}

export interface SystemDesignScenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  iconName: string;
  summary: string;
  requirements: RequirementSpec;
  keyConcepts: string[];
  suggestedComponents: string[];
  tradeOffs: string[];
  targetSlaPercentage: number;
}
