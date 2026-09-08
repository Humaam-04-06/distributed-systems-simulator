/**
 * UberGeohashSimulator — Simulates H3 Hexagonal Spatial Indexing & Ride Dispatch
 * 
 * Features:
 * - H3 spatial cell partitioning (Hex resolution 8, ~460m cell diameter)
 * - Driver location ping ingestion stream (4-second heartbeat cadence)
 * - K-ring radial search for nearest candidate drivers
 * - Real-time supply/demand surge pricing multiplier recalculation
 */

import {
  IScenarioSimulator,
  ScenarioSimulationEvent,
  ScenarioSimulationStats,
} from './ScenarioSimulatorTypes';
import { ScenarioId } from '../ScenarioTypes';

export interface SpatialHexCell {
  cellId: string;
  driverCount: number;
  riderRequests: number;
  surgeMultiplier: number;
}

export class UberGeohashSimulator implements IScenarioSimulator {
  public readonly scenarioId: ScenarioId = 'uber-ride-matching';
  private running: boolean = false;
  private loadMultiplier: number = 1.0;

  private totalPingsIngested: number = 0;
  private totalDispatches: number = 0;
  private matchedRides: number = 0;
  private failedDispatches: number = 0;
  private currentQps: number = 8500;
  private peakQps: number = 8500;
  private avgLatencyMs: number = 24;
  private p99LatencyMs: number = 62;
  private queueDepth: number = 180;
  private events: ScenarioSimulationEvent[] = [];

  // Spatial hex clusters
  private hexCells: Map<string, SpatialHexCell> = new Map();
  public maxSearchRadiusKm: number = 5.0;

  constructor() {
    this.initHexCells();
  }

  private initHexCells(): void {
    const defaultCells = ['8828308281fffff', '8828308285fffff', '8828308287fffff', '882830828bfffff'];
    defaultCells.forEach((id, idx) => {
      this.hexCells.set(id, {
        cellId: id,
        driverCount: 150 + idx * 40,
        riderRequests: 80 + idx * 25,
        surgeMultiplier: 1.0,
      });
    });
  }

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    this.running = true;
    this.addEvent('info', 'ENGINE_START', 'Uber Geospatial H3 Dispatch Engine started. Driver location ingestion active.');
  }

  public stop(): void {
    this.running = false;
    this.addEvent('info', 'ENGINE_STOP', 'Uber Geospatial Engine paused.');
  }

  public step(deltaMs: number): void {
    if (!this.running) return;

    const rate = Math.round(this.currentQps * (deltaMs / 1000) * this.loadMultiplier);
    const pings = Math.round(rate * 0.88);
    const dispatches = Math.max(1, Math.round(rate * 0.12));

    this.totalPingsIngested += pings;
    this.totalDispatches += dispatches;

    // Simulate driver matching in H3 cells
    let surgeActiveInCluster = false;
    this.hexCells.forEach((cell) => {
      cell.riderRequests = Math.max(10, Math.round(cell.riderRequests + (dispatches / 4) * this.loadMultiplier));
      const ratio = cell.riderRequests / Math.max(1, cell.driverCount);
      if (ratio > 1.4) {
        cell.surgeMultiplier = Number(Math.min(3.5, 1.0 + (ratio - 1.4) * 0.8).toFixed(1));
        surgeActiveInCluster = true;
      } else {
        cell.surgeMultiplier = 1.0;
      }
    });

    if (surgeActiveInCluster && Math.random() < 0.1) {
      this.addEvent('warn', 'SURGE_TRIGGERED', 'Dynamic surge pricing activated in high-demand H3 hexagonal cells (>1.4 demand/supply ratio).');
    }

    // Match success rate
    const matchesThisTick = Math.round(dispatches * (surgeActiveInCluster ? 0.91 : 0.98));
    this.matchedRides += matchesThisTick;
    this.failedDispatches += (dispatches - matchesThisTick);

    // Queue & latency model
    this.queueDepth = Math.max(20, Math.min(3000, Math.round(this.queueDepth + (this.loadMultiplier - 1.0) * 120 + (Math.random() * 30 - 15))));
    this.avgLatencyMs = Number((18 + (this.queueDepth / 120) * 2.2).toFixed(1));
    this.p99LatencyMs = Number((this.avgLatencyMs * 2.6).toFixed(1));

    if (this.currentQps * this.loadMultiplier > this.peakQps) {
      this.peakQps = Math.round(this.currentQps * this.loadMultiplier);
    }
  }

  public injectLoadMultiplier(multiplier: number): void {
    this.loadMultiplier = multiplier;
    this.addEvent('info', 'LOAD_SCALED', `Driver/Rider load scaled to ${multiplier}x.`);
  }

  public injectAnomaly(anomalyType: string): void {
    switch (anomalyType) {
      case 'stadium-surge':
        this.hexCells.forEach((cell) => {
          cell.riderRequests += 600;
          cell.surgeMultiplier = 3.5;
        });
        this.queueDepth += 900;
        this.avgLatencyMs += 40;
        this.addEvent('error', 'STADIUM_SURGE_SPIKE', 'Stadium concert egress detected! Demand/supply ratio skyrocketed. 3.5x surge applied across adjacent hexes.');
        break;
      case 'geohash-partition':
        this.failedDispatches += 350;
        this.avgLatencyMs += 65;
        this.addEvent('error', 'GEOHASH_SHARD_PARTITION', 'Network split on Redis Geospatial shard 2. K-ring radius lookups falling back to secondary zone.');
        break;
      default:
        this.addEvent('warn', 'ANOMALY_TRIGGERED', `Synthetic anomaly: ${anomalyType}`);
        break;
    }
  }

  public getStats(): ScenarioSimulationStats {
    const total = this.matchedRides + this.failedDispatches;
    const matchRate = total > 0 ? this.matchedRides / total : 0.98;
    const saturation = Math.min(100, Math.round((this.queueDepth / 2500) * 100));

    return {
      scenarioId: this.scenarioId,
      currentQps: Math.round(this.currentQps * this.loadMultiplier),
      peakQps: this.peakQps,
      avgLatencyMs: this.avgLatencyMs,
      p99LatencyMs: this.p99LatencyMs,
      cacheHitRatio: Number(matchRate.toFixed(3)),
      activeWorkers: Math.max(6, Math.round(12 * this.loadMultiplier)),
      queueDepth: this.queueDepth,
      resourceSaturationPercent: saturation,
      droppedRequests: this.failedDispatches,
      totalCompleted: this.totalPingsIngested + this.matchedRides,
      statusSummary: `Pings: ${this.totalPingsIngested.toLocaleString()} | Dispatches: ${this.totalDispatches.toLocaleString()} (${(matchRate * 100).toFixed(1)}% match)`,
    };
  }

  public getEvents(limit: number = 10): ScenarioSimulationEvent[] {
    return this.events.slice(-limit);
  }

  public reset(): void {
    this.totalPingsIngested = 0;
    this.totalDispatches = 0;
    this.matchedRides = 0;
    this.failedDispatches = 0;
    this.queueDepth = 180;
    this.avgLatencyMs = 24;
    this.p99LatencyMs = 62;
    this.events = [];
    this.initHexCells();
    this.addEvent('info', 'RESET', 'Uber Geohash Simulator reset to baseline state.');
  }

  private addEvent(
    severity: ScenarioSimulationEvent['severity'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: ScenarioSimulationEvent = {
      id: `ub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
