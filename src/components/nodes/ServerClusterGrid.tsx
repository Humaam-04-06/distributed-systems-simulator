import React from 'react';
import {
  Server,
  Plus,
  Minus,
  RotateCcw,
  ZapOff,
  Cpu,
  HardDrive,
  Network,
} from 'lucide-react';
import { ServerNodeState } from '../../engine/types';
import { ServerResources } from '../../engine/ServerResourceManager';
import { DetailedServerMode } from '../../engine/ServerStateMachine';
import { ServerNodeCard } from './ServerNodeCard';
import { showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface ServerClusterGridProps {
  servers: ServerNodeState[];
  getServerResources: (serverId: string) => ServerResources;
  getServerMode: (serverId: string) => DetailedServerMode;
  isWatchdogEnabled: (serverId: string) => boolean;
  getWatchdogProgress: (serverId: string) => {
    isPending: boolean;
    remainingMs: number;
    totalDelayMs: number;
    progressFraction: number;
  } | null;
  onModeChange: (serverId: string, mode: DetailedServerMode) => void;
  onWatchdogToggle: (serverId: string, enabled: boolean) => void;
  onManualRestart: (serverId: string) => void;
  onAddServer?: () => void;
  onRemoveServer?: () => void;
  onResurrectAll?: () => void;
  onSimulateCascadeFailure?: () => void;
}

export const ServerClusterGrid: React.FC<ServerClusterGridProps> = ({
  servers,
  getServerResources,
  getServerMode,
  isWatchdogEnabled,
  getWatchdogProgress,
  onModeChange,
  onWatchdogToggle,
  onManualRestart,
  onAddServer,
  onRemoveServer,
  onResurrectAll,
  onSimulateCascadeFailure,
}) => {
  const onlineCount = servers.filter((s) => {
    const mode = getServerMode(s.id);
    return mode === 'healthy' || mode === 'degraded' || mode === 'flapping';
  }).length;

  const totalCpu = servers.reduce((acc, s) => {
    const r = getServerResources(s.id);
    return acc + (getServerMode(s.id) === 'crashed' || getServerMode(s.id) === 'oom_crash' ? 0 : r.cpuUsagePercentage);
  }, 0);
  const avgCpu = servers.length > 0 ? Math.round(totalCpu / servers.length) : 0;

  const totalRam = servers.reduce((acc, s) => {
    const r = getServerResources(s.id);
    return acc + (getServerMode(s.id) === 'crashed' || getServerMode(s.id) === 'oom_crash' ? 0 : r.memoryUsedMb);
  }, 0);

  const totalActiveConns = servers.reduce((acc, s) => acc + s.activeConnections, 0);

  const handleCascadeFailureClick = async () => {
    if (onSimulateCascadeFailure) {
      onSimulateCascadeFailure();
    } else {
      // Degrade or crash multiple nodes sequentially
      servers.forEach((s, idx) => {
        if (idx === 0) onModeChange(s.id, 'crashed');
        else if (idx === 1) onModeChange(s.id, 'oom_crash');
        else onModeChange(s.id, 'degraded');
      });
    }

    await showWarningAlert(
      'Cascading Failure Initiated!',
      'Primary worker nodes terminated. Traffic will bottleneck onto remaining degraded nodes or trigger 503 circuit breaking.'
    );
  };

  const handleResurrectAllClick = async () => {
    if (onResurrectAll) {
      onResurrectAll();
    } else {
      servers.forEach((s) => {
        onModeChange(s.id, 'healthy');
        onManualRestart(s.id);
      });
    }

    await showSuccessAlert(
      'All Servers Resurrected',
      'Cluster nodes restored to healthy online state and re-registered in load balancer pool.'
    );
  };

  return (
    <div className="rounded-xl border border-[#415a77] bg-[#0d1b2a] p-5 shadow-xl">
      {/* Cluster Overview Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#415a77]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e0e1dd] tracking-tight flex items-center gap-2">
                Worker Server Cluster Pool
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[#1b263b] text-cyan-300 border border-[#415a77]">
                  {onlineCount} / {servers.length} Online
                </span>
              </h2>
              <p className="text-xs text-[#778da9]">
                M/M/c multithreaded workers with real-time memory management & failure state machines
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Stats & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stats Badges */}
          <div className="flex items-center space-x-3 bg-[#1b263b] px-3 py-1.5 rounded-lg border border-[#415a77] text-xs">
            <div className="flex items-center space-x-1 text-[#778da9]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Avg CPU:</span>
              <span className="font-mono font-semibold text-[#e0e1dd]">{avgCpu}%</span>
            </div>
            <div className="h-3 w-px bg-[#415a77]" />
            <div className="flex items-center space-x-1 text-[#778da9]">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>RAM:</span>
              <span className="font-mono font-semibold text-[#e0e1dd]">{totalRam} MB</span>
            </div>
            <div className="h-3 w-px bg-[#415a77]" />
            <div className="flex items-center space-x-1 text-[#778da9]">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conns:</span>
              <span className="font-mono font-semibold text-[#e0e1dd]">{totalActiveConns}</span>
            </div>
          </div>

          {/* Scale Buttons */}
          <div className="flex items-center space-x-1 bg-[#1b263b] p-1 rounded-lg border border-[#415a77]">
            <button
              onClick={onRemoveServer}
              disabled={servers.length <= 1}
              title="Scale In (Remove Server)"
              className="p-1.5 rounded text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-semibold px-1.5 text-[#e0e1dd]">
              {servers.length}
            </span>
            <button
              onClick={onAddServer}
              disabled={servers.length >= 6}
              title="Scale Out (Add Server)"
              className="p-1.5 rounded text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Resurrect All */}
          <button
            onClick={handleResurrectAllClick}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resurrect All</span>
          </button>

          {/* Cascade Failure Button */}
          <button
            onClick={handleCascadeFailureClick}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 transition-colors"
          >
            <ZapOff className="w-3.5 h-3.5" />
            <span>Trigger Cascade</span>
          </button>
        </div>
      </div>

      {/* Grid of Server Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
        {servers.map((server) => {
          const resources = getServerResources(server.id);
          const detailedMode = getServerMode(server.id);
          const watchdogEnabled = isWatchdogEnabled(server.id);
          const watchdogProgress = getWatchdogProgress(server.id);

          return (
            <ServerNodeCard
              key={server.id}
              server={server}
              resources={resources}
              detailedMode={detailedMode}
              watchdogEnabled={watchdogEnabled}
              watchdogProgress={watchdogProgress}
              onModeChange={onModeChange}
              onWatchdogToggle={onWatchdogToggle}
              onManualRestart={onManualRestart}
            />
          );
        })}
      </div>
    </div>
  );
};
