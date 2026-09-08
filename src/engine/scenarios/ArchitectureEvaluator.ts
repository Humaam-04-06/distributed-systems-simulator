/**
 * ArchitectureEvaluator — Automated System Design Scoring & Grading Engine
 * 
 * Evaluates live simulator topology, availability SLA, P99 latency budget,
 * single point of failure (SPOF) risks, and cloud cost efficiency against scenario requirements.
 */

import {
  ScenarioId,
  ArchitectureGrade,
  ArchitectureEvaluationResult,
  SpofVulnerability,
  EvaluationMetric,
} from './ScenarioTypes';
import { globalScenarioCatalog } from './ScenarioCatalog';
import { SimulationMetrics, ServerNodeState, DatabaseNodeState, SimulationConfig } from '../types';
import { DatabaseNode } from '../DatabaseReplicationEngine';

export interface EvaluationInput {
  scenarioId: ScenarioId;
  metrics: SimulationMetrics;
  servers: ServerNodeState[];
  dbNode: DatabaseNodeState;
  dbNodes: DatabaseNode[];
  cacheEnabled: boolean;
  cacheHitRatio: number;
  circuitBreakerEnabled: boolean;
  rateLimiterEnabled: boolean;
  isMultiRegionActive: boolean;
  config: SimulationConfig;
}

export class ArchitectureEvaluator {
  /**
   * Executes full multi-dimensional architectural evaluation
   */
  public static evaluate(input: EvaluationInput): ArchitectureEvaluationResult {
    const scenario = globalScenarioCatalog.getById(input.scenarioId);
    const req = scenario?.requirements ?? {
      targetP99Ms: 100,
      targetAvailabilitySla: 99.99,
      maxMonthlyBudgetUsd: 100_000,
    };

    const metricsList: EvaluationMetric[] = [];
    const spofs: SpofVulnerability[] = [];
    const bottlenecks: string[] = [];
    const strengths: string[] = [];

    // 1. Availability SLA Evaluation (30% weight)
    const measuredAvailability = Math.max(0, 100 - input.metrics.errorRatePercentage);
    let availabilityScore = 100;
    if (measuredAvailability < req.targetAvailabilitySla) {
      const gap = req.targetAvailabilitySla - measuredAvailability;
      availabilityScore = Math.max(0, Math.round(100 - gap * 15));
      bottlenecks.push(`Availability ${measuredAvailability.toFixed(2)}% breached target SLA (${req.targetAvailabilitySla}%).`);
    } else {
      strengths.push(`Availability (${measuredAvailability.toFixed(2)}%) comfortably satisfies SLA requirement.`);
    }

    metricsList.push({
      name: 'Availability SLA & Uptime',
      score: availabilityScore,
      weight: 0.3,
      verdict: availabilityScore >= 90 ? 'passed' : availabilityScore >= 70 ? 'warning' : 'failed',
      feedback: `Measured ${measuredAvailability.toFixed(2)}% uptime (Target: ${req.targetAvailabilitySla}%).`,
    });

    // 2. Latency Budget Evaluation (25% weight)
    const currentP99 = input.metrics.latencies.p99;
    let latencyScore = 100;
    if (currentP99 > req.targetP99Ms) {
      const ratio = currentP99 / req.targetP99Ms;
      latencyScore = Math.max(10, Math.round(100 / ratio));
      bottlenecks.push(`P99 Latency (${currentP99}ms) exceeded SLA budget (${req.targetP99Ms}ms).`);
    } else {
      strengths.push(`P99 Latency (${currentP99}ms) operates well within latency budget.`);
    }

    metricsList.push({
      name: 'P99 Latency SLA Budget',
      score: latencyScore,
      weight: 0.25,
      verdict: latencyScore >= 85 ? 'passed' : latencyScore >= 60 ? 'warning' : 'failed',
      feedback: `Current P99 is ${currentP99}ms against a target budget of ${req.targetP99Ms}ms.`,
    });

    // 3. Single Point of Failure (SPOF) & Resilience (25% weight)
    let resilienceScore = 100;

    // Check DB Replicas
    const healthyReplicas = input.dbNodes.filter((d) => d.role === 'replica' && d.health !== 'crashed');
    if (healthyReplicas.length === 0) {
      resilienceScore -= 30;
      spofs.push({
        id: 'spof-db-replica',
        subsystem: 'Database Tier',
        riskLevel: 'critical',
        description: 'Single Primary Database without redundant read replicas.',
        remediation: 'Deploy at least 2 read replicas with semi-synchronous or synchronous replication.',
      });
    }

    // Check Worker Server Redundancy
    const aliveServers = input.servers.filter((s) => s.health !== 'crashed');
    if (aliveServers.length <= 1) {
      resilienceScore -= 30;
      spofs.push({
        id: 'spof-worker-pool',
        subsystem: 'Compute Tier',
        riskLevel: 'critical',
        description: 'Compute tier has only 1 active instance. Node crash causes total service outage.',
        remediation: 'Scale worker cluster to a minimum of N+2 redundant instances behind a load balancer.',
      });
    }

    // Check Cache Layer for Read-Heavy Scenarios
    if (!input.cacheEnabled && scenario?.category === 'social-media') {
      resilienceScore -= 20;
      spofs.push({
        id: 'spof-missing-cache',
        subsystem: 'Caching Layer',
        riskLevel: 'high',
        description: 'Redis caching is disabled for a 50:1 read-heavy newsfeed scenario.',
        remediation: 'Enable distributed in-memory caching to shield databases from read amplification.',
      });
    }

    // Check Circuit Breakers
    if (!input.circuitBreakerEnabled) {
      resilienceScore -= 15;
      bottlenecks.push('Circuit Breakers are disabled. Cascading failure risk is high during downstream timeouts.');
    } else {
      strengths.push('Circuit Breakers active to isolate faulty worker instances.');
    }

    resilienceScore = Math.max(0, resilienceScore);

    metricsList.push({
      name: 'Resilience & SPOF Elimination',
      score: resilienceScore,
      weight: 0.25,
      verdict: resilienceScore >= 80 ? 'passed' : resilienceScore >= 50 ? 'warning' : 'failed',
      feedback: `${spofs.length} critical single points of failure detected in active architecture.`,
    });

    // 4. Cloud Cost & Efficiency Evaluation (20% weight)
    const computeCost = input.servers.length * 60; // $60/instance/month
    const dbCost = input.dbNodes.length * 180; // $180/DB node/month
    const cacheCost = input.cacheEnabled ? 120 : 0;
    const bandwidthCost = Math.round((input.config.targetRps * 3600 * 24 * 30 * 0.001 * 0.05) / 1000);
    const estimatedMonthlyCostUsd = computeCost + dbCost + cacheCost + bandwidthCost;

    let costEfficiencyScore = 100;
    if (estimatedMonthlyCostUsd > req.maxMonthlyBudgetUsd) {
      const overageRatio = estimatedMonthlyCostUsd / req.maxMonthlyBudgetUsd;
      costEfficiencyScore = Math.max(20, Math.round(100 / overageRatio));
      bottlenecks.push(`Estimated cloud cost ($${estimatedMonthlyCostUsd}/mo) exceeds budget ($${req.maxMonthlyBudgetUsd}/mo).`);
    } else {
      strengths.push(`Infrastructure cost ($${estimatedMonthlyCostUsd}/mo) is within allowable budget.`);
    }

    metricsList.push({
      name: 'Cloud Cost & Resource Efficiency',
      score: costEfficiencyScore,
      weight: 0.2,
      verdict: costEfficiencyScore >= 80 ? 'passed' : 'warning',
      feedback: `Estimated cost: $${estimatedMonthlyCostUsd}/mo (Budget: $${req.maxMonthlyBudgetUsd}/mo).`,
    });

    // Compute Overall Composite Score
    const overallScore = Math.round(
      availabilityScore * 0.3 +
        latencyScore * 0.25 +
        resilienceScore * 0.25 +
        costEfficiencyScore * 0.2
    );

    // Determine Final Architecture Grade
    let grade: ArchitectureGrade = 'F';
    if (overallScore >= 93 && spofs.length === 0) grade = 'A+';
    else if (overallScore >= 84) grade = 'A';
    else if (overallScore >= 74) grade = 'B';
    else if (overallScore >= 62) grade = 'C';
    else if (overallScore >= 45) grade = 'D';
    else grade = 'F';

    // Formulate Interviewer Verdict
    let interviewerVerdict = '';
    switch (grade) {
      case 'A+':
        interviewerVerdict =
          'STRONG HIRE (Staff / Principal Architect). Architecture demonstrates flawless fault tolerance, meets P99 latency budgets, eliminates all SPOFs, and optimizes cloud cost.';
        break;
      case 'A':
        interviewerVerdict =
          'HIRE (Senior Systems Architect). Robust high-scale design capable of handling peak loads with resilient failover mechanisms and minor non-blocking trade-offs.';
        break;
      case 'B':
        interviewerVerdict =
          'LEAN HIRE (Mid-Level Systems Engineer). Functional architecture with good baseline availability, but vulnerable to specific corner cases and elevated P99 latency.';
        break;
      case 'C':
        interviewerVerdict =
          'LEAN NO-HIRE. System suffers from architectural bottlenecks and inadequate caching/replication under stress.';
        break;
      case 'D':
      case 'F':
        interviewerVerdict =
          'NO-HIRE. Critical single points of failure, severe SLA violations, or unmitigated cascading meltdown risks.';
        break;
    }

    return {
      scenarioId: input.scenarioId,
      overallScore,
      grade,
      availabilityScore,
      latencyScore,
      resilienceScore,
      costEfficiencyScore,
      spofsDetected: spofs,
      bottlenecks,
      strengths,
      interviewerVerdict,
      estimatedMonthlyCostUsd,
      metrics: metricsList,
    };
  }
}
