import React from 'react';
import {
  Key,
  Flame,
  Clock,
  Activity,
  Trash2,
  HardDrive,
  Zap,
} from 'lucide-react';
import { CacheEntry } from '../../engine/CacheEvictionEngine';
import { showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface CacheKeyInspectorProps {
  entries: CacheEntry[];
  onInvalidateKey: (key: string) => void;
  onTriggerStampede: (key: string) => void;
}

export const CacheKeyInspector: React.FC<CacheKeyInspectorProps> = ({
  entries,
  onInvalidateKey,
  onTriggerStampede,
}) => {
  const handleInvalidate = async (key: string) => {
    onInvalidateKey(key);
    await showSuccessAlert(
      'Cache Key Purged',
      `Key "${key}" was evicted from Redis storage. Subsequent lookups will result in cache misses.`
    );
  };

  const handleStampede = async (key: string) => {
    onTriggerStampede(key);
    await showWarningAlert(
      'Cache Stampede Triggered!',
      `Hot key "${key}" expired! Hundreds of concurrent requests are storming the Primary Database directly.`
    );
  };

  return (
    <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#e0e1dd]">
              Live In-Memory Key Store
            </h3>
            <p className="text-[11px] text-[#778da9]">
              Inspecting {entries.length} active key-value entries in cache
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#778da9] italic bg-[#0d1b2a] rounded-lg border border-[#415a77]/40">
            Cache is empty. Issue read requests to populate entries.
          </div>
        ) : (
          entries.map((entry) => {
            return (
              <div
                key={entry.key}
                className={`p-2.5 rounded-lg border transition-all ${
                  entry.isHotKey
                    ? 'bg-[#0d1b2a] border-amber-500/50 shadow-sm'
                    : 'bg-[#0d1b2a] border-[#415a77]/50 hover:border-[#778da9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-[#e0e1dd]">
                      {entry.key}
                    </span>
                    {entry.isHotKey && (
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Flame className="w-2.5 h-2.5" />
                        <span>HOT KEY</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5">
                    {entry.isHotKey && (
                      <button
                        onClick={() => handleStampede(entry.key)}
                        title="Simulate Stampede on this key"
                        className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-colors"
                      >
                        <Zap className="w-3 h-3 text-rose-400" />
                        <span>Stampede</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleInvalidate(entry.key)}
                      title="Invalidate / Purge"
                      className="p-1 rounded text-[#778da9] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#778da9] truncate mt-1 bg-[#1b263b]/60 px-2 py-0.5 rounded">
                  {entry.value}
                </div>

                {/* Telemetry Row */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#415a77]/30 text-[10px] font-mono text-[#778da9]">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      Hits: <strong className="text-[#e0e1dd]">{entry.accessCount}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-indigo-400" />
                      {entry.sizeBytes} B
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#778da9]">
                    <Clock className="w-3 h-3 text-amber-400" />
                    TTL: <strong className="text-[#e0e1dd]">{(entry.ttlMs / 1000).toFixed(0)}s</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
