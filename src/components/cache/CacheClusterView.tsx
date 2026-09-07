import React from 'react';
import {
  Radio,
  Flame,
  ShieldCheck,
  RotateCcw,
  Percent,
  HardDrive,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  CacheMetrics,
  CacheEntry,
  EvictionPolicy,
} from '../../engine/CacheEvictionEngine';
import { StampedeEvent } from '../../engine/CacheStampedeSimulator';
import { StampedeMitigationStrategy } from '../../engine/CacheMitigationManager';
import { CacheKeyInspector } from './CacheKeyInspector';
import { showInfoAlert, showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface CacheClusterViewProps {
  metrics: CacheMetrics;
  policy: EvictionPolicy;
  mitigationStrategy: StampedeMitigationStrategy;
  isStampedeActive: boolean;
  activeStampede: StampedeEvent | null;
  entries: CacheEntry[];
  cacheEnabled: boolean;
  onToggleCacheEnabled: () => void;
  onSetPolicy: (policy: EvictionPolicy) => void;
  onSetMitigationStrategy: (strategy: StampedeMitigationStrategy) => void;
  onTriggerStampede: (key?: string) => void;
  onInvalidateKey: (key: string) => void;
  onClearCache: () => void;
}

export const CacheClusterView: React.FC<CacheClusterViewProps> = ({
  metrics,
  policy,
  mitigationStrategy,
  isStampedeActive,
  activeStampede,
  entries,
  cacheEnabled,
  onToggleCacheEnabled,
  onSetPolicy,
  onSetMitigationStrategy,
  onTriggerStampede,
  onInvalidateKey,
  onClearCache,
}) => {
  const handlePolicyChange = async (newPolicy: EvictionPolicy) => {
    onSetPolicy(newPolicy);
    await showInfoAlert(
      `Eviction Policy: ${newPolicy.toUpperCase()}`,
      newPolicy === 'lru'
        ? 'Least Recently Used (LRU): Discards items not accessed for the longest duration.'
        : newPolicy === 'lfu'
        ? 'Least Frequently Used (LFU): Discards items with lowest access counts.'
        : 'First-In First-Out (FIFO): Discards the oldest inserted items regardless of usage.'
    );
  };

  const handleMitigationChange = async (newStrategy: StampedeMitigationStrategy) => {
    onSetMitigationStrategy(newStrategy);
    await showInfoAlert(
      `Stampede Mitigation: ${newStrategy.toUpperCase()}`,
      newStrategy === 'xfetch'
        ? 'XFetch Active: Probabilistically recomputes hot keys before actual expiration based on compute delta & read volume.'
        : newStrategy === 'mutex'
        ? 'Mutex Single-Flight Active: Only one worker acquires lock to recompute expired key from DB; others wait.'
        : 'Mitigation Disabled: Expired hot keys will cause thundering herd DB spikes!'
    );
  };

  const handleTriggerStampedeClick = async () => {
    onTriggerStampede();
    await showWarningAlert(
      'Thundering Herd Triggered!',
      'Hot key expired! Hundreds of concurrent requests are storming the Primary Database directly.'
    );
  };

  const handleClearCacheClick = async () => {
    onClearCache();
    await showSuccessAlert(
      'Cache Flushed',
      'All cached items in Redis storage have been purged.'
    );
  };

  return (
    <div className="rounded-xl border border-[#415a77] bg-[#0d1b2a] p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#415a77]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#e0e1dd] tracking-tight flex items-center gap-2">
              Redis Distributed Caching Layer
              <button
                onClick={onToggleCacheEnabled}
                title="Toggle Cache Layer (Active / Bypassed)"
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono border transition-all ${
                  cacheEnabled
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                }`}
              >
                {cacheEnabled ? 'CACHE ACTIVE' : 'BYPASSED'}
              </button>
            </h2>
            <p className="text-xs text-[#778da9]">
              In-memory caching with eviction policies, hot-key management & XFetch stampede prevention
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Eviction Policy */}
          <div className="flex items-center space-x-1 bg-[#1b263b] p-1 rounded-lg border border-[#415a77]">
            <span className="text-[11px] font-semibold text-[#778da9] px-2 uppercase tracking-wider">
              Policy:
            </span>
            {(['lru', 'lfu', 'fifo'] as EvictionPolicy[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePolicyChange(p)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all uppercase ${
                  policy === p
                    ? 'bg-[#415a77] text-[#e0e1dd] font-semibold shadow-sm'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Mitigation Strategy */}
          <div className="flex items-center space-x-1 bg-[#1b263b] p-1 rounded-lg border border-[#415a77]">
            <span className="text-[11px] font-semibold text-[#778da9] px-2 uppercase tracking-wider">
              Mitigation:
            </span>
            {(['none', 'mutex', 'xfetch'] as StampedeMitigationStrategy[]).map((m) => (
              <button
                key={m}
                onClick={() => handleMitigationChange(m)}
                className={`text-xs px-2 py-1 rounded font-medium transition-all uppercase ${
                  mitigationStrategy === m
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Stampede Trigger */}
          <button
            onClick={handleTriggerStampedeClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Stampede</span>
          </button>

          {/* Flush Cache */}
          <button
            onClick={handleClearCacheClick}
            title="Flush all keys"
            className="p-1.5 rounded-lg bg-[#1b263b] text-[#778da9] hover:text-rose-400 hover:bg-[#0d1b2a] border border-[#415a77] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stampede Alert Banner */}
      {isStampedeActive && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/60 text-xs text-rose-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-rose-300">CACHE STAMPEDE IN PROGRESS:</span>{' '}
              Hot key "{activeStampede?.targetKey ?? 'leaderboard:top10'}" expired!{' '}
              {activeStampede?.surgeRequestCount ?? 850} concurrent reads storming DB (
              {activeStampede?.dbPressureMultiplier ?? 8.5}x load surge).
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-rose-300 bg-rose-900/50 px-2 py-1 rounded border border-rose-700/50">
            +{activeStampede?.peakLatencyMs ?? 480}ms LATENCY SPIKE
          </span>
        </div>
      )}

      {/* Telemetry Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Hit Ratio */}
        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]">
          <div className="text-[11px] font-medium text-[#778da9] flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            Hit Ratio
          </div>
          <div className="text-xl font-mono font-bold text-emerald-300 mt-1">
            {metrics.hitRatioPercentage}%
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">
            {metrics.hitCount} hits / {metrics.missCount} misses
          </div>
        </div>

        {/* Memory Footprint */}
        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]">
          <div className="text-[11px] font-medium text-[#778da9] flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            Memory Usage
          </div>
          <div className="text-xl font-mono font-bold text-[#e0e1dd] mt-1">
            {(metrics.memoryUsedBytes / 1024).toFixed(1)}{' '}
            <span className="text-xs text-[#778da9]">KB</span>
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">
            Cap: {(metrics.maxMemoryBytes / 1024).toFixed(0)} KB
          </div>
        </div>

        {/* Key Capacity */}
        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]">
          <div className="text-[11px] font-medium text-[#778da9] flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Active Keys
          </div>
          <div className="text-xl font-mono font-bold text-cyan-300 mt-1">
            {metrics.totalEntries} / {metrics.maxEntries}
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">
            {metrics.evictionCount} total evictions
          </div>
        </div>

        {/* Mitigation Status */}
        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]">
          <div className="text-[11px] font-medium text-[#778da9] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Stampede Shield
          </div>
          <div className="text-base font-mono font-bold text-amber-300 uppercase mt-1 truncate">
            {mitigationStrategy}
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">
            {mitigationStrategy === 'none' ? 'Vulnerable to Herd' : 'Protected'}
          </div>
        </div>
      </div>

      {/* Embedded Key Store Inspector */}
      <CacheKeyInspector
        entries={entries}
        onInvalidateKey={onInvalidateKey}
        onTriggerStampede={onTriggerStampede}
      />
    </div>
  );
};
