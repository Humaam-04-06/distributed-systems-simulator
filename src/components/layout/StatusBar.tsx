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
      label: 'System Healthy',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    DEGRADED: {
      variant: 'amber' as const,
      label: 'System Degraded',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    CRITICAL: {
      variant: 'crimson' as const,
      label: 'Critical Congestion',
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    COLLAPSED: {
      variant: 'crimson' as const,
      label: 'System Collapse 💀',
      icon: <Flame className="w-3.5 h-3.5" />,
    },
  };

  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const current = statusBadge[status];

  return (
    <footer className="bg-surface/90 border-t border-surface-border px-5 py-2 flex items-center justify-between text-xs font-sans text-slate-400 sticky bottom-0 z-40 select-none backdrop-blur-md">
      {/* Left: Overall Health Badge */}
      <div className="flex items-center gap-3">
        <Badge variant={current.variant} size="sm" pulse>
          <span className="flex items-center gap-1.5 font-sans font-medium">
            {current.icon}
            {current.label}
          </span>
        </Badge>

        <div className="h-3 w-px bg-surface-border" />

        {/* Server Fleet State */}
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-mono text-[11px]">SERVERS:</span>
          <span
            className={`font-mono text-[11px] font-semibold ${
              activeServers === totalServers
                ? 'text-emerald-400'
                : activeServers > 0
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {activeServers}/{totalServers} Online
          </span>
        </div>

        <div className="h-3 w-px bg-surface-border" />

        {/* Database State */}
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-mono text-[11px]">DB PRIMARY:</span>
          <span
            className={`font-mono text-[11px] font-semibold ${
              dbHealthy ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {dbHealthy ? 'Synced' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Right: Telemetry Summaries */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-mono text-[11px]">P99 LATENCY:</span>
          <span
            className={`font-mono font-semibold ${
              avgLatency > 400
                ? 'text-rose-400'
                : avgLatency > 200
                ? 'text-amber-400'
                : 'text-slate-200'
            }`}
          >
            {avgLatency.toFixed(0)} ms
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px]">ERROR RATE:</span>
          <span
            className={`font-mono font-semibold ${
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
          <span className="text-slate-400 font-mono text-[11px]">TOTAL PROCESSED:</span>
          <span className="font-mono font-semibold text-slate-200">
            {totalRequests.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-mono text-[11px]">UPTIME:</span>
          <span className="font-mono text-slate-300">{formatUptime(uptimeSeconds)}</span>
        </div>
      </div>
    </footer>
  );
};
