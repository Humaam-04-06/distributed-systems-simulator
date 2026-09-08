import React, { useState } from 'react';
import {
  Globe,
  Server,
  Activity,
  Zap,
} from 'lucide-react';
import {
  RegionId,
  RegionDefinition,
  SubseaCable,
  GeoRoutingPolicy,
  CLIENT_ORIGINS_CONFIG,
} from '../../engine/MultiRegionTypes';
import { showSuccessAlert, showWarningAlert } from '../../utils/alerts';

interface GlobalRegionMapViewProps {
  regions: RegionDefinition[];
  cables: SubseaCable[];
  activePolicy: GeoRoutingPolicy;
  primaryRegionId: RegionId;
  evacuatedRegions: RegionId[];
  onEvacuateRegion: (regionId: RegionId) => void;
  onRestoreRegion: (regionId: RegionId) => void;
  onPromotePrimary: (regionId: RegionId) => void;
  onSeverCable: (cableId: import('../../engine/MultiRegionTypes').SubseaCableId) => void;
  onHealCable: (cableId: import('../../engine/MultiRegionTypes').SubseaCableId) => void;
}

export const GlobalRegionMapView: React.FC<GlobalRegionMapViewProps> = ({
  regions,
  cables,
  activePolicy,
  primaryRegionId,
  evacuatedRegions,
  onEvacuateRegion,
  onRestoreRegion,
  onPromotePrimary,
  onSeverCable,
  onHealCable,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>('us-east-1');

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];

  const handleRegionClick = (region: RegionDefinition) => {
    setSelectedRegionId(region.id);
  };

  const handleEvacuateToggle = async (region: RegionDefinition) => {
    const isEvacuated = evacuatedRegions.includes(region.id);
    if (isEvacuated) {
      onRestoreRegion(region.id);
      await showSuccessAlert(
        'Region Restored',
        `Data Center [${region.name}] re-admitted to active DNS pools.`
      );
    } else {
      onEvacuateRegion(region.id);
      await showWarningAlert(
        'Region Evacuated!',
        `Traffic drained from [${region.name}]. Global DNS traffic rerouted to redundant regions.`
      );
    }
  };

  const handlePromoteClick = async (region: RegionDefinition) => {
    if (region.id === primaryRegionId) return;
    onPromotePrimary(region.id);
    await showSuccessAlert(
      'Primary Leader Promoted',
      `[${region.name}] is now the designated Global Primary Leader for all cross-region writes!`
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* World Map Container */}
      <div className="relative w-full rounded-2xl bg-[#0d1b2a] border border-[#415a77]/70 shadow-2xl overflow-hidden">
        {/* Map Header Overlay */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2.5 bg-[#1b263b]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#415a77]/80 pointer-events-auto">
            <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-[#e0e1dd] tracking-wider uppercase">
              Global Multi-Region Network Fabric
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d1b2a] text-cyan-300 font-mono font-semibold border border-cyan-500/30">
              POLICY: {activePolicy.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#1b263b]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#415a77]/80 pointer-events-auto text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Primary: <strong className="text-[#e0e1dd]">{primaryRegionId}</strong>
            </span>
            <span className="text-[#415a77]">|</span>
            <span className="text-[#778da9]">
              Evacuated:{' '}
              <strong className={evacuatedRegions.length > 0 ? 'text-rose-400' : 'text-[#e0e1dd]'}>
                {evacuatedRegions.length}
              </strong>
            </span>
          </div>
        </div>

        {/* SVG World Map */}
        <div className="w-full pt-10 pb-4 px-2">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-auto select-none"
            style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
          >
            <defs>
              {/* Radial gradients for region nodes */}
              <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="roseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>

              {/* Linear gradient for subsea cables */}
              <linearGradient id="cableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Latitude / Longitude Subtle Grid */}
            <g stroke="#415a77" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.25">
              <line x1="0" y1="125" x2="1000" y2="125" />
              <line x1="0" y1="250" x2="1000" y2="250" />
              <line x1="0" y1="375" x2="1000" y2="375" />
              <line x1="250" y1="0" x2="250" y2="500" />
              <line x1="500" y1="0" x2="500" y2="500" />
              <line x1="750" y1="0" x2="750" y2="500" />
            </g>

            {/* Continents Simplified Outlines */}
            <g fill="#1b263b" stroke="#415a77" strokeWidth="1" opacity="0.65">
              {/* North America */}
              <path d="M 120 70 L 290 80 L 320 150 L 260 220 L 220 200 L 190 280 L 150 250 L 110 180 Z" />
              {/* South America */}
              <path d="M 280 270 L 380 290 L 390 380 L 340 470 L 300 460 L 270 360 Z" />
              {/* Europe */}
              <path d="M 460 70 L 590 80 L 570 170 L 490 190 L 440 140 Z" />
              {/* Africa */}
              <path d="M 460 200 L 590 200 L 610 320 L 550 420 L 480 340 L 450 240 Z" />
              {/* Asia */}
              <path d="M 600 70 L 920 80 L 890 220 L 780 280 L 680 260 L 620 180 Z" />
              {/* Australia */}
              <path d="M 780 340 L 890 350 L 880 430 L 790 420 Z" />
            </g>

            {/* Subsea Fiber Cables */}
            <g>
              {cables.map((cable) => {
                const srcReg = regions.find((r) => r.id === cable.fromRegion);
                const dstReg = regions.find((r) => r.id === cable.toRegion);
                if (!srcReg || !dstReg) return null;

                const isSevered = cable.status === 'severed';
                const isCongested = cable.status === 'congested';

                // Midpoint control for curved bezier fiber cable
                const midX = (srcReg.svgX + dstReg.svgX) / 2;
                const midY = (srcReg.svgY + dstReg.svgY) / 2 - 35;
                const pathD = `M ${srcReg.svgX} ${srcReg.svgY} Q ${midX} ${midY} ${dstReg.svgX} ${dstReg.svgY}`;

                return (
                  <g key={cable.id} className="cursor-pointer" onClick={() => {
                    if (isSevered) onHealCable(cable.id);
                    else onSeverCable(cable.id);
                  }}>
                    {/* Shadow track */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSevered ? '#f43f5e' : isCongested ? '#f59e0b' : '#06b6d4'}
                      strokeWidth={isSevered ? 3 : 2}
                      strokeDasharray={isSevered ? '6 6' : isCongested ? '8 4' : 'none'}
                      opacity={isSevered ? 0.9 : 0.6}
                    />

                    {/* Cable cut badge */}
                    {isSevered && (
                      <g transform={`translate(${midX - 35}, ${midY - 12})`}>
                        <rect width="70" height="20" rx="4" fill="#f43f5e" />
                        <text x="35" y="14" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          ✂️ SEVERED
                        </text>
                      </g>
                    )}

                    {/* Cable label on hover */}
                    <title>{`${cable.name} (${cable.baseLatencyMs}ms) - Status: ${cable.status.toUpperCase()}`}</title>
                  </g>
                );
              })}
            </g>

            {/* Client Origins Beacon Markers & Active Traffic Arcs */}
            <g>
              {CLIENT_ORIGINS_CONFIG.map((origin) => {
                // Find target region for this origin (closest healthy for visualization)
                const activeRegion = regions.find((r) => r.status === 'healthy') || regions[0];
                const arcPath = `M ${origin.svgX} ${origin.svgY} Q ${(origin.svgX + activeRegion.svgX) / 2} ${(origin.svgY + activeRegion.svgY) / 2 - 20} ${activeRegion.svgX} ${activeRegion.svgY}`;

                return (
                  <g key={origin.id}>
                    {/* Traffic Arc */}
                    <path
                      d={arcPath}
                      fill="none"
                      stroke="#778da9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.3"
                    />

                    {/* Origin Beacon */}
                    <circle cx={origin.svgX} cy={origin.svgY} r="7" fill="url(#cyanGlow)" />
                    <circle cx={origin.svgX} cy={origin.svgY} r="3" fill="#06b6d4" />
                    <text
                      x={origin.svgX}
                      y={origin.svgY + 16}
                      fill="#778da9"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {origin.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Regional Data Center Nodes */}
            <g>
              {regions.map((region) => {
                const isSelected = selectedRegionId === region.id;
                const isEvacuated = evacuatedRegions.includes(region.id);
                const isPrimary = region.id === primaryRegionId;
                const isDegraded = region.status === 'degraded';

                const glowColor = isEvacuated ? 'url(#roseGlow)' : isDegraded ? 'url(#amberGlow)' : 'url(#emeraldGlow)';
                const dotColor = isEvacuated ? '#f43f5e' : isDegraded ? '#f59e0b' : '#10b981';

                return (
                  <g
                    key={region.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => handleRegionClick(region)}
                  >
                    {/* Pulsating outer halo */}
                    <circle
                      cx={region.svgX}
                      cy={region.svgY}
                      r={isSelected ? 24 : 18}
                      fill={glowColor}
                      className="animate-pulse"
                    />

                    {/* Node base */}
                    <circle
                      cx={region.svgX}
                      cy={region.svgY}
                      r={isSelected ? 9 : 7}
                      fill="#0d1b2a"
                      stroke={dotColor}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    <circle cx={region.svgX} cy={region.svgY} r={isSelected ? 4 : 3} fill={dotColor} />

                    {/* Primary Crown Badge */}
                    {isPrimary && (
                      <g transform={`translate(${region.svgX - 10}, ${region.svgY - 26})`}>
                        <rect width="20" height="13" rx="3" fill="#f59e0b" />
                        <text x="10" y="9.5" fill="#000000" fontSize="8" fontWeight="bold" textAnchor="middle">
                          ★
                        </text>
                      </g>
                    )}

                    {/* Evacuated X Badge */}
                    {isEvacuated && (
                      <g transform={`translate(${region.svgX - 18}, ${region.svgY - 26})`}>
                        <rect width="36" height="13" rx="3" fill="#f43f5e" />
                        <text x="18" y="9.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                          DRAINED
                        </text>
                      </g>
                    )}

                    {/* Region Label Tag */}
                    <g transform={`translate(${region.svgX}, ${region.svgY + 16})`}>
                      <text
                        x="0"
                        y="0"
                        fill={isSelected ? '#e0e1dd' : '#778da9'}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {region.id}
                      </text>
                      <text
                        x="0"
                        y="10"
                        fill={dotColor}
                        fontSize="8.5"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {region.avgLatencyMs}ms | {region.activeInstances}vCPU
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Selected Regional Inspector Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Region Profile */}
        <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-[#e0e1dd]">{selectedRegion.name}</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                  selectedRegion.status === 'healthy'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : selectedRegion.status === 'degraded'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {selectedRegion.status}
              </span>
            </div>
            <p className="text-xs text-[#778da9] mb-3">
              Geographic zone: <strong className="text-[#e0e1dd]">{selectedRegion.location}</strong> ({selectedRegion.lat}° N, {selectedRegion.lon}° E)
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
                <div className="text-[10px] text-[#778da9]">ROUND-TRIP (RTT)</div>
                <div className="text-sm font-bold text-cyan-400">{selectedRegion.avgLatencyMs} ms</div>
              </div>
              <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
                <div className="text-[10px] text-[#778da9]">REPLICATION LAG</div>
                <div className="text-sm font-bold text-amber-400">{selectedRegion.replicationLagMs} ms</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#415a77]/60">
            <button
              onClick={() => handleEvacuateToggle(selectedRegion)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                evacuatedRegions.includes(selectedRegion.id)
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {evacuatedRegions.includes(selectedRegion.id) ? 'Restore Ingress' : 'Evacuate Region'}
            </button>
            {selectedRegion.id !== primaryRegionId && (
              <button
                onClick={() => handlePromoteClick(selectedRegion)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#415a77] hover:bg-[#778da9] text-[#e0e1dd] transition-all"
              >
                Promote Primary
              </button>
            )}
          </div>
        </div>

        {/* Inter-Continental Subsea Cables Status */}
        <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-[#e0e1dd]">Subsea Fiber Backbone</span>
            </div>
            <p className="text-xs text-[#778da9] mb-3">
              Trans-oceanic fiber routes connecting global data centers:
            </p>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-xs font-mono">
              {cables.map((c) => {
                const isSevered = c.status === 'severed';
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isSevered
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                        : 'bg-[#0d1b2a] border-[#415a77]/50 text-[#e0e1dd]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-[10px] text-[#778da9]">
                        {c.fromRegion} ⇄ {c.toRegion} ({c.baseLatencyMs}ms)
                      </div>
                    </div>
                    <button
                      onClick={() => (isSevered ? onHealCable(c.id) : onSeverCable(c.id))}
                      className={`text-[10px] px-2 py-1 rounded font-bold uppercase transition-all ${
                        isSevered
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-900/60 hover:bg-rose-600 text-rose-200 border border-rose-500/50'
                      }`}
                    >
                      {isSevered ? 'Repair' : 'Sever'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global WAN Routing Insight */}
        <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-[#e0e1dd]">Geo-DNS Routing Logic</span>
            </div>
            <p className="text-xs text-[#778da9] mb-3">
              How queries from world clients are being directed:
            </p>

            <div className="space-y-1.5 text-xs font-mono mb-3">
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0d1b2a] border border-[#415a77]/40">
                <span className="text-[#778da9]">North America ➔</span>
                <span className="text-cyan-400 font-bold">
                  {evacuatedRegions.includes('us-east-1') ? 'us-west-2' : 'us-east-1'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0d1b2a] border border-[#415a77]/40">
                <span className="text-[#778da9]">Europe ➔</span>
                <span className="text-cyan-400 font-bold">
                  {evacuatedRegions.includes('eu-central-1') ? 'us-east-1' : 'eu-central-1'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0d1b2a] border border-[#415a77]/40">
                <span className="text-[#778da9]">Asia Pacific ➔</span>
                <span className="text-cyan-400 font-bold">
                  {evacuatedRegions.includes('ap-northeast-1') ? 'ap-south-1' : 'ap-northeast-1'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200">
            💡 Dynamic Anycast BGP ensures 100% traffic continuity even during trans-oceanic fiber cuts.
          </div>
        </div>
      </div>
    </div>
  );
};
