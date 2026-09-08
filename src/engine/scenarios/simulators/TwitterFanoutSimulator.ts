/**
 * TwitterFanoutSimulator — Simulates Hybrid Push/Pull Timeline Fanout
 * 
 * Features:
 * - Celebrity threshold detection (pull fanout for >25k followers)
 * - Push fanout queueing into Redis timeline caches
 * - Read-time timeline fan-in aggregation and ranking
 * - Write amplification tracking and cache memory budgeting
 */

import {
  IScenarioSimulator,
  ScenarioSimulationEvent,
  ScenarioSimulationStats,
} from './ScenarioSimulatorTypes';
import { ScenarioId } from '../ScenarioTypes';

export interface TweetAuthor {
  id: string;
  handle: string;
  followerCount: number;
  isCelebrity: boolean;
}

export class TwitterFanoutSimulator implements IScenarioSimulator {
  public readonly scenarioId: ScenarioId = 'twitter-feed';
  private running: boolean = false;
  private loadMultiplier: number = 1.0;

  // Simulation metrics
  private totalTweets: number = 0;
  private pushFanouts: number = 0;
  private pullFanouts: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private droppedWrites: number = 0;
  private currentQps: number = 4500;
  private peakQps: number = 4500;
  private avgLatencyMs: number = 18;
  private p99LatencyMs: number = 45;
  private queueDepth: number = 120;
  private events: ScenarioSimulationEvent[] = [];

  public celebrityThreshold: number = 25000;
  private redisMemoryUsedGb: number = 14.2;

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    this.running = true;
    this.addEvent('info', 'ENGINE_START', 'Twitter Timeline Fanout Simulator active with Hybrid Push/Pull architecture.');
  }

  public stop(): void {
    this.running = false;
    this.addEvent('info', 'ENGINE_STOP', 'Twitter Fanout Simulator paused.');
  }

  public step(deltaMs: number): void {
    if (!this.running) return;

    // Simulate regular stream of tweet creations and timeline reads
    const rate = Math.round(this.currentQps * (deltaMs / 1000) * this.loadMultiplier);
    const tweetsPosted = Math.max(1, Math.round(rate * 0.15));
    const timelinesRead = Math.max(1, Math.round(rate * 0.85));

    for (let i = 0; i < tweetsPosted; i++) {
      this.totalTweets++;
      // 5% chance of celebrity tweet
      const isCelebrity = Math.random() < 0.05;
      if (isCelebrity) {
        this.pullFanouts++;
        this.addEvent(
          'warn',
          'CELEBRITY_TWEET_PULL',
          'Celebrity tweet detected (>25k followers). Diverted to Fanout-on-Read to prevent write amplification.',
          { followers: Math.round(50000 + Math.random() * 200000) }
        );
      } else {
        this.pushFanouts++;
        this.redisMemoryUsedGb += 0.0001;
      }
    }

    // Process timeline reads
    for (let j = 0; j < timelinesRead; j++) {
      if (Math.random() < 0.94) {
        this.cacheHits++;
      } else {
        this.cacheMisses++;
        this.avgLatencyMs = Math.min(120, this.avgLatencyMs + 0.1);
      }
    }

    // Dynamic queue adjustment
    this.queueDepth = Math.max(10, Math.min(2500, Math.round(this.queueDepth + (this.loadMultiplier - 1.0) * 80 + (Math.random() * 20 - 10))));

    // Latency calculation
    this.avgLatencyMs = Number((12 + (this.queueDepth / 100) * 1.5).toFixed(1));
    this.p99LatencyMs = Number((this.avgLatencyMs * 2.4).toFixed(1));

    if (this.currentQps * this.loadMultiplier > this.peakQps) {
      this.peakQps = Math.round(this.currentQps * this.loadMultiplier);
    }
  }

  public injectLoadMultiplier(multiplier: number): void {
    this.loadMultiplier = multiplier;
    this.addEvent('info', 'LOAD_SCALED', `Traffic load multiplier updated to ${multiplier}x.`);
  }

  public injectAnomaly(anomalyType: string): void {
    switch (anomalyType) {
      case 'celebrity-storm':
        this.pullFanouts += 500;
        this.queueDepth += 800;
        this.avgLatencyMs += 35;
        this.addEvent('error', 'CELEBRITY_STORM', 'Viral celebrity event caused 500+ celebrity tweets. Pull-fanout merger queues saturated.');
        break;
      case 'redis-node-failover':
        this.cacheHits = Math.max(0, this.cacheHits - 1000);
        this.cacheMisses += 1500;
        this.droppedWrites += 45;
        this.avgLatencyMs += 55;
        this.addEvent('error', 'REDIS_FAILOVER', 'Redis Timeline Cache shard lost primary. Sentinel failover triggered with 1500 timeline cache misses.');
        break;
      default:
        this.addEvent('warn', 'ANOMALY_TRIGGERED', `Injected synthetic anomaly: ${anomalyType}`);
        break;
    }
  }

  public getStats(): ScenarioSimulationStats {
    const totalReads = this.cacheHits + this.cacheMisses;
    const hitRate = totalReads > 0 ? this.cacheHits / totalReads : 0.94;
    const saturation = Math.min(100, Math.round((this.queueDepth / 2000) * 100));

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
      droppedRequests: this.droppedWrites,
      totalCompleted: this.totalTweets + totalReads,
      statusSummary: `Tweets: ${this.totalTweets} (Push: ${this.pushFanouts}, Pull: ${this.pullFanouts}) | Redis: ${this.redisMemoryUsedGb.toFixed(1)}GB`,
    };
  }

  public getEvents(limit: number = 10): ScenarioSimulationEvent[] {
    return this.events.slice(-limit);
  }

  public reset(): void {
    this.totalTweets = 0;
    this.pushFanouts = 0;
    this.pullFanouts = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.droppedWrites = 0;
    this.queueDepth = 120;
    this.avgLatencyMs = 18;
    this.p99LatencyMs = 45;
    this.redisMemoryUsedGb = 14.2;
    this.events = [];
    this.addEvent('info', 'RESET', 'Twitter Fanout Simulator reset to baseline state.');
  }

  private addEvent(
    severity: ScenarioSimulationEvent['severity'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: ScenarioSimulationEvent = {
      id: `tw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
