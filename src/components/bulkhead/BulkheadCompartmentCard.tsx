import React from 'react';
import {
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Plus,
  Minus,
} from 'lucide-react';
import { BulkheadPoolMetrics, BulkheadDomain } from '../../engine/ThreadPoolBulkhead';

interface BulkheadCompartmentCardProps {
  metrics: BulkheadPoolMetrics;
  onCapacityChange: (domain: BulkheadDomain, maxConcurrency: number, maxQueue: number) => void;
}

export const BulkheadCompartmentCard: React.FC<BulkheadCompartmentCardProps> = ({
  metrics,
  onCapacityChange,
}) => {
  const isSaturated = metrics.saturationState === 'saturated';
  const isElevated = metrics.saturationState === 'elevated';

  const statusColor = isSaturated
    ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    : isElevated
    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  const barColor = isSaturated
    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
    : isElevated
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  return (
    <div
      className={`rounded-xl border transition-all p-5 space-y-4 shadow-lg ${
        isSaturated
          ? 'border-rose-500/50 bg-[#1b263b] ring-1 ring-rose-500/30'
          : 'border-[#415a77] bg-[#1b263b]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
        <div className="flex items-center space-x-2.5">
          <div
            className={`p-2 rounded-lg border ${
              isSaturated
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#e0e1dd] flex items-center gap-2">
              {metrics.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#778da9] font-mono uppercase">
                Priority: {metrics.priority}
              </span>
            </div>
          </div>
        </div>

        <span
          className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold uppercase ${statusColor}`}
        >
          {isSaturated ? 'FLOODED' : isElevated ? 'ELEVATED' : 'NOMINAL'}
        </span>
      </div>

      {/* Concurrency Utilization Gauge */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#778da9] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            Worker Thread Load
          </span>
          <span className="font-bold text-[#e0e1dd]">
            {metrics.activeConcurrency} / {metrics.maxConcurrency} threads ({metrics.utilizationPercentage}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#0d1b2a] overflow-hidden p-0.5 border border-[#415a77]/40">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, metrics.utilizationPercentage)}%` }}
          />
        </div>
      </div>

      {/* Queue Depth Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#778da9]">Waiting Queue Buffer</span>
          <span
            className={`font-bold ${
              metrics.queueDepth >= metrics.maxQueueDepth * 0.8
                ? 'text-rose-400 font-bold animate-pulse'
                : 'text-[#e0e1dd]'
            }`}
          >
            {metrics.queueDepth} / {metrics.maxQueueDepth} reqs
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#0d1b2a] overflow-hidden border border-[#415a77]/40">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (metrics.queueDepth / metrics.maxQueueDepth) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-center">
        <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
          <span className="text-[10px] text-[#778da9] block">Total Processed</span>
          <span className="text-xs font-bold font-mono text-emerald-400">
            {metrics.processedCount}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
          <span className="text-[10px] text-[#778da9] block">Shed Rejections</span>
          <span
            className={`text-xs font-bold font-mono ${
              metrics.rejectedCount > 0 ? 'text-rose-400' : 'text-[#778da9]'
            }`}
          >
            {metrics.rejectedCount}
          </span>
        </div>
      </div>

      {/* Watertight Protection Strip & Capacity Controls */}
      <div className="pt-2 border-t border-[#415a77]/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-[#778da9]">
          {isSaturated ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isSaturated ? 'Blast radius sealed' : 'Watertight isolation active'}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#778da9] font-mono mr-1">
            <Sliders className="w-3 h-3 inline mr-1" />
            Cap:
          </span>
          <button
            onClick={() =>
              onCapacityChange(
                metrics.domain,
                Math.max(5, metrics.maxConcurrency - 5),
                metrics.maxQueueDepth
              )
            }
            className="p-1 rounded bg-[#0d1b2a] text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#415a77] transition border border-[#415a77]/50"
            title="Decrease thread capacity"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-mono font-bold text-[#e0e1dd] px-1">
            {metrics.maxConcurrency}
          </span>
          <button
            onClick={() =>
              onCapacityChange(
                metrics.domain,
                Math.min(100, metrics.maxConcurrency + 5),
                metrics.maxQueueDepth
              )
            }
            className="p-1 rounded bg-[#0d1b2a] text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#415a77] transition border border-[#415a77]/50"
            title="Increase thread capacity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
