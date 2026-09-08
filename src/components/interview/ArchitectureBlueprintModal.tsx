import React, { useState } from 'react';
import {
  Map,
  X,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import {
  ArchitectureBlueprintViewer,
  ArchitectureBlueprint,
} from '../../engine/scenarios/ArchitectureBlueprintViewer';

interface ArchitectureBlueprintModalProps {
  isOpen: boolean;
  scenarioId: ScenarioId;
  onClose: () => void;
}

export const ArchitectureBlueprintModal: React.FC<ArchitectureBlueprintModalProps> = ({
  isOpen,
  scenarioId,
  onClose,
}) => {
  const [activeTier, setActiveTier] = useState<'naive' | 'production'>('production');

  if (!isOpen) return null;

  const blueprint: ArchitectureBlueprint = ArchitectureBlueprintViewer.getBlueprint(
    scenarioId,
    activeTier
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1b263b] border border-[#415a77] shadow-2xl p-6 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
          <div className="flex items-center gap-2.5">
            <Map className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-[#e0e1dd]">
                System Architecture Topology Blueprint
              </h3>
              <p className="text-xs text-[#778da9]">
                Compare naive baseline vs. production fault-tolerant data pipelines
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

        {/* Tier Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTier('naive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTier === 'naive'
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/60 shadow-md'
                : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Naive Baseline (Single Node / SPOFs)
          </button>
          <button
            onClick={() => setActiveTier('production')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTier === 'production'
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 shadow-md'
                : 'bg-[#0d1b2a] text-[#778da9] border-[#415a77]/40 hover:text-[#e0e1dd]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Production High-Scale (Fault-Tolerant)
          </button>
        </div>

        {/* Blueprint Title */}
        <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40 flex items-center justify-between">
          <span className="text-sm font-bold text-[#e0e1dd]">{blueprint.title}</span>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
              activeTier === 'production'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {activeTier} architecture
          </span>
        </div>

        {/* ASCII Topology Diagram */}
        <div className="p-4 rounded-xl bg-[#0a111a] border border-[#415a77]/50 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-[#778da9] uppercase tracking-wider pb-1 border-b border-[#415a77]/30">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Topology Flowchart
          </div>
          <pre className="whitespace-pre leading-snug">{blueprint.asciiDiagram}</pre>
        </div>

        {/* Data Flow Steps */}
        <div className="p-4 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
            End-to-End Data Flow Pipeline
          </h4>
          <ol className="space-y-1.5 text-xs text-[#e0e1dd]">
            {blueprint.dataFlowSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Protocols & SPOFs / Resilience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#778da9]">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Network & Data Protocols
            </div>
            <div className="flex flex-wrap gap-1.5">
              {blueprint.protocols.map((protocol, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-[#1b263b] text-cyan-300 text-xs font-mono border border-cyan-500/30"
                >
                  {protocol}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40 space-y-2">
            {activeTier === 'naive' ? (
              <>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  SPOF Vulnerabilities
                </div>
                <ul className="space-y-1 text-xs text-amber-200">
                  {blueprint.spofsIdentified.map((spof, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span>{spof}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Resilience Mechanisms
                </div>
                <ul className="space-y-1 text-xs text-emerald-200">
                  {blueprint.resilienceMechanisms.map((mech, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{mech}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#415a77]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#415a77]/40 text-[#e0e1dd] hover:bg-[#415a77]/70 transition-colors"
          >
            Close Blueprint Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
