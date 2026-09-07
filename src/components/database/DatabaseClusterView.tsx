import {
  Database,
  ShieldAlert,
  GitBranch,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { DatabaseNode, ReplicationMode } from '../../engine/DatabaseReplicationEngine';
import { WriteConflict } from '../../engine/WriteConflictDetector';
import { DatabaseNodeCard } from './DatabaseNodeCard';
import { showWarningAlert, showSuccessAlert, showInfoAlert } from '../../utils/alerts';

interface DatabaseClusterViewProps {
  nodes: DatabaseNode[];
  replicationMode: ReplicationMode;
  isSplitBrain: boolean;
  splitBrainPrimaries: string[];
  conflicts: WriteConflict[];
  onSetReplicationMode: (mode: ReplicationMode) => void;
  onPromoteReplica: (nodeId: string) => void;
  onToggleNodeHealth: (nodeId: string) => void;
  onTriggerSplitBrain: () => void;
  onResolveSplitBrain: (strategy: 'stonith' | 'demote') => void;
  onResolveConflicts: (strategy: 'lww' | 'highest_lsn') => void;
}

export const DatabaseClusterView: React.FC<DatabaseClusterViewProps> = ({
  nodes,
  replicationMode,
  isSplitBrain,
  splitBrainPrimaries,
  conflicts,
  onSetReplicationMode,
  onPromoteReplica,
  onToggleNodeHealth,
  onTriggerSplitBrain,
  onResolveSplitBrain,
  onResolveConflicts,
}) => {
  const healthyCount = nodes.filter((n) => n.health !== 'crashed').length;
  const unresolvedConflicts = conflicts.filter((c) => !c.resolved);

  const handleModeChange = async (mode: ReplicationMode) => {
    onSetReplicationMode(mode);
    await showInfoAlert(
      `Replication Mode: ${mode.toUpperCase()}`,
      mode === 'sync'
        ? 'Synchronous replication active. Writes will wait for all replicas to flush WAL. Zero replication lag guaranteed!'
        : mode === 'semi-sync'
        ? 'Semi-Synchronous replication active. Writes wait for at least 1 replica ack.'
        : 'Asynchronous replication active. High-throughput writes with eventual consistency.'
    );
  };

  const handleSplitBrainClick = async () => {
    onTriggerSplitBrain();
    await showWarningAlert(
      'CRITICAL: Split-Brain Injected!',
      'Network partition isolated the Primary while the replica elected a second Leader. Concurrent conflicting writes will now create data divergences!'
    );
  };

  const handleStonithResolve = async () => {
    onResolveSplitBrain('stonith');
    onResolveConflicts('lww');
    await showSuccessAlert(
      'STONITH Fencing Executed',
      'Rogue isolated primary forcefully terminated (STONITH). Unresolved write conflicts reconciled using Last-Write-Wins (LWW).'
    );
  };

  return (
    <div className="rounded-xl border border-[#415a77] bg-[#0d1b2a] p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#415a77]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#e0e1dd] tracking-tight flex items-center gap-2">
              Database Cluster & Replication Pool
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[#1b263b] text-amber-300 border border-[#415a77]">
                {healthyCount} / {nodes.length} Online
              </span>
            </h2>
            <p className="text-xs text-[#778da9]">
              Postgres Primary-Replica WAL streaming with Raft-like elections & Split-Brain fencing
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Replication Mode Selector */}
          <div className="flex items-center space-x-1 bg-[#1b263b] p-1 rounded-lg border border-[#415a77]">
            <span className="text-[11px] font-semibold text-[#778da9] px-2 uppercase tracking-wider">
              Mode:
            </span>
            {(['async', 'semi-sync', 'sync'] as ReplicationMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all uppercase ${
                  replicationMode === mode
                    ? 'bg-[#415a77] text-[#e0e1dd] font-semibold shadow-sm'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Split-Brain Trigger / STONITH Fencing */}
          {isSplitBrain ? (
            <button
              onClick={handleStonithResolve}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-md animate-pulse"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Execute STONITH Fencing</span>
            </button>
          ) : (
            <button
              onClick={handleSplitBrainClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Simulate Split-Brain</span>
            </button>
          )}
        </div>
      </div>

      {/* Split-Brain Alert Banner */}
      {isSplitBrain && (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-xs text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-rose-300">SPLIT-BRAIN PARTITION IN PROGRESS:</span>{' '}
              Two isolated Primary nodes are concurrently accepting mutations. Quorum is lost.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResolveSplitBrain('demote');
                onResolveConflicts('lww');
              }}
              className="px-2.5 py-1 rounded bg-[#0d1b2a] hover:bg-[#1b263b] text-xs font-medium text-[#e0e1dd] border border-[#415a77]"
            >
              Graceful Quorum Demote
            </button>
            <button
              onClick={handleStonithResolve}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow"
            >
              STONITH Fencing
            </button>
          </div>
        </div>
      )}

      {/* Unresolved Write Conflicts Bar */}
      {unresolvedConflicts.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              <strong>{unresolvedConflicts.length} Concurrent Write Conflict(s) Detected!</strong>{' '}
              Key mutations diverged during partition.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onResolveConflicts('lww')}
              className="px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-mono text-[11px]"
            >
              Resolve LWW (Last-Write-Wins)
            </button>
            <button
              onClick={() => onResolveConflicts('highest_lsn')}
              className="px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-mono text-[11px]"
            >
              Resolve Highest LSN
            </button>
          </div>
        </div>
      )}

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {nodes.map((node) => {
          const isSplitBrainNode = isSplitBrain && splitBrainPrimaries.includes(node.id);
          return (
            <DatabaseNodeCard
              key={node.id}
              node={node}
              replicationMode={replicationMode}
              isSplitBrainPrimary={isSplitBrainNode}
              onPromote={onPromoteReplica}
              onToggleHealth={onToggleNodeHealth}
            />
          );
        })}
      </div>
    </div>
  );
};
