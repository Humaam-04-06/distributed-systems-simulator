import React from 'react';
import {
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  InterviewStep,
  SystemDesignScenario,
} from '../../engine/scenarios/ScenarioTypes';

interface SystemDesignObjectivePanelProps {
  scenario: SystemDesignScenario;
  currentStep: InterviewStep;
  completedSteps: Set<InterviewStep>;
  completedChecklistIds: Set<string>;
  onStepChange: (step: InterviewStep) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onToggleChecklist: (id: string) => void;
  onRunEvaluation: () => void;
}

export const SystemDesignObjectivePanel: React.FC<SystemDesignObjectivePanelProps> = ({
  scenario,
  currentStep,
  completedSteps,
  completedChecklistIds,
  onStepChange,
  onNextStep,
  onPrevStep,
  onToggleChecklist,
  onRunEvaluation,
}) => {
  const steps: { id: InterviewStep; label: string; index: number }[] = [
    { id: 'clarification', label: '1. Requirements', index: 1 },
    { id: 'estimation', label: '2. Estimations', index: 2 },
    { id: 'high-level-design', label: '3. Architecture', index: 3 },
    { id: 'deep-dive', label: '4. Deep Dives', index: 4 },
    { id: 'failure-scenarios', label: '5. Chaos & SPOFs', index: 5 },
    { id: 'final-review', label: '6. Scorecard', index: 6 },
  ];

  return (
    <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80 flex flex-col space-y-4">
      {/* Progress Steps Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#415a77]/60">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {steps.map((s) => {
            const isCurrent = currentStep === s.id;
            const isDone = completedSteps.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onStepChange(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  isCurrent
                    ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-950/50'
                    : isDone
                    ? 'bg-[#0d1b2a] text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#0d1b2a]/60 text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                {isDone && <CheckCircle2 className="w-3 h-3" />}
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onRunEvaluation}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Run Architecture Evaluation
        </button>
      </div>

      {/* Step Content */}
      <div className="min-h-[220px]">
        {currentStep === 'clarification' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <HelpCircle className="w-4 h-4" />
              Step 1: Functional & Non-Functional Requirements Checklist
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
                <span className="font-bold text-[#e0e1dd] block mb-2">Functional Scope</span>
                <ul className="space-y-1.5">
                  {scenario.requirements.functional.map((f, idx) => {
                    const checkId = `func-${idx}`;
                    const isChecked = completedChecklistIds.has(checkId);
                    return (
                      <li
                        key={idx}
                        onClick={() => onToggleChecklist(checkId)}
                        className="flex items-start gap-2 text-[#778da9] hover:text-[#e0e1dd] cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#415a77] mt-0.5 shrink-0" />
                        )}
                        <span className={isChecked ? 'line-through text-cyan-400/80' : ''}>{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
                <span className="font-bold text-[#e0e1dd] block mb-2">Non-Functional Constraints</span>
                <ul className="space-y-1.5">
                  {scenario.requirements.nonFunctional.map((nf, idx) => {
                    const checkId = `nonfunc-${idx}`;
                    const isChecked = completedChecklistIds.has(checkId);
                    return (
                      <li
                        key={idx}
                        onClick={() => onToggleChecklist(checkId)}
                        className="flex items-start gap-2 text-[#778da9] hover:text-[#e0e1dd] cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#415a77] mt-0.5 shrink-0" />
                        )}
                        <span className={isChecked ? 'line-through text-emerald-400/80' : ''}>{nf}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'estimation' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-2">
              <Zap className="w-4 h-4" />
              Step 2: Napkin-Math Scale & Throughput Calculations
            </div>
            <p className="text-xs text-[#778da9] leading-relaxed">
              Use the calculator above to model traffic volumes. Verify if standard single-server database write IOPS (10k IOPS) will saturate and calculate required memory cache size under the 80/20 Pareto distribution.
            </p>
          </div>
        )}

        {currentStep === 'high-level-design' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Layers className="w-4 h-4" />
              Step 3: Suggested Architectural Components
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {scenario.suggestedComponents.map((comp, idx) => (
                <div key={idx} className="p-2 rounded bg-[#0d1b2a] border border-[#415a77]/50 text-[#e0e1dd] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {comp}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'deep-dive' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
              Step 4: Key Deep Dives & Architectural Trade-offs
            </div>
            <div className="space-y-2">
              {scenario.tradeOffs.map((to, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#0d1b2a] border border-[#415a77]/50 text-xs text-[#778da9] leading-relaxed">
                  <strong className="text-amber-300 block mb-1">Trade-off {idx + 1}:</strong>
                  {to}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'failure-scenarios' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <AlertCircle className="w-4 h-4" />
              Step 5: Failure Modes, Network Partitions & Chaos Drills
            </div>
            <p className="text-xs text-[#778da9] leading-relaxed">
              Test your architecture against worker crashes, database primary failovers, cache stampedes, and cross-AZ network partitions using the Chaos Lab tabs. Ensure your system meets the target {scenario.targetSlaPercentage}% availability SLA.
            </p>
          </div>
        )}

        {currentStep === 'final-review' && (
          <div className="space-y-3 text-center py-6">
            <div className="text-sm font-bold text-[#e0e1dd] mb-1">Ready for Architectural Review?</div>
            <p className="text-xs text-[#778da9] max-w-md mx-auto mb-4">
              The automated evaluator will score your architecture across Availability SLA, Latency Budget, Single Points of Failure, and Cloud Cost.
            </p>
            <button
              onClick={onRunEvaluation}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-xl shadow-cyan-950/60 transition-all cursor-pointer"
            >
              Generate Architecture Scorecard & Grade
            </button>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#415a77]/60">
        <button
          onClick={onPrevStep}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#0d1b2a] hover:bg-[#415a77] text-[#e0e1dd] transition-all cursor-pointer border border-[#415a77]/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous Step
        </button>

        <button
          onClick={onNextStep}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer"
        >
          Next Step
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
