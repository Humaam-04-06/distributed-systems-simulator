import React from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  RefreshCw,
  XCircle,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { ServerNodeState } from '../../engine/types';
import { ServerResources } from '../../engine/ServerResourceManager';
import { DetailedServerMode } from '../../engine/ServerStateMachine';
import { showWarningAlert, showSuccessAlert, showInfoAlert } from '../../utils/alerts';

interface ServerNodeCardProps {
  server: ServerNodeState;
  resources: ServerResources;
  detailedMode: DetailedServerMode;
  watchdogEnabled: boolean;
  watchdogProgress: {
    isPending: boolean;
    remainingMs: number;
    totalDelayMs: number;
    progressFraction: number;
  } | null;
  onModeChange: (serverId: string, mode: DetailedServerMode) => void;
  onWatchdogToggle: (serverId: string, enabled: boolean) => void;
  onManualRestart: (serverId: string) => void;
}

export const ServerNodeCard: React.FC<ServerNodeCardProps> = ({
  server,
  resources,
  detailedMode,
  watchdogEnabled,
  watchdogProgress,
  onModeChange,
  onWatchdogToggle,
  onManualRestart,
}) => {
  const getBadgeStyle = () => {
    switch (detailedMode) {
      case 'healthy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'degraded':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'flapping':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse';
      case 'oom_crash':
        return 'bg-red-600/20 text-red-400 border-red-500/40';
      case 'crashed':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const getCpuColor = (cpu: number) => {
    if (cpu >= 85) return 'bg-rose-500';
    if (cpu >= 60) return 'bg-amber-500';
    return 'bg-cyan-400';
  };

  const getRamColor = (used: number, max: number) => {
    const pct = (used / max) * 100;
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-indigo-400';
  };

  const handleCrashAction = async () => {
    onModeChange(server.id, 'crashed');
    await showWarningAlert(
      `${server.name} Crashed!`,
      `Node was forcefully terminated. In-flight requests will be dropped with HTTP 500/504 errors.`
    );
  };

  const handleOomAction = async () => {
    onModeChange(server.id, 'oom_crash');
    await showWarningAlert(
      `OOM Killer Triggered!`,
      `Linux Out-Of-Memory killer invoked on ${server.name}. Memory threshold exceeded (>512MB).`
    );
  };

  const handleRecoverAction = async () => {
    onModeChange(server.id, 'healthy');
    onManualRestart(server.id);
    await showSuccessAlert(
      `${server.name} Restored`,
      `Worker node has re-joined the cluster pool in healthy rotation.`
    );
  };

  const isDead = detailedMode === 'crashed' || detailedMode === 'oom_crash';

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-4 transition-all duration-300 bg-[#1b263b] ${
        isDead
          ? 'border-rose-500/40 shadow-lg shadow-rose-950/20 opacity-80'
          : detailedMode === 'degraded'
          ? 'border-amber-500/40 shadow-md shadow-amber-950/10'
          : detailedMode === 'flapping'
          ? 'border-purple-500/40 shadow-md shadow-purple-950/10'
          : 'border-[#415a77] hover:border-cyan-500/50 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
        <div className="flex items-center space-x-2.5">
          <div
            className={`p-2 rounded-lg ${
              isDead
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-cyan-500/10 text-cyan-400'
            }`}
          >
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#e0e1dd] tracking-wide">
                {server.name}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1b2a] text-[#778da9]">
                {server.id}
              </span>
            </div>
            <p className="text-[11px] text-[#778da9]">
              Active Connections: <span className="text-[#e0e1dd] font-medium">{server.activeConnections}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-1.5">
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${getBadgeStyle()}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                isDead
                  ? 'bg-rose-400'
                  : detailedMode === 'degraded'
                  ? 'bg-amber-400'
                  : detailedMode === 'flapping'
                  ? 'bg-purple-400 animate-ping'
                  : 'bg-emerald-400'
              }`}
            />
            {detailedMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Watchdog Countdown Overlay (if crashed & watchdog active) */}
      {watchdogProgress && watchdogProgress.isPending && (
        <div className="mt-3 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-indigo-300 font-medium flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Watchdog Auto-Restart
            </span>
            <span className="text-indigo-200 font-mono text-[11px]">
              {(watchdogProgress.remainingMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="w-full bg-[#0d1b2a] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full transition-all duration-100"
              style={{ width: `${watchdogProgress.progressFraction * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Resource Utilization Meters */}
      <div className="mt-3.5 space-y-2.5">
        {/* CPU */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#778da9] flex items-center gap-1 font-medium">
              <Cpu className="w-3.5 h-3.5" /> CPU Utilization
            </span>
            <span className="text-[#e0e1dd] font-mono text-[11px]">
              {isDead ? '0%' : `${resources.cpuUsagePercentage}%`}
            </span>
          </div>
          <div className="w-full bg-[#0d1b2a] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getCpuColor(
                resources.cpuUsagePercentage
              )}`}
              style={{ width: `${isDead ? 0 : resources.cpuUsagePercentage}%` }}
            />
          </div>
        </div>

        {/* Memory / RAM */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#778da9] flex items-center gap-1 font-medium">
              <HardDrive className="w-3.5 h-3.5" /> Memory (RAM)
            </span>
            <span className="text-[#e0e1dd] font-mono text-[11px]">
              {isDead ? '0 MB' : `${resources.memoryUsedMb} / ${resources.maxMemoryMb} MB`}
            </span>
          </div>
          <div className="w-full bg-[#0d1b2a] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getRamColor(
                resources.memoryUsedMb,
                resources.maxMemoryMb
              )}`}
              style={{
                width: `${
                  isDead
                    ? 0
                    : Math.min(100, (resources.memoryUsedMb / resources.maxMemoryMb) * 100)
                }%`,
              }}
            />
          </div>
        </div>

        {/* Thread Pool Saturation */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-[#0d1b2a] rounded-lg p-2 border border-[#415a77]/40">
            <div className="text-[10px] uppercase font-semibold text-[#778da9] tracking-wider">
              Threads
            </div>
            <div className="text-xs font-mono font-bold text-[#e0e1dd] mt-0.5">
              {isDead ? '0' : resources.activeThreads} / {resources.maxThreadPool}
            </div>
          </div>
          <div className="bg-[#0d1b2a] rounded-lg p-2 border border-[#415a77]/40">
            <div className="text-[10px] uppercase font-semibold text-[#778da9] tracking-wider">
              Queue Depth
            </div>
            <div className="text-xs font-mono font-bold text-[#e0e1dd] mt-0.5">
              {server.queueDepth} pkts
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Failure Injection */}
      <div className="mt-4 pt-3 border-t border-[#415a77]/50">
        <div className="text-[11px] font-semibold text-[#778da9] uppercase tracking-wider mb-2">
          Failure Simulation Mode
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onModeChange(server.id, 'healthy')}
            className={`text-xs py-1.5 px-2 rounded-md font-medium transition-all ${
              detailedMode === 'healthy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                : 'bg-[#0d1b2a] text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a]/80'
            }`}
          >
            Healthy
          </button>

          <button
            onClick={() => onModeChange(server.id, 'degraded')}
            className={`text-xs py-1.5 px-2 rounded-md font-medium transition-all ${
              detailedMode === 'degraded'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'bg-[#0d1b2a] text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a]/80'
            }`}
          >
            Degrade
          </button>

          <button
            onClick={() => onModeChange(server.id, 'flapping')}
            className={`text-xs py-1.5 px-2 rounded-md font-medium transition-all ${
              detailedMode === 'flapping'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                : 'bg-[#0d1b2a] text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a]/80'
            }`}
          >
            Flapping
          </button>
        </div>

        {/* Crash / OOM / Recover buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {isDead ? (
            <button
              onClick={handleRecoverAction}
              className="col-span-2 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resurrect Server</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCrashAction}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Crash</span>
              </button>
              <button
                onClick={handleOomAction}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>OOM Kill</span>
              </button>
            </>
          )}
        </div>

        {/* Watchdog Supervisor Toggle */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#415a77]/30 text-xs">
          <span className="text-[#778da9] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            Watchdog Supervisor
          </span>
          <button
            onClick={async () => {
              const nextVal = !watchdogEnabled;
              onWatchdogToggle(server.id, nextVal);
              await showInfoAlert(
                `Watchdog ${nextVal ? 'Activated' : 'Deactivated'}`,
                `Automatic self-healing for ${server.name} is now ${
                  nextVal ? 'enabled (auto-restarts on crash)' : 'disabled'
                }.`
              );
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              watchdogEnabled
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-[#0d1b2a] text-[#778da9] border border-[#415a77]/40'
            }`}
          >
            {watchdogEnabled ? 'Auto-Heal ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
