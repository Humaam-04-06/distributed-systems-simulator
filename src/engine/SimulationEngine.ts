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

  public toggleServer(index: number): void {
    const server = this.serverNodes[index];
    if (!server) return;

    if (server.health === 'crashed') {
      server.health = 'healthy';
      server.cpuLoad = 10;
      this.hashRing.addNode(server.id);
      this.addIncident('info', server.id, `${server.name} recovered and returned to active pool.`);
    } else {
      server.health = 'crashed';
      server.cpuLoad = 0;
      server.activeConnections = 0;
      server.queueDepth = 0;
      this.hashRing.removeNode(server.id);
      this.serverQueues.get(server.id)?.clear();
      this.addIncident('error', server.id, `${server.name} crashed! Ejected from active pool.`);
    }
    this.notify();
  }

  public toggleDb(): void {
    if (this.dbNode.health === 'crashed') {
      this.dbNode.health = 'healthy';
      this.addIncident('info', this.dbNode.id, 'Primary Database reconnected & synchronized.');
    } else {
      this.dbNode.health = 'crashed';
      this.addIncident(
        'critical',
        this.dbNode.id,
        'Primary Database outage! Read-only failover active.'
      );
    }
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
        if (completedPacket.type === 'read' && this.config.cacheEnabled) {
          completedPacket.cacheHit = Math.random() < 0.88;
          if (completedPacket.cacheHit) {
            this.cacheNode.hitCount++;
            extraLatency += 2; // Cache hit
          } else {
            this.cacheNode.missCount++;
            extraLatency += 25; // Cache miss -> DB lookup
          }
        } else {
          // Write or cache bypassed
          if (this.dbNode.health === 'crashed') {
            completedPacket.status = 'error_500';
            completedPacket.totalLatencyMs = extraLatency + 200;
            this.metrics.recordCompleted(completedPacket);
            return;
          }
          extraLatency += 35;
        }

        completedPacket.status = 'success_200';
        completedPacket.totalLatencyMs =
          extraLatency + (Math.random() * this.config.jitterMs - this.config.jitterMs / 2);
        this.metrics.recordCompleted(completedPacket);
      });

      // Update server telemetry states
      const arrivalRatePerServer =
        aliveServers.length > 0 ? this.config.targetRps / aliveServers.length : 0;
      const qm = queue.getMetrics(arrivalRatePerServer);

      server.queueDepth = qm.currentDepth;
      server.activeConnections = queue.getActiveProcessingCount();
      server.cpuLoad = Math.min(99, Math.round(qm.utilizationRho * 100));

      if (server.cpuLoad > 90 && Math.random() < 0.05) {
        this.addIncident('warn', server.id, `${server.name} CPU load exceeded 90%!`);
      }
    }

    // 5. Update Metrics
    this.metrics.tick(now, aliveServers.length);

    // 6. Notify UI subscribers
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
