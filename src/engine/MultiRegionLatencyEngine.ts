/**
 * MultiRegionLatencyEngine — Physical WAN Backbone & Subsea Fiber Simulation
 * 
 * Accurately models speed-of-light propagation delays through optical fiber,
 * inter-continental subsea cable cuts, traffic rerouting penalties, and WAN congestion.
 */

import {
  RegionId,
  SubseaCableId,
  SubseaCable,
  ClientOriginRegion,
  SUBSEA_CABLES_CONFIG,
} from './MultiRegionTypes';

export class MultiRegionLatencyEngine {
  private cables: Map<SubseaCableId, SubseaCable> = new Map();
  private severedCables: Set<SubseaCableId> = new Set();
  private congestedCables: Set<SubseaCableId> = new Set();

  constructor() {
    this.initializeCables();
  }

  private initializeCables(): void {
    SUBSEA_CABLES_CONFIG.forEach((c) => {
      this.cables.set(c.id, { ...c });
    });
  }

  public getCables(): SubseaCable[] {
    return Array.from(this.cables.values());
  }

  public getCable(id: SubseaCableId): SubseaCable | undefined {
    return this.cables.get(id);
  }

  public severCable(id: SubseaCableId): void {
    const cable = this.cables.get(id);
    if (cable) {
      cable.status = 'severed';
      this.severedCables.add(id);
      this.congestedCables.delete(id);
    }
  }

  public congestCable(id: SubseaCableId): void {
    const cable = this.cables.get(id);
    if (cable) {
      cable.status = 'congested';
      this.congestedCables.add(id);
      this.severedCables.delete(id);
    }
  }

  public healCable(id: SubseaCableId): void {
    const cable = this.cables.get(id);
    if (cable) {
      cable.status = 'operational';
      this.severedCables.delete(id);
      this.congestedCables.delete(id);
    }
  }

  public healAllCables(): void {
    this.cables.forEach((c) => {
      c.status = 'operational';
    });
    this.severedCables.clear();
    this.congestedCables.clear();
  }

  public getSeveredCableIds(): SubseaCableId[] {
    return Array.from(this.severedCables);
  }

  /**
   * Computes dynamic WAN latency between a client continent and a regional data center
   */
  public getClientToRegionLatency(
    origin: ClientOriginRegion,
    regionId: RegionId
  ): { latencyMs: number; jitterMs: number; isRerouted: boolean } {
    let base = 25;
    let jitter = 4;
    let isRerouted = false;

    // Baseline geographic distance matrix (Client continent -> Data Center Region)
    switch (origin) {
      case 'north-america':
        if (regionId === 'us-east-1') base = 16;
        else if (regionId === 'us-west-2') base = 32;
        else if (regionId === 'eu-central-1') {
          base = 86;
          if (this.severedCables.has('transatlantic-north')) {
            base += 135;
            jitter += 18;
            isRerouted = true;
          }
        } else if (regionId === 'ap-northeast-1') {
          base = 128;
          if (this.severedCables.has('transpacific-express')) {
            base += 150;
            jitter += 20;
            isRerouted = true;
          }
        } else if (regionId === 'ap-south-1') base = 195;
        else if (regionId === 'sa-east-1') base = 115;
        break;

      case 'europe':
        if (regionId === 'eu-central-1') base = 14;
        else if (regionId === 'us-east-1') {
          base = 84;
          if (this.severedCables.has('transatlantic-north')) {
            base += 135;
            jitter += 18;
            isRerouted = true;
          }
        } else if (regionId === 'us-west-2') base = 145;
        else if (regionId === 'ap-south-1') {
          base = 112;
          if (this.severedCables.has('asia-europe-gateway')) {
            base += 160;
            jitter += 22;
            isRerouted = true;
          }
        } else if (regionId === 'ap-northeast-1') base = 210;
        else if (regionId === 'sa-east-1') base = 180;
        break;

      case 'asia-pacific':
        if (regionId === 'ap-northeast-1') base = 22;
        else if (regionId === 'ap-south-1') base = 48;
        else if (regionId === 'us-west-2') {
          base = 104;
          if (this.severedCables.has('transpacific-express')) {
            base += 155;
            jitter += 20;
            isRerouted = true;
          }
        } else if (regionId === 'us-east-1') base = 185;
        else if (regionId === 'eu-central-1') {
          base = 175;
          if (this.severedCables.has('asia-europe-gateway')) {
            base += 140;
            jitter += 25;
            isRerouted = true;
          }
        } else if (regionId === 'sa-east-1') base = 280;
        break;

      case 'south-america':
        if (regionId === 'sa-east-1') base = 18;
        else if (regionId === 'us-east-1') {
          base = 116;
          if (this.severedCables.has('pan-american')) {
            base += 120;
            jitter += 15;
            isRerouted = true;
          }
        } else if (regionId === 'us-west-2') base = 160;
        else if (regionId === 'eu-central-1') base = 185;
        else if (regionId === 'ap-south-1') base = 310;
        else if (regionId === 'ap-northeast-1') base = 290;
        break;

      case 'middle-east':
        if (regionId === 'ap-south-1') base = 38;
        else if (regionId === 'eu-central-1') {
          base = 78;
          if (this.severedCables.has('asia-europe-gateway')) {
            base += 125;
            jitter += 18;
            isRerouted = true;
          }
        } else if (regionId === 'us-east-1') base = 140;
        else if (regionId === 'us-west-2') base = 210;
        else if (regionId === 'ap-northeast-1') base = 145;
        else if (regionId === 'sa-east-1') base = 240;
        break;
    }

    // Add random micro-jitter
    const actualLatency = Math.max(8, Math.round(base + (Math.random() * jitter - jitter / 2)));
    return { latencyMs: actualLatency, jitterMs: jitter, isRerouted };
  }

  /**
   * Computes replication lag delay between primary region and replica regions
   */
  public getInterRegionLatency(
    fromRegion: RegionId,
    toRegion: RegionId
  ): { latencyMs: number; isSevered: boolean } {
    if (fromRegion === toRegion) return { latencyMs: 0, isSevered: false };

    // Check direct matching cable
    for (const cable of this.cables.values()) {
      const match =
        (cable.fromRegion === fromRegion && cable.toRegion === toRegion) ||
        (cable.fromRegion === toRegion && cable.toRegion === fromRegion);

      if (match) {
        if (cable.status === 'severed') {
          // Rerouted via alternate cable path with +140ms penalty
          return { latencyMs: cable.baseLatencyMs + 140, isSevered: true };
        } else if (cable.status === 'congested') {
          return { latencyMs: cable.baseLatencyMs + 65, isSevered: false };
        }
        return { latencyMs: cable.baseLatencyMs, isSevered: false };
      }
    }

    // Default synthetic multi-hop backbone latency
    return { latencyMs: 140, isSevered: false };
  }

  /**
   * Generates a complete latency matrix for all Client Origins x Regions
   */
  public generateFullLatencyMatrix(): Record<string, Record<string, number>> {
    const origins: ClientOriginRegion[] = [
      'north-america',
      'europe',
      'asia-pacific',
      'south-america',
      'middle-east',
    ];
    const regions: RegionId[] = [
      'us-east-1',
      'us-west-2',
      'eu-central-1',
      'ap-south-1',
      'ap-northeast-1',
      'sa-east-1',
    ];

    const matrix: Record<string, Record<string, number>> = {};

    for (const orig of origins) {
      matrix[orig] = {};
      for (const reg of regions) {
        matrix[orig][reg] = this.getClientToRegionLatency(orig, reg).latencyMs;
      }
    }

    return matrix;
  }
}
