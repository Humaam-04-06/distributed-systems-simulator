import React from 'react';
import {
  Award,
  X,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { ArchitectureEvaluationResult } from '../../engine/scenarios/ScenarioTypes';
import { showSuccessAlert } from '../../utils/alerts';

interface ArchitectureScorecardModalProps {
  isOpen: boolean;
  evaluation: ArchitectureEvaluationResult | null;
  onClose: () => void;
}

export const ArchitectureScorecardModal: React.FC<ArchitectureScorecardModalProps> = ({
  isOpen,
  evaluation,
  onClose,
}) => {
  if (!isOpen || !evaluation) return null;

  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-emerald-950/60';
      case 'B':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-cyan-950/60';
      case 'C':
        return 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-amber-950/60';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-rose-950/60';
    }
  };

  const handleExport = async () => {
    await showSuccessAlert(
      'Evaluation Exported',
      'System Design Interview Scorecard copied to clipboard as Markdown.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1b263b] border border-[#415a77] shadow-2xl p-6 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-[#e0e1dd]">
              System Design Architectural Scorecard
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grade Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/80 gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-4xl font-extrabold font-mono shadow-2xl ${getGradeStyle(
                evaluation.grade
              )}`}
            >
              {evaluation.grade}
            </div>
            <div>
              <div className="text-xs font-mono text-[#778da9] uppercase">Composite Score</div>
              <div className="text-2xl font-bold font-mono text-[#e0e1dd]">
                {evaluation.overallScore} / 100
              </div>
              <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                Scenario: {evaluation.scenarioId.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono text-[#778da9] uppercase">Estimated Cloud Cost</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${evaluation.estimatedMonthlyCostUsd.toLocaleString()} / mo
            </div>
            <div className="text-[10px] text-[#778da9]">Compute, Storage, Bandwidth</div>
          </div>
        </div>

        {/* Interviewer Verdict */}
        <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-cyan-500/40 text-xs">
          <span className="font-bold text-cyan-300 block mb-1">INTERVIEWER VERDICT:</span>
          <p className="text-[#e0e1dd] leading-relaxed font-sans">{evaluation.interviewerVerdict}</p>
        </div>

        {/* Breakdown Meters */}
        <div className="space-y-2.5 text-xs font-mono">
          <span className="font-bold text-[#778da9] block uppercase text-[10px]">
            Evaluation Pillar Breakdown
          </span>
          {evaluation.metrics.map((m, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#0d1b2a] border border-[#415a77]/40">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#e0e1dd] font-semibold">{m.name}</span>
                <span className="font-bold text-cyan-400">{m.score}%</span>
              </div>
              <div className="w-full h-2 bg-[#1b263b] rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    m.score >= 80 ? 'bg-emerald-400' : m.score >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${m.score}%` }}
                />
              </div>
              <p className="text-[10px] text-[#778da9]">{m.feedback}</p>
            </div>
          ))}
        </div>

        {/* Single Points of Failure (SPOFs) */}
        {evaluation.spofsDetected.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-rose-400 flex items-center gap-1.5 uppercase text-[10px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              Single Points of Failure ({evaluation.spofsDetected.length} Critical Risks)
            </span>
            {evaluation.spofsDetected.map((spof) => (
              <div
                key={spof.id}
                className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/60 text-[#e0e1dd]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-300">{spof.subsystem}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-bold uppercase">
                    {spof.riskLevel}
                  </span>
                </div>
                <p className="text-[#778da9] text-[11px] mb-1.5">{spof.description}</p>
                <div className="text-[10px] text-cyan-300 font-mono">
                  💡 Remediation: {spof.remediation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#415a77]/60">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold bg-[#0d1b2a] hover:bg-[#415a77] text-[#e0e1dd] transition-all cursor-pointer border border-[#415a77]/60"
          >
            <Download className="w-3.5 h-3.5" />
            Export Markdown Report
          </button>

          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
