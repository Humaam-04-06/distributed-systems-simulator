/**
 * SimulationEngine — Core orchestrator connecting clock, traffic, queues, LB algorithms, and resilience layers
 */

import { SimulationClock } from './SimulationClock';
import { TrafficGenerator } from './TrafficGenerator';
import { QueueBuffer } from './QueueModel';
import { MetricsAccumulator } from './MetricsAccumulator';
import { LoadBalancer } from './LoadBalancer';
import { ConsistentHashRing } from './ConsistentHashRing';
import { TokenBucketRateLimiter } from './RateLimiter';
import { HealthChecker } from './HealthChecker';
import { ServerResourceManager, ServerResources } from './ServerResourceManager';
import { ServerStateMachine, DetailedServerMode } from './ServerStateMachine';
import { WatchdogSupervisor } from './WatchdogSupervisor';
import { DatabaseReplicationEngine, DatabaseNode, ReplicationMode } from './DatabaseReplicationEngine';
import { FailoverElectionManager } from './FailoverElectionManager';
import { WriteConflictDetector, WriteConflict } from './WriteConflictDetector';
import { CacheEvictionEngine, CacheEntry, CacheMetrics, EvictionPolicy } from './CacheEvictionEngine';
import { CacheStampedeSimulator, StampedeEvent } from './CacheStampedeSimulator';
import { CacheMitigationManager, StampedeMitigationStrategy } from './CacheMitigationManager';
import {
  CircuitBreakerManager,
  CircuitBreakerMetrics,
  CircuitBreakerConfig,
} from './CircuitBreakerManager';
import { RetryEngine, RetryMetrics, BackoffStrategy } from './RetryEngine';
import { FallbackManager, FallbackMetrics, FallbackStrategy } from './FallbackManager';
import {
  ThreadPoolBulkhead,
  BulkheadPoolMetrics,
  BulkheadDomain,
} from './ThreadPoolBulkhead';
import {
  ConnectionPoolBulkhead,
  ConnectionPoolMetrics,
} from './ConnectionPoolBulkhead';
import {
  TenantBulkheadQuarantine,
  TenantQuota,
  TenantTier,
} from './TenantBulkheadQuarantine';
import { DistributedTracer, Trace } from './DistributedTracer';
import { OpenTelemetryExporter, TelemetrySnapshot } from './OpenTelemetryExporter';
import {
  NetworkPartitionMatrix,
  PartitionPreset,
  SubnetIsland,
  LinkStatus,
} from './NetworkPartitionMatrix';
import {
  ByzantineFaultInjector,
  ByzantineEvent,
} from './ByzantineFaultInjector';
import {
  ChaosExperimentRunner,
  ChaosScenarioId,
  ChaosScenario,
  ChaosExperimentState,
} from './ChaosExperimentRunner';
import {
  RegionId,
  RegionDefinition,
  GeoRoutingPolicy,
  SubseaCableId,
  SubseaCable,
} from './MultiRegionTypes';
import { GeoDnsRouter } from './GeoDnsRouter';
import { MultiRegionLatencyEngine } from './MultiRegionLatencyEngine';
import { CrossRegionFailoverManager } from './CrossRegionFailoverManager';
import {
  IncidentEvent,
  IncidentSeverity,
  Packet,
  ServerNodeState,
  DatabaseNodeState,
  CacheNodeState,
  LoadBalancerNodeState,
  SimulationConfig,
  SimulationMetrics,
  LoadBalancingAlgorithm,
} from './types';

export type EngineSubscriber = () => void;

export class SimulationEngine {
  public clock: SimulationClock;
  public trafficGen: TrafficGenerator;
  public metrics: MetricsAccumulator;
  public lbRouter: LoadBalancer;
  public hashRing: ConsistentHashRing;
  public rateLimiter: TokenBucketRateLimiter;
  public healthChecker: HealthChecker;
  public resourceManager: ServerResourceManager;
  public stateMachine: ServerStateMachine;
  public watchdog: WatchdogSupervisor;
  public dbReplication: DatabaseReplicationEngine;
  public failoverElection: FailoverElectionManager;
  public conflictDetector: WriteConflictDetector;
  public cacheEngine: CacheEvictionEngine;
  public stampedeSim: CacheStampedeSimulator;
  public cacheMitigation: CacheMitigationManager;
  public circuitBreaker: CircuitBreakerManager;
  public retryEngine: RetryEngine;
  public fallbackManager: FallbackManager;
  public threadBulkhead: ThreadPoolBulkhead;
  public connBulkhead: ConnectionPoolBulkhead;
  public tenantBulkhead: TenantBulkheadQuarantine;
  public tracer: DistributedTracer;
  public otelExporter: OpenTelemetryExporter;
  public partitionMatrix: NetworkPartitionMatrix;
  public byzantineInjector: ByzantineFaultInjector;
  public chaosRunner: ChaosExperimentRunner;
  public geoDnsRouter: GeoDnsRouter;
  public multiRegionLatency: MultiRegionLatencyEngine;
  public crossRegionFailover: CrossRegionFailoverManager;

  // Cluster Nodes
  public lbNode: LoadBalancerNodeState;
  public serverNodes: ServerNodeState[];
  public serverQueues: Map<string, QueueBuffer> = new Map();
  public dbNode: DatabaseNodeState;
  public cacheNode: CacheNodeState;

  // Active in-flight packets (capped for 60fps performance)
  public activePackets: Packet[] = [];
  public maxVisualPackets: number = 80;

  // Incidents
  public incidents: IncidentEvent[] = [];
  public maxIncidents: number = 50;

  // Configuration
  public config: SimulationConfig = {
    targetRps: 200,
    networkLatencyMs: 40,
    packetLossPercentage: 0,
    jitterMs: 10,
    readWriteRatio: 0.8,
    cacheEnabled: true,
    circuitBreakerEnabled: true,
    lbAlgorithm: 'round-robin',
    serverCapacityRps: 150,
  };

  private subscribers: Set<EngineSubscriber> = new Set();
  private nextIncidentId: number = 1;

  constructor() {
    this.clock = new SimulationClock(50);
    this.trafficGen = new TrafficGenerator(this.config.targetRps);
    this.metrics = new MetricsAccumulator();
    this.lbRouter = new LoadBalancer(this.config.lbAlgorithm);
    this.hashRing = new ConsistentHashRing(32);
    this.rateLimiter = new TokenBucketRateLimiter({
      capacity: 1200,
      refillRateRps: 1000,
      enabled: true,
    });
    this.healthChecker = new HealthChecker({
      intervalMs: 1500,
      unhealthyThreshold: 3,
      healthyThreshold: 2,
    });
    this.resourceManager = new ServerResourceManager();
    this.stateMachine = new ServerStateMachine();
    this.watchdog = new WatchdogSupervisor();
    this.dbReplication = new DatabaseReplicationEngine();
    this.failoverElection = new FailoverElectionManager(this.dbReplication);
    this.conflictDetector = new WriteConflictDetector();
    this.cacheEngine = new CacheEvictionEngine(24, 'lru');
    this.stampedeSim = new CacheStampedeSimulator();
    this.cacheMitigation = new CacheMitigationManager();
    this.circuitBreaker = new CircuitBreakerManager();
    this.retryEngine = new RetryEngine();
    this.fallbackManager = new FallbackManager();
    this.threadBulkhead = new ThreadPoolBulkhead();
    this.connBulkhead = new ConnectionPoolBulkhead();
    this.tenantBulkhead = new TenantBulkheadQuarantine();
    this.tracer = new DistributedTracer();
    this.otelExporter = new OpenTelemetryExporter();

    // 1. Initialize Load Balancer Node State
    this.lbNode = {
      id: 'lb-1',
      name: 'Application Load Balancer',
      type: 'load_balancer',
      health: 'healthy',
      algorithm: 'round-robin',
      activeConnections: 0,
      maxConnections: 5000,
      queueDepth: 0,
      maxQueueDepth: 1000,
      cpuLoad: 12,
      processedTotal: 0,
      failedTotal: 0,
      rateLimitEnabled: true,
      rateLimitRps: 1200,
      tokenBucketTokens: 1200,
      tokenBucketCapacity: 1200,
    };

    // 2. Initialize 3 Worker Servers
    this.serverNodes = [1, 2, 3].map((idx) => ({
      id: `server-${idx}`,
      name: `Worker Server ${idx}`,
      type: 'server',
      health: 'healthy',
      activeConnections: 0,
      maxConnections: 600,
      queueDepth: 0,
      maxQueueDepth: 150,
      cpuLoad: 15,
      processedTotal: 0,
      failedTotal: 0,
      threadPoolActive: 0,
      threadPoolSize: 50,
      circuitBreakerState: 'closed',
      failureCountConsecutive: 0,
    }));

    for (const server of this.serverNodes) {
      this.serverQueues.set(
        server.id,
        new QueueBuffer({
          maxQueueDepth: 150,
          serviceRateMu: this.config.serverCapacityRps,
          concurrencyLimit: server.threadPoolSize,
        })
      );
      this.healthChecker.registerNode(server.id, true);
      this.stateMachine.register(server.id, 'healthy');
      this.watchdog.register(server.id, true, 4000);
    }

    this.hashRing.setNodes(this.serverNodes.map((s) => s.id));

    // 3. Initialize Cache Node
    this.cacheNode = {
      id: 'cache-1',
      name: 'Redis Distributed Cache',
      type: 'cache',
      health: 'healthy',
      activeConnections: 0,
      maxConnections: 2000,
      queueDepth: 0,
      maxQueueDepth: 500,
      cpuLoad: 8,
      processedTotal: 0,
      failedTotal: 0,
      hitCount: 0,
      missCount: 0,
      totalKeys: 4820,
      maxKeys: 10000,
      evictionPolicy: 'lru',
    };

    // 4. Initialize Database Cluster
    this.dbNode = {
      id: 'db-primary',
      name: 'Postgres Primary',
      type: 'database',
      health: 'healthy',
      role: 'primary',
      replicationLagMs: 1.8,
      syncReplication: false,
      connectedReplicas: ['db-replica-1', 'db-replica-2'],
      activeConnections: 0,
      maxConnections: 500,
      queueDepth: 0,
      maxQueueDepth: 400,
      cpuLoad: 22,
      processedTotal: 0,
      failedTotal: 0,
    };

    // 5. Initialize Chaos Engineering & Partition Matrix
    const allNodeIds = [
      'lb-1',
      ...this.serverNodes.map((s) => s.id),
      'redis-1',
      'db-primary',
      'db-replica-1',
      'db-replica-2',
    ];
    this.partitionMatrix = new NetworkPartitionMatrix(allNodeIds);
    this.byzantineInjector = new ByzantineFaultInjector();
    this.chaosRunner = new ChaosExperimentRunner();
    this.geoDnsRouter = new GeoDnsRouter();
    this.multiRegionLatency = new MultiRegionLatencyEngine();
    this.crossRegionFailover = new CrossRegionFailoverManager();

    // Bind tick loop
    this.clock.onTick((_tick, deltaMs) => this.onTick(deltaMs));
  }

  public subscribe(cb: EngineSubscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub();
    }
  }

  public setRps(rps: number): void {
    this.config.targetRps = rps;
    this.trafficGen.setTargetRps(rps);
    this.notify();
  }

  public setLatency(latencyMs: number): void {
    this.config.networkLatencyMs = latencyMs;
    this.notify();
  }

  public setLossRate(lossPercentage: number): void {
    this.config.packetLossPercentage = lossPercentage;
    this.notify();
  }

  public setLbAlgorithm(algo: LoadBalancingAlgorithm): void {
    this.config.lbAlgorithm = algo;
    this.lbNode.algorithm = algo;
    this.lbRouter.setAlgorithm(algo);
    this.addIncident('info', 'lb-1', `Switched routing algorithm to ${algo.replace('-', ' ')}`);
    this.notify();
  }

  public getServerResources(serverId: string): ServerResources {
    const server = this.serverNodes.find((s) => s.id === serverId);
    if (!server) {
      return this.resourceManager.computeResources(0, 0, false);
    }
    const isDegraded = this.stateMachine.getMode(serverId) === 'degraded';
    return this.resourceManager.computeResources(
      server.queueDepth,
      server.activeConnections,
      isDegraded
    );
  }

  public getServerMode(serverId: string): DetailedServerMode {
    return this.stateMachine.getMode(serverId);
  }

  public setServerDetailedMode(serverId: string, mode: DetailedServerMode): void {
    const server = this.serverNodes.find((s) => s.id === serverId);
    if (!server) return;

    this.stateMachine.setMode(serverId, mode);

    if (mode === 'crashed' || mode === 'oom_crash') {
      server.health = 'crashed';
      server.activeConnections = 0;
      server.queueDepth = 0;
      this.hashRing.removeNode(serverId);
      this.serverQueues.get(serverId)?.clear();
      this.watchdog.notifyCrash(serverId, performance.now());
      this.addIncident(
        mode === 'oom_crash' ? 'critical' : 'error',
        serverId,
        `${server.name} ${mode === 'oom_crash' ? 'killed by OOM (>512MB RAM)' : 'crashed'}!`
      );
    } else if (mode === 'healthy') {
      server.health = 'healthy';
      this.hashRing.addNode(serverId);
      this.watchdog.notifyRecovery(serverId);
      this.addIncident('info', serverId, `${server.name} restored to healthy cluster pool.`);
    } else if (mode === 'degraded') {
      server.health = 'degraded';
      this.addIncident(
        'warn',
        serverId,
        `${server.name} marked degraded (4.5x latency + 8% packet drops).`
      );
    } else if (mode === 'flapping') {
      server.health = 'flapping';
      this.addIncident('warn', serverId, `${server.name} entered network flapping state!`);
    }
    this.notify();
  }

  public isWatchdogEnabled(serverId: string): boolean {
    return this.watchdog.isEnabled(serverId);
  }

  public toggleWatchdog(serverId: string, enabled: boolean): void {
    this.watchdog.setEnabled(serverId, enabled);
    this.notify();
  }

  public getWatchdogProgress(serverId: string) {
    return this.watchdog.getRestartProgress(serverId, performance.now());
  }

  public manualRestartServer(serverId: string): void {
    this.setServerDetailedMode(serverId, 'healthy');
  }

  public addServerNode(): void {
    if (this.serverNodes.length >= 6) return;
    const nextIdx = this.serverNodes.length + 1;
    const newId = `server-${nextIdx}`;
    const newServer: ServerNodeState = {
      id: newId,
      name: `Worker Server ${nextIdx}`,
      type: 'server',
      health: 'healthy',
      activeConnections: 0,
      maxConnections: 600,
      queueDepth: 0,
      maxQueueDepth: 150,
      cpuLoad: 15,
      processedTotal: 0,
      failedTotal: 0,
      threadPoolActive: 0,
      threadPoolSize: 50,
      circuitBreakerState: 'closed',
      failureCountConsecutive: 0,
    };

    this.serverNodes.push(newServer);
    this.serverQueues.set(
      newId,
      new QueueBuffer({
        maxQueueDepth: 150,
        serviceRateMu: this.config.serverCapacityRps,
        concurrencyLimit: newServer.threadPoolSize,
      })
    );
    this.healthChecker.registerNode(newId, true);
    this.stateMachine.register(newId, 'healthy');
    this.watchdog.register(newId, true, 4000);
    this.hashRing.addNode(newId);

    this.addIncident('info', newId, `Auto-scaled out: ${newServer.name} provisioned & online.`);
    this.notify();
  }

  public removeServerNode(): void {
    if (this.serverNodes.length <= 1) return;
    const removed = this.serverNodes.pop()!;
    this.serverQueues.get(removed.id)?.clear();
    this.serverQueues.delete(removed.id);
    this.hashRing.removeNode(removed.id);

    this.addIncident('info', removed.id, `Scaled in: ${removed.name} decommissioned from pool.`);
    this.notify();
  }

  public toggleServer(index: number): void {
    const server = this.serverNodes[index];
    if (!server) return;

    if (server.health === 'crashed') {
      this.setServerDetailedMode(server.id, 'healthy');
    } else {
      this.setServerDetailedMode(server.id, 'crashed');
    }
  }

  public getDbNodes(): DatabaseNode[] {
    return this.dbReplication.getNodes();
  }

  public getDbReplicationMode(): ReplicationMode {
    return this.dbReplication.getReplicationMode();
  }

  public setDbReplicationMode(mode: ReplicationMode): void {
    this.dbReplication.setReplicationMode(mode);
    this.addIncident('info', 'db-primary', `Switched replication mode to ${mode.toUpperCase()}.`);
    this.notify();
  }

  public promoteDbReplica(replicaId: string): void {
    const res = this.failoverElection.promoteReplica(replicaId);
    if (res.success) {
      this.addIncident('warn', replicaId, res.message);
    }
    this.notify();
  }

  public toggleDbNodeHealth(nodeId: string): void {
    const node = this.dbReplication.getNode(nodeId);
    if (!node) return;

    if (node.health === 'crashed') {
      this.dbReplication.setNodeHealth(nodeId, 'healthy');
      this.addIncident('info', nodeId, `${node.name} restored to cluster pool.`);
    } else {
      this.dbReplication.setNodeHealth(nodeId, 'crashed');
      this.addIncident('critical', nodeId, `${node.name} went offline (outage)!`);

      // If it was the primary, try auto-failover election!
      if (node.role === 'primary' && this.failoverElection.isAutoFailover()) {
        const election = this.failoverElection.performAutomaticElection('LEADER_FAILURE');
        if (election.elected && election.newLeader) {
          this.addIncident(
            'warn',
            election.newLeader.id,
            `Automatic Failover: ${election.newLeader.name} elected new Primary!`
          );
        }
      }
    }
    this.notify();
  }

  public triggerSplitBrain(): void {
    const res = this.failoverElection.triggerSplitBrain();
    if (res.success) {
      this.addIncident('critical', 'db-primary', res.message);
    }
    this.notify();
  }

  public resolveSplitBrain(strategy: 'stonith' | 'demote' = 'stonith'): void {
    const res = this.failoverElection.resolveSplitBrain(strategy);
    if (res.success) {
      this.addIncident('info', 'db-primary', res.message);
    }
    this.notify();
  }

  public getWriteConflicts(): WriteConflict[] {
    return this.conflictDetector.getConflicts();
  }

  public resolveWriteConflicts(strategy: 'lww' | 'highest_lsn' = 'lww'): void {
    const count = this.conflictDetector.resolveAll(strategy);
    this.addIncident(
      'info',
      'db-primary',
      `Reconciled ${count} write conflict(s) using ${strategy.toUpperCase()}.`
    );
    this.notify();
  }

  public toggleDb(): void {
    const primary = this.dbReplication.getPrimaryNode();
    if (primary) {
      this.toggleDbNodeHealth(primary.id);
    } else {
      this.toggleDbNodeHealth('db-primary');
    }
  }

  public getCacheMetrics(): CacheMetrics {
    return this.cacheEngine.getMetrics();
  }

  public getCacheEntries(): CacheEntry[] {
    return this.cacheEngine.getEntries();
  }

  public getCachePolicy(): EvictionPolicy {
    return this.cacheEngine.getPolicy();
  }

  public setCachePolicy(policy: EvictionPolicy): void {
    this.cacheEngine.setPolicy(policy);
    this.addIncident('info', 'cache-1', `Eviction policy changed to ${policy.toUpperCase()}.`);
    this.notify();
  }

  public getCacheMitigationStrategy(): StampedeMitigationStrategy {
    return this.cacheMitigation.getStrategy();
  }

  public setCacheMitigationStrategy(strategy: StampedeMitigationStrategy): void {
    this.cacheMitigation.setStrategy(strategy);
    this.addIncident(
      'info',
      'cache-1',
      `Cache stampede mitigation set to ${strategy.toUpperCase()}.`
    );
    this.notify();
  }

  public triggerCacheStampede(key: string = 'leaderboard:top10'): void {
    this.cacheEngine.invalidate(key);
    const event = this.stampedeSim.triggerStampede(
      key,
      850,
      this.cacheMitigation.getStrategy()
    );
    this.addIncident(
      'critical',
      'cache-1',
      `Cache Stampede! Key "${key}" expired, ${event.surgeRequestCount} reqs storming DB!`
    );
    this.notify();
  }

  public getActiveStampede(): StampedeEvent | null {
    return this.stampedeSim.getActiveStampede();
  }

  public invalidateCacheKey(key: string): void {
    this.cacheEngine.invalidate(key);
    this.addIncident('info', 'cache-1', `Key "${key}" manually purged from cache.`);
    this.notify();
  }

  public clearCache(): void {
    this.cacheEngine.clear();
    this.addIncident('info', 'cache-1', 'Cache storage completely flushed.');
    this.notify();
  }

  public toggleCache(): void {
    this.config.cacheEnabled = !this.config.cacheEnabled;
    this.addIncident(
      'info',
      'cache-1',
      `Redis cache layer ${this.config.cacheEnabled ? 'enabled' : 'bypassed'}.`
    );
    this.notify();
  }

  public addIncident(severity: IncidentSeverity, sourceNodeId: string, message: string): void {
    this.incidents.unshift({
      id: `inc-${this.nextIncidentId++}`,
      timestamp: Date.now(),
      severity,
      sourceNodeId,
      message,
    });
    if (this.incidents.length > this.maxIncidents) {
      this.incidents.pop();
    }
  }

  private onTick(deltaMs: number): void {
    const now = performance.now();

    // 0. Watchdog auto-restart check
    this.watchdog.checkRestarts(now, (resurrectedId) => {
      this.setServerDetailedMode(resurrectedId, 'healthy');
      this.addIncident(
        'info',
        resurrectedId,
        `Watchdog supervisor auto-resurrected ${resurrectedId} after crash.`
      );
    });

    // Tick flapping state machines
    for (const server of this.serverNodes) {
      this.stateMachine.tick(server.id, now);
    }

    // 1. Generate incoming client packets
    const newPackets = this.trafficGen.generateTickPackets(deltaMs);

    // 2. Health check monitoring
    this.healthChecker.tick(this.serverNodes, (server, isHealthy) => {
      if (!isHealthy && server.health === 'healthy') {
        server.health = 'degraded';
        this.addIncident('warn', server.id, `${server.name} probe degraded! High latency.`);
      }
    });

    // 3. Rate limiting check at Ingress
    const aliveServers = this.serverNodes.filter((s) => s.health !== 'crashed');

    for (const packet of newPackets) {
      // Ingress Token Bucket rate limiting
      const limitResult = this.rateLimiter.tryConsume(1);
      if (!limitResult.allowed) {
        packet.status = 'rate_limited_429';
        packet.totalLatencyMs = 8;
        this.metrics.recordCompleted(packet);
        continue;
      }

      // Simulated network packet loss
      if (Math.random() * 100 < this.config.packetLossPercentage) {
        packet.status = 'timeout_504';
        packet.totalLatencyMs = this.config.networkLatencyMs * 4;
        this.metrics.recordCompleted(packet);
        continue;
      }

      // All servers dead
      if (aliveServers.length === 0) {
        packet.status = 'error_500';
        packet.totalLatencyMs = this.config.networkLatencyMs * 2;
        this.metrics.recordCompleted(packet);
        continue;
      }

      // Route via Load Balancer Router
      let targetServer: ServerNodeState | null = null;
      if (this.lbNode.algorithm === 'consistent-hash') {
        const ringResult = this.hashRing.getNode(packet.id);
        if (ringResult.nodeId) {
          targetServer = aliveServers.find((s) => s.id === ringResult.nodeId) || aliveServers[0];
        } else {
          targetServer = aliveServers[0];
        }
      } else {
        targetServer = this.lbRouter.route(aliveServers, `client-ip-${packet.id}`);
      }

      if (!targetServer) {
        packet.status = 'error_500';
        this.metrics.recordCompleted(packet);
        continue;
      }

      // State machine acceptance filter (crashed, OOM, flapping dropped, degraded drop rate)
      const acceptCheck = this.stateMachine.shouldAcceptPacket(targetServer.id);
      if (!acceptCheck.accepted) {
        if (acceptCheck.reason === 'OOM_KILLED') {
          packet.status = 'error_500';
        } else if (acceptCheck.reason === 'NETWORK_FLAP_DROP') {
          packet.status = 'timeout_504';
        } else {
          packet.status = 'circuit_broken_503';
        }
        packet.totalLatencyMs = this.config.networkLatencyMs * 2;
        this.metrics.recordCompleted(packet);
        continue;
      }

      // 3.1 Classify request domain & tenant tier
      let domain: BulkheadDomain = 'catalog';
      let tenantTier: TenantTier = 'pro';

      if (this.tenantBulkhead.isNoisyNeighborSurgeActive()) {
        const rand = Math.random();
        if (rand < 0.75) {
          domain = 'analytics';
          tenantTier = 'free';
        } else if (rand < 0.90) {
          domain = 'checkout';
          tenantTier = 'enterprise';
        } else {
          domain = 'catalog';
          tenantTier = 'pro';
        }
      } else {
        const rand = Math.random();
        if (rand < 0.35) {
          domain = 'checkout';
          tenantTier = 'enterprise';
        } else if (rand < 0.80) {
          domain = 'catalog';
          tenantTier = 'pro';
        } else {
          domain = 'analytics';
          tenantTier = 'free';
        }
      }

      const route =
        domain === 'checkout'
          ? '/api/v1/checkout'
          : domain === 'catalog'
          ? '/api/v1/catalog'
          : '/api/v1/analytics';

      const { traceId, rootSpanId } = this.tracer.startTrace(route, tenantTier, now);

      // 3.2 Multi-tenant quota quarantine check
      const tenantCheck = this.tenantBulkhead.tryAcquire(tenantTier);
      if (!tenantCheck.accepted) {
        packet.status = 'rate_limited_429';
        packet.totalLatencyMs = 4;
        this.metrics.recordCompleted(packet);
        this.tracer.addEvent(traceId, rootSpanId, 'tenant_quota_exceeded', { tenantTier }, now);
        this.tracer.endTrace(traceId, 429, now);
        continue;
      }

      // 3.3 Domain thread pool bulkhead compartment check
      const bulkheadCheck = this.threadBulkhead.tryAcquire(domain);
      if (!bulkheadCheck.accepted) {
        this.tenantBulkhead.release(tenantTier);
        packet.status = 'circuit_broken_503';
        packet.totalLatencyMs = 4;
        this.metrics.recordCompleted(packet);
        this.tracer.addEvent(traceId, rootSpanId, 'bulkhead_thread_pool_exhausted', { domain }, now);
        this.tracer.endTrace(traceId, 503, now);
        continue;
      }

      // Circuit Breaker Failsafe Check
      if (this.config.circuitBreakerEnabled) {
        const cbCheck = this.circuitBreaker.canExecute(targetServer.id, now);
        if (!cbCheck.allowed) {
          const fallback = this.fallbackManager.executeFallback(
            packet.type === 'write' ? 'write' : 'read',
            'user:profile'
          );
          if (fallback.served) {
            packet.status = 'success_200';
            packet.totalLatencyMs = fallback.latencyMs;
            this.tracer.addEvent(traceId, rootSpanId, 'fallback_executed', { fallbackServed: true }, now);
            this.tracer.endTrace(traceId, 200, now + fallback.latencyMs);
          } else {
            packet.status = 'circuit_broken_503';
            packet.totalLatencyMs = 2; // Fast-fail in 2ms!
            this.tracer.addEvent(traceId, rootSpanId, 'circuit_broken_fast_fail', { server: targetServer.id }, now);
            this.tracer.endTrace(traceId, 503, now + 2);
          }
          this.metrics.recordCompleted(packet);
          continue;
        }
      }

      // 3.4 Network Partition Check
      const canReachServer = this.partitionMatrix.canCommunicate('lb-1', targetServer.id);
      if (!canReachServer) {
        this.tenantBulkhead.release(tenantTier);
        this.threadBulkhead.release(domain);
        packet.status = 'timeout_504';
        packet.totalLatencyMs = Math.round(this.config.networkLatencyMs * 2.5);
        this.metrics.recordCompleted(packet);
        this.tracer.addEvent(traceId, rootSpanId, 'network_partition_link_severed', {
          source: 'lb-1',
          target: targetServer.id,
        }, now);
        this.tracer.endTrace(traceId, 504, now + packet.totalLatencyMs);
        continue;
      }

      // 3.5 Byzantine Traitor Fault Injection Check
      if (this.byzantineInjector.isTraitor(targetServer.id)) {
        const byzMsg = this.byzantineInjector.processOutboundMessage(
          targetServer.id,
          `PAYLOAD_${packet.id}`,
          now
        );
        if (byzMsg.faultInjected) {
          const verification = this.byzantineInjector.verifyInboundMessage(
            targetServer.id,
            byzMsg.payload,
            byzMsg.checksum
          );
          if (verification.corrupted) {
            this.tenantBulkhead.release(tenantTier);
            this.threadBulkhead.release(domain);
            packet.status = 'error_500';
            packet.totalLatencyMs = 15;
            this.metrics.recordCompleted(packet);
            this.tracer.addEvent(traceId, rootSpanId, 'byzantine_fault_quarantined', {
              traitor: targetServer.id,
              faultType: byzMsg.faultType || 'payload-corruption',
            }, now);
            this.tracer.endTrace(traceId, 500, now + 15);
            continue;
          }
        }
      }

      // Trace Spans for successful pipeline
      const cacheHit =
        packet.type === 'read' &&
        this.config.cacheEnabled &&
        Math.random() <
          this.cacheNode.hitCount / Math.max(1, this.cacheNode.hitCount + this.cacheNode.missCount);

      const cacheSpan = this.tracer.startSpan(
        traceId,
        'cache:lookup',
        rootSpanId,
        'CLIENT',
        {
          'cache.hit': cacheHit,
          'cluster.node_id': 'redis-cluster-01',
        },
        now
      );
      this.tracer.endSpan(traceId, cacheSpan.spanId, 'OK', undefined, now + 2);

      const bhSpan = this.tracer.startSpan(
        traceId,
        'bulkhead:acquire',
        rootSpanId,
        'INTERNAL',
        {
          'bulkhead.domain': domain,
        },
        now + 2
      );
      this.tracer.endSpan(traceId, bhSpan.spanId, 'OK', undefined, now + 4);

      const computeDuration = Math.max(
        6,
        Math.round(this.config.networkLatencyMs * (0.6 + Math.random() * 0.8))
      );
      const computeSpan = this.tracer.startSpan(
        traceId,
        'worker:compute',
        rootSpanId,
        'SERVER',
        {
          'cluster.node_id': targetServer.id,
          'http.status_code': 200,
        },
        now + 4
      );

      if (packet.type === 'write') {
        const dbSpan = this.tracer.startSpan(
          traceId,
          'database:wal',
          computeSpan.spanId,
          'CLIENT',
          {
            'db.system': 'postgres',
            'db.statement': 'INSERT INTO transactions (id, status) VALUES ($1, $2)',
            'cluster.node_id': 'db-primary',
          },
          now + 6
        );
        this.tracer.endSpan(traceId, dbSpan.spanId, 'OK', undefined, now + 14);
      }

      this.tracer.endSpan(traceId, computeSpan.spanId, 'OK', undefined, now + 4 + computeDuration);
      this.tracer.endTrace(traceId, 200, now + 4 + computeDuration);

      packet.targetServerId = targetServer.id;
      const queue = this.serverQueues.get(targetServer.id);

      if (queue) {
        const enq = queue.enqueue(packet);
        if (!enq.accepted) {
          // Bounded queue overflow -> HTTP 429
          packet.status = 'rate_limited_429';
          packet.totalLatencyMs = this.config.networkLatencyMs;
          this.metrics.recordCompleted(packet);
        }
      }
    }

    // Update LB Node Token Bucket visual state
    this.lbNode.tokenBucketTokens = this.rateLimiter.getTokens();

    // 4. Process queues across all servers
    for (const server of this.serverNodes) {
      if (server.health === 'crashed') continue;

      const queue = this.serverQueues.get(server.id);
      if (!queue) continue;

      queue.step(deltaMs, (completedPacket) => {
        let extraLatency = this.config.networkLatencyMs;
        const latencyMult = this.stateMachine.getLatencyMultiplier(server.id);
        extraLatency = Math.round(extraLatency * latencyMult);

        if (completedPacket.type === 'read' && this.config.cacheEnabled) {
          const sampleKeys = [
            'leaderboard:top10',
            'user:session:1001',
            'product:sku:9823',
            'pricing:rules:eu',
            'api:token:oauth_99',
            'catalog:categories',
          ];
          // 40% of read traffic hits the hot key 'leaderboard:top10'
          const reqKey =
            Math.random() < 0.4
              ? 'leaderboard:top10'
              : sampleKeys[Math.floor(Math.random() * sampleKeys.length)];

          const activeStampede = this.stampedeSim.getActiveStampede();
          const isStampedeKey = activeStampede && activeStampede.targetKey === reqKey;

          if (isStampedeKey) {
            completedPacket.cacheHit = false;
            const strategy = this.cacheMitigation.getStrategy();

            if (strategy === 'mutex') {
              const acquired = this.cacheMitigation.tryAcquireMutex(reqKey, server.id, 2000, now);
              if (acquired) {
                // First worker queries DB and warms cache
                const readRes = this.dbReplication.executeRead(true);
                extraLatency += readRes.isReplica ? 35 : 45;
                this.cacheEngine.set(
                  reqKey,
                  '["alice","bob","charlie","dave"]',
                  25000,
                  true,
                  now
                );
                this.cacheMitigation.releaseMutex(reqKey);
              } else {
                // Secondary workers wait for single-flight resolution
                extraLatency += 16;
              }
            } else if (strategy === 'xfetch') {
              // Early recomputation kept key refreshed with minimal overhead
              extraLatency += 14;
              this.cacheEngine.set(
                reqKey,
                '["alice","bob","charlie","dave"]',
                25000,
                true,
                now
              );
            } else {
              // Unmitigated thundering herd: direct DB hammering with huge latency spike
              this.dbReplication.executeRead(true);
              extraLatency += Math.min(
                450,
                Math.round(40 * activeStampede.dbPressureMultiplier)
              );
            }
          } else {
            // Normal cache path
            // Check XFetch probabilistic recompute if key exists
            if (this.cacheMitigation.getStrategy() === 'xfetch') {
              const entries = this.cacheEngine.getEntries();
              const existing = entries.find((e) => e.key === reqKey);
              if (existing && existing.ttlMs > 0) {
                const ttlRemaining = existing.ttlMs - (now - existing.createdAt);
                if (this.cacheMitigation.shouldEarlyRecompute(ttlRemaining, 45)) {
                  this.cacheEngine.set(reqKey, existing.value, 30000, existing.isHotKey, now);
                }
              }
            }

            const cacheLookup = this.cacheEngine.get(reqKey, now);
            if (cacheLookup.hit) {
              completedPacket.cacheHit = true;
              extraLatency += 2; // Sub-2ms in-memory cache hit
            } else {
              completedPacket.cacheHit = false;
              // Cache miss -> read from database
              const readRes = this.dbReplication.executeRead(true);
              if (!readRes.success) {
                completedPacket.status = 'error_500';
                completedPacket.totalLatencyMs = extraLatency + 200;
                this.metrics.recordCompleted(completedPacket);
                return;
              }
              extraLatency += readRes.isReplica ? 18 : 28;

              // Populate cache on read miss
              this.cacheEngine.set(
                reqKey,
                `{"entity":"${reqKey}","cached":true}`,
                30000,
                reqKey === 'leaderboard:top10',
                now
              );
            }
          }
        } else {
          // Write or cache bypassed (Direct Database Access)
          if (completedPacket.type === 'write') {
            const writeRes = this.dbReplication.executeWrite(extraLatency);
            if (!writeRes.success) {
              if (this.failoverElection.isAutoFailover()) {
                const election =
                  this.failoverElection.performAutomaticElection('PRIMARY_WRITE_FAILURE');
                if (election.elected && election.newLeader) {
                  this.addIncident(
                    'warn',
                    election.newLeader.id,
                    `Failover: ${election.newLeader.name} elected new Primary leader!`
                  );
                }
              }
              completedPacket.status = 'error_500';
              completedPacket.totalLatencyMs = extraLatency + 200;
              this.metrics.recordCompleted(completedPacket);
              return;
            }
            extraLatency = writeRes.ackLatencyMs;

            // If split-brain is active, simulate concurrent conflicting mutations
            if (this.failoverElection.isSplitBrain()) {
              const randKey = `entity:${Math.floor(Math.random() * 6)}`;
              const randVal = `val_${Math.random().toString(36).substring(7)}`;
              const conflict = this.conflictDetector.recordWrite(
                randKey,
                randVal,
                'db-primary',
                writeRes.lsn,
                true
              );
              if (conflict) {
                this.addIncident(
                  'critical',
                  'db-primary',
                  `Write conflict detected on [${randKey}] in Split-Brain partition!`
                );
              }
            }
          } else {
            // Read query that missed cache
            const readRes = this.dbReplication.executeRead(true);
            if (!readRes.success) {
              this.circuitBreaker.recordFailure(server.id, now);
              completedPacket.status = 'error_500';
              completedPacket.totalLatencyMs = extraLatency + 200;
              this.metrics.recordCompleted(completedPacket);
              return;
            }
            extraLatency += readRes.isReplica ? 12 : 22;
          }
        }

        this.circuitBreaker.recordSuccess(server.id, now);
        completedPacket.status = 'success_200';
        completedPacket.totalLatencyMs =
          extraLatency + (Math.random() * this.config.jitterMs - this.config.jitterMs / 2);
        this.metrics.recordCompleted(completedPacket);
      });

      // Update server telemetry states & physical resource calculations
      const arrivalRatePerServer =
        aliveServers.length > 0 ? this.config.targetRps / aliveServers.length : 0;
      const qm = queue.getMetrics(arrivalRatePerServer);

      server.queueDepth = qm.currentDepth;
      server.activeConnections = queue.getActiveProcessingCount();
      server.circuitBreakerState = this.circuitBreaker.getBreaker(server.id).getState();
      server.failureCountConsecutive = this.circuitBreaker.getMetrics(server.id, now).consecutiveFailures;

      const res = this.resourceManager.computeResources(
        server.queueDepth,
        server.activeConnections,
        this.stateMachine.getMode(server.id) === 'degraded'
      );
      server.cpuLoad = res.cpuUsagePercentage;

      // Auto-trigger OOM kill if memory bounds breached
      if (res.isOom && this.stateMachine.getMode(server.id) !== 'oom_crash') {
        this.setServerDetailedMode(server.id, 'oom_crash');
      }

      if (server.cpuLoad > 90 && Math.random() < 0.05) {
        this.addIncident('warn', server.id, `${server.name} CPU load exceeded 90%!`);
      }
    }

    // Tick database replication stream
    const writeRps = Math.round(this.config.targetRps * (1 - this.config.readWriteRatio));
    this.dbReplication.tick(deltaMs, writeRps, this.config.networkLatencyMs);

    // Sync legacy dbNode for topology UI compatibility
    const curPrimary = this.dbReplication.getPrimaryNode();
    if (curPrimary) {
      this.dbNode.id = curPrimary.id;
      this.dbNode.name = curPrimary.name;
      this.dbNode.health = curPrimary.health;
      this.dbNode.cpuLoad = curPrimary.cpuLoad;
      this.dbNode.replicationLagMs = this.dbReplication.getReplicas()[0]?.replicationLagMs ?? 0;
    } else {
      this.dbNode.health = 'crashed';
    }

    // Tick Cache Stampede Simulator
    const stampedeStatus = this.stampedeSim.tick(now);
    if (stampedeStatus.targetKey && !stampedeStatus.isActive) {
      this.addIncident(
        'info',
        'cache-1',
        `Cache Stampede on "${stampedeStatus.targetKey}" has stabilized.`
      );
    }

    // Synchronize cacheNode telemetry state
    const cMetrics = this.cacheEngine.getMetrics();
    this.cacheNode.hitCount = cMetrics.hitCount;
    this.cacheNode.missCount = cMetrics.missCount;
    this.cacheNode.totalKeys = cMetrics.totalEntries;
    this.cacheNode.maxKeys = cMetrics.maxEntries;
    this.cacheNode.evictionPolicy = this.cacheEngine.getPolicy();
    this.cacheNode.cpuLoad = Math.min(
      100,
      Math.round((cMetrics.memoryUsedBytes / cMetrics.maxMemoryBytes) * 100)
    );

    // Tick Circuit Breakers & Bulkhead partitions
    this.circuitBreaker.tick(now);
    this.threadBulkhead.step(deltaMs);
    this.connBulkhead.step(deltaMs, now);
    this.tenantBulkhead.step(deltaMs, now);

    // 5. Update Metrics
    this.metrics.tick(now, aliveServers.length);

    // 5.1 Tick Chaos Monkey Experiment Runner
    const curSnap = this.metrics.getSnapshot();
    const chaosTick = this.chaosRunner.tick(
      deltaMs,
      100 - curSnap.errorRatePercentage,
      curSnap.latencies.p99
    );
    if (chaosTick.justCompleted) {
      this.addIncident(
        'warn',
        'lb-1',
        this.chaosRunner.getState().blastRadiusSummary
      );
    }

    // 5.2 Tick Cross-Region Failover & Replication
    this.crossRegionFailover.tick(deltaMs, this.config.targetRps);
    const crossRegions = this.crossRegionFailover.getRegions();
    crossRegions.forEach((r) => {
      this.geoDnsRouter.updateRegion(r);
    });

    // 6. Notify UI subscribers
    this.notify();
  }

  public getCircuitBreakerMetrics(serverId: string = 'server-1'): CircuitBreakerMetrics {
    return this.circuitBreaker.getMetrics(serverId);
  }

  public getCircuitBreakerConfig(): CircuitBreakerConfig {
    return this.circuitBreaker.getDefaultConfig();
  }

  public updateCircuitBreakerConfig(cfg: Partial<CircuitBreakerConfig>): void {
    this.circuitBreaker.updateDefaultConfig(cfg);
    this.notify();
  }

  public toggleCircuitBreaker(): void {
    this.config.circuitBreakerEnabled = !this.config.circuitBreakerEnabled;
    this.addIncident(
      'info',
      'lb-1',
      `Circuit Breaker protection ${
        this.config.circuitBreakerEnabled ? 'ARMED' : 'BYPASSED'
      }.`
    );
    this.notify();
  }

  public forceTripCircuit(serverId: string = 'server-1'): void {
    this.circuitBreaker.trip(serverId);
    this.addIncident(
      'critical',
      serverId,
      `Operator manually tripped Circuit Breaker for ${serverId} to OPEN.`
    );
    this.notify();
  }

  public forceResetCircuit(serverId: string = 'server-1'): void {
    this.circuitBreaker.reset(serverId);
    this.addIncident(
      'info',
      serverId,
      `Operator reset Circuit Breaker for ${serverId} to CLOSED.`
    );
    this.notify();
  }

  public getRetryMetrics(): RetryMetrics {
    return this.retryEngine.getMetrics();
  }

  public setRetryStrategy(strategy: BackoffStrategy): void {
    this.retryEngine.setStrategy(strategy);
    this.addIncident(
      'info',
      'lb-1',
      `Retry backoff strategy changed to ${strategy.replace('_', ' ').toUpperCase()}.`
    );
    this.notify();
  }

  public getFallbackMetrics(): FallbackMetrics {
    return this.fallbackManager.getMetrics();
  }

  public setFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackManager.setStrategy(strategy);
    this.addIncident(
      'info',
      'lb-1',
      `Graceful fallback strategy changed to ${strategy.replace('_', ' ').toUpperCase()}.`
    );
    this.notify();
  }

  public triggerCascadingFailure(): void {
    if (this.serverNodes.length > 0) {
      this.setServerDetailedMode(this.serverNodes[0].id, 'crashed');
    }
    if (this.serverNodes.length > 1) {
      this.setServerDetailedMode(this.serverNodes[1].id, 'degraded');
    }
    this.addIncident(
      'critical',
      'lb-1',
      'Cascading Failure Surge Injected! Testing blast radius containment.'
    );
    this.notify();
  }

  public resetResilience(): void {
    this.circuitBreaker.resetAll();
    this.retryEngine.reset();
    this.fallbackManager.reset();
    this.addIncident('info', 'lb-1', 'Resilience metrics and circuit states reset.');
    this.notify();
  }

  public getBulkheadPoolMetrics(): BulkheadPoolMetrics[] {
    return this.threadBulkhead.getAllPoolMetrics();
  }

  public getConnectionPoolMetrics(): ConnectionPoolMetrics {
    return this.connBulkhead.getMetrics();
  }

  public getTenantQuotas(): TenantQuota[] {
    return this.tenantBulkhead.getQuotas();
  }

  public isNoisyNeighborSurgeActive(): boolean {
    return this.tenantBulkhead.isNoisyNeighborSurgeActive();
  }

  public setBulkheadPoolCapacity(
    domain: BulkheadDomain,
    maxConcurrency: number,
    maxQueue: number
  ): void {
    this.threadBulkhead.setPoolCapacity(domain, maxConcurrency, maxQueue);
    this.addIncident(
      'info',
      'lb-1',
      `Bulkhead compartment [${domain.toUpperCase()}] capacity set to ${maxConcurrency} threads, ${maxQueue} queue.`
    );
    this.notify();
  }

  public toggleTenantQuarantine(tier: TenantTier): void {
    const isQuarantined = this.tenantBulkhead.toggleQuarantine(tier);
    this.addIncident(
      isQuarantined ? 'warn' : 'info',
      'lb-1',
      `Tenant [${tier.toUpperCase()}] ${
        isQuarantined ? 'placed in QUARANTINE sandbox' : 'quarantine LIFTED'
      }.`
    );
    this.notify();
  }

  public triggerNoisyNeighborSurge(): void {
    this.tenantBulkhead.triggerNoisyNeighborSurge(8000, performance.now());
    this.addIncident(
      'critical',
      'lb-1',
      'Noisy Neighbor Surge! Free-tier tenant flooded; verifying compartment isolation.'
    );
    this.notify();
  }

  public resetBulkheads(): void {
    this.threadBulkhead.reset();
    this.connBulkhead.reset();
    this.tenantBulkhead.reset();
    this.addIncident('info', 'lb-1', 'Bulkhead compartments and quotas reset.');
    this.notify();
  }

  public getTelemetrySnapshot(): TelemetrySnapshot {
    const snap = this.metrics.getSnapshot();
    const bulkheadThreads: Record<string, number> = {};
    for (const pool of this.threadBulkhead.getAllPoolMetrics()) {
      bulkheadThreads[pool.domain] = pool.activeConcurrency;
    }
    const anyTripped = this.circuitBreaker.getAllMetrics().some((m) => m.state === 'open');
    const cacheTotal = this.cacheNode.hitCount + this.cacheNode.missCount;
    const cacheHitRatio = cacheTotal > 0 ? (this.cacheNode.hitCount / cacheTotal) * 100 : 100;

    return {
      throughputRps: snap.currentRps,
      totalRequests: snap.totalProcessed + snap.totalErrors,
      successfulRequests: snap.totalProcessed,
      rateLimited429Requests: snap.totalRateLimited,
      circuitBroken503Requests: snap.totalCircuitBroken,
      timeout504Requests: Math.round(snap.totalErrors * 0.1),
      serverError500Requests: Math.max(0, snap.totalErrors - snap.totalRateLimited - snap.totalCircuitBroken),
      p50LatencyMs: snap.latencies.p50,
      p90LatencyMs: snap.latencies.p90,
      p95LatencyMs: snap.latencies.p95,
      p99LatencyMs: snap.latencies.p99,
      avgLatencyMs: snap.latencies.avg,
      activeServers: this.serverNodes.filter((s) => s.health !== 'crashed').length,
      cacheHitRatio,
      bulkheadThreads,
      circuitBreakerTripped: anyTripped,
    };
  }

  public getRecentTraces(limit: number = 60): Trace[] {
    return this.tracer.getRecentTraces(limit);
  }

  public getPrometheusMetricsText(): string {
    return this.otelExporter.generatePrometheusText(this.getTelemetrySnapshot());
  }

  public getOTLPJson(): string {
    return this.otelExporter.generateOTLPPayload(this.tracer.getRecentTraces(15));
  }

  public clearTraces(): void {
    this.tracer.clear();
    this.notify();
  }

  // --- Chaos Engineering & Network Partition Methods ---

  public getPartitionMatrixSnapshot(): Record<string, Record<string, LinkStatus>> {
    return this.partitionMatrix.getMatrixSnapshot();
  }

  public getSubnets(): SubnetIsland[] {
    return this.partitionMatrix.calculateSubnets();
  }

  public severPartitionLink(src: string, dst: string): void {
    this.partitionMatrix.severLink(src, dst);
    this.addIncident('warn', src, `Network partition severed link [${src} ➔ ${dst}].`);
    this.notify();
  }

  public connectPartitionLink(src: string, dst: string): void {
    this.partitionMatrix.connectLink(src, dst);
    this.addIncident('info', src, `Network link reconnected [${src} ➔ ${dst}].`);
    this.notify();
  }

  public degradePartitionLink(src: string, dst: string): void {
    this.partitionMatrix.setDegradedLink(src, dst, 0.35, 180);
    this.addIncident('warn', src, `Network link degraded with 35% packet drop [${src} ➔ ${dst}].`);
    this.notify();
  }

  public applyPartitionPreset(preset: PartitionPreset): void {
    this.partitionMatrix.applyPreset(preset);
    this.addIncident('critical', 'lb-1', `Partition preset applied: [${preset.toUpperCase()}].`);
    this.notify();
  }

  public healAllPartitions(): void {
    this.partitionMatrix.healAll();
    this.addIncident('info', 'lb-1', 'All network partitions healed to 100% connectivity.');
    this.notify();
  }

  public toggleByzantineTraitor(nodeId: string): void {
    if (this.byzantineInjector.isTraitor(nodeId)) {
      this.byzantineInjector.removeTraitorNode(nodeId);
      this.addIncident('info', nodeId, `Node [${nodeId}] restored to honest consensus participation.`);
    } else {
      this.byzantineInjector.setTraitorNode(nodeId, 'payload-corruption', 0.6);
      this.addIncident('critical', nodeId, `Byzantine Traitor infiltrated node [${nodeId}]! Bit-flips active.`);
    }
    this.notify();
  }

  public getByzantineTraitors(): string[] {
    return this.byzantineInjector.getTraitors();
  }

  public getByzantineEvents(): ByzantineEvent[] {
    return this.byzantineInjector.getEvents();
  }

  public clearByzantineEvents(): void {
    this.byzantineInjector.clearEvents();
    this.notify();
  }

  public resetByzantine(): void {
    this.byzantineInjector.reset();
    this.addIncident('info', 'lb-1', 'All Byzantine traitor nodes cleared.');
    this.notify();
  }

  public getChaosState(): ChaosExperimentState {
    return this.chaosRunner.getState();
  }

  public getChaosScenarios(): ChaosScenario[] {
    return this.chaosRunner.getScenarios();
  }

  public startChaosScenario(id: ChaosScenarioId): void {
    const scenario = this.chaosRunner.startScenario(id);
    if (scenario) {
      this.addIncident('critical', 'lb-1', `Chaos Drill launched: [${scenario.name}]. Evaluating steady-state.`);
      if (id === 'az-outage') {
        this.partitionMatrix.applyPreset('az-partition');
      } else if (id === 'database-blackhole') {
        this.partitionMatrix.applyPreset('isolate-db-primary');
      } else if (id === 'byzantine-traitor') {
        this.byzantineInjector.setTraitorNode('server-2', 'payload-corruption', 0.8);
      }
    }
    this.notify();
  }

  public stopChaosScenario(): void {
    this.chaosRunner.stopScenario('User aborted');
    this.partitionMatrix.healAll();
    this.byzantineInjector.reset();
    this.addIncident('info', 'lb-1', 'Chaos drill aborted. Partitions healed.');
    this.notify();
  }

  // Multi-Region & Geo-DNS APIs
  public getGeoRoutingPolicy(): GeoRoutingPolicy {
    return this.geoDnsRouter.getPolicy();
  }

  public setGeoRoutingPolicy(policy: GeoRoutingPolicy): void {
    this.geoDnsRouter.setPolicy(policy);
    this.addIncident('info', 'lb-1', `Geo-DNS routing policy switched to [${policy.toUpperCase()}].`);
    this.notify();
  }

  public getGlobalRegions(): RegionDefinition[] {
    return this.crossRegionFailover.getRegions();
  }

  public getSubseaCables(): SubseaCable[] {
    return this.multiRegionLatency.getCables();
  }

  public getPrimaryRegionId(): RegionId {
    return this.crossRegionFailover.getPrimaryRegionId();
  }

  public getEvacuatedRegions(): RegionId[] {
    return this.crossRegionFailover.getEvacuatedRegions();
  }

  public getSeveredCables(): SubseaCableId[] {
    return this.multiRegionLatency.getSeveredCableIds();
  }

  public evacuateRegion(regionId: RegionId): void {
    this.crossRegionFailover.evacuateRegion(regionId);
    this.addIncident('critical', 'lb-1', `Region [${regionId}] evacuated! Traffic drained.`);
    this.notify();
  }

  public restoreRegion(regionId: RegionId): void {
    this.crossRegionFailover.restoreRegion(regionId);
    this.addIncident('info', 'lb-1', `Region [${regionId}] restored to active DNS pool.`);
    this.notify();
  }

  public promotePrimaryRegion(regionId: RegionId): void {
    this.crossRegionFailover.promoteNewPrimary(regionId);
    this.addIncident('critical', 'lb-1', `Primary Region leader promoted to [${regionId}]!`);
    this.notify();
  }

  public simulateRegionAzOutage(regionId: RegionId): void {
    this.crossRegionFailover.simulateAzOutage(regionId);
    this.addIncident('warn', 'lb-1', `AZ outage injected into [${regionId}].`);
    this.notify();
  }

  public severSubseaCable(cableId: SubseaCableId): void {
    this.multiRegionLatency.severCable(cableId);
    this.addIncident('warn', 'lb-1', `Subsea fiber cable [${cableId}] severed! WAN rerouted.`);
    this.notify();
  }

  public healSubseaCable(cableId: SubseaCableId): void {
    this.multiRegionLatency.healCable(cableId);
    this.addIncident('info', 'lb-1', `Subsea fiber cable [${cableId}] repaired.`);
    this.notify();
  }

  public healAllMultiRegion(): void {
    this.multiRegionLatency.healAllCables();
    const evacuated = this.crossRegionFailover.getEvacuatedRegions();
    evacuated.forEach((r) => this.crossRegionFailover.restoreRegion(r));
    this.addIncident('info', 'lb-1', 'All global multi-region infrastructure and fiber cables healed.');
    this.notify();
  }

  public getMetricsSnapshot(): SimulationMetrics {
    return this.metrics.getSnapshot();
  }

  public reset(): void {
    this.clock.reset();
    this.trafficGen.reset();
    this.metrics.reset();
    this.rateLimiter.reset();
    this.resetResilience();
    this.resetBulkheads();
    this.clearTraces();
    this.partitionMatrix.healAll();
    this.byzantineInjector.reset();
    this.chaosRunner.reset();
    this.geoDnsRouter.reset();
    this.multiRegionLatency.healAllCables();
    this.crossRegionFailover.reset();
    this.serverNodes.forEach((s) => {
      s.health = 'healthy';
      s.cpuLoad = 10;
      s.activeConnections = 0;
      s.queueDepth = 0;
    });
    this.serverQueues.forEach((q) => q.clear());
    this.hashRing.setNodes(this.serverNodes.map((s) => s.id));
    this.dbNode.health = 'healthy';
    this.activePackets = [];
    this.incidents = [];
    this.notify();
  }
}
