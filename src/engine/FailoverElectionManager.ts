/**
 * FailoverElectionManager — Handles leader failover, Raft-like quorum elections, and Split-Brain partitions
 */

import { DatabaseReplicationEngine, DatabaseNode } from './DatabaseReplicationEngine';

export interface FailoverEvent {
  timestamp: number;
  oldLeaderId: string;
  newLeaderId: string;
  reason: string;
  divergentLsnDiff: number;
}

export class FailoverElectionManager {
  private replEngine: DatabaseReplicationEngine;
  private autoFailoverEnabled: boolean = true;
  private isSplitBrainActive: boolean = false;
  private splitBrainPrimaries: string[] = [];
  private failoverHistory: FailoverEvent[] = [];

  constructor(replEngine: DatabaseReplicationEngine) {
    this.replEngine = replEngine;
  }

  public setAutoFailover(enabled: boolean): void {
    this.autoFailoverEnabled = enabled;
  }

  public isAutoFailover(): boolean {
    return this.autoFailoverEnabled;
  }

  public isSplitBrain(): boolean {
    return this.isSplitBrainActive;
  }

  public getSplitBrainPrimaries(): string[] {
    return this.splitBrainPrimaries;
  }

  public getHistory(): FailoverEvent[] {
    return [...this.failoverHistory];
  }

  /**
   * Promotes the best candidate replica to primary based on highest LSN and lowest lag
   */
  public performAutomaticElection(reason: string = 'LEADER_HEARTBEAT_TIMEOUT'): {
    elected: boolean;
    newLeader?: DatabaseNode;
    oldLeaderId?: string;
  } {
    const currentPrimary = this.replEngine.getPrimaryNode();
    const oldLeaderId = currentPrimary ? currentPrimary.id : 'unknown';

    // Find healthy replicas
    const candidateReplicas = this.replEngine
      .getReplicas()
      .filter((r) => r.health !== 'crashed');

    if (candidateReplicas.length === 0) {
      return { elected: false, oldLeaderId };
    }

    // Elect replica with the highest LSN (freshest data)
    candidateReplicas.sort((a, b) => {
      if (b.lsn !== a.lsn) return b.lsn - a.lsn;
      return a.replicationLagMs - b.replicationLagMs;
    });

    const chosenLeader = candidateReplicas[0];
    const lsnDiff = currentPrimary ? Math.max(0, currentPrimary.lsn - chosenLeader.lsn) : 0;

    // Demote old leader if alive
    if (currentPrimary) {
      currentPrimary.role = 'replica';
    }

    // Promote new leader
    chosenLeader.role = 'primary';
    chosenLeader.replicationLagMs = 0;
    chosenLeader.pendingWalBytes = 0;

    this.failoverHistory.unshift({
      timestamp: Date.now(),
      oldLeaderId,
      newLeaderId: chosenLeader.id,
      reason,
      divergentLsnDiff: lsnDiff,
    });

    return {
      elected: true,
      newLeader: chosenLeader,
      oldLeaderId,
    };
  }

  /**
   * Manual operator promotion of a specific node
   */
  public promoteReplica(replicaId: string): { success: boolean; message: string } {
    const target = this.replEngine.getNode(replicaId);
    if (!target) {
      return { success: false, message: 'Node not found' };
    }
    if (target.health === 'crashed') {
      return { success: false, message: 'Cannot promote crashed node' };
    }

    const currentPrimary = this.replEngine.getPrimaryNode();
    if (currentPrimary) {
      currentPrimary.role = 'replica';
    }

    target.role = 'primary';
    target.replicationLagMs = 0;
    target.pendingWalBytes = 0;

    this.failoverHistory.unshift({
      timestamp: Date.now(),
      oldLeaderId: currentPrimary?.id ?? 'none',
      newLeaderId: target.id,
      reason: 'MANUAL_OPERATOR_PROMOTION',
      divergentLsnDiff: 0,
    });

    return {
      success: true,
      message: `Promoted ${target.name} to Primary Leader.`,
    };
  }

  /**
   * Simulates a Network Partition Split-Brain:
   * Two database nodes believe they are the legitimate Primary and both accept writes!
   */
  public triggerSplitBrain(): { success: boolean; message: string } {
    const primary = this.replEngine.getPrimaryNode();
    const replicas = this.replEngine.getReplicas().filter((r) => r.health !== 'crashed');

    if (!primary || replicas.length === 0) {
      return { success: false, message: 'Insufficient healthy nodes for split-brain partition.' };
    }

    const secondaryLeader = replicas[0];
    secondaryLeader.role = 'primary'; // Both are now primary!
    this.isSplitBrainActive = true;
    this.splitBrainPrimaries = [primary.id, secondaryLeader.id];

    return {
      success: true,
      message: `Split-Brain Partition Active: ${primary.name} and ${secondaryLeader.name} are both acting as Primary Leaders!`,
    };
  }

  /**
   * Resolves Split-Brain using Fencing (STONITH) or demoting the rogue node
   */
  public resolveSplitBrain(fencingStrategy: 'stonith' | 'demote' = 'stonith'): {
    success: boolean;
    message: string;
  } {
    if (!this.isSplitBrainActive) {
      return { success: false, message: 'Cluster is not currently in a split-brain state.' };
    }

    const [primaryId, rogueId] = this.splitBrainPrimaries;
    const rogueNode = this.replEngine.getNode(rogueId);
    const primaryNode = this.replEngine.getNode(primaryId);

    if (fencingStrategy === 'stonith') {
      // Shoot The Other Node In The Head: Forcefully crash the partitioned rogue node
      if (rogueNode) {
        rogueNode.health = 'crashed';
        rogueNode.role = 'replica';
      }
    } else {
      // Graceful demotion back to replica
      if (rogueNode) {
        rogueNode.role = 'replica';
        if (primaryNode) {
          rogueNode.lsn = primaryNode.lsn;
        }
      }
    }

    this.isSplitBrainActive = false;
    this.splitBrainPrimaries = [];

    return {
      success: true,
      message: `Split-Brain resolved using ${
        fencingStrategy === 'stonith' ? 'STONITH fencing (isolated node terminated)' : 'quorum reconciliation'
      }.`,
    };
  }
}
