import React from 'react';
import {
  Database,
  Crown,
  Cpu,
  Clock,
  ArrowUpCircle,
  AlertOctagon,
  RotateCcw,
  FileText,
  XCircle,
} from 'lucide-react';
import { DatabaseNode, ReplicationMode } from '../../engine/DatabaseReplicationEngine';
import { showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface DatabaseNodeCardProps {
  node: DatabaseNode;
  replicationMode: ReplicationMode;
  isSplitBrainPrimary?: boolean;
  onPromote: (nodeId: string) => void;
  onToggleHealth: (nodeId: string) => void;
}

export const DatabaseNodeCard: React.FC<DatabaseNodeCardProps> = ({
  node,
  replicationMode,
  isSplitBrainPrimary,
  onPromote,
  onToggleHealth,
}) => {
  const isPrimary = node.role === 'primary';
  const isCrashed = node.health === 'crashed';

  const handlePromoteClick = async () => {
    onPromote(node.id);
    await showSuccessAlert(
      'Leader Promoted!',
      `${node.name} has been promoted to Primary Leader. Replication stream re-routed.`
    );
  };

  const handleToggleHealthClick = async () => {
    onToggleHealth(node.id);
    if (isCrashed) {
      await showSuccessAlert(
        'Database Node Restored',
        `${node.name} is back online and synchronizing WAL log sequence numbers.`
      );
    } else {
      await showWarningAlert(
        'Database Outage Injected',
        `${node.name} forcefully terminated. If this was the Primary, an automatic election or manual promotion is required.`
      );
    }
  };

  const getLagColor = (lag: number) => {
    if (lag > 25) return 'text-rose-400 font-bold';
    if (lag > 8) return 'text-amber-300 font-semibold';
    return 'text-emerald-300';
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-4 transition-all duration-300 bg-[#1b263b] ${
        isCrashed
          ? 'border-rose-500/40 opacity-75 shadow-lg shadow-rose-950/20'
          : isSplitBrainPrimary
          ? 'border-rose-500 shadow-lg shadow-rose-950/40 animate-pulse'
          : isPrimary
          ? 'border-amber-500/50 shadow-md shadow-amber-950/20'
          : 'border-[#415a77] hover:border-cyan-500/40 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
        <div className="flex items-center space-x-2.5">
          <div
            className={`p-2 rounded-lg ${
              isCrashed
                ? 'bg-rose-500/20 text-rose-400'
                : isSplitBrainPrimary
                ? 'bg-rose-500/20 text-rose-400'
                : isPrimary
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-cyan-500/10 text-cyan-400'
            }`}
          >
            {isPrimary ? <Crown className="w-5 h-5" /> : <Database className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#e0e1dd] tracking-wide">
                {node.name}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1b2a] text-[#778da9]">
                {node.id}
              </span>
            </div>
            <p className="text-[11px] text-[#778da9]">
              {isPrimary ? 'Accepts Reads & Writes' : 'Read-Only Streaming Replica'}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center space-x-1.5">
          {isSplitBrainPrimary ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider animate-bounce">
              <AlertOctagon className="w-3 h-3 mr-1" />
              Split-Brain
            </span>
          ) : (
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${
                isCrashed
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : isPrimary
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  isCrashed
                    ? 'bg-rose-400'
                    : isPrimary
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
              />
              {isCrashed ? 'Offline' : node.role.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Telemetry Metrics */}
      <div className="mt-3.5 space-y-2.5">
        {/* LSN & Replication Lag */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0d1b2a] rounded-lg p-2 border border-[#415a77]/40">
            <div className="text-[10px] uppercase font-semibold text-[#778da9] flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              WAL LSN
            </div>
            <div className="text-xs font-mono font-bold text-[#e0e1dd] mt-0.5">
              {isCrashed ? '---' : node.lsn.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#0d1b2a] rounded-lg p-2 border border-[#415a77]/40">
            <div className="text-[10px] uppercase font-semibold text-[#778da9] flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              {isPrimary ? 'Mode' : 'Replication Lag'}
            </div>
            <div
              className={`text-xs font-mono mt-0.5 ${
                isPrimary ? 'text-[#e0e1dd] font-bold uppercase' : getLagColor(node.replicationLagMs)
              }`}
            >
              {isCrashed
                ? 'DESYNC'
                : isPrimary
                ? replicationMode.toUpperCase()
                : `${node.replicationLagMs} ms`}
            </div>
          </div>
        </div>

        {/* Pending WAL & IOPS */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="flex justify-between text-[#778da9] bg-[#0d1b2a] px-2.5 py-1.5 rounded border border-[#415a77]/30">
            <span>Pending WAL:</span>
            <span className="font-mono text-[#e0e1dd]">
              {isCrashed ? '0 B' : `${(node.pendingWalBytes / 1024).toFixed(1)} KB`}
            </span>
          </div>

          <div className="flex justify-between text-[#778da9] bg-[#0d1b2a] px-2.5 py-1.5 rounded border border-[#415a77]/30">
            <span>IOPS:</span>
            <span className="font-mono text-[#e0e1dd]">
              {isCrashed ? 0 : node.readIops + node.writeIops} ops/s
            </span>
          </div>
        </div>

        {/* CPU Load Gauge */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#778da9] flex items-center gap-1 font-medium">
              <Cpu className="w-3.5 h-3.5" /> CPU Load
            </span>
            <span className="text-[#e0e1dd] font-mono text-[11px]">
              {isCrashed ? '0%' : `${node.cpuLoad}%`}
            </span>
          </div>
          <div className="w-full bg-[#0d1b2a] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                node.cpuLoad > 80 ? 'bg-rose-500' : 'bg-cyan-400'
              }`}
              style={{ width: `${isCrashed ? 0 : node.cpuLoad}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="mt-4 pt-3 border-t border-[#415a77]/50 grid grid-cols-2 gap-2">
        {!isPrimary && !isCrashed ? (
          <button
            onClick={handlePromoteClick}
            className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Promote Leader</span>
          </button>
        ) : (
          <div className="flex items-center text-[11px] text-[#778da9] italic px-1">
            {isPrimary ? 'Active Leader' : 'Node Offline'}
          </div>
        )}

        <button
          onClick={handleToggleHealthClick}
          className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            isCrashed
              ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
          }`}
        >
          {isCrashed ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Node</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              <span>Crash Node</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
