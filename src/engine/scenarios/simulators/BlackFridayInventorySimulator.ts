/**
 * BlackFridayInventorySimulator — Simulates Flash Sale Atomic Decrements & Waiting Rooms
 * 
 * Features:
 * - Virtual Waiting Room admission queue with rate-limited pass-through
 * - Atomic Redis Lua script inventory decrement (100% oversell prevention)
 * - Distributed locking with Redlock lease timeouts
 * - Botnet traffic mitigation and CAPTCHA challenge simulation
 */

import {
  IScenarioSimulator,
  ScenarioSimulationEvent,
  ScenarioSimulationStats,
} from './ScenarioSimulatorTypes';
import { ScenarioId } from '../ScenarioTypes';

export class BlackFridayInventorySimulator implements IScenarioSimulator {
  public readonly scenarioId: ScenarioId = 'black-friday-sale';
  private running: boolean = false;
  private loadMultiplier: number = 1.0;

  // Inventory state
  public initialInventory: number = 5000;
  private currentStock: number = 5000;
  private totalPurchased: number = 0;
  private waitingRoomUsers: number = 12000;
  private rejectedDueToStockOut: number = 0;
  private botBlockedCount: number = 0;
  private lockTimeouts: number = 0;

  private currentQps: number = 15000;
  private peakQps: number = 15000;
  private avgLatencyMs: number = 42;
  private p99LatencyMs: number = 120;
  private queueDepth: number = 450;
  private events: ScenarioSimulationEvent[] = [];

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    this.running = true;
    this.addEvent('info', 'ENGINE_START', 'Black Friday Flash Sale Engine live. Virtual waiting room and Redis Lua decrement locks armed.');
  }

  public stop(): void {
    this.running = false;
    this.addEvent('info', 'ENGINE_STOP', 'Flash sale paused.');
  }

  public step(deltaMs: number): void {
    if (!this.running) return;

    const ingressAttempts = Math.round(this.currentQps * (deltaMs / 1000) * this.loadMultiplier);

    // Filter bots (approx 18% of traffic)
    const bots = Math.round(ingressAttempts * 0.18);
    this.botBlockedCount += bots;

    const legitimateBuyers = ingressAttempts - bots;
    this.waitingRoomUsers = Math.max(0, this.waitingRoomUsers + Math.round(legitimateBuyers * 0.4) - 200);

    // Atomic Lua decrement simulation
    const buyersProcessed = Math.min(legitimateBuyers, 250);
    for (let i = 0; i < buyersProcessed; i++) {
      if (this.currentStock > 0) {
        this.currentStock--;
        this.totalPurchased++;
        if (this.currentStock === 0) {
          this.addEvent('warn', 'STOCK_EXHAUSTED', 'Flash Sale Inventory reaches ZERO! All subsequent Lua decrements returning 0.');
        }
      } else {
        this.rejectedDueToStockOut++;
      }
    }

    // Queue depth & latency
    this.queueDepth = Math.max(50, Math.min(5000, Math.round(this.waitingRoomUsers * 0.15)));
    this.avgLatencyMs = Number((28 + (this.queueDepth / 150) * 3.5).toFixed(1));
    this.p99LatencyMs = Number((this.avgLatencyMs * 2.8).toFixed(1));

    if (this.currentQps * this.loadMultiplier > this.peakQps) {
      this.peakQps = Math.round(this.currentQps * this.loadMultiplier);
    }
  }

  public injectLoadMultiplier(multiplier: number): void {
    this.loadMultiplier = multiplier;
    this.addEvent('info', 'FLASH_SPIKE', `Sale ingress traffic spiked to ${multiplier}x peak.`);
  }

  public injectAnomaly(anomalyType: string): void {
    switch (anomalyType) {
      case 'botnet-ddos':
        this.botBlockedCount += 25000;
        this.queueDepth += 1800;
        this.avgLatencyMs += 75;
        this.addEvent('error', 'BOTNET_ATTACK', 'Credential stuffing & scraping botnet bombarded payment gateway. WAF rate-limiter engaged.');
        break;
      case 'redlock-timeout':
        this.lockTimeouts += 85;
        this.avgLatencyMs += 110;
        this.addEvent('error', 'REDLOCK_TIMEOUT', 'Payment gateway webhook delay triggered distributed lock lease expiration. Dead-letter queue compensating.');
        break;
      default:
        this.addEvent('warn', 'ANOMALY_TRIGGERED', `Synthetic anomaly: ${anomalyType}`);
        break;
    }
  }

  public getStats(): ScenarioSimulationStats {
    const successRate = this.totalPurchased > 0 ? (this.totalPurchased / (this.totalPurchased + this.rejectedDueToStockOut)) : 1.0;
    const saturation = Math.min(100, Math.round((this.queueDepth / 4000) * 100));

    return {
      scenarioId: this.scenarioId,
      currentQps: Math.round(this.currentQps * this.loadMultiplier),
      peakQps: this.peakQps,
      avgLatencyMs: this.avgLatencyMs,
      p99LatencyMs: this.p99LatencyMs,
      cacheHitRatio: Number(successRate.toFixed(3)),
      activeWorkers: Math.max(8, Math.round(16 * this.loadMultiplier)),
      queueDepth: this.queueDepth,
      resourceSaturationPercent: saturation,
      droppedRequests: this.rejectedDueToStockOut,
      totalCompleted: this.totalPurchased,
      statusSummary: `Stock: ${this.currentStock} / ${this.initialInventory} | Sold: ${this.totalPurchased} | Waiting: ${this.waitingRoomUsers.toLocaleString()} | Bots Filtered: ${this.botBlockedCount.toLocaleString()}`,
    };
  }

  public getEvents(limit: number = 10): ScenarioSimulationEvent[] {
    return this.events.slice(-limit);
  }

  public reset(): void {
    this.currentStock = this.initialInventory;
    this.totalPurchased = 0;
    this.waitingRoomUsers = 12000;
    this.rejectedDueToStockOut = 0;
    this.botBlockedCount = 0;
    this.lockTimeouts = 0;
    this.queueDepth = 450;
    this.avgLatencyMs = 42;
    this.p99LatencyMs = 120;
    this.events = [];
    this.addEvent('info', 'RESET', 'Flash sale inventory restored to 5,000 units.');
  }

  private addEvent(
    severity: ScenarioSimulationEvent['severity'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: ScenarioSimulationEvent = {
      id: `bf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
