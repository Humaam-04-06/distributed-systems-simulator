/**
 * ServerResourceManager — Models physical CPU, Memory/RAM pressure, and Thread Pool starvation
 */

export interface ServerResources {
  cpuUsagePercentage: number;
  memoryUsedMb: number;
  maxMemoryMb: number;
  activeThreads: number;
  maxThreadPool: number;
  isOom: boolean;
  isThreadStarved: boolean;
}

export class ServerResourceManager {
  private baseMemoryMb: number = 128;
  private maxMemoryMb: number = 512;
  private maxThreadPool: number = 50;
  private memoryPerQueuedPacketMb: number = 2.4; // 2.4MB per queued in-flight buffer

  public computeResources(
    queueDepth: number,
    activeConnections: number,
    isDegraded: boolean
  ): ServerResources {
    // 1. Thread Pool
    const activeThreads = Math.min(this.maxThreadPool, activeConnections);
    const isThreadStarved = activeConnections >= this.maxThreadPool;

    // 2. Memory / RAM consumption
    const dynamicMemory = this.baseMemoryMb + queueDepth * this.memoryPerQueuedPacketMb;
    const memoryUsedMb = Math.round(dynamicMemory);
    const isOom = memoryUsedMb >= this.maxMemoryMb;

    // 3. CPU utilization
    const loadFactor = isDegraded ? 2.2 : 1.0;
    const baseCpu = 8;
    const threadCpu = (activeThreads / this.maxThreadPool) * 75 * loadFactor;
    const queueCpu = Math.min(20, (queueDepth / 100) * 15);
    const totalCpu = Math.min(99, Math.round(baseCpu + threadCpu + queueCpu));

    return {
      cpuUsagePercentage: totalCpu,
      memoryUsedMb: Math.min(this.maxMemoryMb, memoryUsedMb),
      maxMemoryMb: this.maxMemoryMb,
      activeThreads,
      maxThreadPool: this.maxThreadPool,
      isOom,
      isThreadStarved,
    };
  }

  public getBaseMemoryMb(): number {
    return this.baseMemoryMb;
  }

  public getMaxMemoryMb(): number {
    return this.maxMemoryMb;
  }
}
