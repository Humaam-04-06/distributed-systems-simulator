/**
 * SimulationEngine — Core orchestrator connecting clock, traffic, queues, and nodes
 */

import { SimulationClock } from './SimulationClock';
import { TrafficGenerator } from './TrafficGenerator';
import { QueueBuffer } from './QueueModel';
import { MetricsAccumulator } from './MetricsAccumulator';
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
} from './types';

export type EngineSubscriber = () => void;

export class SimulationEngine {
  public clock: SimulationClock;
  public trafficGen: TrafficGenerator;
  public metrics: MetricsAccumulator;

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
  private roundRobinIdx: number = 0;

  constructor() {
    this.clock = new SimulationClock(50);
    this.trafficGen = new TrafficGenerator(this.config.targetRps);
    this.metrics = new MetricsAccumulator();

    // 1. Initialize Load Balancer
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
      rateLimitRps: 1500,
      tokenBucketTokens: 1500,
      tokenBucketCapacity: 1500,
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
    }

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

  public setLbAlgorithm(algo: LoadBalancerNodeState['algorithm']): void {
    this.config.lbAlgorithm = algo;
    this.lbNode.algorithm = algo;
    this.addIncident('info', 'lb-1', `Switched routing algorithm to ${algo}`);
    this.notify();
  }

  public toggleServer(index: number): void {
    const server = this.serverNodes[index];
    if (!server) return;

    if (server.health === 'crashed') {
      server.health = 'healthy';
      server.cpuLoad = 10;
      this.addIncident('info', server.id, `Server ${index + 1} recovered and returned to pool.`);
    } else {
      server.health = 'crashed';
      server.cpuLoad = 0;
      server.activeConnections = 0;
      server.queueDepth = 0;
      this.serverQueues.get(server.id)?.clear();
      this.addIncident('error', server.id, `Server ${index + 1} crashed! Health probe failed.`);
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

    // 2. Route packets through LB to healthy servers
    const aliveServers = this.serverNodes.filter((s) => s.health !== 'crashed');

    for (const packet of newPackets) {
      // Packet loss check
      if (Math.random() * 100 < this.config.packetLossPercentage) {
        packet.status = 'timeout_504';
        packet.totalLatencyMs = this.config.networkLatencyMs * 4;
        this.metrics.recordCompleted(packet);
        continue;
      }

      // If all servers dead or DB down on write
      if (aliveServers.length === 0) {
        packet.status = 'error_500';
        packet.totalLatencyMs = this.config.networkLatencyMs * 2;
        this.metrics.recordCompleted(packet);
        continue;
      }

      // Route via algorithm
      let targetServer: ServerNodeState;
      if (this.lbNode.algorithm === 'least-connections') {
        targetServer = [...aliveServers].sort(
          (a, b) => a.activeConnections - b.activeConnections
        )[0];
      } else {
        // Round Robin
        this.roundRobinIdx = (this.roundRobinIdx + 1) % aliveServers.length;
        targetServer = aliveServers[this.roundRobinIdx];
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

    // 3. Process queues across all servers
    for (const server of this.serverNodes) {
      if (server.health === 'crashed') continue;

      const queue = this.serverQueues.get(server.id);
      if (!queue) continue;

      queue.step(deltaMs, (completedPacket) => {
        // Check cache hit if read
        let extraLatency = this.config.networkLatencyMs;
        if (completedPacket.type === 'read' && this.config.cacheEnabled) {
          completedPacket.cacheHit = Math.random() < 0.88;
          if (completedPacket.cacheHit) {
            this.cacheNode.hitCount++;
            extraLatency += 2; // Fast cache hit
          } else {
            this.cacheNode.missCount++;
            extraLatency += 25; // DB lookup
          }
        } else {
          // Write or cache disabled -> hits DB
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

      // Trigger automatic warning incidents on high load
      if (server.cpuLoad > 90 && Math.random() < 0.05) {
        this.addIncident('warn', server.id, `${server.name} CPU utilization exceeded 90%!`);
      }
    }

    // 4. Update Metrics
    this.metrics.tick(now, aliveServers.length);

    // 5. Notify UI subscribers
    this.notify();
  }

  public getMetricsSnapshot(): SimulationMetrics {
    return this.metrics.getSnapshot();
  }

  public reset(): void {
    this.clock.reset();
    this.trafficGen.reset();
    this.metrics.reset();
    this.serverNodes.forEach((s) => {
      s.health = 'healthy';
      s.cpuLoad = 10;
      s.activeConnections = 0;
      s.queueDepth = 0;
    });
    this.serverQueues.forEach((q) => q.clear());
    this.dbNode.health = 'healthy';
    this.activePackets = [];
    this.incidents = [];
    this.notify();
  }
}
