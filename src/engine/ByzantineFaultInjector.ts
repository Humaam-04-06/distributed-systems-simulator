/**
 * ByzantineFaultInjector — Lamport's Byzantine Generals Problem Simulation
 * 
 * Simulates arbitrary and malicious node behaviors: payload bit-flips,
 * invalid cryptographic signatures, conflicting voting in leader elections,
 * and automated cryptographic checksum quarantine defense.
 */

export type ByzantineFaultType =
  | 'payload-corruption'
  | 'conflicting-vote'
  | 'replay-attack'
  | 'silent-drop';

export interface ByzantineTraitorConfig {
  nodeId: string;
  isActive: boolean;
  faultType: ByzantineFaultType;
  corruptionRate: number; // 0.0 - 1.0
  totalInjected: number;
  totalDetected: number;
}

export interface ByzantineVerificationResult {
  valid: boolean;
  corrupted: boolean;
  expectedChecksum: string;
  receivedChecksum: string;
  traitorDetected: boolean;
  traitorNodeId?: string;
  details: string;
}

export interface ByzantineEvent {
  id: string;
  timestampMs: number;
  nodeId: string;
  faultType: ByzantineFaultType;
  description: string;
  actionTaken: 'detected_and_quarantined' | 'bypassed_checksum' | 'dropped';
}

export class ByzantineFaultInjector {
  private traitors: Map<string, ByzantineTraitorConfig> = new Map();
  private events: ByzantineEvent[] = [];
  private readonly maxEvents: number = 80;

  constructor() {}

  /**
   * Computes deterministic cryptographic-style FNV-1a hash checksum for message integrity verification
   */
  public computeChecksum(payload: string): string {
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Designates a node as a Byzantine Traitor
   */
  public setTraitorNode(
    nodeId: string,
    faultType: ByzantineFaultType = 'payload-corruption',
    corruptionRate: number = 0.6
  ): void {
    this.traitors.set(nodeId, {
      nodeId,
      isActive: true,
      faultType,
      corruptionRate: Math.min(1, Math.max(0.1, corruptionRate)),
      totalInjected: 0,
      totalDetected: 0,
    });
  }

  /**
   * Removes Byzantine status from a node
   */
  public removeTraitorNode(nodeId: string): void {
    this.traitors.delete(nodeId);
  }

  /**
   * Checks if node is currently an active Byzantine traitor
   */
  public isTraitor(nodeId: string): boolean {
    const traitor = this.traitors.get(nodeId);
    return Boolean(traitor && traitor.isActive);
  }

  /**
   * Returns list of traitor node IDs
   */
  public getTraitors(): string[] {
    return Array.from(this.traitors.keys());
  }

  /**
   * Returns config for all traitor nodes
   */
  public getAllTraitorConfigs(): ByzantineTraitorConfig[] {
    return Array.from(this.traitors.values());
  }

  /**
   * Simulates outbound message dispatch from a node, potentially injecting Byzantine corruption
   */
  public processOutboundMessage(
    nodeId: string,
    payload: string,
    now: number = performance.now()
  ): {
    payload: string;
    checksum: string;
    faultInjected: boolean;
    faultType?: ByzantineFaultType;
  } {
    const traitor = this.traitors.get(nodeId);
    const validChecksum = this.computeChecksum(payload);

    if (!traitor || !traitor.isActive) {
      return {
        payload,
        checksum: validChecksum,
        faultInjected: false,
      };
    }

    const shouldInject = Math.random() < traitor.corruptionRate;
    if (!shouldInject) {
      return {
        payload,
        checksum: validChecksum,
        faultInjected: false,
      };
    }

    traitor.totalInjected++;

    if (traitor.faultType === 'payload-corruption') {
      // Invert characters in payload while leaving checksum untouched (checksum mismatch)
      const corruptedPayload = `${payload} [BYZANTINE_TAMPERED_0xDEAD]`;
      this.recordEvent({
        id: `byz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestampMs: now,
        nodeId,
        faultType: 'payload-corruption',
        description: `Byzantine bit-flip injected on ${nodeId}: message payload modified in-flight!`,
        actionTaken: 'detected_and_quarantined',
      });

      return {
        payload: corruptedPayload,
        checksum: validChecksum, // Mismatch between payload and checksum!
        faultInjected: true,
        faultType: 'payload-corruption',
      };
    } else if (traitor.faultType === 'conflicting-vote') {
      // Traitor casts contradictory split-ballot votes
      const votePayload = Math.random() > 0.5 ? 'VOTE:CANDIDATE_A' : 'VOTE:CANDIDATE_B';
      this.recordEvent({
        id: `byz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestampMs: now,
        nodeId,
        faultType: 'conflicting-vote',
        description: `Equivocation detected on ${nodeId}: sent conflicting ballot votes to peers!`,
        actionTaken: 'detected_and_quarantined',
      });

      return {
        payload: votePayload,
        checksum: this.computeChecksum(votePayload),
        faultInjected: true,
        faultType: 'conflicting-vote',
      };
    } else if (traitor.faultType === 'replay-attack') {
      // Replays stale transaction payload
      const replayedPayload = `[STALE_NONCE_REPLAY] ${payload}`;
      this.recordEvent({
        id: `byz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestampMs: now,
        nodeId,
        faultType: 'replay-attack',
        description: `Replay attack on ${nodeId}: re-transmitting expired nonce transaction!`,
        actionTaken: 'detected_and_quarantined',
      });

      return {
        payload: replayedPayload,
        checksum: 'deadbeef_replay',
        faultInjected: true,
        faultType: 'replay-attack',
      };
    } else {
      // Silent drop
      this.recordEvent({
        id: `byz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestampMs: now,
        nodeId,
        faultType: 'silent-drop',
        description: `Silent blackhole drop on ${nodeId}: request swallowed without acknowledgement.`,
        actionTaken: 'dropped',
      });

      return {
        payload: '',
        checksum: '',
        faultInjected: true,
        faultType: 'silent-drop',
      };
    }
  }

  /**
   * Verifies inbound message checksum against expected hash
   */
  public verifyInboundMessage(
    senderNodeId: string,
    payload: string,
    providedChecksum: string
  ): ByzantineVerificationResult {
    if (!payload && !providedChecksum) {
      return {
        valid: false,
        corrupted: true,
        expectedChecksum: '',
        receivedChecksum: '',
        traitorDetected: true,
        traitorNodeId: senderNodeId,
        details: 'Silent blackhole drop detected (empty payload and checksum).',
      };
    }

    const calculatedChecksum = this.computeChecksum(payload);
    const isValid = calculatedChecksum === providedChecksum;

    if (!isValid) {
      const traitor = this.traitors.get(senderNodeId);
      if (traitor) {
        traitor.totalDetected++;
      }

      return {
        valid: false,
        corrupted: true,
        expectedChecksum: calculatedChecksum,
        receivedChecksum: providedChecksum,
        traitorDetected: true,
        traitorNodeId: senderNodeId,
        details: `Checksum mismatch on message from [${senderNodeId}]! Expected ${calculatedChecksum}, received ${providedChecksum}. Byzantine quarantine enforced.`,
      };
    }

    return {
      valid: true,
      corrupted: false,
      expectedChecksum: calculatedChecksum,
      receivedChecksum: providedChecksum,
      traitorDetected: false,
      details: 'Checksum signature verified successfully.',
    };
  }

  private recordEvent(event: ByzantineEvent): void {
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.length = this.maxEvents;
    }
  }

  public getEvents(): ByzantineEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }

  public reset(): void {
    this.traitors.clear();
    this.events = [];
  }
}
