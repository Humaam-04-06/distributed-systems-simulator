import React from 'react';
import {
  Server,
  Database,
  Gauge,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export type ClusterStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'COLLAPSED';

export interface StatusBarProps {
  status: ClusterStatus;
  activeServers: number;
  totalServers: number;
  dbHealthy: boolean;
  totalRequests: number;
  errorRate: number;
  avgLatency: number;
  uptimeSeconds: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  activeServers,
  totalServers,
  dbHealthy,
  totalRequests,
  errorRate,
  avgLatency,
  uptimeSeconds,
}) => {
  const statusBadge = {
    HEALTHY: {
      variant: 'emerald' as const,
      label: 'SYSTEM HEALTHY',
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    DEGRADED: {
      variant: 'amber' as const,
      label: 'SYSTEM DEGRADED',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    CRITICAL: {
      variant: 'crimson' as const,
      label: 'CRITICAL CONGESTION',
      icon: <Flame className="w-3 h-3" />,
    },
    COLLAPSED: {
      variant: 'crimson' as const,
      label: '💀 SYSTEM COLLAPSE',
      icon: <Flame className="w-3 h-3" />,
    },
  };

  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const current = statusBadge[status];

  return (
    <footer className="glass-panel border-t border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-slate-400 sticky bottom-0 z-40 select-none">
      {/* Left: Overall Health Badge */}
      <div className="flex items-center gap-3">
        <Badge variant={current.variant} size="sm" pulse>
          <span className="flex items-center gap-1">
            {current.icon}
            {current.label}
          </span>
        </Badge>

        <div className="h-3 w-px bg-slate-800" />

        {/* Server Fleet State */}
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span>SERVERS:</span>
          <span
            className={`font-bold ${
              activeServers === totalServers
                ? 'text-emerald-400'
                : activeServers > 0
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {activeServers}/{totalServers} ALIVE
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Database State */}
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>DB LEADER:</span>
          <span
            className={`font-bold ${
              dbHealthy ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
            }`}
          >
            {dbHealthy ? 'SYNCED' : 'UNAVAILABLE'}
          </span>
        </div>
      </div>

      {/* Right: Telemetry Summaries */}
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-slate-500" />
          <span>LATENCY:</span>
          <span
            className={`font-bold ${
              avgLatency > 400
                ? 'text-rose-400'
                : avgLatency > 200
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}
          >
            {avgLatency.toFixed(0)} ms
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>ERROR RATE:</span>
          <span
            className={`font-bold ${
              errorRate > 15
                ? 'text-rose-400'
                : errorRate > 5
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {errorRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>TOTAL PROCESSED:</span>
          <span className="font-bold text-slate-200">
            {totalRequests.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>UPTIME:</span>
          <span className="text-slate-300">{formatUptime(uptimeSeconds)}</span>
        </div>
      </div>
    </footer>
  );
};
