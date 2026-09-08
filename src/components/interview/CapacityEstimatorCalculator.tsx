import React, { useState } from 'react';
import {
  Calculator,
  RotateCcw,
} from 'lucide-react';
import { CapacityParameters, CapacityEstimator } from '../../engine/scenarios/CapacityEstimator';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import { showSuccessAlert } from '../../utils/alerts';

interface CapacityEstimatorCalculatorProps {
  scenarioId: ScenarioId;
  initialParams: CapacityParameters;
  onParamsChange?: (params: CapacityParameters) => void;
}

export const CapacityEstimatorCalculator: React.FC<CapacityEstimatorCalculatorProps> = ({
  scenarioId,
  initialParams,
  onParamsChange,
}) => {
  const [params, setParams] = useState<CapacityParameters>(initialParams);

  const estimate = CapacityEstimator.calculate(params);

  const updateParam = <K extends keyof CapacityParameters>(key: K, value: CapacityParameters[K]) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    if (onParamsChange) {
      onParamsChange(updated);
    }
  };

  const handleResetDefaults = async () => {
    const def = CapacityEstimator.getDefaultParameters(scenarioId);
    setParams(def);
    if (onParamsChange) onParamsChange(def);
    await showSuccessAlert(
      'Defaults Restored',
      'Restored canonical napkin-math estimations for this scenario.'
    );
  };

  return (
    <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-[#e0e1dd]">
            Back-of-the-Envelope Capacity Estimator
          </span>
        </div>
        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 text-xs text-[#778da9] hover:text-[#e0e1dd] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* Calculated Results Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Read QPS / Peak QPS</div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-1">
            {estimate.readQps.toLocaleString()} / <span className="text-amber-400">{estimate.peakQps.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">Peak {estimate.peakQpsMultiplier}x Multiplier</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Write Ingestion QPS</div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {estimate.writeQps.toLocaleString()} QPS
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">{(estimate.writesPerDay / 1e6).toFixed(1)}M writes/day</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">5-Year Storage Capacity</div>
          <div className="text-base font-bold font-mono text-amber-300 mt-1">
            {estimate.storageFiveYearsTb} TB
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">{estimate.storagePerDayGb} GB / day written</div>
        </div>

        <div className="p-3 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Memory Cache (80/20 RAM)</div>
          <div className="text-base font-bold font-mono text-purple-400 mt-1">
            {estimate.cacheMemoryRequiredGb} GB
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">Egress: {estimate.egressBandwidthGbps} Gbps</div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[#778da9]">Daily Active Users (DAU)</span>
            <span className="text-cyan-400 font-bold">{(params.dailyActiveUsers / 1e6).toFixed(0)}M</span>
          </div>
          <input
            type="range"
            min="10000000"
            max="1000000000"
            step="10000000"
            value={params.dailyActiveUsers}
            onChange={(e) => updateParam('dailyActiveUsers', Number(e.target.value))}
            className="w-full h-1 bg-[#415a77] rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div className="p-2.5 rounded-lg bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[#778da9]">Writes / User / Day</span>
            <span className="text-emerald-400 font-bold">{params.writesPerUserPerDay}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="200"
            step="0.5"
            value={params.writesPerUserPerDay}
            onChange={(e) => updateParam('writesPerUserPerDay', Number(e.target.value))}
            className="w-full h-1 bg-[#415a77] rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        <div className="p-2.5 rounded-lg bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[#778da9]">Reads / User / Day</span>
            <span className="text-cyan-400 font-bold">{params.readsPerUserPerDay}</span>
          </div>
          <input
            type="range"
            min="1"
            max="1500"
            step="5"
            value={params.readsPerUserPerDay}
            onChange={(e) => updateParam('readsPerUserPerDay', Number(e.target.value))}
            className="w-full h-1 bg-[#415a77] rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};
