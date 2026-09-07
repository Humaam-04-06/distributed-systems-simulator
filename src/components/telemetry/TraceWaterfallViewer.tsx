import React, { useState, useMemo } from 'react';
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Zap,
  Server,
  Database,
  Radio,
  Anchor,
  XCircle,
} from 'lucide-react';
import { Trace, Span } from '../../engine/DistributedTracer';
import { showSuccessAlert } from '../../utils/alerts';

interface TraceWaterfallViewerProps {
  traces: Trace[];
  selectedTrace: Trace | null;
  onSelectTrace: (trace: Trace | null) => void;
  onInspectTrace: (trace: Trace) => void;
  onClearTraces?: () => void;
}

export const TraceWaterfallViewer: React.FC<TraceWaterfallViewerProps> = ({
  traces,
  selectedTrace,
  onSelectTrace,
  onInspectTrace,
  onClearTraces,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'slow'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter traces
  const filteredTraces = useMemo(() => {
    return traces.filter((t) => {
      // 1. Filter type check
      if (filterType === 'errors' && !t.hasErrors) return false;
      if (filterType === 'slow' && t.totalDurationMs < 50) return false;

      // 2. Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRoute = t.route.toLowerCase().includes(query);
        const matchesId = t.traceId.toLowerCase().includes(query);
        const matchesTenant = t.tenantTier.toLowerCase().includes(query);
        if (!matchesRoute && !matchesId && !matchesTenant) return false;
      }

      return true;
    });
  }, [traces, filterType, searchQuery]);

  // Current active trace for waterfall
  const activeTrace = selectedTrace || (filteredTraces.length > 0 ? filteredTraces[0] : null);

  const handleCopyTraceparent = async (traceparent: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(traceparent);
      await showSuccessAlert(
        'W3C Traceparent Copied!',
        `Header copied to clipboard:\n${traceparent}`
      );
    } catch {
      // Fallback
    }
  };

  const getSpanColor = (span: Span): string => {
    if (span.status.code === 'ERROR') return 'bg-rose-500 shadow-rose-500/50';
    if (span.name.includes('gateway')) return 'bg-cyan-400 shadow-cyan-400/50';
    if (span.name.includes('cache')) {
      return span.attributes['cache.hit'] ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-amber-400 shadow-amber-400/50';
    }
    if (span.name.includes('bulkhead')) return 'bg-indigo-400 shadow-indigo-400/50';
    if (span.name.includes('worker') || span.name.includes('compute')) return 'bg-sky-400 shadow-sky-400/50';
    if (span.name.includes('database') || span.name.includes('db')) return 'bg-purple-400 shadow-purple-400/50';
    return 'bg-[#778da9] shadow-[#778da9]/50';
  };

  const getSpanIcon = (name: string) => {
    if (name.includes('gateway')) return <Zap className="w-3.5 h-3.5 text-cyan-300" />;
    if (name.includes('cache')) return <Radio className="w-3.5 h-3.5 text-amber-300" />;
    if (name.includes('bulkhead')) return <Anchor className="w-3.5 h-3.5 text-indigo-300" />;
    if (name.includes('worker') || name.includes('compute')) return <Server className="w-3.5 h-3.5 text-sky-300" />;
    if (name.includes('database') || name.includes('db')) return <Database className="w-3.5 h-3.5 text-purple-300" />;
    return <Layers className="w-3.5 h-3.5 text-[#778da9]" />;
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#1b263b] rounded-xl border border-[#415a77]">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0d1b2a] rounded-lg p-1 border border-[#415a77]/60">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filterType === 'all'
                  ? 'bg-[#415a77] text-[#e0e1dd] shadow'
                  : 'text-[#778da9] hover:text-[#e0e1dd]'
              }`}
            >
              All ({traces.length})
            </button>
            <button
              onClick={() => setFilterType('errors')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filterType === 'errors'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-[#778da9] hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Errors ({traces.filter((t) => t.hasErrors).length})
            </button>
            <button
              onClick={() => setFilterType('slow')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filterType === 'slow'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-[#778da9] hover:text-amber-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              Slow &gt;50ms ({traces.filter((t) => t.totalDurationMs >= 50).length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#778da9]" />
            <input
              type="text"
              placeholder="Search route or trace ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg bg-[#0d1b2a] border border-[#415a77] text-[#e0e1dd] placeholder-[#778da9] focus:outline-none focus:border-cyan-400 w-52"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClearTraces && (
            <button
              onClick={onClearTraces}
              className="text-xs text-[#778da9] hover:text-rose-400 px-2.5 py-1 rounded bg-[#0d1b2a] border border-[#415a77] transition-all"
            >
              Clear Buffer
            </button>
          )}
          <span className="text-[11px] font-mono text-cyan-300 px-2.5 py-1 rounded bg-[#0d1b2a] border border-[#415a77]">
            {filteredTraces.length} / {traces.length} TRACES
          </span>
        </div>
      </div>

      {/* Main Split: Trace List + Waterfall Gantt Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[500px]">
        {/* Left Column: Trace List (4 cols) */}
        <div className="lg:col-span-4 bg-[#1b263b] rounded-xl border border-[#415a77] flex flex-col overflow-hidden">
          <div className="p-2.5 border-b border-[#415a77] bg-[#0d1b2a]/60 flex items-center justify-between">
            <span className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Recent Trace Requests
            </span>
            <span className="text-[10px] font-mono text-[#778da9]">W3C Context</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#415a77]/40 max-h-[520px]">
            {filteredTraces.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-[#778da9] space-y-2">
                <Layers className="w-8 h-8 opacity-40 text-cyan-400" />
                <p className="text-xs">No distributed traces match filter criteria.</p>
                <p className="text-[11px] text-[#778da9]/70">Run traffic or clear filters to view live traces.</p>
              </div>
            ) : (
              filteredTraces.map((trace) => {
                const isSelected = activeTrace?.traceId === trace.traceId;
                const isError = trace.hasErrors;
                const isSlow = trace.totalDurationMs >= 50;

                return (
                  <div
                    key={trace.traceId}
                    onClick={() => onSelectTrace(trace)}
                    className={`p-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#415a77]/40 border-l-4 border-cyan-400'
                        : 'hover:bg-[#0d1b2a]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        {isError ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="text-xs font-mono font-semibold text-[#e0e1dd] truncate max-w-[130px]">
                          {trace.route}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isError
                            ? 'bg-rose-500/20 text-rose-300'
                            : isSlow
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {trace.httpStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#778da9] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300">{trace.totalDurationMs}ms</span>
                        <span>•</span>
                        <span>{trace.spans.length} spans</span>
                      </div>
                      <span className="uppercase text-[9px] px-1 rounded bg-[#0d1b2a] text-[#778da9] border border-[#415a77]/50">
                        {trace.tenantTier}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Waterfall Gantt Chart (8 cols) */}
        <div className="lg:col-span-8 bg-[#1b263b] rounded-xl border border-[#415a77] flex flex-col overflow-hidden">
          {activeTrace ? (
            <>
              {/* Selected Trace Header */}
              <div className="p-3.5 border-b border-[#415a77] bg-[#0d1b2a]/80 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      POST
                    </span>
                    <span className="text-sm font-mono font-bold text-[#e0e1dd]">
                      {activeTrace.route}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                        activeTrace.hasErrors
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      HTTP {activeTrace.httpStatus}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 bg-[#1b263b] px-2 py-0.5 rounded border border-[#415a77]">
                      {activeTrace.totalDurationMs} ms
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#778da9]">
                    <span>Trace:</span>
                    <span className="text-[#e0e1dd] select-all">{activeTrace.traceId}</span>
                    <button
                      onClick={(e) => handleCopyTraceparent(activeTrace.traceparent, e)}
                      title="Copy W3C traceparent"
                      className="text-cyan-400 hover:text-cyan-200 transition-colors ml-1"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <span>•</span>
                    <span className="text-indigo-300 uppercase">Tenant: {activeTrace.tenantTier}</span>
                  </div>
                </div>

                <button
                  onClick={() => onInspectTrace(activeTrace)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Inspect OTel Spans
                </button>
              </div>

              {/* Waterfall Timeline View */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* Time Axis Ruler */}
                <div className="relative h-6 border-b border-[#415a77] text-[10px] font-mono text-[#778da9]">
                  <span className="absolute left-0 top-0">0 ms</span>
                  <span className="absolute left-1/4 top-0 -translate-x-1/2">
                    {(activeTrace.totalDurationMs * 0.25).toFixed(1)} ms
                  </span>
                  <span className="absolute left-2/4 top-0 -translate-x-1/2">
                    {(activeTrace.totalDurationMs * 0.5).toFixed(1)} ms
                  </span>
                  <span className="absolute left-3/4 top-0 -translate-x-1/2">
                    {(activeTrace.totalDurationMs * 0.75).toFixed(1)} ms
                  </span>
                  <span className="absolute right-0 top-0">
                    {activeTrace.totalDurationMs.toFixed(1)} ms
                  </span>
                </div>

                {/* Spans Gantt Bars */}
                <div className="space-y-2.5">
                  {activeTrace.spans.map((span) => {
                    const traceStart = activeTrace.startTimeMs;
                    const traceTotal = Math.max(0.1, activeTrace.totalDurationMs);
                    const offsetMs = Math.max(0, span.startTimeMs - traceStart);
                    const leftPct = Math.min(95, Math.max(0, (offsetMs / traceTotal) * 100));
                    const widthPct = Math.min(
                      100 - leftPct,
                      Math.max(4, (span.durationMs / traceTotal) * 100)
                    );

                    return (
                      <div
                        key={span.spanId}
                        className="p-2 rounded-lg bg-[#0d1b2a]/60 border border-[#415a77]/50 hover:border-cyan-500/40 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            {getSpanIcon(span.name)}
                            <span className="font-bold text-[#e0e1dd]">{span.name}</span>
                            <span className="text-[10px] text-[#778da9] px-1.5 py-0.2 rounded bg-[#1b263b] border border-[#415a77]/60">
                              {span.kind}
                            </span>
                            {span.attributes['cluster.node_id'] && (
                              <span className="text-[10px] text-cyan-300 font-semibold">
                                @{span.attributes['cluster.node_id']}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {span.status.code === 'ERROR' && (
                              <span className="text-[10px] text-rose-400 font-bold">ERROR</span>
                            )}
                            <span className="text-xs font-bold text-cyan-300">
                              {span.durationMs} ms
                            </span>
                          </div>
                        </div>

                        {/* Gantt Bar Track */}
                        <div className="relative h-3 bg-[#1b263b] rounded-full overflow-hidden border border-[#415a77]/40">
                          <div
                            className={`absolute h-full rounded-full transition-all duration-300 ${getSpanColor(
                              span
                            )}`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                          />
                        </div>

                        {/* Metadata Snippet */}
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#778da9]">
                          <span>ID: {span.spanId.slice(0, 8)}...</span>
                          {span.attributes['cache.hit'] !== undefined && (
                            <span
                              className={
                                span.attributes['cache.hit']
                                  ? 'text-emerald-400 font-semibold'
                                  : 'text-amber-400 font-semibold'
                              }
                            >
                              cache.hit: {String(span.attributes['cache.hit'])}
                            </span>
                          )}
                          {span.attributes['bulkhead.domain'] && (
                            <span className="text-indigo-300">
                              bulkhead: {span.attributes['bulkhead.domain']}
                            </span>
                          )}
                          {span.events.length > 0 && (
                            <span className="text-cyan-400">
                              {span.events.length} checkpoint events
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#778da9] space-y-2">
              <Layers className="w-10 h-10 opacity-30 text-cyan-400" />
              <p className="text-sm font-semibold text-[#e0e1dd]">No Active Trace Selected</p>
              <p className="text-xs">
                Select a trace from the left panel to inspect its OpenTelemetry span timeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
