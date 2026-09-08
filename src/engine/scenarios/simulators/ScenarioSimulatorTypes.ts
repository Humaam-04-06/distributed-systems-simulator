/**
 * ScenarioSimulatorTypes — Unified Contracts for Domain-Specific Scenario Engines
 * 
 * Defines standard interfaces for simulating high-scale workloads like
 * Twitter Fanout, Uber Geohashing, Black Friday Locking, Netflix ABR,
 * Bitly Shortening, and WhatsApp Session Management.
 */

import { ScenarioId } from '../ScenarioTypes';

export type SimulationEventSeverity = 'info' | 'success' | 'warn' | 'error';

export interface ScenarioSimulationEvent {
  id: string;
  timestamp: number;
  severity: SimulationEventSeverity;
  scenarioId: ScenarioId;
  action: string;
  latencyMs: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ScenarioSimulationStats {
  scenarioId: ScenarioId;
  currentQps: number;
  peakQps: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  cacheHitRatio: number; // 0.0 to 1.0
  activeWorkers: number;
  queueDepth: number;
  resourceSaturationPercent: number; // 0 to 100
  droppedRequests: number;
  totalCompleted: number;
  statusSummary: string;
}

export interface IScenarioSimulator {
  readonly scenarioId: ScenarioId;
  isRunning(): boolean;
  start(): void;
  stop(): void;
  step(deltaMs: number): void;
  injectLoadMultiplier(multiplier: number): void;
  injectAnomaly(anomalyType: string): void;
  getStats(): ScenarioSimulationStats;
  getEvents(limit?: number): ScenarioSimulationEvent[];
  reset(): void;
}
