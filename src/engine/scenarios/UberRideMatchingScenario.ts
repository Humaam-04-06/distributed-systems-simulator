/**
 * UberRideMatchingScenario — System Design Interview Scenario Specification
 * Problem: Design a Real-Time Geospatial Ride-Matching Platform (Uber / Lyft)
 */

import { SystemDesignScenario } from './ScenarioTypes';

export const UBER_RIDE_MATCHING_SCENARIO: SystemDesignScenario = {
  id: 'uber-ride-matching',
  title: 'Design Uber / Lyft Real-Time Ride Matching',
  subtitle: 'Geospatial H3 Hexagonal Indexing, Location Ingestion & Surge Engine',
  category: 'geospatial',
  difficulty: 'hard',
  iconName: 'Car',
  summary:
    'Architect a high-velocity geospatial dispatch platform handling 1M concurrent drivers emitting GPS pings every 4s, sub-50ms radius queries via spatial indexes, and dynamic localized surge pricing.',
  requirements: {
    functional: [
      'Drivers report GPS coordinates (lat, lon, bearing, status) every 4 seconds',
      'Riders request a ride and are matched with the optimal nearby driver within 3-5 km',
      'Display real-time driver movement on passenger map in under 1 second',
      'Calculate dynamic surge pricing multipliers for geographic zones based on supply/demand',
    ],
    nonFunctional: [
      'Ultra-low latency: Driver match dispatch < 50ms P99',
      'Write-heavy ingestion: 250,000 GPS pings/sec sustained',
      'High availability: 99.99% (prevent ride disruptions)',
      'Graceful degradation: Stale driver location tolerated for 10s if network flaps',
    ],
    dauEstimate: 120_000_000,
    readWriteRatio: '1:50 Write Heavy (GPS Pings)',
    targetP99Ms: 45,
    targetAvailabilitySla: 99.99,
    maxMonthlyBudgetUsd: 220_000,
  },
  keyConcepts: [
    'Geospatial Indexing via Uber H3 (Hexagonal Hierarchical Spatial Index) or Google S2',
    'In-Memory Ephemeral Geospatial Store (Redis GEO / Redis Cluster with H3 spatial keys)',
    'Persistent WebSocket Gateway Connection Pools maintaining stateful driver sessions',
    'Driver Location Ingestion Pipeline with Apache Flink / Kafka stream processing',
    'Dynamic Hex-Bin Aggregator computing live supply-to-demand ratios for Surge Pricing',
    'Distributed Lock (Redlock) preventing two riders from matching the same driver concurrently',
  ],
  suggestedComponents: [
    'Layer 4 TCP Load Balancer for WebSocket Gateway Servers',
    'Stateful WebSocket Connection Gateway Fleet',
    'Apache Kafka High-Throughput Event Ingestion Cluster',
    'Redis In-Memory Geospatial Spatial Index Cluster (H3 resolution level 7-9)',
    'Ride Matching & Dispatch Engine Microservice with worker thread pools',
    'Persistent Sharded Database (PostgreSQL / CockroachDB) for trips and payment ledgers',
  ],
  tradeOffs: [
    'In-Memory Spatial Index vs. PostGIS: PostGIS disk writes cannot sustain 250k updates/sec; in-memory Redis GEO/H3 achieves sub-millisecond updates.',
    'Geohash vs. H3 Hexagons: Geohashes suffer from edge distortions and varying neighbor distances; hexagons maintain equidistant neighbors for accurate radius scans.',
    'WebSocket vs. HTTP Long Polling: WebSockets reduce TCP handshake overhead by 90%, vital for 4s ping intervals.',
  ],
  targetSlaPercentage: 99.99,
};
