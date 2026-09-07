/**
 * OpenTelemetryExporter — Standard Prometheus & OTLP Metrics Exporter
 * 
 * Generates industry-standard Prometheus text-based exposition formatting (# HELP / # TYPE)
 * and OpenTelemetry Protocol (OTLP) v1 JSON payloads for Jaeger/Tempo/Grafana consumption.
 */

import { Trace } from './DistributedTracer';

export interface TelemetrySnapshot {
  throughputRps: number;
  totalRequests: number;
  successfulRequests: number;
  rateLimited429Requests: number;
  circuitBroken503Requests: number;
  timeout504Requests: number;
  serverError500Requests: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgLatencyMs: number;
  activeServers: number;
  cacheHitRatio: number;
  bulkheadThreads: Record<string, number>;
  circuitBreakerTripped: boolean;
}

export interface OTLPResourceSpan {
  resource: {
    attributes: Array<{
      key: string;
      value: { stringValue?: string; intValue?: number; boolValue?: boolean };
    }>;
  };
  scopeSpans: Array<{
    scope: { name: string; version: string };
    spans: Array<{
      traceId: string;
      spanId: string;
      parentSpanId?: string;
      name: string;
      kind: number;
      startTimeUnixNano: string;
      endTimeUnixNano: string;
      attributes: Array<{
        key: string;
        value: { stringValue?: string; intValue?: number; boolValue?: boolean };
      }>;
      status: {
        code: number;
        message?: string;
      };
    }>;
  }>;
}

export class OpenTelemetryExporter {
  private serviceName: string;
  private serviceVersion: string;

  constructor(serviceName: string = 'distributed-systems-simulator', serviceVersion: string = '1.0.0') {
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
  }

  /**
   * Generates Prometheus exposition format (text/plain; version=0.0.4)
   */
  public generatePrometheusText(snapshot: TelemetrySnapshot): string {
    const timestamp = Date.now();
    const lines: string[] = [];

    lines.push(`# ==============================================================================`);
    lines.push(`# OpenTelemetry Prometheus Exporter — Distributed Systems Simulator`);
    lines.push(`# Service: ${this.serviceName} (v${this.serviceVersion})`);
    lines.push(`# Scrape Time: ${new Date(timestamp).toISOString()}`);
    lines.push(`# ==============================================================================`);
    lines.push('');

    // 1. Total Requests Counter
    lines.push('# HELP http_requests_total Total number of HTTP requests processed by cluster.');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total{status="200",handler="cluster_ingress"} ${snapshot.successfulRequests}`);
    lines.push(`http_requests_total{status="429",handler="rate_limiter"} ${snapshot.rateLimited429Requests}`);
    lines.push(`http_requests_total{status="503",handler="circuit_breaker"} ${snapshot.circuitBroken503Requests}`);
    lines.push(`http_requests_total{status="504",handler="upstream_timeout"} ${snapshot.timeout504Requests}`);
    lines.push(`http_requests_total{status="500",handler="server_failure"} ${snapshot.serverError500Requests}`);
    lines.push('');

    // 2. Latency Histogram (Buckets in seconds)
    const p50Sec = (snapshot.p50LatencyMs / 1000).toFixed(4);
    const p90Sec = (snapshot.p90LatencyMs / 1000).toFixed(4);
    const p95Sec = (snapshot.p95LatencyMs / 1000).toFixed(4);
    const p99Sec = (snapshot.p99LatencyMs / 1000).toFixed(4);

    lines.push('# HELP http_request_duration_seconds HTTP request latency histogram in seconds.');
    lines.push('# TYPE http_request_duration_seconds histogram');
    lines.push(`http_request_duration_seconds_bucket{le="0.005"} ${Math.round(snapshot.totalRequests * 0.25)}`);
    lines.push(`http_request_duration_seconds_bucket{le="0.010"} ${Math.round(snapshot.totalRequests * 0.50)}`);
    lines.push(`http_request_duration_seconds_bucket{le="0.025"} ${Math.round(snapshot.totalRequests * 0.75)}`);
    lines.push(`http_request_duration_seconds_bucket{le="0.050"} ${Math.round(snapshot.totalRequests * 0.90)}`);
    lines.push(`http_request_duration_seconds_bucket{le="0.100"} ${Math.round(snapshot.totalRequests * 0.95)}`);
    lines.push(`http_request_duration_seconds_bucket{le="0.250"} ${Math.round(snapshot.totalRequests * 0.98)}`);
    lines.push(`http_request_duration_seconds_bucket{le="0.500"} ${Math.round(snapshot.totalRequests * 0.99)}`);
    lines.push(`http_request_duration_seconds_bucket{le="+Inf"} ${snapshot.totalRequests}`);
    lines.push(`http_request_duration_seconds_sum ${(snapshot.totalRequests * (snapshot.avgLatencyMs / 1000)).toFixed(3)}`);
    lines.push(`http_request_duration_seconds_count ${snapshot.totalRequests}`);
    lines.push('');

    // 3. Percentile Quantiles Summary
    lines.push('# HELP http_request_duration_quantiles Real-time calculated latency quantiles.');
    lines.push('# TYPE http_request_duration_quantiles summary');
    lines.push(`http_request_duration_quantiles{quantile="0.50"} ${p50Sec}`);
    lines.push(`http_request_duration_quantiles{quantile="0.90"} ${p90Sec}`);
    lines.push(`http_request_duration_quantiles{quantile="0.95"} ${p95Sec}`);
    lines.push(`http_request_duration_quantiles{quantile="0.99"} ${p99Sec}`);
    lines.push('');

    // 4. Active Nodes Gauge
    lines.push('# HELP cluster_workers_active Number of active healthy worker nodes in load balancer rotation.');
    lines.push('# TYPE cluster_workers_active gauge');
    lines.push(`cluster_workers_active ${snapshot.activeServers}`);
    lines.push('');

    // 5. Cache Hit Ratio Gauge
    lines.push('# HELP cache_hit_ratio Current Redis cache hit ratio percentage.');
    lines.push('# TYPE cache_hit_ratio gauge');
    lines.push(`cache_hit_ratio ${(snapshot.cacheHitRatio / 100).toFixed(4)}`);
    lines.push('');

    // 6. Bulkhead Thread Allocation Gauges
    lines.push('# HELP bulkhead_threads_active Active running threads per isolated bulkhead compartment.');
    lines.push('# TYPE bulkhead_threads_active gauge');
    for (const [domain, count] of Object.entries(snapshot.bulkheadThreads)) {
      lines.push(`bulkhead_threads_active{domain="${domain}"} ${count}`);
    }
    lines.push('');

    // 7. Circuit Breaker Status Gauge
    lines.push('# HELP circuit_breaker_tripped Circuit breaker trip indicator (1=open/tripped, 0=nominal).');
    lines.push('# TYPE circuit_breaker_tripped gauge');
    lines.push(`circuit_breaker_tripped ${snapshot.circuitBreakerTripped ? 1 : 0}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generates OpenTelemetry Protocol (OTLP) JSON format
   */
  public generateOTLPPayload(traces: Trace[]): string {
    const baseNano = BigInt(Date.now()) * BigInt(1_000_000);

    const resourceSpans: OTLPResourceSpan[] = traces.map((trace) => {
      return {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: this.serviceName } },
            { key: 'service.version', value: { stringValue: this.serviceVersion } },
            { key: 'host.name', value: { stringValue: 'distributed-sim-cluster-01' } },
            { key: 'tenant.tier', value: { stringValue: trace.tenantTier } },
          ],
        },
        scopeSpans: [
          {
            scope: {
              name: 'io.opentelemetry.tracer',
              version: '1.24.0',
            },
            spans: trace.spans.map((s) => {
              const spanStart = (baseNano - BigInt(Math.round(s.durationMs * 1_000_000))).toString();
              const spanEnd = baseNano.toString();

              return {
                traceId: s.traceId,
                spanId: s.spanId,
                parentSpanId: s.parentSpanId,
                name: s.name,
                kind: s.kind === 'SERVER' ? 1 : s.kind === 'CLIENT' ? 2 : 3,
                startTimeUnixNano: spanStart,
                endTimeUnixNano: spanEnd,
                attributes: Object.entries(s.attributes).map(([k, v]) => {
                  if (typeof v === 'boolean') return { key: k, value: { boolValue: v } };
                  if (typeof v === 'number') return { key: k, value: { intValue: v } };
                  return { key: k, value: { stringValue: String(v) } };
                }),
                status: {
                  code: s.status.code === 'OK' ? 1 : s.status.code === 'ERROR' ? 2 : 0,
                  message: s.status.description,
                },
              };
            }),
          },
        ],
      };
    });

    return JSON.stringify({ resourceSpans }, null, 2);
  }

  /**
   * Generates sample curl command snippet for live testing
   */
  public generateCurlSnippet(): string {
    return 'curl -s -X GET http://localhost:5174/metrics -H "Accept: text/plain"';
  }
}
