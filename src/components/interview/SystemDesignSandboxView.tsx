import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  Sparkles,
  Layers,
  Calculator,
  RotateCcw,
  FileText,
  Sliders,
  AlertTriangle,
  Zap,
  ArrowRightLeft,
  Activity,
  Map,
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
import { ArchitecturePreset } from '../../engine/scenarios/ArchitecturePresets';
import { SystemDesignScenarioCatalog } from './SystemDesignScenarioCatalog';
import { CapacityEstimatorCalculator } from './CapacityEstimatorCalculator';
import { SystemDesignObjectivePanel } from './SystemDesignObjectivePanel';
import { ArchitectureScorecardModal } from './ArchitectureScorecardModal';
import { ScenarioSimulationWidget } from './ScenarioSimulationWidget';
import { TradeoffMatrixView } from './TradeoffMatrixView';
import { SystemDesignQuizModal } from './SystemDesignQuizModal';
import { FailureModeCaseStudyModal } from './FailureModeCaseStudyModal';
import { ScenarioBenchmarkModal } from './ScenarioBenchmarkModal';
import { ArchitecturePresetLoader } from './ArchitecturePresetLoader';
import { ArchitectureBlueprintModal } from './ArchitectureBlueprintModal';
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
  const [activeTab, setActiveTab] = useState<'flow' | 'simulator' | 'calculator' | 'tradeoffs' | 'catalog'>('flow');
  
  // Modals
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isPresetLoaderOpen, setIsPresetLoaderOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

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

  const handleSelectPreset = (preset: ArchitecturePreset) => {
    setIsPresetLoaderOpen(false);
    if (onLoadPreset) {
      onLoadPreset(preset.scenarioId);
    }
    showSuccessAlert(
      `Preset Applied: ${preset.name}`,
      `Loaded ${preset.tier === 'production' ? 'Optimized Production' : 'Naive Baseline'} blueprint.`
    );
  };

  const handleResetProgress = async () => {
    setCurrentStep('clarification');
    setCompletedSteps(new Set<InterviewStep>(['clarification']));
    setCompletedChecklistIds(new Set<string>());
    setEvaluation(null);
    await showSuccessAlert('Progress Reset', 'Scenario interview progress has been reset.');
  };

  return (
    <div className="flex flex-col space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-[#1b263b] border border-[#415a77]/60 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/40 text-indigo-300">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-[#e0e1dd]">
                System Design Interview Sandbox
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Staff Engineer Track
              </span>
            </div>
            <p className="text-xs text-[#778da9] mt-0.5">
              FAANG-grade architecture evaluation, interactive napkin math, live chaos simulations & staff scorecards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPresetLoaderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-[#415a77] text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer shadow-md"
          >
            <Layers className="w-4 h-4" />
            Presets
          </button>
          <button
            onClick={() => setIsBlueprintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-[#415a77] text-teal-300 border border-teal-500/40 transition-all cursor-pointer shadow-md"
          >
            <Map className="w-4 h-4" />
            Topology
          </button>
          <button
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-[#415a77] text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-md"
          >
            <Award className="w-4 h-4" />
            Quiz
          </button>
          <button
            onClick={() => setIsFailureModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-[#415a77] text-red-300 border border-red-500/40 transition-all cursor-pointer shadow-md"
          >
            <AlertTriangle className="w-4 h-4" />
            Post-Mortems
          </button>
          <button
            onClick={() => setIsBenchmarkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-[#415a77] text-purple-300 border border-purple-500/40 transition-all cursor-pointer shadow-md"
          >
            <Zap className="w-4 h-4" />
            Benchmark
          </button>
          <button
            onClick={handleRunEvaluation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Evaluate Architecture
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#1b263b] border border-[#415a77]/60">
          {/* Scenario quick selector & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('flow')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'flow'
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-md'
                  : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Interview Roadmap
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'simulator'
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/60 shadow-md'
                  : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Traffic Simulator
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'calculator'
                  ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/60 shadow-md'
                  : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Capacity Estimator
            </button>
            <button
              onClick={() => setActiveTab('tradeoffs')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'tradeoffs'
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/60 shadow-md'
                  : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Tradeoff Matrix
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'catalog'
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 shadow-md'
                  : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Catalog ({ALL_SYSTEM_DESIGN_SCENARIOS.length})
            </button>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2">
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
              {/* Live Traffic Quick Preview */}
              <div className="p-5 rounded-2xl bg-[#1b263b] border border-[#415a77]/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#415a77]/60">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-[#e0e1dd]">Traffic Simulation</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                  >
                    Open Live Studio →
                  </button>
                </div>
                <p className="text-xs text-[#778da9]">
                  Run real-time scenario simulation with burst traffic, node failure injection & dynamic throughput tracking.
                </p>
              </div>

              {/* Napkin-math preview widget */}
              <div className="p-5 rounded-2xl bg-[#1b263b] border border-[#415a77]/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#415a77]/60">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-[#e0e1dd]">Estimated Workload</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
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

        {activeTab === 'simulator' && (
          <div className="max-w-4xl mx-auto">
            <ScenarioSimulationWidget scenarioId={activeScenarioId} />
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

        {activeTab === 'tradeoffs' && (
          <div className="max-w-5xl mx-auto">
            <TradeoffMatrixView scenarioId={activeScenarioId} />
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

      {/* Modals */}
      <ArchitectureScorecardModal
        isOpen={isScorecardOpen}
        evaluation={evaluation}
        onClose={() => setIsScorecardOpen(false)}
      />

      <SystemDesignQuizModal
        isOpen={isQuizOpen}
        scenarioId={activeScenarioId}
        onClose={() => setIsQuizOpen(false)}
      />

      <FailureModeCaseStudyModal
        isOpen={isFailureModalOpen}
        scenarioId={activeScenarioId}
        onClose={() => setIsFailureModalOpen(false)}
      />

      <ScenarioBenchmarkModal
        isOpen={isBenchmarkOpen}
        scenarioId={activeScenarioId}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      <ArchitecturePresetLoader
        isOpen={isPresetLoaderOpen}
        scenarioId={activeScenarioId}
        onClose={() => setIsPresetLoaderOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <ArchitectureBlueprintModal
        isOpen={isBlueprintModalOpen}
        scenarioId={activeScenarioId}
        onClose={() => setIsBlueprintModalOpen(false)}
      />
    </div>
  );
};
