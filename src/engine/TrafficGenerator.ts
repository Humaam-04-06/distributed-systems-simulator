/**
 * TrafficGenerator — Poisson arrival process and configurable traffic profiles
 */

import { Packet, PacketType } from './types';

export type TrafficPattern = 'steady' | 'spike' | 'sinusoidal' | 'burst';

export class TrafficGenerator {
  private targetRps: number = 200;
  private pattern: TrafficPattern = 'steady';
  private readWriteRatio: number = 0.8; // 80% reads, 20% writes
  private packetCounter: number = 0;
  private timeOffset: number = 0;

  constructor(targetRps: number = 200) {
    this.targetRps = targetRps;
  }

  public setTargetRps(rps: number): void {
    this.targetRps = Math.max(1, Math.min(5000, rps));
  }

  public getTargetRps(): number {
    return this.targetRps;
  }

  public setPattern(pattern: TrafficPattern): void {
    this.pattern = pattern;
  }

  public getPattern(): TrafficPattern {
    return this.pattern;
  }

  public setReadWriteRatio(ratio: number): void {
    this.readWriteRatio = Math.max(0, Math.min(1, ratio));
  }

  /**
   * Generates discrete packets for the current tick using Poisson distribution
   */
  public generateTickPackets(deltaTimeMs: number): Packet[] {
    this.timeOffset += deltaTimeMs / 1000;

    // Calculate effective instantaneous RPS based on pattern
    let effectiveRps = this.targetRps;
    switch (this.pattern) {
      case 'sinusoidal':
        // Oscillate +/- 40% every 15 seconds
        effectiveRps =
          this.targetRps * (1 + 0.4 * Math.sin((2 * Math.PI * this.timeOffset) / 15));
        break;
      case 'spike':
        // Sudden 3x spike every 10 seconds for 2 seconds
        const spikeCycle = this.timeOffset % 10;
        if (spikeCycle > 6 && spikeCycle < 8) {
          effectiveRps = this.targetRps * 3;
        }
        break;
      case 'burst':
        // Short burst bursts every 4 seconds
        effectiveRps =
          Math.sin(this.timeOffset * 4) > 0.6 ? this.targetRps * 2.2 : this.targetRps * 0.4;
        break;
      case 'steady':
      default:
        effectiveRps = this.targetRps;
        break;
    }

    // Mean expected packets in this delta time: lambda = RPS * deltaSeconds
    const expectedLambda = (effectiveRps * deltaTimeMs) / 1000;

    // Poisson sample using Knuth's algorithm (or Gaussian approximation for large lambda)
    const count = this.samplePoisson(expectedLambda);

    const packets: Packet[] = [];
    const now = performance.now();

    for (let i = 0; i < count; i++) {
      this.packetCounter++;
      const isRead = Math.random() < this.readWriteRatio;
      const type: PacketType = isRead ? 'read' : 'write';

      packets.push({
        id: `pkt-${this.packetCounter}`,
        type,
        status: 'queued',
        createdAt: now,
        hops: [
          {
            nodeId: 'ingress',
            enteredAt: now,
          },
        ],
        conduitProgress: 0,
        currentConduitId: 'ingress-to-lb',
      });
    }

    return packets;
  }

  /**
   * Knuth Poisson pseudo-random generator
   */
  private samplePoisson(lambda: number): number {
    if (lambda <= 0) return 0;

    // For large lambda (> 30), use Gaussian normal approximation
    if (lambda > 30) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
    }

    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  public reset(): void {
    this.packetCounter = 0;
    this.timeOffset = 0;
  }
}
