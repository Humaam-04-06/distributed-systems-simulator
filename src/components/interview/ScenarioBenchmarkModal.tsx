import React, { useState } from 'react';
import {
  Zap,
  Clock,
  ShieldCheck,
  ShieldAlert,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import {
  ScenarioBenchmarkRunner,
  ScenarioBenchmarkReport,
} from '../../engine/scenarios/ScenarioBenchmarkRunner';
import { showSuccessAlert } from '../../utils/alerts';

interface ScenarioBenchmarkModalProps {
  isOpen: boolean;
  scenarioId: ScenarioId;
  onClose: () => void;
}

export const ScenarioBenchmarkModal: React.FC<ScenarioBenchmarkModalProps> = ({
  isOpen,
  scenarioId,
  onClose,
}) => {
  const [durationSec, setDurationSec] = useState(2);
  const [targetQps, setTargetQps] = useState(10000);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [report, setReport] = useState<ScenarioBenchmarkReport | null>(null);

  if (!isOpen) return null;

  const handleRun = () => {
    setIsBenchmarking(true);
    setTimeout(async () => {
      const result = ScenarioBenchmarkRunner.runBenchmark({
        scenarioId,
        durationSeconds: durationSec,
        targetQps,
        simulatedConcurrency: 24,
      });
      setReport(result);
      setIsBenchmarking(false);

      if (result.slaCompliant) {
        await showSuccessAlert(
          'SLA Benchmark Passed!',
          `Achieved ${result.availabilityPercentage}% availability and P99 latency of ${result.p99LatencyMs}ms.`
        );
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1b263b] border border-[#415a77] shadow-2xl p-6 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-[#e0e1dd]">
              Automated Scenario Stress Benchmark
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0d1b2a] border border-[#415a77]/60 text-xs">
          <div>
            <label className="block text-[#778da9] mb-1 font-semibold">
              Benchmark Duration (Seconds)
            </label>
            <select
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[#1b263b] border border-[#415a77] text-[#e0e1dd] font-mono cursor-pointer"
            >
              <option value={1}>1 Second (Quick Burst)</option>
              <option value={2}>2 Seconds (Standard)</option>
              <option value={5}>5 Seconds (Stress Test)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#778da9] mb-1 font-semibold">
              Target Concurrency QPS
            </label>
            <select
              value={targetQps}
              onChange={(e) => setTargetQps(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[#1b263b] border border-[#415a77] text-[#e0e1dd] font-mono cursor-pointer"
            >
              <option value={5000}>5,000 QPS (Nominal)</option>
              <option value={10000}>10,000 QPS (High Load)</option>
              <option value={25000}>25,000 QPS (Peak Spike)</option>
              <option value={50000}>50,000 QPS (Extreme Stress)</option>
            </select>
          </div>
        </div>

        {/* Run Button */}
        <div className="flex justify-end">
          <button
            onClick={handleRun}
            disabled={isBenchmarking}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
              isBenchmarking
                ? 'bg-cyan-800 opacity-60 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/50'
            }`}
          >
            {isBenchmarking ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isBenchmarking ? 'Simulating Workload...' : 'Execute Stress Benchmark'}
          </button>
        </div>

        {/* Results Display */}
        {report && (
          <div className="p-5 rounded-2xl bg-[#0d1b2a] border border-[#415a77]/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
              <span className="text-xs font-mono uppercase text-[#778da9]">
                Benchmark Results: {report.scenarioId}
              </span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  report.slaCompliant
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {report.slaCompliant ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                {report.slaCompliant ? 'SLA COMPLIANT' : 'SLA BREACHED'}
              </div>
            </div>

            {/* Percentiles Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#1b263b] border border-[#415a77]/40">
                <span className="text-[10px] text-[#778da9] block">P50 Latency</span>
                <span className="text-base font-bold text-emerald-400">
                  {report.p50LatencyMs} ms
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1b263b] border border-[#415a77]/40">
                <span className="text-[10px] text-[#778da9] block">P90 Latency</span>
                <span className="text-base font-bold text-cyan-400">
                  {report.p90LatencyMs} ms
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1b263b] border border-[#415a77]/40">
                <span className="text-[10px] text-[#778da9] block">P99 Latency</span>
                <span className="text-base font-bold text-amber-400">
                  {report.p99LatencyMs} ms
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1b263b] border border-[#415a77]/40">
                <span className="text-[10px] text-[#778da9] block">Availability</span>
                <span className="text-base font-bold text-emerald-400">
                  {report.availabilityPercentage}%
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]/60 text-xs">
              <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Bottleneck Analysis
              </div>
              <p className="text-[#e0e1dd] leading-relaxed">{report.bottleneckSummary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
