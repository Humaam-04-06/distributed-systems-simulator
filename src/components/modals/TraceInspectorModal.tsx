import React, { useState } from 'react';
import {
  X,
  Layers,
  Copy,
  Clock,
  FileCode,
  Zap,
  Server,
  Radio,
  Anchor,
  Database,
  Sparkles,
} from 'lucide-react';
import { Trace, Span } from '../../engine/DistributedTracer';
import { showSuccessAlert } from '../../utils/alerts';

interface TraceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: Trace | null;
}

export const TraceInspectorModal: React.FC<TraceInspectorModalProps> = ({
  isOpen,
  onClose,
  trace,
}) => {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'inspector' | 'json'>('inspector');

  if (!isOpen || !trace) return null;

  const activeSpan: Span =
    trace.spans.find((s) => s.spanId === selectedSpanId) || trace.spans[0];

  // Identify bottleneck span (longest duration)
  const longestSpan = [...trace.spans].sort((a, b) => b.durationMs - a.durationMs)[0];
  const bottleneckPct =
    trace.totalDurationMs > 0
      ? Math.round((longestSpan.durationMs / trace.totalDurationMs) * 100)
      : 0;

  const handleCopyTraceparent = async () => {
    try {
      await navigator.clipboard.writeText(trace.traceparent);
      await showSuccessAlert(
        'Traceparent Copied!',
        `W3C Traceparent:\n${trace.traceparent}`
      );
    } catch {
      // Fallback
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
      await showSuccessAlert('Trace JSON Copied!', 'Full OpenTelemetry trace JSON copied to clipboard.');
    } catch {
      // Fallback
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0d1b2a] border border-[#415a77] shadow-2xl p-6 text-[#e0e1dd] space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#e0e1dd] font-mono">
                  {trace.name}
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    trace.hasErrors
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  HTTP {trace.httpStatus}
                </span>
                <span className="text-xs font-mono text-cyan-300 bg-[#1b263b] px-2 py-0.5 rounded border border-[#415a77]">
                  {trace.totalDurationMs} ms
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#778da9] mt-0.5">
                <span>W3C Traceparent:</span>
                <span className="text-cyan-300 select-all">{trace.traceparent}</span>
                <button
                  onClick={handleCopyTraceparent}
                  title="Copy W3C header"
                  className="text-cyan-400 hover:text-cyan-200 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1b263b] rounded-lg p-0.5 border border-[#415a77]">
              <button
                onClick={() => setViewMode('inspector')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'inspector'
                    ? 'bg-[#415a77] text-[#e0e1dd]'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                Span Inspector
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'json'
                    ? 'bg-[#415a77] text-[#e0e1dd]'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                Raw JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#1b263b] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottleneck Diagnostic Bar */}
        <div className="p-3 bg-[#1b263b] rounded-xl border border-[#415a77] flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[#778da9]">Bottleneck Analysis:</span>
            <span className="font-bold text-[#e0e1dd]">
              [{longestSpan.name}] consumed {longestSpan.durationMs}ms ({bottleneckPct}% of total duration)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#778da9]">Spans in Tree: {trace.spans.length}</span>
            <span className="uppercase px-1.5 py-0.5 rounded bg-[#0d1b2a] text-indigo-300 border border-[#415a77]">
              {trace.tenantTier} SLA
            </span>
          </div>
        </div>

        {/* Main Body */}
        {viewMode === 'inspector' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 overflow-hidden">
            {/* Left Span Tree Selector (4 cols) */}
            <div className="md:col-span-4 bg-[#1b263b] rounded-xl border border-[#415a77] p-2 overflow-y-auto space-y-1 max-h-[460px]">
              <div className="text-[10px] font-mono text-[#778da9] uppercase px-2 py-1">
                Spans in Hierarchy
              </div>
              {trace.spans.map((span) => {
                const isSelected = activeSpan.spanId === span.spanId;
                const isError = span.status.code === 'ERROR';

                return (
                  <button
                    key={span.spanId}
                    onClick={() => setSelectedSpanId(span.spanId)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#415a77]/50 border-l-4 border-cyan-400 text-[#e0e1dd]'
                        : 'hover:bg-[#0d1b2a]/50 text-[#778da9]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getSpanIcon(span.name)}
                      <div className="truncate">
                        <div className="text-xs font-mono font-bold text-[#e0e1dd] truncate">
                          {span.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#778da9]">
                          {span.kind} • {span.spanId.slice(0, 8)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-cyan-300">
                        {span.durationMs}ms
                      </div>
                      {isError && (
                        <span className="text-[9px] text-rose-400 font-bold">ERR</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Span Detail Inspector (8 cols) */}
            <div className="md:col-span-8 bg-[#1b263b] rounded-xl border border-[#415a77] p-4 overflow-y-auto space-y-4 max-h-[460px]">
              {/* Span Overview */}
              <div className="flex items-center justify-between pb-2 border-b border-[#415a77]/60">
                <div>
                  <div className="text-sm font-mono font-bold text-[#e0e1dd] flex items-center gap-2">
                    {getSpanIcon(activeSpan.name)}
                    {activeSpan.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#778da9]">
                    Span ID: {activeSpan.spanId} {activeSpan.parentSpanId && `(Parent: ${activeSpan.parentSpanId.slice(0, 8)}...)`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                      activeSpan.status.code === 'ERROR'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {activeSpan.status.code}
                  </span>
                  <span className="text-xs font-mono text-cyan-300 bg-[#0d1b2a] px-2 py-0.5 rounded border border-[#415a77]">
                    {activeSpan.durationMs} ms
                  </span>
                </div>
              </div>

              {/* Attributes Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  OpenTelemetry Semantic Attributes
                </div>
                <div className="bg-[#0d1b2a] rounded-lg border border-[#415a77]/50 divide-y divide-[#415a77]/30 text-xs font-mono overflow-hidden">
                  {Object.entries(activeSpan.attributes).map(([key, value]) => (
                    <div key={key} className="p-2 flex items-center justify-between hover:bg-[#1b263b]/40">
                      <span className="text-cyan-300">{key}</span>
                      <span className="text-[#e0e1dd] font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Span Events */}
              {activeSpan.events && activeSpan.events.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#e0e1dd] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Span Checkpoint Events
                  </div>
                  <div className="bg-[#0d1b2a] rounded-lg border border-[#415a77]/50 p-2.5 space-y-2 text-xs font-mono">
                    {activeSpan.events.map((evt, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[#778da9]">
                        <span className="text-[#e0e1dd]">• {evt.name}</span>
                        <span className="text-[10px] text-cyan-400">
                          +{Math.max(0, evt.timestampMs - activeSpan.startTimeMs).toFixed(1)}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#1b263b] rounded-xl border border-[#415a77] flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-[#415a77] bg-[#0d1b2a] flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-300">trace_otlp_dump.json</span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-xs text-[#778da9] hover:text-cyan-300 px-2 py-0.5 rounded bg-[#1b263b] border border-[#415a77] transition-all"
              >
                <Copy className="w-3 h-3" />
                Copy JSON
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-cyan-300 bg-[#0d1b2a]/95">
              <pre className="whitespace-pre">{JSON.stringify(trace, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
