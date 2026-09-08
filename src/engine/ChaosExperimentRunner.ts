/**
 * ChaosExperimentRunner — Netflix Chaos Monkey & Gorilla Orchestration Engine
 * 
 * Automates chaos experiments (Rolling AZ Outages, Database Blackholes, Byzantine Infiltration,
 * and Latency Storms) and evaluates continuous steady-state hypothesis invariants.
 */

export type ChaosScenarioId =
  | 'az-outage'
  | 'database-blackhole'
  | 'byzantine-traitor'
  | 'latency-storm'
  | 'cascading-meltdown';

export interface ChaosScenario {
  id: ChaosScenarioId;
  name: string;
  description: string;
  targetSubsystem: string;
  durationMs: number;
  hypothesis: string;
  minAvailabilityThreshold: number; // e.g. 98.0%
  maxP99ThresholdMs: number; // e.g. 150ms
}

export interface ChaosExperimentState {
  activeScenario: ChaosScenario | null;
  status: 'idle' | 'running' | 'completed' | 'aborted';
  elapsedMs: number;
  totalDurationMs: number;
  steadyStateHypothesisMet: boolean;
  hypothesisMetrics: {
    currentAvailability: number;
    minAvailabilityThreshold: number;
    currentP99Latency: number;
    maxP99Threshold: number;
    violationsCount: number;
  };
  blastRadiusSummary: string;
}

export class ChaosExperimentRunner {
  private scenarios: Map<ChaosScenarioId, ChaosScenario> = new Map();
  private state: ChaosExperimentState;

  constructor() {
    this.initializeScenarios();
    this.state = this.createDefaultState();
  }

  private createDefaultState(): ChaosExperimentState {
    return {
      activeScenario: null,
      status: 'idle',
      elapsedMs: 0,
      totalDurationMs: 0,
      steadyStateHypothesisMet: true,
      hypothesisMetrics: {
        currentAvailability: 100,
        minAvailabilityThreshold: 98.0,
        currentP99Latency: 20,
        maxP99Threshold: 150,
        violationsCount: 0,
      },
      blastRadiusSummary: 'Nominal. No active chaos experiment.',
    };
  }

  private initializeScenarios(): void {
    const list: ChaosScenario[] = [
      {
        id: 'az-outage',
        name: 'Rolling AZ Outage (Chaos Gorilla)',
        description: 'Simulates complete severed network link to AZ-East, isolating 50% of compute nodes.',
        targetSubsystem: 'Worker Cluster & Network Fabric',
        durationMs: 12000,
        hypothesis: 'Surviving AZ-West nodes auto-scale capacity; overall availability remains > 98.5%.',
        minAvailabilityThreshold: 98.5,
        maxP99ThresholdMs: 120,
      },
      {
        id: 'database-blackhole',
        name: 'Database Blackhole Partition',
        description: 'Drops 100% of outbound packets from Primary Database, forcing Raft failover election.',
        targetSubsystem: 'Database Replication Tier',
        durationMs: 10000,
        hypothesis: 'Quorum detects partition within 3s and safely promotes highest-LSN replica to Primary.',
        minAvailabilityThreshold: 95.0,
        maxP99ThresholdMs: 180,
      },
      {
        id: 'byzantine-traitor',
        name: 'Byzantine Traitor Infiltration',
        description: 'Injects in-flight bit flips and corrupted payload signatures on Server 2.',
        targetSubsystem: 'Consensus & Payload Integrity',
        durationMs: 8000,
        hypothesis: 'Cryptographic FNV-1a checksums detect tampered messages; traitor is quarantined with 0 corrupt writes.',
        minAvailabilityThreshold: 99.0,
        maxP99ThresholdMs: 90,
      },
      {
        id: 'latency-storm',
        name: 'Inter-DC Latency Storm',
        description: 'Injects +300ms Gaussian jitter across 80% of inter-node RPC links.',
        targetSubsystem: 'Ingress LB & Downstream Queues',
        durationMs: 10000,
        hypothesis: 'Adaptive timeout backoffs and Redis caching absorb latency spike without buffer exhaustion.',
        minAvailabilityThreshold: 97.0,
        maxP99ThresholdMs: 250,
      },
      {
        id: 'cascading-meltdown',
        name: 'Domino Cascading Meltdown',
        description: 'Progressively overloads surviving workers to test Hystrix circuit breaker blast radius isolation.',
        targetSubsystem: 'Resilience & Circuit Breakers',
        durationMs: 12000,
        hypothesis: 'Circuit breakers trip to OPEN within 250ms, shedding excess traffic and saving healthy nodes from crash loops.',
        minAvailabilityThreshold: 90.0,
        maxP99ThresholdMs: 200,
      },
    ];

    for (const s of list) {
      this.scenarios.set(s.id, s);
    }
  }

  public getScenarios(): ChaosScenario[] {
    return Array.from(this.scenarios.values());
  }

  public getScenario(id: ChaosScenarioId): ChaosScenario | undefined {
    return this.scenarios.get(id);
  }

  /**
   * Starts an automated chaos experiment
   */
  public startScenario(id: ChaosScenarioId): ChaosScenario | undefined {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;

    this.state = {
      activeScenario: scenario,
      status: 'running',
      elapsedMs: 0,
      totalDurationMs: scenario.durationMs,
      steadyStateHypothesisMet: true,
      hypothesisMetrics: {
        currentAvailability: 100,
        minAvailabilityThreshold: scenario.minAvailabilityThreshold,
        currentP99Latency: 20,
        maxP99Threshold: scenario.maxP99ThresholdMs,
        violationsCount: 0,
      },
      blastRadiusSummary: `Chaos Drill Active: ${scenario.name}. Testing steady-state hypothesis.`,
    };

    return scenario;
  }

  /**
   * Stops active chaos experiment early
   */
  public stopScenario(reason: string = 'User requested abort'): void {
    if (this.state.status === 'running') {
      this.state.status = 'aborted';
      this.state.blastRadiusSummary = `Experiment stopped: ${reason}.`;
    }
  }

  /**
   * Ticks the chaos experiment clock and monitors steady-state invariants
   */
  public tick(
    deltaMs: number,
    currentAvailability: number,
    currentP99Latency: number
  ): {
    justCompleted: boolean;
    steadyStateBreached: boolean;
  } {
    if (this.state.status !== 'running' || !this.state.activeScenario) {
      return { justCompleted: false, steadyStateBreached: false };
    }

    this.state.elapsedMs += deltaMs;

    // Update real-time metrics
    this.state.hypothesisMetrics.currentAvailability = Number(currentAvailability.toFixed(1));
    this.state.hypothesisMetrics.currentP99Latency = Number(currentP99Latency.toFixed(1));

    // Verify steady-state hypothesis
    const breachedAvailability =
      currentAvailability < this.state.hypothesisMetrics.minAvailabilityThreshold;
    const breachedLatency =
      currentP99Latency > this.state.hypothesisMetrics.maxP99Threshold;

    let steadyStateBreached = false;
    if (breachedAvailability || breachedLatency) {
      this.state.hypothesisMetrics.violationsCount++;
      if (this.state.hypothesisMetrics.violationsCount > 3) {
        this.state.steadyStateHypothesisMet = false;
        steadyStateBreached = true;
      }
    }

    // Check completion
    if (this.state.elapsedMs >= this.state.totalDurationMs) {
      this.state.status = 'completed';
      const outcome = this.state.steadyStateHypothesisMet ? 'VERIFIED PASSED' : 'HYPOTHESIS FAILED';
      this.state.blastRadiusSummary = `Experiment concluded: ${this.state.activeScenario.name} [${outcome}].`;
      return { justCompleted: true, steadyStateBreached };
    }

    return { justCompleted: false, steadyStateBreached };
  }

  public getState(): ChaosExperimentState {
    return { ...this.state };
  }

  public reset(): void {
    this.state = this.createDefaultState();
  }
}
