/**
 * CrossRegionFailoverManager — Global Multi-Region Failover & Replication Controller
 * 
 * Manages Active-Active vs. Active-Passive deployment topologies, automated
 * leader promotion on primary region failure, and graceful traffic evacuation.
 */

import {
  RegionId,
  RegionDefinition,
  GLOBAL_REGIONS_CONFIG,
} from './MultiRegionTypes';

export type RegionalDeploymentTopology = 'active-active' | 'active-passive';

export interface RegionalReplicationStream {
  fromRegion: RegionId;
  toRegion: RegionId;
  replicationLagMs: number;
  walBytesBehindKb: number;
  syncState: 'in_sync' | 'catching_up' | 'diverged';
  lastReplicatedLsn: number;
}

export interface RegionFailoverEvent {
  id: string;
  timestampMs: number;
  regionId: RegionId;
  type: 'evacuated' | 'promoted_primary' | 'restored' | 'az_failure' | 'drain_started';
  message: string;
}

export class CrossRegionFailoverManager {
  private primaryRegionId: RegionId = 'us-east-1';
  private topology: RegionalDeploymentTopology = 'active-active';
  private regions: Map<RegionId, RegionDefinition> = new Map();
  private evacuatedRegions: Set<RegionId> = new Set();
  private replicationStreams: Map<string, RegionalReplicationStream> = new Map();
  private events: RegionFailoverEvent[] = [];
  private readonly maxEvents = 60;
  private currentLsn: number = 10000;

  constructor() {
    this.initializeRegions();
    this.initializeReplicationStreams();
  }

  private initializeRegions(): void {
    GLOBAL_REGIONS_CONFIG.forEach((r) => {
      this.regions.set(r.id, { ...r });
    });
  }

  private initializeReplicationStreams(): void {
    const replicaRegions: RegionId[] = [
      'us-west-2',
      'eu-central-1',
      'ap-south-1',
      'ap-northeast-1',
      'sa-east-1',
    ];

    replicaRegions.forEach((repId) => {
      const reg = this.regions.get(repId);
      const baseLag = reg?.replicationLagMs ?? 60;
      this.replicationStreams.set(`${this.primaryRegionId}->${repId}`, {
        fromRegion: this.primaryRegionId,
        toRegion: repId,
        replicationLagMs: baseLag,
        walBytesBehindKb: Math.round(baseLag * 4.5),
        syncState: 'in_sync',
        lastReplicatedLsn: this.currentLsn - Math.round(baseLag * 2),
      });
    });
  }

  public getPrimaryRegionId(): RegionId {
    return this.primaryRegionId;
  }

  public getTopology(): RegionalDeploymentTopology {
    return this.topology;
  }

  public setTopology(topology: RegionalDeploymentTopology): void {
    this.topology = topology;
    this.addEvent(
      this.primaryRegionId,
      'drain_started',
      `Regional deployment topology updated to [${topology.toUpperCase()}].`
    );
  }

  public getRegions(): RegionDefinition[] {
    return Array.from(this.regions.values());
  }

  public getEvacuatedRegions(): RegionId[] {
    return Array.from(this.evacuatedRegions);
  }

  public isEvacuated(regionId: RegionId): boolean {
    return this.evacuatedRegions.has(regionId);
  }

  public getReplicationStreams(): RegionalReplicationStream[] {
    return Array.from(this.replicationStreams.values());
  }

  public getEvents(): RegionFailoverEvent[] {
    return [...this.events];
  }

  private addEvent(
    regionId: RegionId,
    type: RegionFailoverEvent['type'],
    message: string
  ): void {
    this.events.unshift({
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestampMs: Date.now(),
      regionId,
      type,
      message,
    });
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
  }

  /**
   * Gracefully drains all ingress traffic and evacuates a regional data center
   */
  public evacuateRegion(regionId: RegionId, reason: string = 'Manual operator evacuation'): void {
    const reg = this.regions.get(regionId);
    if (!reg) return;

    this.evacuatedRegions.add(regionId);
    reg.status = 'evacuated';
    reg.ingressRps = 0;
    reg.cpuLoad = 5;

    this.addEvent(
      regionId,
      'evacuated',
      `Region [${reg.name}] EVACUATED! DNS records withdrawn. Reason: ${reason}`
    );

    // If the evacuated region is the active Primary, elect a new Primary region immediately!
    if (regionId === this.primaryRegionId) {
      this.promoteNewPrimary();
    }
  }

  /**
   * Restores an evacuated region back to healthy rotation
   */
  public restoreRegion(regionId: RegionId): void {
    const reg = this.regions.get(regionId);
    if (!reg) return;

    this.evacuatedRegions.delete(regionId);
    reg.status = 'healthy';
    reg.healthCheckFailures = 0;
    reg.cpuLoad = 25;

    this.addEvent(
      regionId,
      'restored',
      `Region [${reg.name}] restored to healthy DNS pool. Re-establishing replication.`
    );
  }

  /**
   * Simulates an Availability Zone (AZ) failure inside a region
   */
  public simulateAzOutage(regionId: RegionId): void {
    const reg = this.regions.get(regionId);
    if (!reg) return;

    reg.status = 'degraded';
    reg.activeInstances = Math.max(2, Math.floor(reg.activeInstances / 2));
    reg.avgLatencyMs += 65;
    reg.cpuLoad = 88;

    this.addEvent(
      regionId,
      'az_failure',
      `Major AZ failure in [${reg.name}]! 50% compute instances lost, latency +65ms.`
    );
  }

  /**
   * Promotes the replica with lowest replication lag to become the new Primary
   */
  public promoteNewPrimary(targetRegionId?: RegionId): RegionId {
    let candidateId = targetRegionId;

    if (!candidateId) {
      // Find candidate with lowest lag that is NOT evacuated
      const candidates = Array.from(this.regions.values()).filter(
        (r) => r.id !== this.primaryRegionId && !this.evacuatedRegions.has(r.id) && r.status !== 'offline'
      );

      if (candidates.length === 0) {
        return this.primaryRegionId; // No viable candidates
      }

      candidates.sort((a, b) => a.replicationLagMs - b.replicationLagMs);
      candidateId = candidates[0].id;
    }

    // Demote current primary
    const oldPrimary = this.regions.get(this.primaryRegionId);
    if (oldPrimary) oldPrimary.isPrimary = false;

    // Promote new primary
    const newPrimary = this.regions.get(candidateId);
    if (newPrimary) {
      newPrimary.isPrimary = true;
      this.primaryRegionId = candidateId;
      this.addEvent(
        candidateId,
        'promoted_primary',
        `Automated Failover: [${newPrimary.name}] promoted to Global Primary Leader!`
      );
      this.rebuildReplicationTopology();
    }

    return this.primaryRegionId;
  }

  private rebuildReplicationTopology(): void {
    this.replicationStreams.clear();
    const otherRegions = Array.from(this.regions.keys()).filter((id) => id !== this.primaryRegionId);

    otherRegions.forEach((repId) => {
      const reg = this.regions.get(repId);
      const lag = reg?.replicationLagMs ?? 75;
      this.replicationStreams.set(`${this.primaryRegionId}->${repId}`, {
        fromRegion: this.primaryRegionId,
        toRegion: repId,
        replicationLagMs: lag,
        walBytesBehindKb: Math.round(lag * 3.8),
        syncState: 'in_sync',
        lastReplicatedLsn: this.currentLsn - Math.round(lag * 1.5),
      });
    });
  }

  /**
   * Periodic simulation tick for replication lag progression
   */
  public tick(deltaMs: number, globalWriteRps: number): void {
    this.currentLsn += Math.round(globalWriteRps * (deltaMs / 1000) * 2);

    this.replicationStreams.forEach((stream) => {
      const targetReg = this.regions.get(stream.toRegion);
      if (!targetReg) return;

      if (targetReg.status === 'degraded') {
        stream.replicationLagMs = Math.min(650, stream.replicationLagMs + 4);
        stream.walBytesBehindKb = Math.round(stream.replicationLagMs * 8);
        stream.syncState = 'catching_up';
      } else if (targetReg.status === 'evacuated') {
        stream.syncState = 'diverged';
      } else {
        // Normal convergence towards baseline
        const baseline = targetReg.id === 'us-west-2' ? 65 : targetReg.id === 'eu-central-1' ? 82 : 140;
        if (stream.replicationLagMs > baseline) {
          stream.replicationLagMs = Math.max(baseline, stream.replicationLagMs - 2);
        }
        stream.syncState = 'in_sync';
        stream.walBytesBehindKb = Math.round(stream.replicationLagMs * 3.2);
      }

      targetReg.replicationLagMs = stream.replicationLagMs;
      stream.lastReplicatedLsn = this.currentLsn - Math.round(stream.replicationLagMs * 1.5);
    });
  }

  public reset(): void {
    this.primaryRegionId = 'us-east-1';
    this.topology = 'active-active';
    this.evacuatedRegions.clear();
    this.events = [];
    this.currentLsn = 10000;
    this.initializeRegions();
    this.initializeReplicationStreams();
  }
}
