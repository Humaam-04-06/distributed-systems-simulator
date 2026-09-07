/**
 * DatabaseReplicationEngine — Models Leader-Follower replication, WAL streaming, and sync/async dynamics
 */

export type ReplicationMode = 'async' | 'sync' | 'semi-sync';

export interface DatabaseNode {
  id: string;
  name: string;
  role: 'primary' | 'replica';
  health: 'healthy' | 'degraded' | 'crashed';
  lsn: number; // Log Sequence Number (WAL position)
  replicationLagMs: number;
  pendingWalBytes: number;
  readIops: number;
  writeIops: number;
  cpuLoad: number;
}

export interface WriteResult {
  success: boolean;
  ackLatencyMs: number;
  lsn: number;
  replicasAcknowledged: number;
  error?: string;
}

export interface ReadResult {
  success: boolean;
  nodeId: string;
  isReplica: boolean;
  dataLagMs: number;
  staleRead: boolean;
}

export class DatabaseReplicationEngine {
  private nodes: Map<string, DatabaseNode> = new Map();
  private replicationMode: ReplicationMode = 'async';
  private primaryLsn: number = 10000;

  constructor() {
    this.nodes.set('db-primary', {
      id: 'db-primary',
      name: 'Postgres Primary (Leader)',
      role: 'primary',
      health: 'healthy',
      lsn: 10000,
      replicationLagMs: 0,
      pendingWalBytes: 0,
      readIops: 120,
      writeIops: 85,
      cpuLoad: 24,
    });

    this.nodes.set('db-replica-1', {
      id: 'db-replica-1',
      name: 'Read Replica 1 (us-east)',
      role: 'replica',
      health: 'healthy',
      lsn: 9998,
      replicationLagMs: 2.1,
      pendingWalBytes: 1280,
      readIops: 240,
      writeIops: 0,
      cpuLoad: 18,
    });

    this.nodes.set('db-replica-2', {
      id: 'db-replica-2',
      name: 'Read Replica 2 (eu-central)',
      role: 'replica',
      health: 'healthy',
      lsn: 9995,
      replicationLagMs: 6.4,
      pendingWalBytes: 3840,
      readIops: 190,
      writeIops: 0,
      cpuLoad: 16,
    });
  }

  public getReplicationMode(): ReplicationMode {
    return this.replicationMode;
  }

  public setReplicationMode(mode: ReplicationMode): void {
    this.replicationMode = mode;
  }

  public getNodes(): DatabaseNode[] {
    return Array.from(this.nodes.values());
  }

  public getNode(id: string): DatabaseNode | undefined {
    return this.nodes.get(id);
  }

  public getPrimaryNode(): DatabaseNode | undefined {
    return Array.from(this.nodes.values()).find((n) => n.role === 'primary');
  }

  public getReplicas(): DatabaseNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.role === 'replica');
  }

  public executeWrite(baseLatencyMs: number): WriteResult {
    const primary = this.getPrimaryNode();
    if (!primary || primary.health === 'crashed') {
      return {
        success: false,
        ackLatencyMs: baseLatencyMs,
        lsn: this.primaryLsn,
        replicasAcknowledged: 0,
        error: 'PRIMARY_UNAVAILABLE',
      };
    }

    this.primaryLsn += 1;
    primary.lsn = this.primaryLsn;
    primary.writeIops += 1;

    const healthyReplicas = this.getReplicas().filter((r) => r.health !== 'crashed');

    // Calculate replication acknowledge latency and required acks based on mode
    let ackLatencyMs = baseLatencyMs + 12; // Local write commit latency
    let replicasAcknowledged = 0;

    if (this.replicationMode === 'sync') {
      // Sync requires ALL healthy replicas to acknowledge before client response
      if (healthyReplicas.length > 0) {
        const maxReplicaLag = Math.max(...healthyReplicas.map((r) => r.replicationLagMs));
        ackLatencyMs += maxReplicaLag + baseLatencyMs * 2;
        replicasAcknowledged = healthyReplicas.length;
        healthyReplicas.forEach((r) => {
          r.lsn = this.primaryLsn;
          r.pendingWalBytes = 0;
          r.replicationLagMs = Math.max(0.5, r.replicationLagMs * 0.2);
        });
      }
    } else if (this.replicationMode === 'semi-sync') {
      // Semi-sync waits for at least 1 replica to flush WAL to disk
      if (healthyReplicas.length > 0) {
        const minReplicaLag = Math.min(...healthyReplicas.map((r) => r.replicationLagMs));
        ackLatencyMs += minReplicaLag + baseLatencyMs;
        replicasAcknowledged = 1;
        healthyReplicas[0].lsn = this.primaryLsn;
      }
    } else {
      // Asynchronous: Primary returns immediately; replicas trail behind
      replicasAcknowledged = 0;
      healthyReplicas.forEach((r) => {
        r.pendingWalBytes += 512;
      });
    }

    return {
      success: true,
      ackLatencyMs: Math.round(ackLatencyMs),
      lsn: this.primaryLsn,
      replicasAcknowledged,
    };
  }

  public executeRead(preferReplica: boolean = true): ReadResult {
    const primary = this.getPrimaryNode();
    const healthyReplicas = this.getReplicas().filter((r) => r.health !== 'crashed');

    if (preferReplica && healthyReplicas.length > 0) {
      // Round robin / least lag replica
      const targetReplica = healthyReplicas.reduce((best, curr) =>
        curr.replicationLagMs < best.replicationLagMs ? curr : best
      );

      targetReplica.readIops += 1;
      const staleRead = targetReplica.lsn < this.primaryLsn;

      return {
        success: true,
        nodeId: targetReplica.id,
        isReplica: true,
        dataLagMs: targetReplica.replicationLagMs,
        staleRead,
      };
    }

    if (primary && primary.health !== 'crashed') {
      primary.readIops += 1;
      return {
        success: true,
        nodeId: primary.id,
        isReplica: false,
        dataLagMs: 0,
        staleRead: false,
      };
    }

    return {
      success: false,
      nodeId: '',
      isReplica: false,
      dataLagMs: 0,
      staleRead: false,
    };
  }

  public tick(deltaMs: number, writeRps: number, networkLatencyMs: number): void {
    const primary = this.getPrimaryNode();
    const isPrimaryAlive = primary && primary.health !== 'crashed';

    for (const replica of this.getReplicas()) {
      if (replica.health === 'crashed') {
        replica.replicationLagMs = 9999;
        replica.pendingWalBytes = 0;
        continue;
      }

      if (!isPrimaryAlive) {
        // Primary is down, replication stream halts
        replica.replicationLagMs = Math.round(replica.replicationLagMs + deltaMs * 0.1);
        continue;
      }

      // Dynamic replication catchup speed
      const catchupRate = this.replicationMode === 'sync' ? 1.0 : 0.45;

      // Ingress write load builds replication lag in async mode
      const loadFactor = (writeRps / 100) * (networkLatencyMs * 0.08);
      const targetLag =
        this.replicationMode === 'sync'
          ? 0.5
          : Math.max(1.0, networkLatencyMs * 0.15 + loadFactor);

      replica.replicationLagMs = Number(
        Math.max(0.2, replica.replicationLagMs + (targetLag - replica.replicationLagMs) * 0.1).toFixed(1)
      );

      // Advance replica LSN towards primary
      if (replica.lsn < this.primaryLsn) {
        const diff = this.primaryLsn - replica.lsn;
        const advance = Math.ceil(diff * catchupRate);
        replica.lsn = Math.min(this.primaryLsn, replica.lsn + advance);
        replica.pendingWalBytes = Math.max(0, (this.primaryLsn - replica.lsn) * 512);
      }

      // Re-calculate CPU load
      replica.cpuLoad = Math.min(
        95,
        Math.round(12 + (replica.readIops / 50) + (replica.replicationLagMs > 50 ? 25 : 0))
      );
      replica.readIops = Math.max(0, Math.round(replica.readIops * 0.9));
    }

    if (primary && isPrimaryAlive) {
      primary.cpuLoad = Math.min(
        98,
        Math.round(18 + (primary.writeIops / 30) + (primary.readIops / 60))
      );
      primary.writeIops = Math.max(0, Math.round(primary.writeIops * 0.85));
      primary.readIops = Math.max(0, Math.round(primary.readIops * 0.85));
    }
  }

  public setNodeHealth(nodeId: string, health: 'healthy' | 'degraded' | 'crashed'): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.health = health;
    }
  }
}
