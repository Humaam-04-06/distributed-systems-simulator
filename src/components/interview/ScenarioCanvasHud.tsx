import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  Layers,
  HelpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SystemDesignScenario } from '../../engine/scenarios/ScenarioTypes';

interface ScenarioCanvasHudProps {
  scenario: SystemDesignScenario;
  onOpenPresets: () => void;
  onOpenHints: () => void;
  onOpenCalculator: () => void;
  onRunEvaluation: () => void;
}

export const ScenarioCanvasHud: React.FC<ScenarioCanvasHudProps> = ({
  scenario,
  onOpenPresets,
  onOpenHints,
  onOpenCalculator,
  onRunEvaluation,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSeconds = 45 * 60; // 45 minute mock interview
  const remaining = Math.max(0, totalSeconds - secondsElapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300">
      <div className="rounded-2xl bg-[#1b263b]/95 backdrop-blur-md border border-[#415a77]/80 shadow-2xl px-4 py-2.5 flex items-center gap-4 text-xs">
        {/* Scenario Pill */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#e0e1dd] whitespace-nowrap">
                {scenario.title}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {scenario.difficulty}
              </span>
            </div>
            <div className="text-[10px] text-[#778da9]">
              Target SLA: <span className="text-cyan-400 font-mono font-semibold">{scenario.targetSlaPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0d1b2a] border border-[#415a77]/60 font-mono text-cyan-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">{timeFormatted}</span>
        </div>

        {/* Action Buttons (when expanded) */}
        {isExpanded && (
          <div className="flex items-center gap-1.5 border-l border-[#415a77]/60 pl-3">
            <button
              onClick={onOpenPresets}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1b2a] hover:bg-[#415a77] text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer text-[11px]"
              title="Load Naive or Production Architecture Blueprint"
            >
              <Layers className="w-3 h-3" />
              Blueprints
            </button>

            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1b2a] hover:bg-[#415a77] text-[#e0e1dd] border border-[#415a77]/60 transition-all cursor-pointer text-[11px]"
              title="Back-of-the-envelope Napkin Math"
            >
              <Calculator className="w-3 h-3 text-cyan-400" />
              Napkin Math
            </button>

            <button
              onClick={onOpenHints}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1b2a] hover:bg-[#415a77] text-amber-300 border border-amber-500/40 transition-all cursor-pointer text-[11px]"
              title="Request Staff Interviewer Hint"
            >
              <HelpCircle className="w-3 h-3" />
              Hints
            </button>

            <button
              onClick={onRunEvaluation}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer text-[11px] shadow-sm shadow-emerald-950/40"
              title="Evaluate Live Architecture"
            >
              <Award className="w-3 h-3" />
              Grade
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
