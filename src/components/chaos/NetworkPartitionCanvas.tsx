import React from 'react';
import {
  Scissors,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Split,
  Database,
  Layers,
  Zap,
} from 'lucide-react';
import {
  LinkStatus,
  PartitionPreset,
  SubnetIsland,
} from '../../engine/NetworkPartitionMatrix';
import { showSuccessAlert, showWarningAlert } from '../../utils/alerts';

interface NetworkPartitionCanvasProps {
  nodes: string[];
  matrix: Record<string, Record<string, LinkStatus>>;
  subnets: SubnetIsland[];
  onSeverLink: (sourceId: string, targetId: string) => void;
  onConnectLink: (sourceId: string, targetId: string) => void;
  onDegradeLink: (sourceId: string, targetId: string) => void;
  onApplyPreset: (preset: PartitionPreset) => void;
  onHealAll: () => void;
}

export const NetworkPartitionCanvas: React.FC<NetworkPartitionCanvasProps> = ({
  nodes,
  matrix,
  subnets,
  onSeverLink,
  onConnectLink,
  onDegradeLink,
  onApplyPreset,
  onHealAll,
}) => {
  const handleCellClick = (src: string, dst: string) => {
    if (src === dst) return;
    const currentStatus = matrix[src]?.[dst] || 'connected';

    if (currentStatus === 'connected') {
      onSeverLink(src, dst);
    } else if (currentStatus === 'severed') {
      onDegradeLink(src, dst);
    } else {
      onConnectLink(src, dst);
    }
  };

  const handlePresetSelect = async (preset: PartitionPreset) => {
    onApplyPreset(preset);
    if (preset === 'clean') {
      await showSuccessAlert('Topology Restored', 'All inter-node network links reconnected.');
    } else {
      await showWarningAlert(
        'Partition Preset Applied',
        `Injected [${preset.replace(/-/g, ' ').toUpperCase()}]. Verify subnet quorums.`
      );
    }
  };

  const handleHealAllClick = async () => {
    onHealAll();
    await showSuccessAlert('Partitions Healed', 'All inter-node network links restored to 100% health.');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Preset Toolbar & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#1b263b] rounded-xl border border-[#415a77]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-[#778da9] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            Presets:
          </span>

          <button
            onClick={() => handlePresetSelect('split-brain-50-50')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0d1b2a] text-[#e0e1dd] border border-[#415a77] hover:border-amber-400 transition-all"
          >
            <Split className="w-3 h-3 text-amber-400" />
            50/50 Split-Brain
          </button>

          <button
            onClick={() => handlePresetSelect('isolate-db-primary')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0d1b2a] text-[#e0e1dd] border border-[#415a77] hover:border-rose-400 transition-all"
          >
            <Database className="w-3 h-3 text-rose-400" />
            Isolate DB Primary
          </button>

          <button
            onClick={() => handlePresetSelect('az-partition')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0d1b2a] text-[#e0e1dd] border border-[#415a77] hover:border-cyan-400 transition-all"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            AZ-East vs AZ-West
          </button>

          <button
            onClick={() => handlePresetSelect('asymmetric-ring')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0d1b2a] text-[#e0e1dd] border border-[#415a77] hover:border-purple-400 transition-all"
          >
            <Radio className="w-3 h-3 text-purple-400" />
            Asymmetric Ring
          </button>
        </div>

        <button
          onClick={handleHealAllClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Heal All Links
        </button>
      </div>

      {/* Subnet Consensus Quorums HUD */}
      <div className="p-3 bg-[#1b263b] rounded-xl border border-[#415a77] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5 font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Active Subnet Islands & Consensus Quorums ({subnets.length} Island{subnets.length > 1 ? 's' : ''})
          </span>
          <span className="text-[11px] font-mono text-[#778da9]">
            Majority Rule: &gt; {Math.floor(nodes.length / 2)} Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {subnets.map((island) => (
            <div
              key={island.id}
              className={`p-2.5 rounded-lg border font-mono text-xs space-y-1 ${
                island.hasQuorum
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#e0e1dd] uppercase">{island.id}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    island.hasQuorum
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {island.hasQuorum ? 'MAJORITY QUORUM' : 'MINORITY PARTITION'}
                </span>
              </div>
              <div className="text-[11px] text-[#778da9]">
                Nodes ({island.nodes.length}):{' '}
                <span className="text-[#e0e1dd] font-semibold">{island.nodes.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive NxN Adjacency Matrix */}
      <div className="flex-1 bg-[#1b263b] rounded-xl border border-[#415a77] p-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#e0e1dd]">
              NxN Inter-Node Communication Adjacency Matrix
            </h3>
            <p className="text-xs text-[#778da9]">
              Click any cell to toggle link status: Connected ➔ Severed ➔ Degraded (35% loss) ➔ Connected.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </div>
            <div className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" /> Severed
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Degraded
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-center border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="p-2 border border-[#415a77]/50 bg-[#0d1b2a] text-[#778da9] text-left">
                  SRC \ DST
                </th>
                {nodes.map((node) => (
                  <th
                    key={node}
                    className="p-2 border border-[#415a77]/50 bg-[#0d1b2a] text-cyan-300 font-bold"
                  >
                    {node}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((src) => (
                <tr key={src} className="hover:bg-[#0d1b2a]/30 transition-colors">
                  <td className="p-2 border border-[#415a77]/50 bg-[#0d1b2a] text-left font-bold text-cyan-300">
                    {src}
                  </td>
                  {nodes.map((dst) => {
                    const isSelf = src === dst;
                    const status = matrix[src]?.[dst] || 'connected';

                    if (isSelf) {
                      return (
                        <td
                          key={dst}
                          className="p-2 border border-[#415a77]/40 bg-[#0d1b2a]/50 text-[#778da9]/40 cursor-not-allowed"
                        >
                          —
                        </td>
                      );
                    }

                    return (
                      <td
                        key={dst}
                        onClick={() => handleCellClick(src, dst)}
                        className={`p-2 border border-[#415a77]/50 cursor-pointer transition-all ${
                          status === 'connected'
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                            : status === 'severed'
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold'
                        }`}
                        title={`${src} ➔ ${dst}: ${status.toUpperCase()} (Click to toggle)`}
                      >
                        <div className="flex items-center justify-center">
                          {status === 'connected' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : status === 'severed' ? (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
