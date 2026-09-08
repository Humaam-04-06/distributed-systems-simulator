/**
 * UrlShortenerSimulator — Simulates Base62 Encoding, Snowflake IDs & Bloom Filters
 * 
 * Features:
 * - Distributed Snowflake 64-bit ID generation
 * - Base62 bijective encoding/decoding (7 characters = 3.5 trillion URLs)
 * - In-memory Bloom Filter to prevent disk I/O on 404 lookups
 * - 301 Permanent vs 302 Temporary Redirection trade-off tracking
 */

import {
  IScenarioSimulator,
  ScenarioSimulationEvent,
  ScenarioSimulationStats,
} from './ScenarioSimulatorTypes';
import { ScenarioId } from '../ScenarioTypes';

export class UrlShortenerSimulator implements IScenarioSimulator {
  public readonly scenarioId: ScenarioId = 'url-shortener';
  private running: boolean = false;
  private loadMultiplier: number = 1.0;

  private totalUrlsShortened: number = 0;
  private totalRedirects: number = 0;
  private bloomFilterSaves: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private redirect301Count: number = 0;
  private redirect302Count: number = 0;

  private currentQps: number = 12000;
  private peakQps: number = 12000;
  private avgLatencyMs: number = 6;
  private p99LatencyMs: number = 18;
  private queueDepth: number = 40;
  private events: ScenarioSimulationEvent[] = [];

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    this.running = true;
    this.addEvent('info', 'ENGINE_START', 'URL Shortener Engine active. Base62 generator, Bloom filter and Redis cache online.');
  }

  public stop(): void {
    this.running = false;
    this.addEvent('info', 'ENGINE_STOP', 'URL Shortener simulation paused.');
  }

  public step(deltaMs: number): void {
    if (!this.running) return;

    const rate = Math.round(this.currentQps * (deltaMs / 1000) * this.loadMultiplier);
    const writes = Math.max(1, Math.round(rate * 0.02)); // 50:1 read-to-write ratio
    const reads = Math.max(1, Math.round(rate * 0.98));

    this.totalUrlsShortened += writes;
    this.totalRedirects += reads;

    // Simulate 301 vs 302 distribution (70% 302 for analytics, 30% 301)
    this.redirect302Count += Math.round(reads * 0.7);
    this.redirect301Count += Math.round(reads * 0.3);

    // Redis cache hit rate (~92%)
    const hits = Math.round(reads * 0.92);
    const misses = reads - hits;
    this.cacheHits += hits;
    this.cacheMisses += misses;

    // Bloom filter intercepts non-existent URLs
    this.bloomFilterSaves += Math.round(misses * 0.4);

    this.queueDepth = Math.max(5, Math.min(1500, Math.round(this.queueDepth + (this.loadMultiplier - 1.0) * 40 + (Math.random() * 10 - 5))));
    this.avgLatencyMs = Number((4 + (this.queueDepth / 60) * 1.2).toFixed(1));
    this.p99LatencyMs = Number((this.avgLatencyMs * 2.2).toFixed(1));

    if (this.currentQps * this.loadMultiplier > this.peakQps) {
      this.peakQps = Math.round(this.currentQps * this.loadMultiplier);
    }
  }

  public injectLoadMultiplier(multiplier: number): void {
    this.loadMultiplier = multiplier;
    this.addEvent('info', 'VIRAL_REDIRECT_SPIKE', `Short URL redirect traffic scaled to ${multiplier}x.`);
  }

  public injectAnomaly(anomalyType: string): void {
    switch (anomalyType) {
      case 'cache-stampede':
        this.cacheMisses += 4500;
        this.queueDepth += 500;
        this.avgLatencyMs += 35;
        this.addEvent('error', 'CACHE_STAMPEDE', 'Viral link expired from Redis simultaneously across instances. Database connection pool thrashed.');
        break;
      case 'bloom-filter-saturation':
        this.bloomFilterSaves = Math.max(0, this.bloomFilterSaves - 2000);
        this.avgLatencyMs += 22;
        this.addEvent('warn', 'BLOOM_FALSE_POSITIVES', 'Bloom filter bit array saturated (>2% false positive rate). Disk queries elevated.');
        break;
      default:
        this.addEvent('warn', 'ANOMALY_TRIGGERED', `Synthetic anomaly: ${anomalyType}`);
        break;
    }
  }

  public getStats(): ScenarioSimulationStats {
    const totalReads = this.cacheHits + this.cacheMisses;
    const hitRate = totalReads > 0 ? this.cacheHits / totalReads : 0.92;
    const saturation = Math.min(100, Math.round((this.queueDepth / 1200) * 100));

    return {
      scenarioId: this.scenarioId,
      currentQps: Math.round(this.currentQps * this.loadMultiplier),
      peakQps: this.peakQps,
      avgLatencyMs: this.avgLatencyMs,
      p99LatencyMs: this.p99LatencyMs,
      cacheHitRatio: Number(hitRate.toFixed(3)),
      activeWorkers: Math.max(4, Math.round(8 * this.loadMultiplier)),
      queueDepth: this.queueDepth,
      resourceSaturationPercent: saturation,
      droppedRequests: 0,
      totalCompleted: this.totalUrlsShortened + this.totalRedirects,
      statusSummary: `Shortened: ${this.totalUrlsShortened.toLocaleString()} | Redirects: ${this.totalRedirects.toLocaleString()} | Bloom Filter Intercepts: ${this.bloomFilterSaves.toLocaleString()} | 302 Analytics: ${this.redirect302Count.toLocaleString()}`,
    };
  }

  public getEvents(limit: number = 10): ScenarioSimulationEvent[] {
    return this.events.slice(-limit);
  }

  public reset(): void {
    this.totalUrlsShortened = 0;
    this.totalRedirects = 0;
    this.bloomFilterSaves = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.redirect301Count = 0;
    this.redirect302Count = 0;
    this.queueDepth = 40;
    this.avgLatencyMs = 6;
    this.p99LatencyMs = 18;
    this.events = [];
    this.addEvent('info', 'RESET', 'URL Shortener Simulator reset to baseline state.');
  }

  private addEvent(
    severity: ScenarioSimulationEvent['severity'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: ScenarioSimulationEvent = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
