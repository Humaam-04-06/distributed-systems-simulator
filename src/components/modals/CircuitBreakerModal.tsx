import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  ZapOff,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { CircuitBreakerMetrics, CircuitBreakerConfig } from '../../engine/CircuitBreakerManager';
import { showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface CircuitBreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CircuitBreakerMetrics;
  config: CircuitBreakerConfig;
  enabled: boolean;
  onToggleEnabled: () => void;
  onUpdateConfig: (config: Partial<CircuitBreakerConfig>) => void;
  onForceTrip: () => void;
  onForceReset: () => void;
}

export const CircuitBreakerModal: React.FC<CircuitBreakerModalProps> = ({
  isOpen,
  onClose,
  metrics,
  config,
  enabled,
  onToggleEnabled,
  onUpdateConfig,
  onForceTrip,
  onForceReset,
}) => {
  if (!isOpen) return null;

  const handleTripClick = async () => {
    onForceTrip();
    await showWarningAlert(
      'Circuit Breaker Tripped',
      'Forced circuit state to OPEN. Downstream calls are now blocked to prevent cascade collapse.'
    );
  };

  const handleResetClick = async () => {
    onForceReset();
    await showSuccessAlert(
      'Circuit Breaker Reset',
      'Circuit reset to CLOSED. Normal traffic forwarding resumed.'
    );
  };

  const stateColor =
    metrics.state === 'closed'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : metrics.state === 'open'
      ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
      : 'text-amber-400 border-amber-500/30 bg-amber-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0d1b2a] border border-[#415a77] shadow-2xl p-6 text-[#e0e1dd] space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#415a77]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#e0e1dd] flex items-center gap-2">
                Hystrix Circuit Breaker Console
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold uppercase ${stateColor}`}
                >
                  {metrics.state.replace('_', '-')}
                </span>
              </h2>
              <p className="text-xs text-[#778da9]">
                Netflix Hystrix tri-state machine & fault containment mechanism
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#1b263b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Machine SVG Diagram */}
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-5 flex flex-col items-center">
          <span className="text-xs font-semibold text-[#778da9] uppercase tracking-wider mb-3">
            Live Tri-State Transition Topology
          </span>
          <div className="w-full max-w-md relative flex items-center justify-between py-4">
            {/* CLOSED Node */}
            <div
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                metrics.state === 'closed'
                  ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'border-[#415a77] bg-[#0d1b2a] opacity-60'
              }`}
            >
              <ShieldCheck
                className={`w-6 h-6 ${
                  metrics.state === 'closed' ? 'text-emerald-400' : 'text-[#778da9]'
                }`}
              />
              <span className="text-xs font-bold font-mono mt-1 text-[#e0e1dd]">CLOSED</span>
              <span className="text-[10px] text-[#778da9]">Healthy Flow</span>
            </div>

            {/* Connecting Arrow */}
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[9px] text-rose-400 font-mono text-center">
                errors &gt; {config.failureThresholdPercentage}%
              </span>
              <div className="w-full h-0.5 bg-[#415a77] my-1 relative">
                <div
                  className={`h-full ${
                    metrics.state === 'open' ? 'bg-rose-500 animate-pulse' : 'bg-[#415a77]'
                  }`}
                />
              </div>
              <span className="text-[9px] text-emerald-400 font-mono text-center">
                canary passed
              </span>
            </div>

            {/* OPEN Node */}
            <div
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                metrics.state === 'open'
                  ? 'border-rose-500 bg-rose-500/20 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/40 animate-pulse'
                  : 'border-[#415a77] bg-[#0d1b2a] opacity-60'
              }`}
            >
              <ZapOff
                className={`w-6 h-6 ${
                  metrics.state === 'open' ? 'text-rose-400' : 'text-[#778da9]'
                }`}
              />
              <span className="text-xs font-bold font-mono mt-1 text-[#e0e1dd]">OPEN</span>
              <span className="text-[10px] text-[#778da9]">Failsafe Block</span>
            </div>

            {/* Connecting Arrow */}
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[9px] text-amber-400 font-mono text-center">
                sleep {config.sleepWindowMs / 1000}s
              </span>
              <div className="w-full h-0.5 bg-[#415a77] my-1 relative">
                <div
                  className={`h-full ${
                    metrics.state === 'half_open' ? 'bg-amber-400 animate-pulse' : 'bg-[#415a77]'
                  }`}
                />
              </div>
              <span className="text-[9px] text-rose-400 font-mono text-center">
                probe failed
              </span>
            </div>

            {/* HALF-OPEN Node */}
            <div
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                metrics.state === 'half_open'
                  ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40'
                  : 'border-[#415a77] bg-[#0d1b2a] opacity-60'
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${
                  metrics.state === 'half_open' ? 'text-amber-400' : 'text-[#778da9]'
                }`}
              />
              <span className="text-xs font-bold font-mono mt-1 text-[#e0e1dd]">HALF-OPEN</span>
              <span className="text-[10px] text-[#778da9]">Canary Trial</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Meters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3 text-center">
            <span className="text-[11px] text-[#778da9] block">Rolling Error Rate</span>
            <span className="text-lg font-bold font-mono text-rose-400">
              {metrics.failureRatePercentage}%
            </span>
          </div>
          <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3 text-center">
            <span className="text-[11px] text-[#778da9] block">Consecutive Fails</span>
            <span className="text-lg font-bold font-mono text-amber-300">
              {metrics.consecutiveFailures} / {config.consecutiveFailureThreshold}
            </span>
          </div>
          <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3 text-center">
            <span className="text-[11px] text-[#778da9] block">Canary Successes</span>
            <span className="text-lg font-bold font-mono text-cyan-300">
              {metrics.consecutiveSuccesses} / {metrics.canaryMax}
            </span>
          </div>
          <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3 text-center">
            <span className="text-[11px] text-[#778da9] block">Total Trips</span>
            <span className="text-lg font-bold font-mono text-[#e0e1dd]">
              {metrics.trippedCount}
            </span>
          </div>
        </div>

        {/* Configuration Sliders */}
        <div className="space-y-4 rounded-xl border border-[#415a77] bg-[#1b263b] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#e0e1dd] uppercase tracking-wider pb-2 border-b border-[#415a77]">
            <Sliders className="w-4 h-4 text-[#778da9]" />
            Trip Thresholds & Sleep Configuration
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-[#778da9] mb-1">
                <span>Failure Rate Trip Threshold</span>
                <span className="font-mono text-rose-400 font-semibold">
                  {config.failureThresholdPercentage}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={90}
                step={5}
                value={config.failureThresholdPercentage}
                onChange={(e) =>
                  onUpdateConfig({ failureThresholdPercentage: Number(e.target.value) })
                }
                className="w-full accent-rose-500 bg-[#0d1b2a]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#778da9] mb-1">
                <span>Sleep Window (OPEN state timeout)</span>
                <span className="font-mono text-amber-300 font-semibold">
                  {config.sleepWindowMs} ms
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={config.sleepWindowMs}
                onChange={(e) => onUpdateConfig({ sleepWindowMs: Number(e.target.value) })}
                className="w-full accent-amber-400 bg-[#0d1b2a]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#778da9] mb-1">
                <span>Canary Successes to Recover</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {config.halfOpenMaxSuccesses} requests
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={config.halfOpenMaxSuccesses}
                onChange={(e) =>
                  onUpdateConfig({ halfOpenMaxSuccesses: Number(e.target.value) })
                }
                className="w-full accent-cyan-400 bg-[#0d1b2a]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={onToggleEnabled}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              enabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Circuit Breaker {enabled ? 'Active (Protected)' : 'Bypassed'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTripClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition"
            >
              <Flame className="w-4 h-4" />
              Force Trip (OPEN)
            </button>
            <button
              onClick={handleResetClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#415a77] text-[#e0e1dd] hover:bg-[#778da9] transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset (CLOSED)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
