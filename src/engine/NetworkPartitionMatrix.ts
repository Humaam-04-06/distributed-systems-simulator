/**
 * NetworkPartitionMatrix — NxN Adjacency Matrix & Topology Partition Engine
 * 
 * Simulates asymmetric partitions, complete network splits, availability zone (AZ)
 * boundaries, and packet loss/latency injection between arbitrary node pairs.
 */

export type LinkStatus = 'connected' | 'severed' | 'degraded';

export interface PartitionLink {
  sourceId: string;
  targetId: string;
  status: LinkStatus;
  packetLossRate: number; // 0.0 - 1.0
  addedLatencyMs: number;
}

export type PartitionPreset =
  | 'clean'
  | 'split-brain-50-50'
  | 'isolate-db-primary'
  | 'az-partition'
  | 'asymmetric-ring';

export interface SubnetIsland {
  id: string;
  nodes: string[];
  hasQuorum: boolean;
}

export class NetworkPartitionMatrix {
  private nodes: string[] = [];
  private links: Map<string, PartitionLink> = new Map();

  constructor(initialNodes: string[] = []) {
    if (initialNodes.length > 0) {
      this.setNodes(initialNodes);
    }
  }

  private makeKey(sourceId: string, targetId: string): string {
    return `${sourceId}->${targetId}`;
  }

  /**
   * Initializes or updates the cluster node set and creates all NxN directional links
   */
  public setNodes(nodeIds: string[]): void {
    this.nodes = [...nodeIds];
    for (const src of this.nodes) {
      for (const dst of this.nodes) {
        const key = this.makeKey(src, dst);
        if (!this.links.has(key)) {
          this.links.set(key, {
            sourceId: src,
            targetId: dst,
            status: 'connected',
            packetLossRate: 0,
            addedLatencyMs: 0,
          });
        }
      }
    }
  }

  /**
   * Returns all active registered nodes
   */
  public getNodes(): string[] {
    return [...this.nodes];
  }

  /**
   * Severs communication from source to target (can be bidirectional or unidirectional)
   */
  public severLink(sourceId: string, targetId: string, bidirectional: boolean = true): void {
    const keyForward = this.makeKey(sourceId, targetId);
    const linkForward = this.links.get(keyForward);
    if (linkForward) {
      linkForward.status = 'severed';
      linkForward.packetLossRate = 1.0;
    }

    if (bidirectional) {
      const keyReverse = this.makeKey(targetId, sourceId);
      const linkReverse = this.links.get(keyReverse);
      if (linkReverse) {
        linkReverse.status = 'severed';
        linkReverse.packetLossRate = 1.0;
      }
    }
  }

  /**
   * Restores communication between nodes
   */
  public connectLink(sourceId: string, targetId: string, bidirectional: boolean = true): void {
    const keyForward = this.makeKey(sourceId, targetId);
    const linkForward = this.links.get(keyForward);
    if (linkForward) {
      linkForward.status = 'connected';
      linkForward.packetLossRate = 0;
      linkForward.addedLatencyMs = 0;
    }

    if (bidirectional) {
      const keyReverse = this.makeKey(targetId, sourceId);
      const linkReverse = this.links.get(keyReverse);
      if (linkReverse) {
        linkReverse.status = 'connected';
        linkReverse.packetLossRate = 0;
        linkReverse.addedLatencyMs = 0;
      }
    }
  }

  /**
   * Configures degraded link with jitter / partial packet loss
   */
  public setDegradedLink(
    sourceId: string,
    targetId: string,
    lossRate: number = 0.35,
    latencyMs: number = 180,
    bidirectional: boolean = true
  ): void {
    const keyForward = this.makeKey(sourceId, targetId);
    const linkForward = this.links.get(keyForward);
    if (linkForward) {
      linkForward.status = 'degraded';
      linkForward.packetLossRate = Math.min(1, Math.max(0, lossRate));
      linkForward.addedLatencyMs = latencyMs;
    }

    if (bidirectional) {
      const keyReverse = this.makeKey(targetId, sourceId);
      const linkReverse = this.links.get(keyReverse);
      if (linkReverse) {
        linkReverse.status = 'degraded';
        linkReverse.packetLossRate = Math.min(1, Math.max(0, lossRate));
        linkReverse.addedLatencyMs = latencyMs;
      }
    }
  }

  /**
   * Checks if two nodes can communicate directly
   */
  public canCommunicate(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return true;
    const link = this.links.get(this.makeKey(sourceId, targetId));
    if (!link) return true;
    if (link.status === 'severed') return false;
    if (link.status === 'degraded' && link.packetLossRate > 0) {
      return Math.random() >= link.packetLossRate;
    }
    return true;
  }

  /**
   * Calculates total latency including any added partition degradation
   */
  public getEffectiveLatency(
    sourceId: string,
    targetId: string,
    baseLatencyMs: number
  ): { reachable: boolean; totalLatencyMs: number } {
    if (sourceId === targetId) {
      return { reachable: true, totalLatencyMs: 0 };
    }
    const link = this.links.get(this.makeKey(sourceId, targetId));
    if (!link) {
      return { reachable: true, totalLatencyMs: baseLatencyMs };
    }
    if (link.status === 'severed') {
      return { reachable: false, totalLatencyMs: baseLatencyMs };
    }
    if (link.status === 'degraded') {
      const dropped = Math.random() < link.packetLossRate;
      if (dropped) {
        return { reachable: false, totalLatencyMs: baseLatencyMs + link.addedLatencyMs };
      }
      return { reachable: true, totalLatencyMs: baseLatencyMs + link.addedLatencyMs };
    }
    return { reachable: true, totalLatencyMs: baseLatencyMs };
  }

  /**
   * Heals all network links back to 100% connectivity
   */
  public healAll(): void {
    for (const link of this.links.values()) {
      link.status = 'connected';
      link.packetLossRate = 0;
      link.addedLatencyMs = 0;
    }
  }

  /**
   * Applies pre-built industry chaos partition scenarios
   */
  public applyPreset(preset: PartitionPreset): void {
    this.healAll();

    if (preset === 'clean') return;

    if (preset === 'split-brain-50-50') {
      // Partition cluster in half: [nodes 0..half] vs [nodes half..end]
      const half = Math.ceil(this.nodes.length / 2);
      const groupA = this.nodes.slice(0, half);
      const groupB = this.nodes.slice(half);

      for (const a of groupA) {
        for (const b of groupB) {
          this.severLink(a, b, true);
        }
      }
    } else if (preset === 'isolate-db-primary') {
      // Completely isolate primary db from all workers
      const primary = this.nodes.find((n) => n.includes('primary') || n.includes('db-1')) || 'db-1';
      for (const node of this.nodes) {
        if (node !== primary) {
          this.severLink(node, primary, true);
        }
      }
    } else if (preset === 'az-partition') {
      // Simulate AZ-East (server-1, server-2) isolated from AZ-West (server-3, server-4)
      const azEast = this.nodes.filter((_, idx) => idx % 2 === 0);
      const azWest = this.nodes.filter((_, idx) => idx % 2 === 1);
      for (const e of azEast) {
        for (const w of azWest) {
          this.severLink(e, w, true);
        }
      }
    } else if (preset === 'asymmetric-ring') {
      // Asymmetric: Node i can send to Node i+1, but reverse is dropped
      for (let i = 0; i < this.nodes.length; i++) {
        const src = this.nodes[i];
        const dst = this.nodes[(i + 1) % this.nodes.length];
        this.severLink(dst, src, false); // Reverse severed only
      }
    }
  }

  /**
   * Computes connected component islands and calculates quorum (> N/2)
   */
  public calculateSubnets(): SubnetIsland[] {
    const visited = new Set<string>();
    const islands: SubnetIsland[] = [];
    const totalNodes = this.nodes.length;

    let islandIndex = 1;
    for (const node of this.nodes) {
      if (visited.has(node)) continue;

      const group: string[] = [];
      const queue: string[] = [node];
      visited.add(node);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        group.push(curr);

        for (const neighbor of this.nodes) {
          if (!visited.has(neighbor)) {
            // Check mutual bidirectional reachability for cluster subnet consensus
            if (this.canCommunicate(curr, neighbor) && this.canCommunicate(neighbor, curr)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }

      islands.push({
        id: `island-${islandIndex++}`,
        nodes: group,
        hasQuorum: group.length > totalNodes / 2,
      });
    }

    return islands;
  }

  /**
   * Returns list of currently severed links
   */
  public getActiveSeveredLinks(): Array<{ sourceId: string; targetId: string }> {
    const list: Array<{ sourceId: string; targetId: string }> = [];
    for (const link of this.links.values()) {
      if (link.status === 'severed') {
        list.push({ sourceId: link.sourceId, targetId: link.targetId });
      }
    }
    return list;
  }

  /**
   * Checks if link is unidirectional/asymmetric
   */
  public isAsymmetric(sourceId: string, targetId: string): boolean {
    const forward = this.links.get(this.makeKey(sourceId, targetId))?.status;
    const reverse = this.links.get(this.makeKey(targetId, sourceId))?.status;
    return forward !== reverse;
  }

  /**
   * Returns full NxN matrix snapshot for visual rendering
   */
  public getMatrixSnapshot(): Record<string, Record<string, LinkStatus>> {
    const matrix: Record<string, Record<string, LinkStatus>> = {};
    for (const src of this.nodes) {
      matrix[src] = {};
      for (const dst of this.nodes) {
        const link = this.links.get(this.makeKey(src, dst));
        matrix[src][dst] = link ? link.status : 'connected';
      }
    }
    return matrix;
  }
}
