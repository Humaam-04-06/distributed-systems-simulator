import React from 'react';
import {
  Flame,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Server,
  Database,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  ChaosScenario,
  ChaosScenarioId,
  ChaosExperimentState,
} from '../../engine/ChaosExperimentRunner';
import { showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface ChaosExperimentConsoleProps {
  state: ChaosExperimentState;
  scenarios: ChaosScenario[];
  onStartScenario: (id: ChaosScenarioId) => void;
  onStopScenario: () => void;
}

export const ChaosExperimentConsole: React.FC<ChaosExperimentConsoleProps> = ({
  state,
  scenarios,
  onStartScenario,
  onStopScenario,
}) => {
  const isRunning = state.status === 'running';

  const handleLaunchDrill = async (scenario: ChaosScenario) => {
    onStartScenario(scenario.id);
    await showWarningAlert(
      `Chaos Drill Launched: ${scenario.name}`,
      `Injecting chaos into [${scenario.targetSubsystem}]. Evaluating steady-state hypothesis: "${scenario.hypothesis}"`
    );
  };

  const handleAbortDrill = async () => {
    onStopScenario();
    await showSuccessAlert('Chaos Drill Aborted', 'Cluster returned to baseline operations.');
  };

  const getScenarioIcon = (id: ChaosScenarioId) => {
    if (id === 'az-outage') return <Server className="w-4 h-4 text-cyan-400" />;
    if (id === 'database-blackhole') return <Database className="w-4 h-4 text-rose-400" />;
    if (id === 'byzantine-traitor') return <Flame className="w-4 h-4 text-amber-400" />;
    if (id === 'latency-storm') return <Radio className="w-4 h-4 text-purple-400" />;
    return <ShieldAlert className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Active Experiment Running Banner */}
      {isRunning && state.activeScenario ? (
        <div className="p-4 bg-gradient-to-r from-rose-950/40 via-[#1b263b] to-[#0d1b2a] rounded-xl border border-rose-500/50 shadow-xl space-y-3 animate-pulse-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-rose-500 text-white animate-pulse">
                    DRILL ACTIVE
                  </span>
                  <h3 className="text-sm font-bold text-[#e0e1dd] font-mono">
                    {state.activeScenario.name}
                  </h3>
                </div>
                <p className="text-xs text-[#778da9] mt-0.5">
                  Target: <span className="text-cyan-300">{state.activeScenario.targetSubsystem}</span> • {state.blastRadiusSummary}
                </p>
              </div>
            </div>

            <button
              onClick={handleAbortDrill}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-950/40"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Abort Drill
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-[#778da9]">
              <span>Progress: {Math.round((state.elapsedMs / Math.max(1, state.totalDurationMs)) * 100)}%</span>
              <span>{Math.max(0, Math.ceil((state.totalDurationMs - state.elapsedMs) / 1000))}s remaining</span>
            </div>
            <div className="w-full bg-[#0d1b2a] h-2 rounded-full overflow-hidden border border-[#415a77]">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (state.elapsedMs / Math.max(1, state.totalDurationMs)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Steady-State Hypothesis Live Invariants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">Availability Invariant</div>
                <div
                  className={`text-sm font-bold font-mono ${
                    state.hypothesisMetrics.currentAvailability >= state.hypothesisMetrics.minAvailabilityThreshold
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {state.hypothesisMetrics.currentAvailability}%{' '}
                  <span className="text-[10px] text-[#778da9]">
                    (Min: {state.hypothesisMetrics.minAvailabilityThreshold}%)
                  </span>
                </div>
              </div>
              {state.hypothesisMetrics.currentAvailability >= state.hypothesisMetrics.minAvailabilityThreshold ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              )}
            </div>

            <div className="p-2.5 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">P99 Latency Invariant</div>
                <div
                  className={`text-sm font-bold font-mono ${
                    state.hypothesisMetrics.currentP99Latency <= state.hypothesisMetrics.maxP99Threshold
                      ? 'text-cyan-300'
                      : 'text-amber-400'
                  }`}
                >
                  {state.hypothesisMetrics.currentP99Latency}ms{' '}
                  <span className="text-[10px] text-[#778da9]">
                    (Max: {state.hypothesisMetrics.maxP99Threshold}ms)
                  </span>
                </div>
              </div>
              {state.hypothesisMetrics.currentP99Latency <= state.hypothesisMetrics.maxP99Threshold ? (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>

            <div className="p-2.5 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">Steady-State Verdict</div>
                <div
                  className={`text-sm font-bold font-mono uppercase ${
                    state.steadyStateHypothesisMet ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {state.steadyStateHypothesisMet ? 'HYPOTHESIS HOLDS' : 'INVARIANT BREACH'}
                </div>
              </div>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#1b263b] rounded-xl border border-[#415a77] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-[#e0e1dd]">
                Netflix Chaos Monkey Automated Drills
              </h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300">
                SYSTEM NOMINAL
              </span>
            </div>
            <p className="text-xs text-[#778da9]">
              Select a chaos scenario below to test cluster fault tolerance, blast radius isolation, and automatic MTTR recovery.
            </p>
          </div>

          <span className="text-xs font-mono text-cyan-300 bg-[#0d1b2a] px-3 py-1.5 rounded-lg border border-[#415a77]">
            {scenarios.length} DRILLS AVAILABLE
          </span>
        </div>
      )}

      {/* Catalog of Chaos Drill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scenarios.map((scenario) => {
          const isTargetRunning = isRunning && state.activeScenario?.id === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                isTargetRunning
                  ? 'bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-950/40'
                  : 'bg-[#1b263b] border-[#415a77] hover:border-cyan-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#0d1b2a] border border-[#415a77]/60">
                      {getScenarioIcon(scenario.id)}
                    </div>
                    <span className="text-xs font-mono font-bold text-[#e0e1dd]">
                      {scenario.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#778da9] px-2 py-0.5 rounded bg-[#0d1b2a] border border-[#415a77]/50">
                    {Math.round(scenario.durationMs / 1000)}s
                  </span>
                </div>

                <p className="text-xs text-[#778da9]">{scenario.description}</p>

                <div className="p-2.5 bg-[#0d1b2a] rounded-lg border border-[#415a77]/50 space-y-1 font-mono text-[11px]">
                  <div className="text-[#778da9] text-[10px] uppercase font-bold text-cyan-400">
                    Steady-State Hypothesis:
                  </div>
                  <div className="text-[#e0e1dd] italic">"{scenario.hypothesis}"</div>
                  <div className="flex items-center justify-between text-[10px] text-[#778da9] pt-1 border-t border-[#415a77]/30">
                    <span>Min Availability: {scenario.minAvailabilityThreshold}%</span>
                    <span>Max P99: {scenario.maxP99ThresholdMs}ms</span>
                  </div>
                </div>
              </div>

              <button
                disabled={isRunning}
                onClick={() => handleLaunchDrill(scenario)}
                className={`w-full py-2 text-xs font-semibold rounded-lg font-mono transition-all flex items-center justify-center gap-1.5 ${
                  isTargetRunning
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500 cursor-not-allowed'
                    : isRunning
                    ? 'bg-[#0d1b2a] text-[#778da9] border border-[#415a77]/40 cursor-not-allowed opacity-50'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-md shadow-cyan-950/20'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                {isTargetRunning ? 'Drill Executing...' : 'Launch Chaos Drill'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
