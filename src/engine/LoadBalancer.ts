/**
 * LoadBalancer — Multi-algorithm load balancing router
 */

import { LoadBalancingAlgorithm, ServerNodeState } from './types';

export interface BackendTarget {
  id: string;
  weight: number;
  activeConnections: number;
  healthy: boolean;
}

export class LoadBalancer {
  private algorithm: LoadBalancingAlgorithm = 'round-robin';
  private roundRobinCounter: number = 0;
  private weightedCounter: number = 0;

  constructor(algorithm: LoadBalancingAlgorithm = 'round-robin') {
    this.algorithm = algorithm;
  }

  public setAlgorithm(algo: LoadBalancingAlgorithm): void {
    this.algorithm = algo;
  }

  public getAlgorithm(): LoadBalancingAlgorithm {
    return this.algorithm;
  }

  /**
   * Routes an incoming request to an optimal healthy server based on the active strategy
   */
  public route(
    healthyServers: ServerNodeState[],
    clientKey: string = 'client-192.168.1.1'
  ): ServerNodeState | null {
    if (!healthyServers || healthyServers.length === 0) {
      return null;
    }

    switch (this.algorithm) {
      case 'least-connections':
        return this.routeLeastConnections(healthyServers);

      case 'weighted-round-robin':
        return this.routeWeightedRoundRobin(healthyServers);

      case 'random':
        return this.routeRandom(healthyServers);

      case 'ip-hash':
        return this.routeIpHash(healthyServers, clientKey);

      case 'round-robin':
      default:
        return this.routeRoundRobin(healthyServers);
    }
  }

  private routeRoundRobin(servers: ServerNodeState[]): ServerNodeState {
    this.roundRobinCounter = (this.roundRobinCounter + 1) % servers.length;
    return servers[this.roundRobinCounter];
  }

  private routeLeastConnections(servers: ServerNodeState[]): ServerNodeState {
    // Sort by active connections ascending, break ties by queue depth
    let best = servers[0];
    for (let i = 1; i < servers.length; i++) {
      const current = servers[i];
      if (
        current.activeConnections < best.activeConnections ||
        (current.activeConnections === best.activeConnections &&
          current.queueDepth < best.queueDepth)
      ) {
        best = current;
      }
    }
    return best;
  }

  private routeWeightedRoundRobin(servers: ServerNodeState[]): ServerNodeState {
    // Default synthetic weights (e.g. S1=1, S2=2, S3=3)
    const weights = servers.map((_, idx) => idx + 1);
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);

    this.weightedCounter = (this.weightedCounter + 1) % totalWeight;

    let cumulative = 0;
    for (let i = 0; i < servers.length; i++) {
      cumulative += weights[i];
      if (this.weightedCounter < cumulative) {
        return servers[i];
      }
    }
    return servers[0];
  }

  private routeRandom(servers: ServerNodeState[]): ServerNodeState {
    const idx = Math.floor(Math.random() * servers.length);
    return servers[idx];
  }

  private routeIpHash(servers: ServerNodeState[], clientIp: string): ServerNodeState {
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      hash = (hash << 5) - hash + clientIp.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const idx = Math.abs(hash) % servers.length;
    return servers[idx];
  }
}
