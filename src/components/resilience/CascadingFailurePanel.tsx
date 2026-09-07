import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Repeat,
  RotateCcw,
  Sparkles,
  Info,
  Flame,
} from 'lucide-react';
import { CircuitBreakerMetrics } from '../../engine/CircuitBreakerManager';
import { RetryMetrics, BackoffStrategy } from '../../engine/RetryEngine';
import { FallbackMetrics, FallbackStrategy } from '../../engine/FallbackManager';
import { showInfoAlert, showWarningAlert } from '../../utils/alerts';

interface CascadingFailurePanelProps {
  cbMetrics: CircuitBreakerMetrics;
  retryMetrics: RetryMetrics;
  fallbackMetrics: FallbackMetrics;
  circuitBreakerEnabled: boolean;
  onToggleCircuitBreaker: () => void;
  onSetRetryStrategy: (strategy: BackoffStrategy) => void;
  onSetFallbackStrategy: (strategy: FallbackStrategy) => void;
  onTriggerCascadingFailure: () => void;
  onResetResilience: () => void;
  onOpenCircuitModal: () => void;
}

export const CascadingFailurePanel: React.FC<CascadingFailurePanelProps> = ({
  cbMetrics,
  retryMetrics,
  fallbackMetrics,
  circuitBreakerEnabled,
  onToggleCircuitBreaker,
  onSetRetryStrategy,
  onSetFallbackStrategy,
  onTriggerCascadingFailure,
  onResetResilience,
  onOpenCircuitModal,
}) => {
  const handleStrategyChange = async (strategy: BackoffStrategy) => {
    onSetRetryStrategy(strategy);
    await showInfoAlert(
      `Retry Strategy: ${strategy.replace('_', ' ').toUpperCase()}`,
      strategy === 'full_jitter'
        ? 'AWS Full Jitter: Spreads retries uniformly across the sleep interval, preventing synchronized thundering herds.'
        : strategy === 'decorrelated_jitter'
        ? 'Decorrelated Jitter: Dynamically computes random sleep based on last delay to prevent clustered retries.'
        : strategy === 'exponential'
        ? 'Standard Exponential Backoff: Doubles sleep delay on each attempt (2^attempt * base).'
        : 'Linear Backoff: Increases sleep delay uniformly on each attempt.'
    );
  };

  const handleFallbackChange = async (strategy: FallbackStrategy) => {
    onSetFallbackStrategy(strategy);
    await showInfoAlert(
      `Fallback Strategy: ${strategy.replace('_', ' ').toUpperCase()}`,
      strategy === 'stale_cache'
        ? 'Stale Cache: Serves expired in-memory snapshots while downstream service recovers.'
        : strategy === 'mock_default'
        ? 'Mock Default: Returns static deterministic response payload with zero downstream load.'
        : strategy === 'read_only_degraded'
        ? 'Read-Only Mode: Fulfills reads in degraded state while safely rejecting write mutations.'
        : strategy === 'fail_silent'
        ? 'Fail Silent: Suppresses error notifications and returns empty datasets.'
        : 'Fail Fast: Returns immediate HTTP 503 with Retry-After header in < 2ms.'
    );
  };

  const handleTriggerCascadeClick = async () => {
    onTriggerCascadingFailure();
    await showWarningAlert(
      'Cascading Failure Initiated!',
      circuitBreakerEnabled
        ? 'Circuit Breakers detected the failure cascade and isolated the blast radius! Failsafe protection is active.'
        : 'WARNING: Circuit Breakers are disabled! Downstream failures are cascading uncontrollably across all nodes!'
    );
  };

  const cbStateColor =
    cbMetrics.state === 'closed'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : cbMetrics.state === 'open'
      ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
      : 'text-amber-400 border-amber-500/30 bg-amber-500/10';

  return (
    <div className="rounded-xl border border-[#415a77] bg-[#0d1b2a] p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#415a77]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#e0e1dd]">
                Resilience & Cascading Failure Defense
              </h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold uppercase ${cbStateColor}`}
              >
                {cbMetrics.state.replace('_', '-')}
              </span>
            </div>
            <p className="text-xs text-[#778da9]">
              Netflix Hystrix Circuit Breakers, AWS Backoff Jitter & Graceful Fallbacks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCircuitModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1b263b] text-cyan-300 border border-[#415a77] hover:bg-[#415a77] hover:text-[#e0e1dd] transition"
          >
            <Zap className="w-3.5 h-3.5" />
            Hystrix Console
          </button>
          <button
            onClick={onToggleCircuitBreaker}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              circuitBreakerEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {circuitBreakerEnabled ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            {circuitBreakerEnabled ? 'Breaker Armed' : 'Breaker Bypassed'}
          </button>
        </div>
      </div>

      {/* Top 4 Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Breaker Trips</span>
          <span className="text-lg font-bold font-mono text-rose-400">
            {cbMetrics.trippedCount}
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            Error: {cbMetrics.failureRatePercentage}%
          </span>
        </div>

        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Retries Executed</span>
          <span className="text-lg font-bold font-mono text-amber-300">
            {retryMetrics.totalRetryAttempts}
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            Avg Delay: {retryMetrics.averageDelayMs}ms
          </span>
        </div>

        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Fallbacks Served</span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {fallbackMetrics.totalFallbacksServed}
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            Stale Cache: {fallbackMetrics.staleCacheServed}
          </span>
        </div>

        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Blast Radius</span>
          <span
            className={`text-lg font-bold font-mono ${
              circuitBreakerEnabled ? 'text-emerald-400' : 'text-rose-500 animate-pulse'
            }`}
          >
            {circuitBreakerEnabled ? 'ISOLATED' : 'UNCONTAINED'}
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            {circuitBreakerEnabled ? 'Fast-fail active' : 'Overload cascade'}
          </span>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retry & Jitter Strategy Selector */}
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#415a77]">
            <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-amber-300" />
              Exponential Backoff & Jitter Strategy
            </span>
            <span className="text-[10px] text-[#778da9] font-mono">
              AWS Jitter Spec
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['full_jitter', 'Full Jitter (AWS)'],
                ['decorrelated_jitter', 'Decorrelated Jitter'],
                ['exponential', 'Exponential Backoff'],
                ['linear', 'Linear Backoff'],
              ] as const
            ).map(([stratKey, label]) => (
              <button
                key={stratKey}
                onClick={() => handleStrategyChange(stratKey)}
                className={`p-2.5 rounded-lg text-left text-xs transition border ${
                  retryMetrics.strategy === stratKey
                    ? 'bg-[#415a77] border-cyan-400/50 text-[#e0e1dd] font-semibold'
                    : 'bg-[#0d1b2a] border-[#415a77]/60 text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-[10px] opacity-75 mt-0.5">
                  {stratKey === 'full_jitter'
                    ? 'Uniform dispersion'
                    : stratKey === 'decorrelated_jitter'
                    ? 'Dynamic window'
                    : stratKey === 'exponential'
                    ? 'Deterministic 2^N'
                    : 'Fixed increments'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fallback Graceful Degradation Strategy Selector */}
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#415a77]">
            <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Graceful Fallback Strategy
            </span>
            <span className="text-[10px] text-[#778da9] font-mono">
              Degraded Mode
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['stale_cache', 'Stale In-Memory Cache'],
                ['mock_default', 'Mock Default Stub'],
                ['read_only_degraded', 'Read-Only Mode'],
                ['fail_fast', 'Fail-Fast (HTTP 503)'],
              ] as const
            ).map(([stratKey, label]) => (
              <button
                key={stratKey}
                onClick={() => handleFallbackChange(stratKey)}
                className={`p-2.5 rounded-lg text-left text-xs transition border ${
                  fallbackMetrics.strategy === stratKey
                    ? 'bg-[#415a77] border-cyan-400/50 text-[#e0e1dd] font-semibold'
                    : 'bg-[#0d1b2a] border-[#415a77]/60 text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-[10px] opacity-75 mt-0.5">
                  {stratKey === 'stale_cache'
                    ? 'Serve cached snapshot'
                    : stratKey === 'mock_default'
                    ? 'Return static stub'
                    : stratKey === 'read_only_degraded'
                    ? 'Reads OK, writes 503'
                    : 'Immediate failsafe reject'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulator Blast Radius Demo Box */}
      <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#e0e1dd]">
            <Info className="w-4 h-4 text-cyan-300" />
            Cascading Outage & Domino-Effect Simulation
          </div>
          <p className="text-xs text-[#778da9] max-w-xl">
            Inject a localized failure surge. With Circuit Breakers active, failed calls are fast-failed
            or degraded to protect the remaining fleet. Without them, traffic stampedes and crashes
            every surviving server node!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerCascadeClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition shadow-lg shadow-rose-500/10"
          >
            <Flame className="w-4 h-4" />
            Inject Cascading Surge
          </button>
          <button
            onClick={onResetResilience}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#415a77] text-[#e0e1dd] hover:bg-[#778da9] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
