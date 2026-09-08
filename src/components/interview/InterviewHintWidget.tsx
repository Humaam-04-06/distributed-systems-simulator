import React, { useState } from 'react';
import {
  HelpCircle,
  Eye,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import {
  InterviewHintsEngine,
  InterviewHint,
} from '../../engine/scenarios/InterviewHintsEngine';
import { showSuccessAlert } from '../../utils/alerts';

interface InterviewHintWidgetProps {
  scenarioId: ScenarioId;
  hintsEngine: InterviewHintsEngine;
  onHintRevealed?: (penalty: number) => void;
}

export const InterviewHintWidget: React.FC<InterviewHintWidgetProps> = ({
  scenarioId,
  hintsEngine,
  onHintRevealed,
}) => {
  const hints = hintsEngine.getHintsForScenario(scenarioId);
  const [revealedSet, setRevealedSet] = useState<Set<string>>(new Set());

  const handleReveal = async (hint: InterviewHint) => {
    hintsEngine.revealHint(hint.id);
    setRevealedSet(new Set(revealedSet).add(hint.id));
    if (onHintRevealed) {
      onHintRevealed(hintsEngine.getTotalPenalty(scenarioId));
    }
    await showSuccessAlert(
      `Hint Revealed (${hint.title})`,
      `Applied -${hint.scorePenalty} point interview penalty. Review the trade-off insight below.`
    );
  };

  const totalPenalty = hintsEngine.getTotalPenalty(scenarioId);

  return (
    <div className="w-full rounded-2xl bg-[#1b263b] border border-[#415a77]/80 shadow-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#e0e1dd]">
              Staff Interviewer Progressive Hints
            </h4>
            <div className="text-[11px] text-[#778da9]">
              Stuck on architecture? Request hints with realistic interview score deductions.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0d1b2a] border border-[#415a77]/60 text-xs font-mono">
          <span className="text-[#778da9]">Total Penalty:</span>
          <span
            className={`font-bold ${
              totalPenalty > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            -{totalPenalty} pts
          </span>
        </div>
      </div>

      {/* Hints List */}
      <div className="space-y-3">
        {hints.map((hint) => {
          const isRevealed = hintsEngine.isHintRevealed(hint.id) || revealedSet.has(hint.id);

          return (
            <div
              key={hint.id}
              className={`p-4 rounded-xl border transition-all ${
                isRevealed
                  ? 'bg-[#0d1b2a] border-cyan-500/50 shadow-md shadow-cyan-950/20'
                  : 'bg-[#0d1b2a]/60 border-[#415a77]/40 hover:border-[#415a77]/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      hint.level === 1
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : hint.level === 2
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    Level {hint.level} (-{hint.scorePenalty} pts)
                  </span>
                  <h5 className="text-xs font-bold text-[#e0e1dd]">{hint.title}</h5>
                </div>

                {!isRevealed ? (
                  <button
                    onClick={() => handleReveal(hint)}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3 h-3" />
                    Reveal (-{hint.scorePenalty} pts)
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Revealed
                  </span>
                )}
              </div>

              {isRevealed ? (
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-[#e0e1dd] leading-relaxed bg-[#1b263b] p-3 rounded-lg border border-[#415a77]/50">
                    {hint.hintText}
                  </p>
                  <div className="flex items-start gap-1.5 text-[11px] text-cyan-300 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Trade-off Insight: {hint.tradeOffInsight}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#778da9]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Hidden guidance. Click Reveal to inspect interviewer recommendation.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
