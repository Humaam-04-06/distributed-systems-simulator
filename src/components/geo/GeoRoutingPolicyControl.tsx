import React from 'react';
import {
  Compass,
  Zap,
  RotateCcw,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import {
  GeoRoutingPolicy,
  RegionId,
  SubseaCableId,
  RegionDefinition,
} from '../../engine/MultiRegionTypes';
import { showSuccessAlert, showWarningAlert, showInfoAlert } from '../../utils/alerts';

interface GeoRoutingPolicyControlProps {
  activePolicy: GeoRoutingPolicy;
  regions: RegionDefinition[];
  primaryRegionId: RegionId;
  evacuatedRegions: RegionId[];
  severedCables: SubseaCableId[];
  onSetPolicy: (policy: GeoRoutingPolicy) => void;
  onSimulateAzOutage: (regionId: RegionId) => void;
  onSeverCable: (cableId: SubseaCableId) => void;
  onHealAll: () => void;
}

export const GeoRoutingPolicyControl: React.FC<GeoRoutingPolicyControlProps> = ({
  activePolicy,
  regions,
  primaryRegionId,
  evacuatedRegions,
  severedCables,
  onSetPolicy,
  onSimulateAzOutage,
  onSeverCable,
  onHealAll,
}) => {
  const policies: {
    id: GeoRoutingPolicy;
    name: string;
    description: string;
    badge: string;
  }[] = [
    {
      id: 'geo-proximity',
      name: 'Geo-Proximity (Haversine)',
      description: 'Routes client requests to the geographically nearest healthy data center based on great-circle distance.',
      badge: 'RECOMMENDED',
    },
    {
      id: 'latency-based',
      name: 'Latency-Based (WAN Probing)',
      description: 'Measures continuous synthetic WAN RTT across regions and routes to the lowest-latency endpoint.',
      badge: 'DYNAMIC',
    },
    {
      id: 'weighted-round-robin',
      name: 'Weighted Round Robin',
      description: 'Distributes ingress traffic proportionally across regions according to assigned compute capacity weights.',
      badge: 'CAPACITY',
    },
    {
      id: 'active-passive',
      name: 'Active-Passive Standby',
      description: 'Directs 100% of traffic to the Primary region. If degraded or evacuated, automatically fails over to hot standby.',
      badge: 'FAILOVER',
    },
    {
      id: 'anycast-bgp',
      name: 'BGP Anycast Shortest Path',
      description: 'Simulates single global VIP routed via shortest BGP Autonomous System path with route withdrawal convergence.',
      badge: 'ANYCAST',
    },
  ];

  const handlePolicyChange = async (policy: GeoRoutingPolicy) => {
    onSetPolicy(policy);
    await showInfoAlert(
      'Routing Policy Switched',
      `Geo-DNS now directing traffic via [${policy.toUpperCase()}]. Client queries will re-converge immediately.`
    );
  };

  const handleDisasterDrill = async (type: 'cable_red_sea' | 'cable_atlantic' | 'primary_az') => {
    if (type === 'cable_red_sea') {
      onSeverCable('asia-europe-gateway');
      await showWarningAlert(
        'Red Sea Subsea Cable Cut!',
        'SEA-ME-WE 5 fiber severed. Europe-to-Asia traffic rerouted around Africa/Pacific (+160ms latency).'
      );
    } else if (type === 'cable_atlantic') {
      onSeverCable('transatlantic-north');
      await showWarningAlert(
        'Transatlantic Fiber Cut!',
        'TAT-14 fiber disrupted. US-East to Europe traffic rerouting via South Atlantic (+135ms latency).'
      );
    } else if (type === 'primary_az') {
      onSimulateAzOutage(primaryRegionId);
      await showWarningAlert(
        'Primary AZ Blackout!',
        `50% compute instances lost in Primary [${primaryRegionId}]. Auto-failover probing active.`
      );
    }
  };

  const handleHealAllClick = async () => {
    onHealAll();
    await showSuccessAlert(
      'Global Infrastructure Restored',
      'All subsea cables repaired and all regional data centers restored to healthy DNS pools.'
    );
  };

  // Calculate live global average latency
  const healthyRegions = regions.filter((r) => r.status !== 'evacuated' && r.status !== 'offline');
  const avgLatency =
    healthyRegions.length > 0
      ? Math.round(healthyRegions.reduce((sum, r) => sum + r.avgLatencyMs, 0) / healthyRegions.length)
      : 0;

  return (
    <div className="flex flex-col space-y-4">
      {/* Global Status Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]/80">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Avg Global Latency</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{avgLatency} ms</div>
          <div className="text-[10px] text-[#778da9] mt-0.5">Across {healthyRegions.length} Active Hubs</div>
        </div>

        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]/80">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Primary Hub</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{primaryRegionId}</div>
          <div className="text-[10px] text-[#778da9] mt-0.5">Global Write Authority</div>
        </div>

        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]/80">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Evacuated Hubs</div>
          <div className={`text-xl font-bold font-mono mt-1 ${evacuatedRegions.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {evacuatedRegions.length} Regions
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">Traffic Drained</div>
        </div>

        <div className="p-3 rounded-xl bg-[#1b263b] border border-[#415a77]/80">
          <div className="text-[10px] text-[#778da9] font-mono uppercase">Subsea Fiber Cables</div>
          <div className={`text-xl font-bold font-mono mt-1 ${severedCables.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {severedCables.length > 0 ? `${severedCables.length} SEVERED` : '5/5 Healthy'}
          </div>
          <div className="text-[10px] text-[#778da9] mt-0.5">Backbone Availability</div>
        </div>
      </div>

      {/* Main Policy Selection Cards */}
      <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-[#e0e1dd]">Geo-DNS Routing Policy Selector</span>
          </div>
          <span className="text-xs font-mono text-[#778da9]">
            Active: <strong className="text-cyan-300 uppercase">{activePolicy}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {policies.map((p) => {
            const isSelected = activePolicy === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handlePolicyChange(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0d1b2a] border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                    : 'bg-[#1b263b]/70 border-[#415a77]/60 hover:border-[#778da9] hover:bg-[#0d1b2a]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#e0e1dd]">{p.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isSelected
                          ? 'bg-cyan-500 text-black'
                          : 'bg-[#0d1b2a] text-[#778da9] border border-[#415a77]/50'
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#778da9] leading-relaxed mb-3">{p.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#415a77]/40 text-[10px] font-mono">
                  <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-[#778da9]'}>
                    {isSelected ? '✓ ACTIVE ROUTING' : 'Click to Activate'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disaster Drills & Injections Bar */}
      <div className="p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-bold text-[#e0e1dd]">Multi-Region Disaster Drills & Chaos</span>
          </div>
          <button
            onClick={handleHealAllClick}
            className="flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Heal All Fiber & Regions
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleDisasterDrill('cable_red_sea')}
            className="p-3 rounded-xl bg-[#0d1b2a] hover:bg-rose-950/30 border border-[#415a77]/60 hover:border-rose-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#e0e1dd] group-hover:text-rose-300">
                Red Sea Cable Sever
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[10px] text-[#778da9] leading-relaxed">
              Cuts SEA-ME-WE 5 fiber gateway. Forces Europe-Asia traffic to reroute (+160ms).
            </p>
          </button>

          <button
            onClick={() => handleDisasterDrill('cable_atlantic')}
            className="p-3 rounded-xl bg-[#0d1b2a] hover:bg-rose-950/30 border border-[#415a77]/60 hover:border-rose-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#e0e1dd] group-hover:text-rose-300">
                Atlantic Storm Disruption
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[10px] text-[#778da9] leading-relaxed">
              Sever TAT-14 transatlantic cable. Tests US-Europe multi-hop failover resiliency.
            </p>
          </button>

          <button
            onClick={() => handleDisasterDrill('primary_az')}
            className="p-3 rounded-xl bg-[#0d1b2a] hover:bg-rose-950/30 border border-[#415a77]/60 hover:border-rose-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#e0e1dd] group-hover:text-rose-300">
                Primary AZ Blackout
              </span>
              <Zap className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-[10px] text-[#778da9] leading-relaxed">
              Knocks out 50% capacity in Primary [us-east-1] and triggers automated election.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
