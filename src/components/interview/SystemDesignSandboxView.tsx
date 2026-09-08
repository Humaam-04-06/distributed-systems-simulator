import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  Sparkles,
  Layers,
  Calculator,
  RotateCcw,
  Play,
  FileText,
  Sliders,
} from 'lucide-react';
import {
  ScenarioId,
  InterviewStep,
  ArchitectureEvaluationResult,
} from '../../engine/scenarios/ScenarioTypes';
import {
  globalScenarioCatalog,
  ALL_SYSTEM_DESIGN_SCENARIOS,
} from '../../engine/scenarios/ScenarioCatalog';
import { CapacityEstimator, CapacityParameters } from '../../engine/scenarios/CapacityEstimator';
import { ArchitectureEvaluator, EvaluationInput } from '../../engine/scenarios/ArchitectureEvaluator';
import { SystemDesignScenarioCatalog } from './SystemDesignScenarioCatalog';
import { CapacityEstimatorCalculator } from './CapacityEstimatorCalculator';
import { SystemDesignObjectivePanel } from './SystemDesignObjectivePanel';
import { ArchitectureScorecardModal } from './ArchitectureScorecardModal';
import { showSuccessAlert } from '../../utils/alerts';

interface SystemDesignSandboxViewProps {
  evaluationInput?: Partial<EvaluationInput>;
  onLoadPreset?: (scenarioId: ScenarioId) => void;
  onNavigateCanvas?: () => void;
}

export const SystemDesignSandboxView: React.FC<SystemDesignSandboxViewProps> = ({
  evaluationInput,
  onLoadPreset,
  onNavigateCanvas,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('twitter-feed');
  const [currentStep, setCurrentStep] = useState<InterviewStep>('clarification');
  const [completedSteps, setCompletedSteps] = useState<Set<InterviewStep>>(
    new Set<InterviewStep>(['clarification'])
  );
  const [completedChecklistIds, setCompletedChecklistIds] = useState<Set<string>>(
    new Set<string>(['clarify-read-write', 'clarify-qps'])
  );
  const [activeTab, setActiveTab] = useState<'flow' | 'calculator' | 'catalog'>('flow');
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<ArchitectureEvaluationResult | null>(null);

  const scenario = useMemo(() => {
    return (
      globalScenarioCatalog.getById(activeScenarioId) ||
      ALL_SYSTEM_DESIGN_SCENARIOS[0]
    );
  }, [activeScenarioId]);

  const [capacityParams, setCapacityParams] = useState<CapacityParameters>(() => {
    return CapacityEstimator.getDefaultParameters('twitter-feed');
  });

  const handleSelectScenario = (newId: ScenarioId) => {
    setActiveScenarioId(newId);
    setCurrentStep('clarification');
    setCompletedSteps(new Set<InterviewStep>(['clarification']));
    setCompletedChecklistIds(new Set<string>());
    setCapacityParams(CapacityEstimator.getDefaultParameters(newId));
    setActiveTab('flow');
  };

  const handleNextStep = () => {
    const stepOrder: InterviewStep[] = [
      'clarification',
      'estimation',
      'high-level-design',
      'deep-dive',
      'failure-scenarios',
      'final-review',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const next = stepOrder[currentIndex + 1];
      setCurrentStep(next);
      setCompletedSteps((prev) => new Set(prev).add(next));
    }
  };

  const handlePrevStep = () => {
    const stepOrder: InterviewStep[] = [
      'clarification',
      'estimation',
      'high-level-design',
      'deep-dive',
      'failure-scenarios',
      'final-review',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleToggleChecklist = (id: string) => {
    setCompletedChecklistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRunEvaluation = () => {
    const defaultEvalInput: EvaluationInput = {
      scenarioId: activeScenarioId,
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
        name: 'PostgreSQL Primary',
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
      cacheHitRatio: 0.88,
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
      ...evaluationInput,
    };

    const result = ArchitectureEvaluator.evaluate(defaultEvalInput);
    setEvaluation(result);
    setIsScorecardOpen(true);
  };

  const handleResetProgress = async () => {
    setCurrentStep('clarification');
    setCompletedSteps(new Set<InterviewStep>(['clarification']));
    setCompletedChecklistIds(new Set<string>());
    await showSuccessAlert(
      'Interview Reset',
      'Session reset to Step 1 (Requirements Clarification).'
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1b2a] text-[#e0e1dd] overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-[#1b263b] border-b border-[#415a77]/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-tight text-[#e0e1dd]">
                System Design Interview Sandbox
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                FAANG / Staff Engineer Tier
              </span>
            </div>
            <p className="text-xs text-[#778da9]">
              Live 45-minute interactive architectural interview scenarios, SPOF detection & SLA grading
            </p>
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[#0d1b2a] rounded-xl border border-[#415a77]/60">
            <button
              onClick={() => setActiveTab('flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'flow'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[#778da9] hover:text-[#e0e1dd]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Interview Flow
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[#778da9] hover:text-[#e0e1dd]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Napkin Math
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[#778da9] hover:text-[#e0e1dd]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Change Scenario ({ALL_SYSTEM_DESIGN_SCENARIOS.length})
            </button>
          </div>

          {/* Quick Evaluate Action */}
          <button
            onClick={handleRunEvaluation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer border border-emerald-400/40"
          >
            <Award className="w-4 h-4" />
            Evaluate Architecture
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Scenario Banner Strip */}
        <div className="p-4 rounded-2xl bg-[#1b263b] border border-[#415a77]/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-xl">
              {scenario.title[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#e0e1dd]">{scenario.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {scenario.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-[#0d1b2a]">
                  🎯 {scenario.targetSlaPercentage}% SLA
                </span>
              </div>
              <p className="text-xs text-[#778da9] mt-0.5">{scenario.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onLoadPreset && (
              <button
                onClick={() => onLoadPreset(activeScenarioId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0d1b2a] hover:bg-[#415a77] text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Load Preset Blueprint
              </button>
            )}
            {onNavigateCanvas && (
              <button
                onClick={onNavigateCanvas}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0d1b2a] hover:bg-[#415a77] text-[#e0e1dd] border border-[#415a77]/60 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                Inspect Canvas
              </button>
            )}
            <button
              onClick={handleResetProgress}
              className="p-2 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] transition-colors"
              title="Reset progress"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Sub-views */}
        {activeTab === 'flow' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <SystemDesignObjectivePanel
                scenario={scenario}
                currentStep={currentStep}
                completedSteps={completedSteps}
                completedChecklistIds={completedChecklistIds}
                onStepChange={setCurrentStep}
                onNextStep={handleNextStep}
                onPrevStep={handlePrevStep}
                onToggleChecklist={handleToggleChecklist}
                onRunEvaluation={handleRunEvaluation}
              />
            </div>

            <div className="lg:col-span-4 space-y-6">
              {/* Napkin-math preview widget */}
              <div className="p-5 rounded-2xl bg-[#1b263b] border border-[#415a77]/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#415a77]/60">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-[#e0e1dd]">Estimated Workload</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Open Full Calc →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40">
                    <span className="text-[10px] text-[#778da9] block uppercase">Read QPS</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {capacityParams.dailyActiveUsers > 0
                        ? Math.round(
                            (capacityParams.dailyActiveUsers * capacityParams.readsPerUserPerDay) /
                              86400
                          ).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40">
                    <span className="text-[10px] text-[#778da9] block uppercase">Peak Write QPS</span>
                    <span className="text-sm font-bold text-amber-400">
                      {capacityParams.dailyActiveUsers > 0
                        ? Math.round(
                            ((capacityParams.dailyActiveUsers *
                              capacityParams.writesPerUserPerDay) /
                              86400) *
                              capacityParams.peakMultiplier
                          ).toLocaleString()
                        : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Architectural Tips */}
              <div className="p-5 rounded-2xl bg-[#1b263b] border border-[#415a77]/60 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#415a77]/60">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-[#e0e1dd]">Staff Engineer Heuristics</span>
                </div>
                <ul className="space-y-2 text-xs text-[#778da9] list-disc list-inside">
                  <li>Always clarify non-functional SLA requirements (latency &lt; 200ms, 99.99% availability).</li>
                  <li>Address the 80/20 cache rule: 20% of posts or rides generate 80% of read traffic.</li>
                  <li>Ensure no database is a Single Point of Failure (SPOF) without read-replicas.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="max-w-4xl mx-auto">
            <CapacityEstimatorCalculator
              scenarioId={activeScenarioId}
              initialParams={capacityParams}
              onParamsChange={setCapacityParams}
            />
          </div>
        )}

        {activeTab === 'catalog' && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-bold text-[#e0e1dd]">Available Interview Scenarios</h4>
              <p className="text-xs text-[#778da9]">
                Select any scenario below to change the active problem and requirements roadmap.
              </p>
            </div>
            <SystemDesignScenarioCatalog
              activeScenarioId={activeScenarioId}
              onSelectScenario={handleSelectScenario}
            />
          </div>
        )}
      </div>

      {/* Scorecard Modal */}
      <ArchitectureScorecardModal
        isOpen={isScorecardOpen}
        evaluation={evaluation}
        onClose={() => setIsScorecardOpen(false)}
      />
    </div>
  );
};
