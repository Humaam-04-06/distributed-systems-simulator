import React from 'react';
import {
  Anchor,
  Database,
  Users,
  Flame,
  RotateCcw,
  Radio,
  Lock,
  Unlock,
} from 'lucide-react';
import { BulkheadPoolMetrics, BulkheadDomain } from '../../engine/ThreadPoolBulkhead';
import { ConnectionPoolMetrics } from '../../engine/ConnectionPoolBulkhead';
import { TenantQuota, TenantTier } from '../../engine/TenantBulkheadQuarantine';
import { BulkheadCompartmentCard } from './BulkheadCompartmentCard';
import { showWarningAlert, showSuccessAlert } from '../../utils/alerts';

interface BulkheadClusterViewProps {
  poolMetrics: BulkheadPoolMetrics[];
  connPoolMetrics: ConnectionPoolMetrics;
  tenantQuotas: TenantQuota[];
  isNoisyNeighborActive: boolean;
  onSetPoolCapacity: (domain: BulkheadDomain, maxConcurrency: number, maxQueue: number) => void;
  onToggleTenantQuarantine: (tier: TenantTier) => void;
  onTriggerNoisyNeighborSurge: () => void;
  onResetBulkheads: () => void;
}

export const BulkheadClusterView: React.FC<BulkheadClusterViewProps> = ({
  poolMetrics,
  connPoolMetrics,
  tenantQuotas,
  isNoisyNeighborActive,
  onSetPoolCapacity,
  onToggleTenantQuarantine,
  onTriggerNoisyNeighborSurge,
  onResetBulkheads,
}) => {
  const handleTriggerNoisyNeighbor = async () => {
    onTriggerNoisyNeighborSurge();
    await showWarningAlert(
      'Noisy Neighbor Surge Triggered!',
      'Free-tier tenant flooded with 1,200 requests! Bulkhead quarantine has isolated the rogue traffic, keeping Payment & Checkout 100% stable with 0ms added latency.'
    );
  };

  const handleToggleQuarantineClick = async (tier: TenantTier, currentlyQuarantined: boolean) => {
    onToggleTenantQuarantine(tier);
    if (!currentlyQuarantined) {
      await showWarningAlert(
        'Tenant Quarantined',
        `Tenant [${tier.toUpperCase()}] isolated in sandbox queue. Execution ceiling restricted to 20% capacity.`
      );
    } else {
      await showSuccessAlert(
        'Quarantine Lifted',
        `Tenant [${tier.toUpperCase()}] restored to normal concurrency quota.`
      );
    }
  };

  const saturatedCount = poolMetrics.filter((p) => p.saturationState === 'saturated').length;
  const totalNoisyShed = tenantQuotas.reduce((acc, t) => acc + t.noisyNeighborShedCount, 0);

  return (
    <div className="rounded-xl border border-[#415a77] bg-[#0d1b2a] p-5 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#415a77]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#e0e1dd]">
                Bulkhead Pattern & Resource Pool Isolation
              </h2>
              {isNoisyNeighborActive && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold animate-pulse">
                  NOISY NEIGHBOR SURGE
                </span>
              )}
            </div>
            <p className="text-xs text-[#778da9]">
              Watertight thread partitions, database connection pooling & multi-tenant quarantine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerNoisyNeighbor}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition shadow-md"
          >
            <Flame className="w-4 h-4" />
            Inject Noisy Neighbor
          </button>
          <button
            onClick={onResetBulkheads}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#415a77] text-[#e0e1dd] hover:bg-[#778da9] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Top Telemetry HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Watertight Compartments</span>
          <span className="text-lg font-bold font-mono text-[#e0e1dd]">
            3 Pools Active
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            Checkout (T0) Protected
          </span>
        </div>

        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Saturated Compartments</span>
          <span
            className={`text-lg font-bold font-mono ${
              saturatedCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {saturatedCount} / 3
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            {saturatedCount > 0 ? 'Isolated; other pools safe' : 'All pools nominal'}
          </span>
        </div>

        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">DB Connection Pool</span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {connPoolMetrics.activeLeased} / {connPoolMetrics.maxPoolSize} ({connPoolMetrics.poolUtilizationPercentage}%)
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            Idle: {connPoolMetrics.idleCount} conn
          </span>
        </div>

        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-3">
          <span className="text-[11px] text-[#778da9] block">Noisy Neighbor Shed</span>
          <span
            className={`text-lg font-bold font-mono ${
              totalNoisyShed > 0 ? 'text-amber-300' : 'text-[#778da9]'
            }`}
          >
            {totalNoisyShed} reqs
          </span>
          <span className="text-[10px] text-[#778da9] block mt-0.5">
            Enterprise SLA: 100% Clean
          </span>
        </div>
      </div>

      {/* Domain Thread Pool Bulkheads Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#415a77]/50">
          <h3 className="text-xs font-bold text-[#e0e1dd] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Domain Thread Pool Bulkheads
          </h3>
          <span className="text-[10px] text-[#778da9]">
            CPU / Worker Concurrency Compartments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {poolMetrics.map((pool) => (
            <BulkheadCompartmentCard
              key={pool.domain}
              metrics={pool}
              onCapacityChange={onSetPoolCapacity}
            />
          ))}
        </div>
      </div>

      {/* Database Connection Pool & Multi-Tenant Quotas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Database Connection Pool Compartment */}
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#415a77]">
            <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-300" />
              Database Connection Pool Bulkhead
            </span>
            <span className="text-[10px] text-[#778da9] font-mono">
              TCP Pool Bounds
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#778da9]">Active Leased Connections</span>
              <span className="text-[#e0e1dd] font-bold">
                {connPoolMetrics.activeLeased} / {connPoolMetrics.maxPoolSize}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0d1b2a] overflow-hidden border border-[#415a77]/50">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${connPoolMetrics.poolUtilizationPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
              <span className="text-[10px] text-[#778da9] block">Waiting Queue</span>
              <span className="text-xs font-bold font-mono text-[#e0e1dd]">
                {connPoolMetrics.queuedRequests} / {connPoolMetrics.maxWaitQueue}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
              <span className="text-[10px] text-[#778da9] block">Pool Exhaustions</span>
              <span
                className={`text-xs font-bold font-mono ${
                  connPoolMetrics.exhaustionCount > 0 ? 'text-rose-400' : 'text-[#778da9]'
                }`}
              >
                {connPoolMetrics.exhaustionCount}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
              <span className="text-[10px] text-[#778da9] block">Leases Served</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                {connPoolMetrics.totalLeasesFulfilled}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Quota & Quarantine Panel */}
        <div className="rounded-xl border border-[#415a77] bg-[#1b263b] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#415a77]">
            <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-300" />
              Tenant Concurrency Quotas & Quarantine
            </span>
            <span className="text-[10px] text-[#778da9] font-mono">
              Noisy Neighbor Shield
            </span>
          </div>

          <div className="space-y-2">
            {tenantQuotas.map((tenant) => (
              <div
                key={tenant.tier}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#e0e1dd]">
                      {tenant.displayName}
                    </span>
                    <span className="text-[10px] text-[#778da9] font-mono">
                      SLA: {tenant.slaTarget}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#778da9] font-mono mt-0.5">
                    Concurrency: {tenant.activeConcurrency} / {tenant.concurrencyLimit} (Burst: +{tenant.burstAllowance})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                      tenant.isQuarantined
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {tenant.isQuarantined ? 'Quarantined' : 'Protected'}
                  </span>
                  <button
                    onClick={() => handleToggleQuarantineClick(tenant.tier, tenant.isQuarantined)}
                    className="p-1 rounded text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#415a77] transition"
                    title={tenant.isQuarantined ? 'Lift quarantine' : 'Quarantine tenant'}
                  >
                    {tenant.isQuarantined ? (
                      <Unlock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
