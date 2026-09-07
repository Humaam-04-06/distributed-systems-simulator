import React, { useState, useMemo } from 'react';
import { ConsistentHashRing, VirtualNodeToken } from '../../engine/ConsistentHashRing';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, Search, Plus, Trash2, HelpCircle } from 'lucide-react';

export interface ConsistentHashRingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeServers: string[];
}

export const ConsistentHashRingModal: React.FC<ConsistentHashRingModalProps> = ({
  isOpen,
  onClose,
  activeServers,
}) => {
  const [testKey, setTestKey] = useState<string>('user_session_4920');
  const [servers, setServers] = useState<string[]>(
    activeServers.length > 0 ? activeServers : ['server-1', 'server-2', 'server-3']
  );

  const hashRing = useMemo(() => {
    const ring = new ConsistentHashRing(24); // 24 virtual nodes per server for crisp rendering
    ring.setNodes(servers);
    return ring;
  }, [servers]);

  const tokens: VirtualNodeToken[] = useMemo(() => {
    return hashRing.getRingTokens();
  }, [hashRing]);

  const lookupResult = useMemo(() => {
    return hashRing.getNode(testKey);
  }, [hashRing, testKey]);

  if (!isOpen) return null;

  const serverColors: Record<string, string> = {
    'server-1': '#3b82f6', // Blue
    'server-2': '#8b5cf6', // Violet
    'server-3': '#10b981', // Emerald
    'server-4': '#f59e0b', // Amber
  };

  const centerRadius = 140;
  const cx = 175;
  const cy = 175;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1b2a]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b263b] border border-[#415a77] rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#415a77]/60">
          <div>
            <h2 className="text-base font-semibold text-[#e0e1dd] flex items-center gap-2">
              Consistent Hashing Ring Visualizer
              <Badge variant="blue" size="sm">
                360° Ring
              </Badge>
            </h2>
            <p className="text-xs text-[#778da9] mt-0.5">
              Demonstrates minimal key re-distribution when worker nodes scale
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#223049] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1 overflow-y-auto">
          {/* SVG 360 Ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-[350px] h-[350px]">
              <svg width="350" height="350" className="overflow-visible">
                {/* Outer Ring Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={centerRadius}
                  fill="none"
                  stroke="#415a77"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Inner Core */}
                <circle cx={cx} cy={cy} r="45" fill="#223049" stroke="#415a77" strokeWidth="1" />
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  fill="#778da9"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  HASH RING
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fill="#e0e1dd"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  2^32 SLOTS
                </text>

                {/* Virtual Node Tokens along circumference */}
                {tokens.map((token, i) => {
                  const rad = (token.angleDegrees * Math.PI) / 180;
                  const x = cx + centerRadius * Math.cos(rad);
                  const y = cy + centerRadius * Math.sin(rad);
                  const color = serverColors[token.nodeId] || '#778da9';

                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="#1b263b"
                      strokeWidth="1.5"
                      className="transition-all hover:scale-150"
                    >
                      <title>{`${token.nodeId} (Token ${token.virtualIndex})`}</title>
                    </circle>
                  );
                })}

                {/* Searched Key Marker */}
                {lookupResult.token && (
                  <>
                    {(() => {
                      const rad = (lookupResult.keyAngle * Math.PI) / 180;
                      const kx = cx + centerRadius * Math.cos(rad);
                      const ky = cy + centerRadius * Math.sin(rad);
                      return (
                        <>
                          <line
                            x1={cx}
                            y1={cy}
                            x2={kx}
                            y2={ky}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={kx}
                            cy={ky}
                            r="7"
                            fill="#f59e0b"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="animate-ping"
                          />
                          <circle
                            cx={kx}
                            cy={ky}
                            r="6"
                            fill="#f59e0b"
                            stroke="#1b263b"
                            strokeWidth="1.5"
                          />
                        </>
                      );
                    })()}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Right Controls & Details */}
          <div className="space-y-4">
            {/* Key Search Input */}
            <div className="p-3.5 rounded-xl bg-[#223049] border border-[#415a77]">
              <label className="text-xs font-semibold text-[#e0e1dd] flex items-center gap-1.5 mb-2">
                <Search className="w-3.5 h-3.5 text-[#778da9]" />
                Simulate Request Key Hashing:
              </label>
              <input
                type="text"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="e.g. user_session_123"
                className="w-full bg-[#1b263b] border border-[#415a77] rounded-lg px-3 py-1.5 text-xs text-[#e0e1dd] font-mono focus:outline-none focus:border-[#778da9]"
              />

              {lookupResult.nodeId && (
                <div className="mt-3 p-2.5 rounded-lg bg-[#1b263b] border border-[#415a77]/60 text-xs font-mono space-y-1">
                  <div className="text-[#778da9]">
                    Key Hash: <span className="text-[#e0e1dd]">{lookupResult.keyHash}</span>
                  </div>
                  <div className="text-[#778da9]">
                    Ring Angle:{' '}
                    <span className="text-[#e0e1dd]">
                      {lookupResult.keyAngle.toFixed(1)}°
                    </span>
                  </div>
                  <div className="text-[#778da9] flex items-center gap-2 pt-1 border-t border-[#415a77]/40">
                    <span>Routed Server:</span>
                    <Badge variant="blue" size="sm">
                      {lookupResult.nodeId.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Server Pool Scaling */}
            <div className="p-3.5 rounded-xl bg-[#223049] border border-[#415a77] space-y-2">
              <div className="text-xs font-semibold text-[#e0e1dd] flex justify-between items-center">
                <span>Active Hash Ring Nodes:</span>
                <span className="text-[#778da9] font-mono text-[11px]">
                  {tokens.length} virtual tokens
                </span>
              </div>

              <div className="space-y-1.5">
                {servers.map((s) => (
                  <div
                    key={s}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1b263b] border border-[#415a77]/60 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: serverColors[s] || '#778da9' }}
                      />
                      <span className="text-[#e0e1dd]">{s}</span>
                    </div>
                    {servers.length > 2 && (
                      <button
                        onClick={() => setServers(servers.filter((id) => id !== s))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Remove Server from Hash Ring"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {servers.length < 4 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setServers([...servers, `server-${servers.length + 1}`])}
                >
                  Scale Up Server {servers.length + 1}
                </Button>
              )}
            </div>

            {/* System Design Tip */}
            <div className="p-3 rounded-lg bg-[#1b263b] border border-[#415a77]/50 text-[11px] text-[#778da9] flex items-start gap-2 leading-relaxed">
              <HelpCircle className="w-4 h-4 text-[#778da9] shrink-0 mt-0.5" />
              <span>
                <strong>Interview Insight:</strong> With simple modular hashing (hash(key) % N), adding a server re-maps ~80% of all keys. In Consistent Hashing, only ~1/N of keys migrate!
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#415a77]/60 flex justify-end">
          <Button size="sm" variant="primary" onClick={onClose}>
            Close Visualizer
          </Button>
        </div>
      </div>
    </div>
  );
};
