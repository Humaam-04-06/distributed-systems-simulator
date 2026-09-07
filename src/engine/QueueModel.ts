/**
 * QueueModel — Mathematical M/M/1 & M/M/c queuing models and discrete packet buffers
 */

import { Packet } from './types';

export interface QueueConfig {
  maxQueueDepth: number;
  serviceRateMu: number; // requests serviced per second
  concurrencyLimit: number; // c in M/M/c
}

export interface QueueMetrics {
  currentDepth: number;
  utilizationRho: number;
  averageWaitTimeMs: number;
  isCongested: boolean;
  isOverflown: boolean;
}

export class QueueBuffer {
  private queue: Packet[] = [];
  private activeProcessing: Set<Packet> = new Set();
  private config: QueueConfig;

  constructor(config: QueueConfig) {
    this.config = config;
  }

  public enqueue(packet: Packet): { accepted: boolean; reason?: string } {
    if (this.queue.length >= this.config.maxQueueDepth) {
      return { accepted: false, reason: 'QUEUE_OVERFLOW' };
    }

    this.queue.push(packet);
    return { accepted: true };
  }

  public step(deltaTimeMs: number, onPacketServiced: (packet: Packet) => void): void {
    // 1. Fill available concurrency slots from queue
    while (
      this.activeProcessing.size < this.config.concurrencyLimit &&
      this.queue.length > 0
    ) {
      const nextPacket = this.queue.shift()!;
      this.activeProcessing.add(nextPacket);
    }

    // 2. Process active requests based on service rate (Poisson/Exponential service)
    const serviceProbabilityPerDelta =
      (this.config.serviceRateMu * (deltaTimeMs / 1000)) /
      Math.max(1, this.activeProcessing.size);

    const completed: Packet[] = [];
    for (const packet of this.activeProcessing) {
      // Simulating exponential distribution service completion
      if (Math.random() < Math.min(0.95, serviceProbabilityPerDelta)) {
        completed.push(packet);
      }
    }

    for (const p of completed) {
      this.activeProcessing.delete(p);
      onPacketServiced(p);
    }
  }

  public getMetrics(arrivalRateLambda: number): QueueMetrics {
    const totalCapacity = this.config.serviceRateMu * this.config.concurrencyLimit;
    const utilization = Math.min(1, arrivalRateLambda / Math.max(1, totalCapacity));

    // M/M/c average wait time estimation via Little's Law
    const avgWaitTimeMs =
      utilization < 0.98
        ? (1 / Math.max(0.1, totalCapacity - arrivalRateLambda)) * 1000
        : 1000 + (arrivalRateLambda - totalCapacity) * 5;

    return {
      currentDepth: this.queue.length + this.activeProcessing.size,
      utilizationRho: utilization,
      averageWaitTimeMs: Math.max(5, avgWaitTimeMs),
      isCongested: utilization > 0.75,
      isOverflown: this.queue.length >= this.config.maxQueueDepth,
    };
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveProcessingCount(): number {
    return this.activeProcessing.size;
  }

  public clear(): void {
    this.queue = [];
    this.activeProcessing.clear();
  }
}
