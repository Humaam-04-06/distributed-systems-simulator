import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  Building2,
  Calendar,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import {
  FailureModeMatrix,
  FailureModeCaseStudy,
} from '../../engine/scenarios/FailureModeMatrix';

interface FailureModeCaseStudyModalProps {
  isOpen: boolean;
  scenarioId: ScenarioId;
  onClose: () => void;
}

export const FailureModeCaseStudyModal: React.FC<FailureModeCaseStudyModalProps> = ({
  isOpen,
  scenarioId,
  onClose,
}) => {
  const caseStudies = FailureModeMatrix.getCaseStudies(scenarioId);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    caseStudies[0]?.id || ''
  );

  if (!isOpen) return null;

  const currentStudy: FailureModeCaseStudy | undefined =
    caseStudies.find((s) => s.id === selectedCaseId) || caseStudies[0];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1b263b] border border-[#415a77] shadow-2xl p-6 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-base font-bold text-[#e0e1dd]">
                Production Post-Mortems & Failure Mode Analysis
              </h3>
              <p className="text-xs text-[#778da9]">
                Real-world distributed systems outage case studies, root cause analysis & Staff mitigations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#415a77]/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Study Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {caseStudies.map((study) => (
            <button
              key={study.id}
              onClick={() => setSelectedCaseId(study.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                (currentStudy?.id === study.id)
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-md'
                  : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
              }`}
            >
              {study.companyOrContext} ({study.incidentYear})
            </button>
          ))}
        </div>

        {currentStudy && (
          <div className="space-y-4">
            {/* Title & Metadata Card */}
            <div className="p-4 rounded-xl bg-[#0d1b2a] border border-[#415a77]/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold text-[#e0e1dd]">
                  {currentStudy.title}
                </h4>
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getSeverityBadge(
                    currentStudy.severity
                  )}`}
                >
                  {currentStudy.severity} Outage
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#778da9]">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{currentStudy.companyOrContext}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#778da9]">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Year: {currentStudy.incidentYear}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#778da9]">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duration: {currentStudy.durationHours}h</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#778da9]">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">{currentStudy.realWorldIncident}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-200">
                <span className="font-semibold text-red-400">Impact: </span>
                {currentStudy.estimatedImpact}
              </div>
            </div>

            {/* Symptoms & Naive Flaw */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Telemetry Symptoms During Outage
                </h5>
                <ul className="space-y-1.5">
                  {currentStudy.symptoms.map((sym, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[#e0e1dd] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Naive Architectural Flaw
                </h5>
                <p className="text-xs text-[#e0e1dd] leading-relaxed">
                  {currentStudy.naiveArchitecturalFlaw}
                </p>
              </div>
            </div>

            {/* Root Cause Analysis */}
            <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-red-500/30 space-y-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-red-300">
                Deep Root Cause Analysis (RCA)
              </h5>
              <p className="text-xs text-[#e0e1dd] leading-relaxed">
                {currentStudy.rootCause}
              </p>
            </div>

            {/* Staff Engineering Mitigations */}
            <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Staff Engineer Architectural Mitigations
                </h5>
              </div>
              <ul className="space-y-2">
                {currentStudy.staffEngineeringRemediation.map((rem, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-[#e0e1dd] flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{rem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Takeaway */}
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#e0e1dd]">
                <span className="font-bold text-blue-300">System Design Takeaway: </span>
                {currentStudy.keyTakeaway}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#415a77]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#415a77]/40 text-[#e0e1dd] hover:bg-[#415a77]/70 transition-colors"
          >
            Close Post-Mortem Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
