/**
 * NetflixStreamingSimulator — Simulates Adaptive Bitrate Streaming & Open Connect CDNs
 * 
 * Features:
 * - Adaptive Bitrate (ABR) chunk selection (4K, 1080p, 720p, 480p)
 * - Edge CDN Point of Presence (POP) cache hit/miss ratio (~95% hit rate)
 * - Origin shield protection preventing S3 egress saturation
 * - Network bandwidth throttling & playback re-buffering metrics
 */

import {
  IScenarioSimulator,
  ScenarioSimulationEvent,
  ScenarioSimulationStats,
} from './ScenarioSimulatorTypes';
import { ScenarioId } from '../ScenarioTypes';

export interface VideoChunkRequest {
  chunkId: string;
  bitrateTier: '4K' | '1080p' | '720p' | '480p';
  bitrateKbps: number;
  fromCdnPop: boolean;
}

export class NetflixStreamingSimulator implements IScenarioSimulator {
  public readonly scenarioId: ScenarioId = 'netflix-streaming';
  private running: boolean = false;
  private loadMultiplier: number = 1.0;

  private totalChunksServed: number = 0;
  private edgeCdnHits: number = 0;
  private originFetches: number = 0;
  private rebufferingEvents: number = 0;
  private activeStreams: number = 240000;
  private totalBandwidthTbps: number = 3.2;

  private currentQps: number = 42000;
  private peakQps: number = 42000;
  private avgLatencyMs: number = 14;
  private p99LatencyMs: number = 38;
  private queueDepth: number = 95;
  private events: ScenarioSimulationEvent[] = [];

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    this.running = true;
    this.addEvent('info', 'ENGINE_START', 'Netflix Streaming Engine running. Open Connect Edge CDNs serving ABR video chunks.');
  }

  public stop(): void {
    this.running = false;
    this.addEvent('info', 'ENGINE_STOP', 'Streaming simulation halted.');
  }

  public step(deltaMs: number): void {
    if (!this.running) return;

    const rate = Math.round(this.currentQps * (deltaMs / 1000) * this.loadMultiplier);
    this.totalChunksServed += rate;

    // Edge CDN serves ~95% of video chunks
    const hits = Math.round(rate * 0.95);
    const misses = rate - hits;
    this.edgeCdnHits += hits;
    this.originFetches += misses;

    // Rebuffering triggers if queue exceeds threshold
    if (this.queueDepth > 600 && Math.random() < 0.15) {
      this.rebufferingEvents++;
      this.addEvent('warn', 'REBUFFERING_SPIKE', 'Client video player buffer under-run detected. ABR downshifting to 720p.');
    }

    // Dynamic bandwidth & stream count
    this.activeStreams = Math.round(240000 * this.loadMultiplier);
    this.totalBandwidthTbps = Number((3.2 * this.loadMultiplier).toFixed(2));

    this.queueDepth = Math.max(10, Math.min(2000, Math.round(this.queueDepth + (this.loadMultiplier - 1.0) * 90 + (Math.random() * 20 - 10))));
    this.avgLatencyMs = Number((8 + (this.queueDepth / 80) * 1.8).toFixed(1));
    this.p99LatencyMs = Number((this.avgLatencyMs * 2.5).toFixed(1));

    if (this.currentQps * this.loadMultiplier > this.peakQps) {
      this.peakQps = Math.round(this.currentQps * this.loadMultiplier);
    }
  }

  public injectLoadMultiplier(multiplier: number): void {
    this.loadMultiplier = multiplier;
    this.addEvent('info', 'PRIME_TIME_PEAK', `Streaming concurrency multiplied to ${multiplier}x (Prime Time Evening).`);
  }

  public injectAnomaly(anomalyType: string): void {
    switch (anomalyType) {
      case 'cdn-cache-eviction':
        this.originFetches += 8000;
        this.queueDepth += 750;
        this.avgLatencyMs += 48;
        this.addEvent('error', 'CDN_CACHE_INVALIDATION', 'ISP Edge Cache purge event caused 8,000 requests to hit Origin Shield.');
        break;
      case 'transcoding-stall':
        this.rebufferingEvents += 120;
        this.avgLatencyMs += 60;
        this.addEvent('error', 'TRANSCODING_STALL', 'DASH/HLS chunk packaging workers delayed. Missing 4K segments forcing fallback to 1080p.');
        break;
      default:
        this.addEvent('warn', 'ANOMALY_TRIGGERED', `Synthetic anomaly: ${anomalyType}`);
        break;
    }
  }

  public getStats(): ScenarioSimulationStats {
    const total = this.edgeCdnHits + this.originFetches;
    const hitRate = total > 0 ? this.edgeCdnHits / total : 0.95;
    const saturation = Math.min(100, Math.round((this.queueDepth / 1800) * 100));

    return {
      scenarioId: this.scenarioId,
      currentQps: Math.round(this.currentQps * this.loadMultiplier),
      peakQps: this.peakQps,
      avgLatencyMs: this.avgLatencyMs,
      p99LatencyMs: this.p99LatencyMs,
      cacheHitRatio: Number(hitRate.toFixed(3)),
      activeWorkers: Math.max(12, Math.round(24 * this.loadMultiplier)),
      queueDepth: this.queueDepth,
      resourceSaturationPercent: saturation,
      droppedRequests: this.rebufferingEvents,
      totalCompleted: this.totalChunksServed,
      statusSummary: `Streams: ${this.activeStreams.toLocaleString()} | Bandwidth: ${this.totalBandwidthTbps} Tbps | CDN Hit Rate: ${(hitRate * 100).toFixed(1)}% | Rebuffers: ${this.rebufferingEvents}`,
    };
  }

  public getEvents(limit: number = 10): ScenarioSimulationEvent[] {
    return this.events.slice(-limit);
  }

  public reset(): void {
    this.totalChunksServed = 0;
    this.edgeCdnHits = 0;
    this.originFetches = 0;
    this.rebufferingEvents = 0;
    this.activeStreams = 240000;
    this.totalBandwidthTbps = 3.2;
    this.queueDepth = 95;
    this.avgLatencyMs = 14;
    this.p99LatencyMs = 38;
    this.events = [];
    this.addEvent('info', 'RESET', 'Netflix streaming simulator reset to baseline state.');
  }

  private addEvent(
    severity: ScenarioSimulationEvent['severity'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: ScenarioSimulationEvent = {
      id: `nf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      severity,
      scenarioId: this.scenarioId,
      action,
      latencyMs: this.avgLatencyMs,
      message,
      details,
    };
    this.events.push(event);
    if (this.events.length > 50) {
      this.events.shift();
    }
  }
}
