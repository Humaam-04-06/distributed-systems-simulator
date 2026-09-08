import React from 'react';
import {
  Skull,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  Trash2,
} from 'lucide-react';
import { ByzantineEvent } from '../../engine/ByzantineFaultInjector';
import { showSuccessAlert, showWarningAlert } from '../../utils/alerts';

interface ByzantineTraitorPanelProps {
  nodes: string[];
  traitors: string[];
  events: ByzantineEvent[];
  onToggleTraitor: (nodeId: string) => void;
  onClearEvents: () => void;
  onResetByzantine: () => void;
}

export const ByzantineTraitorPanel: React.FC<ByzantineTraitorPanelProps> = ({
  nodes,
  traitors,
  events,
  onToggleTraitor,
  onClearEvents,
  onResetByzantine,
}) => {
  const handleTraitorToggle = async (nodeId: string) => {
    const isTraitor = traitors.includes(nodeId);
    onToggleTraitor(nodeId);

    if (isTraitor) {
      await showSuccessAlert(
        'Traitor Cleansed',
        `Node [${nodeId}] restored to honest consensus participation.`
      );
    } else {
      await showWarningAlert(
        'Byzantine Traitor Infiltrated!',
        `Node [${nodeId}] will now inject bit-flip corruptions and conflicting votes into the cluster.`
      );
    }
  };

  const handleResetClick = async () => {
    onResetByzantine();
    await showSuccessAlert('Byzantine State Reset', 'All nodes cleared of traitor infiltration.');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner & Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#1b263b] rounded-xl border border-[#415a77]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-bold text-[#e0e1dd]">
              Lamport's Byzantine Generals Fault Injector
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#0d1b2a] text-cyan-300 border border-[#415a77]">
              {traitors.length} TRAITOR{traitors.length !== 1 ? 'S' : ''} ACTIVE
            </span>
          </div>
          <p className="text-xs text-[#778da9]">
            Simulate malicious or arbitrary hardware failures: bit-flips, conflicting votes, and cryptographic defense.
          </p>
        </div>

        <button
          onClick={handleResetClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0d1b2a] text-[#e0e1dd] border border-[#415a77] hover:border-emerald-400 hover:text-emerald-300 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Cleanse All Traitors
        </button>
      </div>

      {/* Traitor Node Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nodes.map((nodeId) => {
          const isTraitor = traitors.includes(nodeId);

          return (
            <div
              key={nodeId}
              className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                isTraitor
                  ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-950/30'
                  : 'bg-[#1b263b] border-[#415a77]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isTraitor
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isTraitor ? <Skull className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-mono font-bold text-[#e0e1dd]">{nodeId}</div>
                    <div className="text-[10px] font-mono text-[#778da9]">
                      {isTraitor ? 'Traitor Infiltrated' : 'Honest Consensus'}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                    isTraitor
                      ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isTraitor ? 'MALICIOUS' : 'HONEST'}
                </span>
              </div>

              <div className="text-xs font-mono text-[#778da9] space-y-1 bg-[#0d1b2a] p-2 rounded-lg border border-[#415a77]/50">
                <div className="flex items-center justify-between">
                  <span>Corruption Rate:</span>
                  <span className={isTraitor ? 'text-rose-400 font-bold' : 'text-[#e0e1dd]'}>
                    {isTraitor ? '60%' : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Behavior:</span>
                  <span className={isTraitor ? 'text-amber-300 font-bold' : 'text-emerald-400'}>
                    {isTraitor ? 'Payload Bit-Flip' : 'Valid Signatures'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleTraitorToggle(nodeId)}
                className={`w-full py-1.5 text-xs font-semibold rounded-lg font-mono transition-all flex items-center justify-center gap-1.5 ${
                  isTraitor
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {isTraitor ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Cleanse & Restore Honest
                  </>
                ) : (
                  <>
                    <Skull className="w-3.5 h-3.5" />
                    Infiltrate as Byzantine Traitor
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Byzantine Security Audit Event Feed */}
      <div className="flex-1 bg-[#1b263b] rounded-xl border border-[#415a77] p-4 flex flex-col overflow-hidden min-h-[260px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#415a77]/60 mb-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-[#e0e1dd] font-mono">
              Cryptographic Checksum Defense Audit Feed
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0d1b2a] text-[#778da9] font-mono border border-[#415a77]">
              FNV-1a Hash Verification
            </span>
          </div>

          {events.length > 0 && (
            <button
              onClick={onClearEvents}
              className="text-xs text-[#778da9] hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear Feed
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-[#415a77]/30">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[#778da9] space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-50" />
              <p className="text-xs font-semibold text-[#e0e1dd]">
                Zero Byzantine Corruptions Detected
              </p>
              <p className="text-[11px]">
                Infiltrate a node as a Byzantine traitor to observe cryptographic checksum quarantine in action.
              </p>
            </div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="pt-2 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-300">
                      [{evt.faultType.toUpperCase()}]
                    </span>
                    <span className="text-[#e0e1dd] font-bold">@{evt.nodeId}</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-semibold uppercase">
                    {evt.actionTaken.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[#778da9] text-[11px] pl-1">{evt.description}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
