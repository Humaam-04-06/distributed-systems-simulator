/**
 * DistributedTracer — OpenTelemetry / W3C Standard Distributed Tracing Engine
 * 
 * Implements W3C traceparent context propagation, hierarchical span trees,
 * semantic attribute tagging, timestamped events, and in-memory trace buffers.
 */

export type SpanKind = 'SERVER' | 'CLIENT' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER';
export type SpanStatusCode = 'UNSET' | 'OK' | 'ERROR';

export interface SpanEvent {
  name: string;
  timestampMs: number;
  attributes?: Record<string, string | number | boolean>;
}

export interface SpanAttributes {
  'http.method'?: string;
  'http.route'?: string;
  'http.status_code'?: number;
  'cluster.node_id'?: string;
  'cache.hit'?: boolean;
  'bulkhead.domain'?: string;
  'tenant.tier'?: string;
  'db.system'?: string;
  'db.statement'?: string;
  'circuit_breaker.state'?: string;
  'retry.attempt'?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs: number;
  status: {
    code: SpanStatusCode;
    description?: string;
  };
  attributes: SpanAttributes;
  events: SpanEvent[];
}

export interface Trace {
  traceId: string;
  traceparent: string; // 00-{traceId}-{rootSpanId}-01 (W3C standard)
  rootSpanId: string;
  name: string;
  startTimeMs: number;
  endTimeMs: number;
  totalDurationMs: number;
  hasErrors: boolean;
  httpStatus: number;
  route: string;
  tenantTier: 'enterprise' | 'pro' | 'free';
  spans: Span[];
}

export class DistributedTracer {
  private activeTraces: Map<string, { trace: Trace; openSpans: Map<string, Span> }> = new Map();
  private completedTraces: Trace[] = [];
  private readonly maxTracesRetained: number = 150;

  constructor(maxRetained: number = 150) {
    this.maxTracesRetained = maxRetained;
  }

  /**
   * Generates a 128-bit hex trace ID (32 hex characters)
   */
  public generateTraceId(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generates a 64-bit hex span ID (16 hex characters)
   */
  public generateSpanId(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Starts a new distributed trace with an ingress root span
   */
  public startTrace(
    route: string,
    tenantTier: 'enterprise' | 'pro' | 'free' = 'pro',
    now: number = performance.now()
  ): { traceId: string; rootSpanId: string } {
    const traceId = this.generateTraceId();
    const rootSpanId = this.generateSpanId();
    const traceparent = `00-${traceId}-${rootSpanId}-01`;

    const rootSpan: Span = {
      traceId,
      spanId: rootSpanId,
      name: 'gateway:ingress',
      kind: 'SERVER',
      startTimeMs: now,
      durationMs: 0,
      status: { code: 'UNSET' },
      attributes: {
        'http.method': 'POST',
        'http.route': route,
        'cluster.node_id': 'lb-1',
        'tenant.tier': tenantTier,
      },
      events: [
        {
          name: 'request_received_at_gateway',
          timestampMs: now,
        },
      ],
    };

    const trace: Trace = {
      traceId,
      traceparent,
      rootSpanId,
      name: `HTTP POST ${route}`,
      startTimeMs: now,
      endTimeMs: now,
      totalDurationMs: 0,
      hasErrors: false,
      httpStatus: 200,
      route,
      tenantTier,
      spans: [rootSpan],
    };

    const openSpans = new Map<string, Span>();
    openSpans.set(rootSpanId, rootSpan);

    this.activeTraces.set(traceId, { trace, openSpans });

    return { traceId, rootSpanId };
  }

  /**
   * Starts a child span in the trace hierarchy
   */
  public startSpan(
    traceId: string,
    name: string,
    parentSpanId?: string,
    kind: SpanKind = 'INTERNAL',
    attributes: SpanAttributes = {},
    now: number = performance.now()
  ): Span {
    const entry = this.activeTraces.get(traceId);
    const spanId = this.generateSpanId();

    const span: Span = {
      traceId,
      spanId,
      parentSpanId: parentSpanId || entry?.trace.rootSpanId,
      name,
      kind,
      startTimeMs: now,
      durationMs: 0,
      status: { code: 'UNSET' },
      attributes: { ...attributes },
      events: [],
    };

    if (entry) {
      entry.trace.spans.push(span);
      entry.openSpans.set(spanId, span);
    }

    return span;
  }

  /**
   * Adds an in-span event checkpoint
   */
  public addEvent(
    traceId: string,
    spanId: string,
    eventName: string,
    attributes?: Record<string, string | number | boolean>,
    now: number = performance.now()
  ): void {
    const entry = this.activeTraces.get(traceId);
    if (!entry) return;

    const span = entry.openSpans.get(spanId);
    if (span) {
      span.events.push({
        name: eventName,
        timestampMs: now,
        attributes,
      });
    }
  }

  /**
   * Concludes a child or root span
   */
  public endSpan(
    traceId: string,
    spanId: string,
    statusCode: SpanStatusCode = 'OK',
    statusDesc?: string,
    now: number = performance.now()
  ): Span | undefined {
    const entry = this.activeTraces.get(traceId);
    if (!entry) return undefined;

    const span = entry.openSpans.get(spanId);
    if (span) {
      span.endTimeMs = now;
      span.durationMs = Math.max(0.1, Number((now - span.startTimeMs).toFixed(2)));
      span.status.code = statusCode;
      if (statusDesc) span.status.description = statusDesc;
      entry.openSpans.delete(spanId);
      return span;
    }

    return undefined;
  }

  /**
   * Completes the entire trace and flushes it to the completed ring buffer
   */
  public endTrace(
    traceId: string,
    httpStatus: number = 200,
    now: number = performance.now()
  ): Trace | undefined {
    const entry = this.activeTraces.get(traceId);
    if (!entry) return undefined;

    const { trace, openSpans } = entry;

    // Conclude any remaining dangling spans
    openSpans.forEach((span) => {
      if (!span.endTimeMs) {
        span.endTimeMs = now;
        span.durationMs = Math.max(0.1, Number((now - span.startTimeMs).toFixed(2)));
        span.status.code = httpStatus >= 400 ? 'ERROR' : 'OK';
      }
    });

    // Close root span if needed
    const rootSpan = trace.spans.find((s) => s.spanId === trace.rootSpanId);
    if (rootSpan && !rootSpan.endTimeMs) {
      rootSpan.endTimeMs = now;
      rootSpan.durationMs = Math.max(0.1, Number((now - rootSpan.startTimeMs).toFixed(2)));
      rootSpan.status.code = httpStatus >= 400 ? 'ERROR' : 'OK';
      rootSpan.attributes['http.status_code'] = httpStatus;
    }

    trace.endTimeMs = now;
    trace.totalDurationMs = Math.max(0.1, Number((now - trace.startTimeMs).toFixed(2)));
    trace.httpStatus = httpStatus;
    trace.hasErrors = httpStatus >= 400 || trace.spans.some((s) => s.status.code === 'ERROR');

    this.activeTraces.delete(traceId);

    // Push into ring buffer
    this.completedTraces.unshift(trace);
    if (this.completedTraces.length > this.maxTracesRetained) {
      this.completedTraces.length = this.maxTracesRetained;
    }

    return trace;
  }

  /**
   * Returns recent completed traces
   */
  public getRecentTraces(limit: number = 50): Trace[] {
    return this.completedTraces.slice(0, limit);
  }

  /**
   * Finds a specific trace by ID
   */
  public getTrace(traceId: string): Trace | undefined {
    return this.completedTraces.find((t) => t.traceId === traceId);
  }

  /**
   * Filters traces exceeding a latency threshold
   */
  public getSlowTraces(thresholdMs: number = 50): Trace[] {
    return this.completedTraces.filter((t) => t.totalDurationMs >= thresholdMs);
  }

  /**
   * Filters traces that encountered an error
   */
  public getErrorTraces(): Trace[] {
    return this.completedTraces.filter((t) => t.hasErrors);
  }

  /**
   * Returns trace buffer metrics
   */
  public getMetrics(): {
    activeTraceCount: number;
    completedTraceCount: number;
    errorCount: number;
    avgDurationMs: number;
  } {
    const errorCount = this.completedTraces.filter((t) => t.hasErrors).length;
    const avgDurationMs =
      this.completedTraces.length > 0
        ? Number(
            (
              this.completedTraces.reduce((sum, t) => sum + t.totalDurationMs, 0) /
              this.completedTraces.length
            ).toFixed(2)
          )
        : 0;

    return {
      activeTraceCount: this.activeTraces.size,
      completedTraceCount: this.completedTraces.length,
      errorCount,
      avgDurationMs,
    };
  }

  /**
   * Resets trace buffers
   */
  public clear(): void {
    this.activeTraces.clear();
    this.completedTraces = [];
  }
}
