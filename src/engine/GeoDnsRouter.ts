/**
 * GeoDnsRouter — Global DNS & Anycast BGP Traffic Director
 * 
 * Implements intelligent DNS resolution algorithms:
 * - Geoproximity (Haversine Great-Circle Distance)
 * - Latency-Based Probing (Simulated WAN RTT)
 * - Weighted Round Robin (Capacity-Proportional Distribution)
 * - Active-Passive Regional Failover
 * - BGP Anycast Shortest AS-Path Routing with Route Flap Simulation
 */

import {
  RegionId,
  RegionDefinition,
  GeoRoutingPolicy,
  ClientOriginRegion,
  ClientOrigin,
  GeoDnsResolutionResult,
  CLIENT_ORIGINS_CONFIG,
  GLOBAL_REGIONS_CONFIG,
} from './MultiRegionTypes';

export class GeoDnsRouter {
  private activePolicy: GeoRoutingPolicy = 'geo-proximity';
  private regions: Map<RegionId, RegionDefinition> = new Map();
  private origins: Map<ClientOriginRegion, ClientOrigin> = new Map();
  private totalResolutions: number = 0;
  private failoverCount: number = 0;
  private resolutionCounts: Map<RegionId, number> = new Map();

  constructor() {
    this.initializeRegions();
    this.initializeOrigins();
  }

  private initializeRegions(): void {
    GLOBAL_REGIONS_CONFIG.forEach((r) => {
      this.regions.set(r.id, { ...r });
      this.resolutionCounts.set(r.id, 0);
    });
  }

  private initializeOrigins(): void {
    CLIENT_ORIGINS_CONFIG.forEach((o) => {
      this.origins.set(o.id, { ...o });
    });
  }

  public setPolicy(policy: GeoRoutingPolicy): void {
    this.activePolicy = policy;
  }

  public getPolicy(): GeoRoutingPolicy {
    return this.activePolicy;
  }

  public updateRegion(region: RegionDefinition): void {
    this.regions.set(region.id, { ...region });
  }

  public getRegions(): RegionDefinition[] {
    return Array.from(this.regions.values());
  }

  public getRegion(id: RegionId): RegionDefinition | undefined {
    return this.regions.get(id);
  }

  public getOrigins(): ClientOrigin[] {
    return Array.from(this.origins.values());
  }

  /**
   * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
   */
  private computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Filters out regions that are offline or evacuated from DNS record pools
   */
  private getHealthyCandidates(): RegionDefinition[] {
    const all = Array.from(this.regions.values());
    const eligible = all.filter((r) => r.status === 'healthy' || r.status === 'degraded');
    return eligible.length > 0 ? eligible : all; // Fallback to all if catastrophic total outage
  }

  /**
   * Resolves a client origin to the optimal target region based on the configured policy
   */
  public resolve(
    originRegion: ClientOriginRegion,
    latencyMatrix: Record<string, Record<string, number>> = {}
  ): GeoDnsResolutionResult {
    this.totalResolutions++;
    const origin = this.origins.get(originRegion) || CLIENT_ORIGINS_CONFIG[0];
    const healthyCandidates = this.getHealthyCandidates();
    let result: GeoDnsResolutionResult;

    switch (this.activePolicy) {
      case 'geo-proximity':
        result = this.resolveGeoProximity(origin, healthyCandidates);
        break;

      case 'latency-based':
        result = this.resolveLatencyBased(origin, healthyCandidates, latencyMatrix);
        break;

      case 'weighted-round-robin':
        result = this.resolveWeightedRoundRobin(healthyCandidates);
        break;

      case 'active-passive':
        result = this.resolveActivePassive(healthyCandidates);
        break;

      case 'anycast-bgp':
        result = this.resolveAnycastBgp(origin, healthyCandidates);
        break;

      default:
        result = this.resolveGeoProximity(origin, healthyCandidates);
        break;
    }

    // Track resolution metrics
    const currentCount = this.resolutionCounts.get(result.targetRegionId) || 0;
    this.resolutionCounts.set(result.targetRegionId, currentCount + 1);

    if (result.reroutedDueToHealth) {
      this.failoverCount++;
    }

    return result;
  }

  /**
   * Geo-Proximity: Picks the geographically closest healthy region by Haversine distance
   */
  private resolveGeoProximity(
    origin: ClientOrigin,
    candidates: RegionDefinition[]
  ): GeoDnsResolutionResult {
    let closestRegion = candidates[0];
    let minDistance = Infinity;

    // First, find theoretical closest among ALL regions
    const allRegions = Array.from(this.regions.values());
    let theoreticalClosest = allRegions[0];
    let theoreticalMinDistance = Infinity;

    for (const r of allRegions) {
      const dist = this.computeDistanceKm(origin.lat, origin.lon, r.lat, r.lon);
      if (dist < theoreticalMinDistance) {
        theoreticalMinDistance = dist;
        theoreticalClosest = r;
      }
    }

    for (const r of candidates) {
      const dist = this.computeDistanceKm(origin.lat, origin.lon, r.lat, r.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closestRegion = r;
      }
    }

    const rerouted = theoreticalClosest.id !== closestRegion.id;
    const estLatency = Math.round(15 + (minDistance / 1000) * 8);

    return {
      targetRegionId: closestRegion.id,
      policyUsed: 'geo-proximity',
      estimatedLatencyMs: estLatency,
      reason: rerouted
        ? `Failover: Nearest region [${theoreticalClosest.name}] unavailable; routed to next closest [${closestRegion.name}] (${Math.round(minDistance)} km).`
        : `Routed to nearest geographic data center [${closestRegion.name}] (${Math.round(minDistance)} km away).`,
      reroutedDueToHealth: rerouted,
    };
  }

  /**
   * Latency-Based: Selects the region with the lowest measured WAN RTT
   */
  private resolveLatencyBased(
    origin: ClientOrigin,
    candidates: RegionDefinition[],
    latencyMatrix: Record<string, Record<string, number>>
  ): GeoDnsResolutionResult {
    let bestRegion = candidates[0];
    let lowestLatency = Infinity;

    for (const r of candidates) {
      const measuredRtt = latencyMatrix[origin.id]?.[r.id] ?? (r.avgLatencyMs + 20);
      if (measuredRtt < lowestLatency) {
        lowestLatency = measuredRtt;
        bestRegion = r;
      }
    }

    return {
      targetRegionId: bestRegion.id,
      policyUsed: 'latency-based',
      estimatedLatencyMs: lowestLatency,
      reason: `Lowest WAN latency probe measured: ${lowestLatency}ms to [${bestRegion.name}].`,
      reroutedDueToHealth: bestRegion.status === 'degraded',
    };
  }

  /**
   * Weighted Round Robin: Distributes traffic based on region capacity weights
   */
  private resolveWeightedRoundRobin(candidates: RegionDefinition[]): GeoDnsResolutionResult {
    const totalWeight = candidates.reduce((sum, r) => sum + r.weight, 0);
    const rand = Math.random() * (totalWeight || 1);
    let cumulative = 0;
    let selected = candidates[0];

    for (const r of candidates) {
      cumulative += r.weight;
      if (rand <= cumulative) {
        selected = r;
        break;
      }
    }

    return {
      targetRegionId: selected.id,
      policyUsed: 'weighted-round-robin',
      estimatedLatencyMs: selected.avgLatencyMs + 25,
      reason: `Distributed to [${selected.name}] via weighted capacity allocation (${selected.weight}% weight share).`,
      reroutedDueToHealth: false,
    };
  }

  /**
   * Active-Passive: 100% traffic to primary region unless down, then failover to hot standby
   */
  private resolveActivePassive(candidates: RegionDefinition[]): GeoDnsResolutionResult {
    const primary = this.regions.get('us-east-1');
    const isPrimaryHealthy = primary && (primary.status === 'healthy');

    if (isPrimaryHealthy) {
      return {
        targetRegionId: 'us-east-1',
        policyUsed: 'active-passive',
        estimatedLatencyMs: primary.avgLatencyMs + 10,
        reason: 'Active-Passive Policy: 100% ingress directed to Primary Hub [us-east-1].',
        reroutedDueToHealth: false,
      };
    }

    // Standby failover: pick us-west-2, or eu-central-1
    const standby = candidates.find((r) => r.id === 'us-west-2') || candidates[0];
    return {
      targetRegionId: standby.id,
      policyUsed: 'active-passive',
      estimatedLatencyMs: standby.avgLatencyMs + 45,
      reason: `Active-Passive AUTOMATED FAILOVER: Primary [us-east-1] is ${primary?.status ?? 'down'}. Traffic failed over to Standby Hub [${standby.name}]!`,
      reroutedDueToHealth: true,
    };
  }

  /**
   * Anycast BGP: Simulates single global VIP routed via shortest BGP Autonomous System path
   */
  private resolveAnycastBgp(
    origin: ClientOrigin,
    candidates: RegionDefinition[]
  ): GeoDnsResolutionResult {
    // Under Anycast, client routes to nearest BGP POP/Edge
    const sorted = [...candidates].sort((a, b) => {
      const distA = this.computeDistanceKm(origin.lat, origin.lon, a.lat, a.lon);
      const distB = this.computeDistanceKm(origin.lat, origin.lon, b.lat, b.lon);
      return distA - distB;
    });

    const anycastTarget = sorted[0];
    const asHops = Math.max(2, Math.floor(this.computeDistanceKm(origin.lat, origin.lon, anycastTarget.lat, anycastTarget.lon) / 1200) + 1);

    return {
      targetRegionId: anycastTarget.id,
      policyUsed: 'anycast-bgp',
      estimatedLatencyMs: 12 + asHops * 8,
      reason: `BGP Anycast AS-Path resolution: Selected [${anycastTarget.name}] via shortest AS path (${asHops} BGP hops).`,
      reroutedDueToHealth: false,
    };
  }

  public getResolutionStats() {
    return {
      totalResolutions: this.totalResolutions,
      failoverCount: this.failoverCount,
      distribution: Object.fromEntries(this.resolutionCounts.entries()),
    };
  }

  public reset(): void {
    this.totalResolutions = 0;
    this.failoverCount = 0;
    this.initializeRegions();
    this.initializeOrigins();
  }
}
