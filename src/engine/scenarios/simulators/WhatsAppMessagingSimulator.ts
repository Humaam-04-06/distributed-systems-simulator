/**
 * WhatsAppMessagingSimulator — Simulates Persistent WebSockets, Dual-ACKs & Cassandra LSM writes
 * 
 * Features:
 * - Persistent WebSocket session table (epoll/kqueue connection tracking)
 * - Three-stage message ACK state machine (sent -> delivered -> read)
 * - Append-only Cassandra/ScyllaDB partition writes
 * - Group chat membership fanout engine
 */

import {
  IScenarioSimulator,
  ScenarioSimulationEvent,
  ScenarioSimulationStats,
} from './ScenarioSimulatorTypes';
import { ScenarioId } from '../ScenarioTypes';

export class WhatsAppMessagingSimulator implements IScenarioSimulator {
  public readonly scenarioId: ScenarioId = 'whatsapp-chat';
  private running: boolean = false;
  private loadMultiplier: number = 1.0;

  private totalMessages: number = 0;
  private sentAcks: number = 0;
  private deliveredAcks: number = 0;
  private readAcks: number = 0;
  private groupFanoutMessages: number = 0;
  private activeWebSockets: number = 1800000;
  private cassandraPendingWrites: number = 85;

  private currentQps: number = 28000;
  private peakQps: number = 28000;
  private avgLatencyMs: number = 16;
  private p99LatencyMs: number = 42;
  private queueDepth: number = 140;
  private events: ScenarioSimulationEvent[] = [];

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    this.running = true;
    this.addEvent('info', 'ENGINE_START', 'WhatsApp Messaging Engine online. 1.8M active WebSockets and Cassandra LSM commit logs active.');
  }

  public stop(): void {
    this.running = false;
    this.addEvent('info', 'ENGINE_STOP', 'WhatsApp chat simulator stopped.');
  }

  public step(deltaMs: number): void {
    if (!this.running) return;

    const rate = Math.round(this.currentQps * (deltaMs / 1000) * this.loadMultiplier);
    this.totalMessages += rate;

    // Stage 1: Sent ACK (single tick)
    this.sentAcks += rate;

    // Stage 2: Delivered ACK (double tick) (~90% delivered immediately)
    const delivered = Math.round(rate * 0.9);
    this.deliveredAcks += delivered;

    // Stage 3: Read ACK (blue ticks) (~65% read promptly)
    const read = Math.round(rate * 0.65);
    this.readAcks += read;

    // Group fanout (approx 20% of messages are group chats with ~8 members)
    const groupMsgs = Math.round(rate * 0.2);
    this.groupFanoutMessages += groupMsgs * 8;

    this.activeWebSockets = Math.round(1800000 * this.loadMultiplier);

    this.queueDepth = Math.max(15, Math.min(2200, Math.round(this.queueDepth + (this.loadMultiplier - 1.0) * 110 + (Math.random() * 25 - 12))));
    this.avgLatencyMs = Number((10 + (this.queueDepth / 90) * 1.6).toFixed(1));
    this.p99LatencyMs = Number((this.avgLatencyMs * 2.4).toFixed(1));

    if (this.currentQps * this.loadMultiplier > this.peakQps) {
      this.peakQps = Math.round(this.currentQps * this.loadMultiplier);
    }
  }

  public injectLoadMultiplier(multiplier: number): void {
    this.loadMultiplier = multiplier;
    this.addEvent('info', 'NEW_YEAR_EVE_SPIKE', `Message volume escalated to ${multiplier}x peak (Midnight Countdown).`);
  }

  public injectAnomaly(anomalyType: string): void {
    switch (anomalyType) {
      case 'gateway-fd-exhaustion':
        this.activeWebSockets = Math.max(10000, this.activeWebSockets - 500000);
        this.queueDepth += 950;
        this.avgLatencyMs += 55;
        this.addEvent('error', 'SOCKET_FD_EXHAUSTION', 'WebSocket gateway hit OS ulimit file descriptor cap. 500k clients disconnected; reconnect backoff triggered.');
        break;
      case 'cassandra-compaction-lag':
        this.cassandraPendingWrites += 1200;
        this.avgLatencyMs += 45;
        this.addEvent('warn', 'CASSANDRA_COMPACTION_LAG', 'Major SSTable compaction storm on Cassandra cluster. Write latency degraded to 45ms.');
        break;
      default:
        this.addEvent('warn', 'ANOMALY_TRIGGERED', `Synthetic anomaly: ${anomalyType}`);
        break;
    }
  }

  public getStats(): ScenarioSimulationStats {
    const deliveryRate = this.totalMessages > 0 ? this.deliveredAcks / this.totalMessages : 0.9;
    const saturation = Math.min(100, Math.round((this.queueDepth / 2000) * 100));

    return {
      scenarioId: this.scenarioId,
      currentQps: Math.round(this.currentQps * this.loadMultiplier),
      peakQps: this.peakQps,
      avgLatencyMs: this.avgLatencyMs,
      p99LatencyMs: this.p99LatencyMs,
      cacheHitRatio: Number(deliveryRate.toFixed(3)),
      activeWorkers: Math.max(10, Math.round(20 * this.loadMultiplier)),
      queueDepth: this.queueDepth,
      resourceSaturationPercent: saturation,
      droppedRequests: 0,
      totalCompleted: this.totalMessages,
      statusSummary: `Messages: ${this.totalMessages.toLocaleString()} | Delivered: ${this.deliveredAcks.toLocaleString()} (✓✓) | Read: ${this.readAcks.toLocaleString()} | Active WebSockets: ${(this.activeWebSockets / 1e6).toFixed(2)}M`,
    };
  }

  public getEvents(limit: number = 10): ScenarioSimulationEvent[] {
    return this.events.slice(-limit);
  }

  public reset(): void {
    this.totalMessages = 0;
    this.sentAcks = 0;
    this.deliveredAcks = 0;
    this.readAcks = 0;
    this.groupFanoutMessages = 0;
    this.activeWebSockets = 1800000;
    this.cassandraPendingWrites = 85;
    this.queueDepth = 140;
    this.avgLatencyMs = 16;
    this.p99LatencyMs = 42;
    this.events = [];
    this.addEvent('info', 'RESET', 'WhatsApp simulator reset to baseline state.');
  }

  private addEvent(
    severity: ScenarioSimulationEvent['severity'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: ScenarioSimulationEvent = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
