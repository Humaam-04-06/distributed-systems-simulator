import { describe, it, expect } from 'vitest';
import { SystemDesignReportExporter } from '../../engine/scenarios/SystemDesignReportExporter';
import { globalScenarioCatalog } from '../../engine/scenarios/ScenarioCatalog';
import { ArchitectureEvaluationResult } from '../../engine/scenarios/ScenarioTypes';
import { CapacityEstimator } from '../../engine/scenarios/CapacityEstimator';

describe('SystemDesignReportExporter', () => {
  const scenario = globalScenarioCatalog.getById('twitter-feed')!;
  const capacityParams = CapacityEstimator.getDefaultParameters('twitter-feed');

  const mockEvaluation: ArchitectureEvaluationResult = {
    scenarioId: 'twitter-feed',
    overallScore: 88,
    grade: 'A',
    availabilityScore: 95,
    latencyScore: 85,
    resilienceScore: 88,
    costEfficiencyScore: 84,
    spofsDetected: [
      {
        id: 'spof-1',
        subsystem: 'Database Master',
        riskLevel: 'critical',
        description: 'Single primary without sync replica',
        remediation: 'Configure multi-AZ synchronous standby replica',
      },
    ],
    bottlenecks: ['Queue lag during celebrity fanouts'],
    strengths: ['Sub-20ms timeline read latency', 'Redis cluster partitioning'],
    interviewerVerdict: 'Strong architecture demonstrating solid understanding of hybrid fanout.',
    estimatedMonthlyCostUsd: 14500,
    metrics: [
      {
        name: 'Availability SLA',
        score: 95,
        weight: 0.3,
        verdict: 'passed',
        feedback: 'Comfortably meets SLA',
      },
      {
        name: 'Latency Budget',
        score: 85,
        weight: 0.3,
        verdict: 'passed',
        feedback: 'P99 within targets',
      },
    ],
  };

  it('should generate comprehensive Markdown report with all sections', () => {
    const md = SystemDesignReportExporter.generateMarkdown(
      scenario,
      mockEvaluation,
      capacityParams,
      5
    );

    expect(md).toContain('# System Design Interview Evaluation Dossier');
    expect(md).toContain(scenario.title);
    expect(md).toContain('**Letter Grade:** **A**');
    expect(md).toContain('88 / 100');
    expect(md).toContain('-5 pts');
    expect(md).toContain('$14,500 USD');
    expect(md).toContain('Single primary without sync replica');
    expect(md).toContain('Configure multi-AZ synchronous standby replica');
    expect(md).toContain('Back-of-the-Envelope Capacity Estimations');
  });

  it('should handle zero-SPOF clean architectures gracefully', () => {
    const cleanEval: ArchitectureEvaluationResult = {
      ...mockEvaluation,
      spofsDetected: [],
    };

    const md = SystemDesignReportExporter.generateMarkdown(
      scenario,
      cleanEval,
      capacityParams,
      0
    );

    expect(md).toContain('Zero critical SPOFs identified');
  });
});
