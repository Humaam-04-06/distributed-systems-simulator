import { describe, it, expect } from 'vitest';
import { globalScenarioCatalog } from '../../engine/scenarios/ScenarioCatalog';
import { CapacityEstimator } from '../../engine/scenarios/CapacityEstimator';
import { CapacityPresetProfilesCatalog } from '../../engine/scenarios/CapacityPresetProfiles';
import { ScenarioChallengeRunner } from '../../engine/scenarios/ScenarioChallengeRunner';
import { InterviewHintsEngine } from '../../engine/scenarios/InterviewHintsEngine';
import { ArchitecturePresetsCatalog } from '../../engine/scenarios/ArchitecturePresets';
import { ArchitectureBlueprintViewer } from '../../engine/scenarios/ArchitectureBlueprintViewer';
import { ScenarioSimulatorFactory } from '../../engine/scenarios/simulators/ScenarioSimulatorFactory';
import { ScenarioBenchmarkRunner } from '../../engine/scenarios/ScenarioBenchmarkRunner';
import { ArchitectureEvaluator, EvaluationInput } from '../../engine/scenarios/ArchitectureEvaluator';
import { FailureModeMatrix } from '../../engine/scenarios/FailureModeMatrix';
import { SystemDesignQuizCatalog } from '../../engine/scenarios/SystemDesignQuizQuestions';
import { SystemDesignReportExporter } from '../../engine/scenarios/SystemDesignReportExporter';

describe('FullInterviewLifecycle End-to-End Simulation', () => {
  it('should execute complete end-to-end System Design candidate lifecycle for Twitter Feed', () => {
    // 1. Candidate selects scenario
    const scenario = globalScenarioCatalog.getById('twitter-feed');
    expect(scenario).toBeDefined();
    expect(scenario?.id).toBe('twitter-feed');

    // 2. Candidate performs napkin-math capacity estimation with scale profile override
    const defaultParams = CapacityEstimator.getDefaultParameters('twitter-feed');
    const faangParams = CapacityPresetProfilesCatalog.applyProfile(defaultParams, 'global-faang');
    expect(faangParams.dailyActiveUsers).toBe(300_000_000);
    const capacityResults = CapacityEstimator.calculate(faangParams);
    expect(capacityResults.readQps).toBeGreaterThan(100_000);
    expect(capacityResults.egressBandwidthGbps).toBeGreaterThan(0);

    // 3. Candidate progresses through 6-step interview workflow
    const runner = new ScenarioChallengeRunner('twitter-feed');
    expect(runner.getState().currentStep).toBe('clarification');
    
    // Complete checklist items
    runner.toggleChecklistItem('clarify-read-write');
    expect(runner.getState().completedChecklistIds.has('clarify-read-write')).toBe(true);

    // Advance through steps
    runner.nextStep(); // estimation
    expect(runner.getState().currentStep).toBe('estimation');
    runner.nextStep(); // high-level-design
    expect(runner.getState().currentStep).toBe('high-level-design');

    // 4. Candidate requests progressive hints during high-level design
    const hintsEngine = new InterviewHintsEngine();
    const hints = hintsEngine.getHintsForScenario('twitter-feed');
    expect(hints.length).toBe(3);
    const revealed = hintsEngine.revealHint('tw-hint-1');
    expect(revealed?.level).toBe(1);
    expect(hintsEngine.isHintRevealed('tw-hint-1')).toBe(true);
    expect(hintsEngine.getTotalPenalty('twitter-feed')).toBe(2);

    // 5. Candidate inspects architectural blueprints and presets
    const blueprints = ArchitectureBlueprintViewer.getAllBlueprints('twitter-feed');
    expect(blueprints.naive.spofsIdentified.length).toBeGreaterThan(0);
    expect(blueprints.production.resilienceMechanisms.length).toBeGreaterThan(0);

    const presets = ArchitecturePresetsCatalog.getByScenario('twitter-feed');
    expect(presets.length).toBe(2);
    const prodPreset = presets.find((p) => p.tier === 'production');
    expect(prodPreset?.tier).toBe('production');

    // 6. Simulator execution and automated benchmark stress testing
    const simulator = ScenarioSimulatorFactory.getSimulator('twitter-feed');
    simulator.start();
    expect(simulator.isRunning()).toBe(true);
    simulator.step(100);
    const simStats = simulator.getStats();
    expect(simStats.totalCompleted).toBeGreaterThanOrEqual(0);
    simulator.stop();

    const benchmarkReport = ScenarioBenchmarkRunner.runBenchmark({
      scenarioId: 'twitter-feed',
      durationSeconds: 1,
      targetQps: 1000,
      simulatedConcurrency: 20,
    });
    expect(benchmarkReport.achievedQps).toBeGreaterThan(0);
    expect(benchmarkReport.slaCompliant).toBe(true);

    // 7. Architectural evaluation and automated grading
    const evalInput: EvaluationInput = {
      scenarioId: 'twitter-feed',
      metrics: {
        currentRps: 1200,
        successfulRps: 1195,
        errorRps: 5,
        errorRatePercentage: 0.004,
        latencies: {
          p50: 18,
          p90: 42,
          p95: 68,
          p99: 94,
          avg: 24,
          min: 8,
          max: 180,
        },
        totalProcessed: 54000,
        totalErrors: 12,
        totalRateLimited: 4,
        totalCircuitBroken: 0,
        history: [],
      },
      servers: [
        {
          id: 'server-1',
          name: 'App Server 1',
          type: 'server',
          health: 'healthy',
          activeConnections: 12,
          maxConnections: 100,
          queueDepth: 2,
          maxQueueDepth: 50,
          cpuLoad: 35,
          processedTotal: 25000,
          failedTotal: 5,
          threadPoolActive: 8,
          threadPoolSize: 32,
          circuitBreakerState: 'closed',
          failureCountConsecutive: 0,
        },
        {
          id: 'server-2',
          name: 'App Server 2',
          type: 'server',
          health: 'healthy',
          activeConnections: 14,
          maxConnections: 100,
          queueDepth: 3,
          maxQueueDepth: 50,
          cpuLoad: 38,
          processedTotal: 29000,
          failedTotal: 7,
          threadPoolActive: 9,
          threadPoolSize: 32,
          circuitBreakerState: 'closed',
          failureCountConsecutive: 0,
        },
      ],
      dbNode: {
        id: 'db-primary',
        name: 'Postgres Primary',
        type: 'database',
        health: 'healthy',
        activeConnections: 18,
        maxConnections: 200,
        queueDepth: 1,
        maxQueueDepth: 100,
        cpuLoad: 42,
        processedTotal: 48000,
        failedTotal: 0,
        role: 'primary',
        replicationLagMs: 0,
        syncReplication: true,
        connectedReplicas: ['db-replica-1'],
      },
      dbNodes: [
        {
          id: 'db-primary',
          name: 'Postgres Leader',
          role: 'primary',
          health: 'healthy',
          lsn: 10000,
          replicationLagMs: 0,
          pendingWalBytes: 0,
          readIops: 250,
          writeIops: 120,
          cpuLoad: 35,
        },
        {
          id: 'db-replica-1',
          name: 'Postgres Follower 1',
          role: 'replica',
          health: 'healthy',
          lsn: 9998,
          replicationLagMs: 4,
          pendingWalBytes: 128,
          readIops: 420,
          writeIops: 0,
          cpuLoad: 28,
        },
      ],
      cacheEnabled: true,
      cacheHitRatio: 0.94,
      circuitBreakerEnabled: true,
      rateLimiterEnabled: true,
      isMultiRegionActive: false,
      config: {
        targetRps: 1200,
        networkLatencyMs: 15,
        packetLossPercentage: 0,
        jitterMs: 5,
        readWriteRatio: 0.85,
        cacheEnabled: true,
        circuitBreakerEnabled: true,
        lbAlgorithm: 'least-connections',
        serverCapacityRps: 1500,
      },
    };

    const evaluation = ArchitectureEvaluator.evaluate(evalInput);
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(80);
    expect(['A', 'A+', 'B']).toContain(evaluation.grade);

    // 8. Candidate reviews real-world failure modes
    const caseStudies = FailureModeMatrix.getCaseStudies('twitter-feed');
    expect(caseStudies.length).toBeGreaterThanOrEqual(2);
    expect(caseStudies[0].title).toContain('Fail Whale');

    // 9. Candidate tests knowledge via Staff Quiz
    const quizQuestions = SystemDesignQuizCatalog.getByScenario('twitter-feed');
    expect(quizQuestions.length).toBe(3);
    const q1 = quizQuestions[0];
    expect(q1.options[q1.correctAnswerIndex]).toBeTruthy();

    // 10. Generate formal Markdown Dossier report
    const markdownReport = SystemDesignReportExporter.generateMarkdown(
      scenario!,
      evaluation,
      faangParams,
      2
    );
    expect(markdownReport).toContain('# System Design Interview Evaluation Dossier');
    expect(markdownReport).toContain('Design Twitter / X Real-Time Newsfeed');
    expect(markdownReport).toContain('## 1. Executive Scorecard');
    expect(markdownReport).toContain('## 3. Back-of-the-Envelope Capacity Estimations');
  });
});
