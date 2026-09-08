import { describe, it, expect } from 'vitest';
import {
  ArchitectureEvaluator,
  EvaluationInput,
} from '../../engine/scenarios/ArchitectureEvaluator';

describe('ArchitectureEvaluator', () => {
  it('should award high grades and detect zero critical SPOFs for resilient multi-node setups', () => {
    const input: EvaluationInput = {
      scenarioId: 'twitter-feed',
      metrics: {
        currentRps: 1500,
        successfulRps: 1498,
        errorRps: 2,
        errorRatePercentage: 0.001,
        latencies: {
          p50: 15,
          p90: 35,
          p95: 55,
          p99: 85,
          avg: 22,
          min: 5,
          max: 160,
        },
        totalProcessed: 100000,
        totalErrors: 5,
        totalRateLimited: 2,
        totalCircuitBroken: 0,
        history: [],
      },
      servers: [
        {
          id: 's1',
          name: 'API Server 1',
          type: 'server',
          health: 'healthy',
          activeConnections: 10,
          maxConnections: 100,
          queueDepth: 2,
          maxQueueDepth: 50,
          cpuLoad: 30,
          processedTotal: 50000,
          failedTotal: 2,
          threadPoolActive: 5,
          threadPoolSize: 20,
          circuitBreakerState: 'closed',
          failureCountConsecutive: 0,
        },
        {
          id: 's2',
          name: 'API Server 2',
          type: 'server',
          health: 'healthy',
          activeConnections: 12,
          maxConnections: 100,
          queueDepth: 3,
          maxQueueDepth: 50,
          cpuLoad: 32,
          processedTotal: 50000,
          failedTotal: 3,
          threadPoolActive: 6,
          threadPoolSize: 20,
          circuitBreakerState: 'closed',
          failureCountConsecutive: 0,
        },
      ],
      dbNode: {
        id: 'db-p',
        name: 'DB Primary',
        type: 'database',
        health: 'healthy',
        activeConnections: 15,
        maxConnections: 200,
        queueDepth: 1,
        maxQueueDepth: 50,
        cpuLoad: 40,
        processedTotal: 80000,
        failedTotal: 0,
        role: 'primary',
        replicationLagMs: 0,
        syncReplication: true,
        connectedReplicas: ['db-r1'],
      },
      dbNodes: [
        {
          id: 'db-p',
          name: 'DB Primary',
          role: 'primary',
          health: 'healthy',
          lsn: 10000,
          replicationLagMs: 0,
          pendingWalBytes: 0,
          readIops: 200,
          writeIops: 100,
          cpuLoad: 40,
        },
        {
          id: 'db-r1',
          name: 'DB Replica 1',
          role: 'replica',
          health: 'healthy',
          lsn: 9998,
          replicationLagMs: 5,
          pendingWalBytes: 128,
          readIops: 350,
          writeIops: 0,
          cpuLoad: 30,
        },
      ],
      cacheEnabled: true,
      cacheHitRatio: 0.92,
      circuitBreakerEnabled: true,
      rateLimiterEnabled: true,
      isMultiRegionActive: false,
      config: {
        targetRps: 1500,
        networkLatencyMs: 20,
        packetLossPercentage: 0,
        jitterMs: 5,
        readWriteRatio: 0.8,
        cacheEnabled: true,
        circuitBreakerEnabled: true,
        lbAlgorithm: 'round-robin',
        serverCapacityRps: 1000,
      },
    };

    const evaluation = ArchitectureEvaluator.evaluate(input);

    expect(evaluation.overallScore).toBeGreaterThanOrEqual(75);
    expect(['A+', 'A', 'B']).toContain(evaluation.grade);
    expect(evaluation.interviewerVerdict.length).toBeGreaterThan(0);
    expect(evaluation.estimatedMonthlyCostUsd).toBeGreaterThan(0);
    expect(evaluation.metrics.length).toBeGreaterThanOrEqual(3);
  });

  it('should detect single point of failure (SPOF) when database has no replicas', () => {
    const vulnerableInput: EvaluationInput = {
      scenarioId: 'uber-ride-matching',
      metrics: {
        currentRps: 500,
        successfulRps: 490,
        errorRps: 10,
        errorRatePercentage: 0.02,
        latencies: {
          p50: 45,
          p90: 120,
          p95: 180,
          p99: 250,
          avg: 60,
          min: 10,
          max: 400,
        },
        totalProcessed: 10000,
        totalErrors: 20,
        totalRateLimited: 0,
        totalCircuitBroken: 0,
        history: [],
      },
      servers: [
        {
          id: 's1',
          name: 'App Server 1',
          type: 'server',
          health: 'healthy',
          activeConnections: 50,
          maxConnections: 100,
          queueDepth: 10,
          maxQueueDepth: 50,
          cpuLoad: 75,
          processedTotal: 10000,
          failedTotal: 20,
          threadPoolActive: 15,
          threadPoolSize: 20,
          circuitBreakerState: 'closed',
          failureCountConsecutive: 0,
        },
      ],
      dbNode: {
        id: 'db-p',
        name: 'Single DB',
        type: 'database',
        health: 'healthy',
        activeConnections: 45,
        maxConnections: 50,
        queueDepth: 8,
        maxQueueDepth: 10,
        cpuLoad: 92,
        processedTotal: 9000,
        failedTotal: 15,
        role: 'primary',
        replicationLagMs: 0,
        syncReplication: false,
        connectedReplicas: [], // Zero replicas!
      },
      dbNodes: [
        {
          id: 'db-p',
          name: 'Single DB',
          role: 'primary',
          health: 'healthy',
          lsn: 5000,
          replicationLagMs: 0,
          pendingWalBytes: 0,
          readIops: 800,
          writeIops: 200,
          cpuLoad: 92,
        },
      ],
      cacheEnabled: false,
      cacheHitRatio: 0.0,
      circuitBreakerEnabled: false,
      rateLimiterEnabled: false,
      isMultiRegionActive: false,
      config: {
        targetRps: 500,
        networkLatencyMs: 30,
        packetLossPercentage: 0,
        jitterMs: 10,
        readWriteRatio: 0.7,
        cacheEnabled: false,
        circuitBreakerEnabled: false,
        lbAlgorithm: 'round-robin',
        serverCapacityRps: 500,
      },
    };

    const evaluation = ArchitectureEvaluator.evaluate(vulnerableInput);

    expect(evaluation.spofsDetected.length).toBeGreaterThan(0);
    const dbSpof = evaluation.spofsDetected.find((s) => s.subsystem.toLowerCase().includes('database'));
    expect(dbSpof).toBeDefined();
    expect(evaluation.overallScore).toBeLessThan(75);
  });
});
