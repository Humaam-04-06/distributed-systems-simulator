/**
 * ConsistentHashRing — High-scale consistent hashing with virtual node replicas
 */

export interface VirtualNodeToken {
  hash: number;
  nodeId: string;
  virtualIndex: number;
  angleDegrees: number; // 0 to 360 for UI ring visualization
}

export class ConsistentHashRing {
  private ring: VirtualNodeToken[] = [];
  private virtualReplicasPerNode: number;
  private physicalNodes: Set<string> = new Set();

  constructor(virtualReplicasPerNode: number = 40) {
    this.virtualReplicasPerNode = virtualReplicasPerNode;
  }

  /**
   * Fast 32-bit FNV-1a hash function
   */
  public hash(key: string): number {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0; // Unsigned 32-bit integer (0 to 4,294,967,295)
  }

  public addNode(nodeId: string): void {
    if (this.physicalNodes.has(nodeId)) return;
    this.physicalNodes.add(nodeId);

    for (let i = 0; i < this.virtualReplicasPerNode; i++) {
      const vKey = `${nodeId}#vnode-${i}`;
      const hashVal = this.hash(vKey);
      const angle = (hashVal / 4294967295) * 360;

      this.ring.push({
        hash: hashVal,
        nodeId,
        virtualIndex: i,
        angleDegrees: angle,
      });
    }

    // Keep ring sorted by hash ascending for binary search
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  public removeNode(nodeId: string): void {
    if (!this.physicalNodes.has(nodeId)) return;
    this.physicalNodes.delete(nodeId);
    this.ring = this.ring.filter((token) => token.nodeId !== nodeId);
  }

  public setNodes(nodeIds: string[]): void {
    this.ring = [];
    this.physicalNodes.clear();
    for (const id of nodeIds) {
      this.addNode(id);
    }
  }

  /**
   * Finds the physical server responsible for a given key by searching clockwise on the ring
   */
  public getNode(key: string): { nodeId: string | null; token: VirtualNodeToken | null; keyHash: number; keyAngle: number } {
    if (this.ring.length === 0) {
      return { nodeId: null, token: null, keyHash: 0, keyAngle: 0 };
    }

    const keyHash = this.hash(key);
    const keyAngle = (keyHash / 4294967295) * 360;

    // Binary search clockwise for first token with token.hash >= keyHash
    let low = 0;
    let high = this.ring.length - 1;
    let targetIdx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hash >= keyHash) {
        targetIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // Wrap around to start if keyHash is greater than all tokens
    if (keyHash > this.ring[this.ring.length - 1].hash) {
      targetIdx = 0;
    }

    const token = this.ring[targetIdx];
    return {
      nodeId: token.nodeId,
      token,
      keyHash,
      keyAngle,
    };
  }

  public getRingTokens(): VirtualNodeToken[] {
    return [...this.ring];
  }

  public getPhysicalNodes(): string[] {
    return Array.from(this.physicalNodes);
  }
}
