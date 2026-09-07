import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  FileCode,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  Radio,
  Anchor,
  ShieldAlert,
} from 'lucide-react';
import { TelemetrySnapshot } from '../../engine/OpenTelemetryExporter';
import { showSuccessAlert } from '../../utils/alerts';

interface TelemetryMetricsConsoleProps {
  snapshot: TelemetrySnapshot;
  prometheusText: string;
  otlpJson: string;
}

export const TelemetryMetricsConsole: React.FC<TelemetryMetricsConsoleProps> = ({
  snapshot,
  prometheusText,
  otlpJson,
}) => {
  const [activeTab, setActiveTab] = useState<'red' | 'prometheus' | 'otlp'>('red');

  const handleCopyPrometheus = async () => {
    try {
      await navigator.clipboard.writeText(prometheusText);
      await showSuccessAlert(
        'Prometheus Metrics Copied!',
        'Prometheus text exposition format (# HELP / # TYPE) copied to clipboard.'
      );
    } catch {
      // Fallback
    }
  };

  const handleCopyOTLP = async () => {
    try {
      await navigator.clipboard.writeText(otlpJson);
      await showSuccessAlert(
        'OTLP JSON Copied!',
        'OpenTelemetry Protocol v1 ResourceSpans JSON copied to clipboard.'
      );
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Sub-tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1b263b] rounded-xl border border-[#415a77]">
        <div className="flex items-center gap-1.5 bg-[#0d1b2a] p-1 rounded-lg border border-[#415a77]/60">
          <button
            onClick={() => setActiveTab('red')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'red'
                ? 'bg-[#415a77] text-[#e0e1dd] shadow'
                : 'text-[#778da9] hover:text-[#e0e1dd]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-300" />
            RED Metrics Dashboard
          </button>
          <button
            onClick={() => setActiveTab('prometheus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'prometheus'
                ? 'bg-[#415a77] text-[#e0e1dd] shadow'
                : 'text-[#778da9] hover:text-[#e0e1dd]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-300" />
            Prometheus Exposition (/metrics)
          </button>
          <button
            onClick={() => setActiveTab('otlp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'otlp'
                ? 'bg-[#415a77] text-[#e0e1dd] shadow'
                : 'text-[#778da9] hover:text-[#e0e1dd]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-purple-300" />
            OTLP v1 JSON Payload
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'prometheus' && (
            <button
              onClick={handleCopyPrometheus}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Prometheus Scrape
            </button>
          )}

          {activeTab === 'otlp' && (
            <button
              onClick={handleCopyOTLP}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy OTLP JSON
            </button>
          )}

          <span className="text-[11px] font-mono text-[#778da9] bg-[#0d1b2a] px-2.5 py-1 rounded border border-[#415a77]">
            OPEN_TELEMETRY v1.24
          </span>
        </div>
      </div>

      {/* Tab 1: RED Metrics Dashboard */}
      {activeTab === 'red' && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {/* Top 3 RED Cards: Rate, Errors, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Rate */}
            <div className="p-4 bg-[#1b263b] rounded-xl border border-[#415a77] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#778da9] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Rate (Throughput)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  LIVE
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-[#e0e1dd]">
                {snapshot.throughputRps} <span className="text-sm font-normal text-[#778da9]">req/s</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#778da9] font-mono pt-1 border-t border-[#415a77]/50">
                <span>Total: {snapshot.totalRequests.toLocaleString()}</span>
                <span className="text-emerald-400">200 OK: {snapshot.successfulRequests.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. Errors */}
            <div className="p-4 bg-[#1b263b] rounded-xl border border-[#415a77] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#778da9] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Errors & Shedding
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    snapshot.rateLimited429Requests + snapshot.circuitBroken503Requests > 0
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {snapshot.rateLimited429Requests + snapshot.circuitBroken503Requests > 0
                    ? 'SHEDDING'
                    : 'NOMINAL'}
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-[#e0e1dd]">
                {(
                  ((snapshot.rateLimited429Requests +
                    snapshot.circuitBroken503Requests +
                    snapshot.timeout504Requests +
                    snapshot.serverError500Requests) /
                    Math.max(1, snapshot.totalRequests)) *
                  100
                ).toFixed(1)}
                <span className="text-sm font-normal text-[#778da9]"> %</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#778da9] font-mono pt-1 border-t border-[#415a77]/50">
                <span className="text-amber-300">429: {snapshot.rateLimited429Requests}</span>
                <span className="text-rose-400">503: {snapshot.circuitBroken503Requests}</span>
                <span>504: {snapshot.timeout504Requests}</span>
              </div>
            </div>

            {/* 3. Duration (P99 Latency) */}
            <div className="p-4 bg-[#1b263b] rounded-xl border border-[#415a77] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#778da9] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Duration (P99 Tail)
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    snapshot.p99LatencyMs > 100
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  SLA: 100ms
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-[#e0e1dd]">
                {snapshot.p99LatencyMs} <span className="text-sm font-normal text-[#778da9]">ms</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#778da9] font-mono pt-1 border-t border-[#415a77]/50">
                <span>Avg: {snapshot.avgLatencyMs} ms</span>
                <span className="text-cyan-300">P50: {snapshot.p50LatencyMs} ms</span>
              </div>
            </div>
          </div>

          {/* Latency Percentile Histogram Bar Curve */}
          <div className="p-4 bg-[#1b263b] rounded-xl border border-[#415a77] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Sliding-Window Latency Distribution (Histogram Percentiles)
              </span>
              <span className="text-[11px] font-mono text-[#778da9]">
                P50 ➔ P90 ➔ P95 ➔ P99
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {/* P50 */}
              <div className="p-3 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 space-y-1">
                <div className="text-[10px] font-mono text-[#778da9] uppercase">P50 Median</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {snapshot.p50LatencyMs} ms
                </div>
                <div className="w-full bg-[#1b263b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (snapshot.p50LatencyMs / 120) * 100)}%` }}
                  />
                </div>
              </div>

              {/* P90 */}
              <div className="p-3 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 space-y-1">
                <div className="text-[10px] font-mono text-[#778da9] uppercase">P90 Fast Tail</div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {snapshot.p90LatencyMs} ms
                </div>
                <div className="w-full bg-[#1b263b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (snapshot.p90LatencyMs / 120) * 100)}%` }}
                  />
                </div>
              </div>

              {/* P95 */}
              <div className="p-3 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 space-y-1">
                <div className="text-[10px] font-mono text-[#778da9] uppercase">P95 SLA Boundary</div>
                <div className="text-lg font-bold font-mono text-amber-300">
                  {snapshot.p95LatencyMs} ms
                </div>
                <div className="w-full bg-[#1b263b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (snapshot.p95LatencyMs / 120) * 100)}%` }}
                  />
                </div>
              </div>

              {/* P99 */}
              <div className="p-3 bg-[#0d1b2a] rounded-lg border border-[#415a77]/60 space-y-1">
                <div className="text-[10px] font-mono text-[#778da9] uppercase">P99 Outlier Tail</div>
                <div
                  className={`text-lg font-bold font-mono ${
                    snapshot.p99LatencyMs > 100 ? 'text-rose-400' : 'text-purple-300'
                  }`}
                >
                  {snapshot.p99LatencyMs} ms
                </div>
                <div className="w-full bg-[#1b263b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      snapshot.p99LatencyMs > 100 ? 'bg-rose-500' : 'bg-purple-400'
                    }`}
                    style={{ width: `${Math.min(100, (snapshot.p99LatencyMs / 120) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Auxiliary Cluster Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#1b263b] rounded-xl border border-[#415a77] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">Active Workers</div>
                <div className="text-base font-bold font-mono text-[#e0e1dd]">
                  {snapshot.activeServers} Nodes
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1b263b] rounded-xl border border-[#415a77] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">Cache Hit Ratio</div>
                <div className="text-base font-bold font-mono text-[#e0e1dd]">
                  {snapshot.cacheHitRatio.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1b263b] rounded-xl border border-[#415a77] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Anchor className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">Bulkhead Threads</div>
                <div className="text-base font-bold font-mono text-[#e0e1dd]">
                  {Object.values(snapshot.bulkheadThreads).reduce((a, b) => a + b, 0)} In-Flight
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1b263b] rounded-xl border border-[#415a77] flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  snapshot.circuitBreakerTripped
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#778da9] uppercase">Circuit Breaker</div>
                <div className="text-base font-bold font-mono text-[#e0e1dd]">
                  {snapshot.circuitBreakerTripped ? 'TRIPPED (OPEN)' : 'HEALTHY (CLOSED)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prometheus Exposition (/metrics) */}
      {activeTab === 'prometheus' && (
        <div className="flex-1 flex flex-col bg-[#1b263b] rounded-xl border border-[#415a77] overflow-hidden">
          <div className="p-3 border-b border-[#415a77] bg-[#0d1b2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                HTTP GET
              </span>
              <span className="text-xs font-mono text-cyan-300">
                http://localhost:5174/metrics
              </span>
              <span className="text-[10px] font-mono text-[#778da9]">
                text/plain; version=0.0.4
              </span>
            </div>

            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Scrape Ready
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-[#e0e1dd] bg-[#0d1b2a]/90 selection:bg-cyan-500/30 selection:text-cyan-200">
            <pre className="whitespace-pre leading-relaxed">{prometheusText}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: OTLP v1 JSON Payload */}
      {activeTab === 'otlp' && (
        <div className="flex-1 flex flex-col bg-[#1b263b] rounded-xl border border-[#415a77] overflow-hidden">
          <div className="p-3 border-b border-[#415a77] bg-[#0d1b2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                POST
              </span>
              <span className="text-xs font-mono text-purple-300">
                /v1/traces (application/json)
              </span>
              <span className="text-[10px] font-mono text-[#778da9]">
                OTLP ResourceSpans Schema
              </span>
            </div>

            <span className="text-[10px] font-mono text-purple-300">
              Compatible: Jaeger • Tempo • Datadog
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-cyan-300 bg-[#0d1b2a]/90 selection:bg-purple-500/30 selection:text-purple-200">
            <pre className="whitespace-pre leading-relaxed">{otlpJson}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
