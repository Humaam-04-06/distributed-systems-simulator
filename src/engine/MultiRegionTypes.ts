/**
 * MultiRegionTypes — Definitions for Global Multi-Region Traffic Routing,
 * Geo-DNS, Subsea Cable WAN backbones, and Automated Failover.
 */

export type RegionId =
  | 'us-east-1'
  | 'us-west-2'
  | 'eu-central-1'
  | 'ap-south-1'
  | 'ap-northeast-1'
  | 'sa-east-1';

export type GeoRoutingPolicy =
  | 'geo-proximity'
  | 'latency-based'
  | 'weighted-round-robin'
  | 'active-passive'
  | 'anycast-bgp';

export type ClientOriginRegion =
  | 'north-america'
  | 'south-america'
  | 'europe'
  | 'asia-pacific'
  | 'middle-east';

export interface ClientOrigin {
  id: ClientOriginRegion;
  name: string;
  lat: number;
  lon: number;
  svgX: number; // 0-1000 coordinate space for SVG world map
  svgY: number; // 0-500 coordinate space
  baseTrafficShare: number; // 0.0 - 1.0
}

export type RegionStatus = 'healthy' | 'degraded' | 'evacuated' | 'offline';

export interface RegionDefinition {
  id: RegionId;
  name: string;
  location: string;
  lat: number;
  lon: number;
  svgX: number;
  svgY: number;
  isPrimary: boolean;
  weight: number; // 1 to 100 for weighted round robin
  status: RegionStatus;
  activeInstances: number;
  ingressRps: number;
  avgLatencyMs: number;
  replicationLagMs: number;
  healthCheckFailures: number;
  cpuLoad: number;
}

export type SubseaCableId =
  | 'transatlantic-north'
  | 'transpacific-express'
  | 'asia-europe-gateway'
  | 'pan-american'
  | 'indian-ocean-cable';

export type CableStatus = 'operational' | 'congested' | 'severed';

export interface SubseaCable {
  id: SubseaCableId;
  name: string;
  fromRegion: RegionId;
  toRegion: RegionId;
  baseLatencyMs: number;
  status: CableStatus;
  jitterMs: number;
  capacityGbps: number;
}

export interface GeoDnsResolutionResult {
  targetRegionId: RegionId;
  policyUsed: GeoRoutingPolicy;
  estimatedLatencyMs: number;
  reason: string;
  reroutedDueToHealth: boolean;
  transitCableId?: SubseaCableId;
}

export interface MultiRegionSnapshot {
  regions: RegionDefinition[];
  cables: SubseaCable[];
  activePolicy: GeoRoutingPolicy;
  globalAverageLatencyMs: number;
  globalIngressRps: number;
  evacuatedRegions: RegionId[];
  severedCables: SubseaCableId[];
  primaryRegionId: RegionId;
  activeTrafficArcs: {
    fromOrigin: ClientOriginRegion;
    toRegion: RegionId;
    intensity: number;
  }[];
}

export const GLOBAL_REGIONS_CONFIG: RegionDefinition[] = [
  {
    id: 'us-east-1',
    name: 'US East (N. Virginia)',
    location: 'North America',
    lat: 38.03,
    lon: -78.47,
    svgX: 260,
    svgY: 175,
    isPrimary: true,
    weight: 40,
    status: 'healthy',
    activeInstances: 12,
    ingressRps: 0,
    avgLatencyMs: 18,
    replicationLagMs: 0,
    healthCheckFailures: 0,
    cpuLoad: 25,
  },
  {
    id: 'us-west-2',
    name: 'US West (Oregon)',
    location: 'North America',
    lat: 45.52,
    lon: -122.67,
    svgX: 165,
    svgY: 155,
    isPrimary: false,
    weight: 30,
    status: 'healthy',
    activeInstances: 8,
    ingressRps: 0,
    avgLatencyMs: 24,
    replicationLagMs: 65,
    healthCheckFailures: 0,
    cpuLoad: 20,
  },
  {
    id: 'eu-central-1',
    name: 'Europe (Frankfurt)',
    location: 'Europe',
    lat: 50.11,
    lon: 8.68,
    svgX: 520,
    svgY: 140,
    isPrimary: false,
    weight: 25,
    status: 'healthy',
    activeInstances: 10,
    ingressRps: 0,
    avgLatencyMs: 22,
    replicationLagMs: 82,
    healthCheckFailures: 0,
    cpuLoad: 28,
  },
  {
    id: 'ap-south-1',
    name: 'Asia (Mumbai)',
    location: 'Asia Pacific',
    lat: 19.07,
    lon: 72.87,
    svgX: 685,
    svgY: 235,
    isPrimary: false,
    weight: 20,
    status: 'healthy',
    activeInstances: 6,
    ingressRps: 0,
    avgLatencyMs: 35,
    replicationLagMs: 145,
    healthCheckFailures: 0,
    cpuLoad: 32,
  },
  {
    id: 'ap-northeast-1',
    name: 'Asia (Tokyo)',
    location: 'Asia Pacific',
    lat: 35.68,
    lon: 139.69,
    svgX: 840,
    svgY: 185,
    isPrimary: false,
    weight: 25,
    status: 'healthy',
    activeInstances: 8,
    ingressRps: 0,
    avgLatencyMs: 20,
    replicationLagMs: 160,
    healthCheckFailures: 0,
    cpuLoad: 22,
  },
  {
    id: 'sa-east-1',
    name: 'South America (São Paulo)',
    location: 'South America',
    lat: -23.55,
    lon: -46.63,
    svgX: 345,
    svgY: 370,
    isPrimary: false,
    weight: 15,
    status: 'healthy',
    activeInstances: 4,
    ingressRps: 0,
    avgLatencyMs: 28,
    replicationLagMs: 120,
    healthCheckFailures: 0,
    cpuLoad: 18,
  },
];

export const CLIENT_ORIGINS_CONFIG: ClientOrigin[] = [
  {
    id: 'north-america',
    name: 'North America Clients',
    lat: 40.0,
    lon: -100.0,
    svgX: 215,
    svgY: 160,
    baseTrafficShare: 0.35,
  },
  {
    id: 'europe',
    name: 'European Clients',
    lat: 48.0,
    lon: 14.0,
    svgX: 535,
    svgY: 145,
    baseTrafficShare: 0.28,
  },
  {
    id: 'asia-pacific',
    name: 'Asia Pacific Clients',
    lat: 28.0,
    lon: 115.0,
    svgX: 790,
    svgY: 210,
    baseTrafficShare: 0.22,
  },
  {
    id: 'south-america',
    name: 'South America Clients',
    lat: -15.0,
    lon: -55.0,
    svgX: 320,
    svgY: 335,
    baseTrafficShare: 0.08,
  },
  {
    id: 'middle-east',
    name: 'Middle East & Africa Clients',
    lat: 24.0,
    lon: 45.0,
    svgX: 620,
    svgY: 220,
    baseTrafficShare: 0.07,
  },
];

export const SUBSEA_CABLES_CONFIG: SubseaCable[] = [
  {
    id: 'transatlantic-north',
    name: 'TAT-14 Transatlantic Fiber',
    fromRegion: 'us-east-1',
    toRegion: 'eu-central-1',
    baseLatencyMs: 74,
    status: 'operational',
    jitterMs: 4,
    capacityGbps: 3200,
  },
  {
    id: 'transpacific-express',
    name: 'Unity Transpacific Express',
    fromRegion: 'us-west-2',
    toRegion: 'ap-northeast-1',
    baseLatencyMs: 98,
    status: 'operational',
    jitterMs: 6,
    capacityGbps: 4800,
  },
  {
    id: 'asia-europe-gateway',
    name: 'SEA-ME-WE 5 Gateway',
    fromRegion: 'eu-central-1',
    toRegion: 'ap-south-1',
    baseLatencyMs: 108,
    status: 'operational',
    jitterMs: 5,
    capacityGbps: 2400,
  },
  {
    id: 'pan-american',
    name: 'Seabras-1 Pan-American',
    fromRegion: 'us-east-1',
    toRegion: 'sa-east-1',
    baseLatencyMs: 112,
    status: 'operational',
    jitterMs: 7,
    capacityGbps: 1800,
  },
  {
    id: 'indian-ocean-cable',
    name: 'Bay of Bengal Gateway',
    fromRegion: 'ap-south-1',
    toRegion: 'ap-northeast-1',
    baseLatencyMs: 84,
    status: 'operational',
    jitterMs: 5,
    capacityGbps: 2200,
  },
];
