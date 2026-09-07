/**
 * Core type definitions for the Distributed Systems Simulator engine
 */

export type PacketStatus =
  | 'queued'
  | 'routing_lb'
  | 'processing_server'
  | 'querying_cache'
  | 'querying_db'
  | 'replicating'
  | 'success_200'
  | 'rate_limited_429'
  | 'circuit_broken_503'
  | 'error_500'
  | 'timeout_504';

export type PacketType = 'read' | 'write' | 'health_check';

export interface PacketHop {
  nodeId: string;
  enteredAt: number;
  exitedAt?: number;
}

export interface Packet {
  id: string;
  type: PacketType;
  status: PacketStatus;
  createdAt: number;
  completedAt?: number;
  hops: PacketHop[];
  targetServerId?: string;
  cacheHit?: boolean;
  dbReplicaUsed?: boolean;
  totalLatencyMs?: number;
  // Visual interpolation coordinate (0 to 1 along current conduit)
  conduitProgress?: number;
  currentConduitId?: string;
}

export type NodeType = 'ingress' | 'load_balancer' | 'server' | 'cache' | 'database';

export type NodeHealth = 'healthy' | 'degraded' | 'crashed' | 'flapping';

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  health: NodeHealth;
  activeConnections: number;
  maxConnections: number;
  queueDepth: number;
  maxQueueDepth: number;
  cpuLoad: number; // 0 to 100%
  processedTotal: number;
  failedTotal: number;
}

export interface ServerNodeState extends BaseNode {
  type: 'server';
  threadPoolActive: number;
  threadPoolSize: number;
  circuitBreakerState: 'closed' | 'open' | 'half_open';
  failureCountConsecutive: number;
  lastFailureTime?: number;
}

export interface DatabaseNodeState extends BaseNode {
  type: 'database';
  role: 'primary' | 'replica';
  replicationLagMs: number;
  syncReplication: boolean;
  connectedReplicas: string[];
}

export interface CacheNodeState extends BaseNode {
  type: 'cache';
  hitCount: number;
  missCount: number;
  totalKeys: number;
  maxKeys: number;
  evictionPolicy: 'lru' | 'lfu';
}

export type LoadBalancingAlgorithm =
  | 'round-robin'
  | 'weighted-round-robin'
  | 'least-connections'
  | 'random'
  | 'ip-hash'
  | 'consistent-hash';

export interface LoadBalancerNodeState extends BaseNode {
  type: 'load_balancer';
  algorithm: LoadBalancingAlgorithm;
  rateLimitRps: number;
  rateLimitEnabled: boolean;
  tokenBucketTokens: number;
  tokenBucketCapacity: number;
}

export type AnyDistributedNode =
  | BaseNode
  | ServerNodeState
  | DatabaseNodeState
  | CacheNodeState
  | LoadBalancerNodeState;

export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
}

export interface TimeseriesPoint {
  timestamp: number;
  rps: number;
  p99Latency: number;
  p50Latency: number;
  errorRate: number;
  activeServers: number;
}

export interface SimulationMetrics {
  currentRps: number;
  successfulRps: number;
  errorRps: number;
  errorRatePercentage: number;
  latencies: LatencyPercentiles;
  totalProcessed: number;
  totalErrors: number;
  totalRateLimited: number;
  totalCircuitBroken: number;
  history: TimeseriesPoint[];
}

export type IncidentSeverity = 'info' | 'warn' | 'error' | 'critical';

export interface IncidentEvent {
  id: string;
  timestamp: number;
  severity: IncidentSeverity;
  sourceNodeId: string;
  message: string;
}

export interface SimulationConfig {
  targetRps: number;
  networkLatencyMs: number;
  packetLossPercentage: number;
  jitterMs: number;
  readWriteRatio: number; // e.g. 0.8 means 80% reads, 20% writes
  cacheEnabled: boolean;
  circuitBreakerEnabled: boolean;
  lbAlgorithm: LoadBalancingAlgorithm;
  serverCapacityRps: number;
}
