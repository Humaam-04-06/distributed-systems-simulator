/**
 * HealthChecker — Active and passive health probe manager for backend pools
 */

import { ServerNodeState } from './types';

export interface HealthCheckConfig {
  intervalMs: number;
  unhealthyThreshold: number; // Consecutive failures to mark dead
  healthyThreshold: number; // Consecutive successes to mark alive
}

export interface NodeProbeState {
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastProbeTime: number;
  isHealthy: boolean;
}

export class HealthChecker {
  private config: HealthCheckConfig;
  private probeStates: Map<string, NodeProbeState> = new Map();
  private lastGlobalCheck: number = performance.now();

  constructor(
    config: HealthCheckConfig = {
      intervalMs: 2000,
      unhealthyThreshold: 3,
      healthyThreshold: 2,
    }
  ) {
    this.config = config;
  }

  public registerNode(nodeId: string, initialHealth: boolean = true): void {
    this.probeStates.set(nodeId, {
      consecutiveFailures: 0,
      consecutiveSuccesses: initialHealth ? this.config.healthyThreshold : 0,
      lastProbeTime: performance.now(),
      isHealthy: initialHealth,
    });
  }

  /**
   * Run active periodic health probes across all registered servers
   */
  public tick(
    servers: ServerNodeState[],
    onStateChange: (server: ServerNodeState, isHealthy: boolean) => void
  ): void {
    const now = performance.now();
    if (now - this.lastGlobalCheck < this.config.intervalMs) {
      return;
    }
    this.lastGlobalCheck = now;

    for (const server of servers) {
      let state = this.probeStates.get(server.id);
      if (!state) {
        this.registerNode(server.id, server.health !== 'crashed');
        state = this.probeStates.get(server.id)!;
      }

      state.lastProbeTime = now;

      // Simulated probe result: server is healthy if not explicitly crashed and CPU < 98%
      const probePassed = server.health !== 'crashed' && server.cpuLoad < 98;

      if (probePassed) {
        state.consecutiveFailures = 0;
        state.consecutiveSuccesses++;

        if (!state.isHealthy && state.consecutiveSuccesses >= this.config.healthyThreshold) {
          state.isHealthy = true;
          onStateChange(server, true);
        }
      } else {
        state.consecutiveSuccesses = 0;
        state.consecutiveFailures++;

        if (state.isHealthy && state.consecutiveFailures >= this.config.unhealthyThreshold) {
          state.isHealthy = false;
          onStateChange(server, false);
        }
      }
    }
  }

  /**
   * Passive health check ejection (called upon immediate connection error)
   */
  public reportImmediateFailure(
    server: ServerNodeState,
    onEject: (server: ServerNodeState) => void
  ): void {
    const state = this.probeStates.get(server.id);
    if (state) {
      state.consecutiveFailures++;
      if (state.isHealthy && state.consecutiveFailures >= this.config.unhealthyThreshold) {
        state.isHealthy = false;
        onEject(server);
      }
    }
  }

  public isNodeHealthy(nodeId: string): boolean {
    return this.probeStates.get(nodeId)?.isHealthy ?? false;
  }
}
