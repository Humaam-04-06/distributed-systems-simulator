import React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import {
  ArchitecturePresetsCatalog,
  ArchitecturePreset,
} from '../../engine/scenarios/ArchitecturePresets';
import { showSuccessAlert } from '../../utils/alerts';

interface ArchitecturePresetLoaderProps {
  isOpen: boolean;
  scenarioId: ScenarioId;
  onClose: () => void;
  onSelectPreset: (preset: ArchitecturePreset) => void;
}

export const ArchitecturePresetLoader: React.FC<ArchitecturePresetLoaderProps> = ({
  isOpen,
  scenarioId,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const presets = ArchitecturePresetsCatalog.getByScenario(scenarioId);

  const handleApply = async (preset: ArchitecturePreset) => {
    onSelectPreset(preset);
    onClose();
    await showSuccessAlert(
      `Blueprint Loaded: ${preset.name}`,
      `Configured simulator topology with ${preset.serverCount} servers, cache=${preset.cacheEnabled ? 'ON' : 'OFF'}, and replication=${preset.replicationEnabled ? 'SYNC' : 'OFF'}.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1b263b] border border-[#415a77] shadow-2xl p-6 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-[#e0e1dd]">
              System Design Architectural Blueprints
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#778da9]">
          Choose a blueprint to load into the simulation canvas. Compare a naive, single-node design
          (rich with real-world bottlenecks and SPOFs) against an enterprise-grade production architecture.
        </p>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                preset.tier === 'production'
                  ? 'bg-[#0d1b2a] border-emerald-500/40 hover:border-emerald-500/80 shadow-lg shadow-emerald-950/20'
                  : 'bg-[#0d1b2a] border-amber-500/40 hover:border-amber-500/80 shadow-lg shadow-amber-950/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        preset.tier === 'production'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {preset.tier.toUpperCase()} TIER
                    </span>
                    <h4 className="text-sm font-bold text-[#e0e1dd] mt-1.5">{preset.name}</h4>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold font-mono text-lg ${
                      preset.expectedGrade.startsWith('A')
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500 text-rose-300'
                    }`}
                  >
                    {preset.expectedGrade}
                  </div>
                </div>

                <p className="text-xs text-[#778da9] leading-relaxed">{preset.description}</p>

                {/* Highlights */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#778da9] block">
                    Architecture Highlights:
                  </span>
                  {preset.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-[#e0e1dd]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* SPOFs if any */}
                {preset.spofsPresent.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#415a77]/40">
                    <span className="text-[10px] font-mono uppercase text-rose-400 block">
                      Single Points of Failure ({preset.spofsPresent.length}):
                    </span>
                    {preset.spofsPresent.map((spof, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span>{spof}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleApply(preset)}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  preset.tier === 'production'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Load This Blueprint
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
