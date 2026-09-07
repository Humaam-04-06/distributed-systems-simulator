/**
 * useSimulation — Reactive React hook interfacing with SimulationEngine
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { SimulationEngine } from '../engine/SimulationEngine';
import { DetailedServerMode } from '../engine/ServerStateMachine';
import { ServerResources } from '../engine/ServerResourceManager';
import { DatabaseNode, ReplicationMode } from '../engine/DatabaseReplicationEngine';
import { WriteConflict } from '../engine/WriteConflictDetector';
import { CacheEntry, CacheMetrics, EvictionPolicy } from '../engine/CacheEvictionEngine';
import { StampedeEvent } from '../engine/CacheStampedeSimulator';
import { StampedeMitigationStrategy } from '../engine/CacheMitigationManager';
import {
  CircuitBreakerMetrics,
  CircuitBreakerConfig,
} from '../engine/CircuitBreakerManager';
import { RetryMetrics, BackoffStrategy } from '../engine/RetryEngine';
import { FallbackMetrics, FallbackStrategy } from '../engine/FallbackManager';
import {
  BulkheadPoolMetrics,
  BulkheadDomain,
} from '../engine/ThreadPoolBulkhead';
import { ConnectionPoolMetrics } from '../engine/ConnectionPoolBulkhead';
import { TenantQuota, TenantTier } from '../engine/TenantBulkheadQuarantine';
import {
  IncidentEvent,
  ServerNodeState,
  DatabaseNodeState,
  CacheNodeState,
  LoadBalancerNodeState,
  SimulationMetrics,
  LoadBalancingAlgorithm,
} from '../engine/types';

export function useSimulation() {
  const engineRef = useRef<SimulationEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new SimulationEngine();
  }

  const engine = engineRef.current;

  // React state reflecting engine internals
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeedState] = useState<number>(1);
  const [metrics, setMetrics] = useState<SimulationMetrics>(engine.getMetricsSnapshot());
  const [lbNode, setLbNode] = useState<LoadBalancerNodeState>({ ...engine.lbNode });
  const [serverNodes, setServerNodes] = useState<ServerNodeState[]>([
    ...engine.serverNodes.map((s) => ({ ...s })),
  ]);
  const [dbNode, setDbNode] = useState<DatabaseNodeState>({ ...engine.dbNode });
  const [cacheNode, setCacheNode] = useState<CacheNodeState>({ ...engine.cacheNode });
  const [incidents, setIncidents] = useState<IncidentEvent[]>([...engine.incidents]);
  const [config, setConfig] = useState({ ...engine.config });
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [dbNodes, setDbNodes] = useState<DatabaseNode[]>([...engine.getDbNodes()]);
  const [replicationMode, setReplicationModeState] = useState<ReplicationMode>(
    engine.getDbReplicationMode()
  );
  const [isSplitBrain, setIsSplitBrain] = useState<boolean>(engine.failoverElection.isSplitBrain());
  const [splitBrainPrimaries, setSplitBrainPrimaries] = useState<string[]>([
    ...engine.failoverElection.getSplitBrainPrimaries(),
  ]);
  const [writeConflicts, setWriteConflicts] = useState<WriteConflict[]>([
    ...engine.getWriteConflicts(),
  ]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics>(engine.getCacheMetrics());
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([...engine.getCacheEntries()]);
  const [cachePolicy, setCachePolicyState] = useState<EvictionPolicy>(engine.getCachePolicy());
  const [cacheMitigationStrategy, setCacheMitigationStrategyState] =
    useState<StampedeMitigationStrategy>(engine.getCacheMitigationStrategy());
  const [isStampedeActive, setIsStampedeActive] = useState<boolean>(
    engine.stampedeSim.getActiveStampede() !== null
  );
  const [activeStampede, setActiveStampede] = useState<StampedeEvent | null>(
    engine.stampedeSim.getActiveStampede()
  );
  const [cbMetrics, setCbMetrics] = useState<CircuitBreakerMetrics>(
    engine.getCircuitBreakerMetrics()
  );
  const [cbConfig, setCbConfig] = useState<CircuitBreakerConfig>(
    engine.getCircuitBreakerConfig()
  );
  const [retryMetrics, setRetryMetrics] = useState<RetryMetrics>(engine.getRetryMetrics());
  const [fallbackMetrics, setFallbackMetrics] = useState<FallbackMetrics>(
    engine.getFallbackMetrics()
  );
  const [bulkheadPoolMetrics, setBulkheadPoolMetrics] = useState<BulkheadPoolMetrics[]>(
    engine.getBulkheadPoolMetrics()
  );
  const [connPoolMetrics, setConnPoolMetrics] = useState<ConnectionPoolMetrics>(
    engine.getConnectionPoolMetrics()
  );
  const [tenantQuotas, setTenantQuotas] = useState<TenantQuota[]>(
    engine.getTenantQuotas()
  );
  const [isNoisyNeighborActive, setIsNoisyNeighborActive] = useState<boolean>(
    engine.isNoisyNeighborSurgeActive()
  );

  // Subscribe to engine tick notifications
  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setMetrics(engine.getMetricsSnapshot());
      setLbNode({ ...engine.lbNode });
      setServerNodes(engine.serverNodes.map((s) => ({ ...s })));
      setDbNode({ ...engine.dbNode });
      setCacheNode({ ...engine.cacheNode });
      setIncidents([...engine.incidents]);
      setConfig({ ...engine.config });
      setDbNodes([...engine.getDbNodes()]);
      setReplicationModeState(engine.getDbReplicationMode());
      setIsSplitBrain(engine.failoverElection.isSplitBrain());
      setSplitBrainPrimaries([...engine.failoverElection.getSplitBrainPrimaries()]);
      setWriteConflicts([...engine.getWriteConflicts()]);
      setCacheMetrics(engine.getCacheMetrics());
      setCacheEntries([...engine.getCacheEntries()]);
      setCachePolicyState(engine.getCachePolicy());
      setCacheMitigationStrategyState(engine.getCacheMitigationStrategy());
      setIsStampedeActive(engine.stampedeSim.getActiveStampede() !== null);
      setActiveStampede(engine.stampedeSim.getActiveStampede());
      setCbMetrics(engine.getCircuitBreakerMetrics());
      setCbConfig(engine.getCircuitBreakerConfig());
      setRetryMetrics(engine.getRetryMetrics());
      setFallbackMetrics(engine.getFallbackMetrics());
      setBulkheadPoolMetrics([...engine.getBulkheadPoolMetrics()]);
      setConnPoolMetrics({ ...engine.getConnectionPoolMetrics() });
      setTenantQuotas([...engine.getTenantQuotas()]);
      setIsNoisyNeighborActive(engine.isNoisyNeighborSurgeActive());
    });

    // Start simulation clock
    engine.clock.start();
    setIsRunning(true);

    const uptimeInterval = setInterval(() => {
      if (engine.clock.getIsRunning()) {
        setUptimeSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      unsub();
      clearInterval(uptimeInterval);
      engine.clock.pause();
    };
  }, [engine]);

  // Actions
  const toggleRunning = useCallback(() => {
    const running = engine.clock.toggle();
    setIsRunning(running);
  }, [engine]);

  const setSpeed = useCallback(
    (newSpeed: number) => {
      engine.clock.setSpeed(newSpeed);
      setSpeedState(newSpeed);
    },
    [engine]
  );

  const reset = useCallback(() => {
    engine.reset();
    setUptimeSeconds(0);
    setMetrics(engine.getMetricsSnapshot());
  }, [engine]);

  const setRps = useCallback(
    (rps: number) => {
      engine.setRps(rps);
    },
    [engine]
  );

  const setLatency = useCallback(
    (latencyMs: number) => {
      engine.setLatency(latencyMs);
    },
    [engine]
  );

  const setLossRate = useCallback(
    (lossPercentage: number) => {
      engine.setLossRate(lossPercentage);
    },
    [engine]
  );

  const setLbAlgorithm = useCallback(
    (algo: LoadBalancingAlgorithm) => {
      engine.setLbAlgorithm(algo);
    },
    [engine]
  );

  const toggleServer = useCallback(
    (index: number) => {
      engine.toggleServer(index);
    },
    [engine]
  );

  const toggleDb = useCallback(() => {
    engine.toggleDb();
  }, [engine]);

  const toggleCache = useCallback(() => {
    engine.toggleCache();
  }, [engine]);

  const getServerResources = useCallback(
    (serverId: string): ServerResources => {
      return engine.getServerResources(serverId);
    },
    [engine]
  );

  const getServerMode = useCallback(
    (serverId: string): DetailedServerMode => {
      return engine.getServerMode(serverId);
    },
    [engine]
  );

  const setServerDetailedMode = useCallback(
    (serverId: string, mode: DetailedServerMode) => {
      engine.setServerDetailedMode(serverId, mode);
    },
    [engine]
  );

  const isWatchdogEnabled = useCallback(
    (serverId: string): boolean => {
      return engine.isWatchdogEnabled(serverId);
    },
    [engine]
  );

  const toggleWatchdog = useCallback(
    (serverId: string, enabled: boolean) => {
      engine.toggleWatchdog(serverId, enabled);
    },
    [engine]
  );

  const getWatchdogProgress = useCallback(
    (serverId: string) => {
      return engine.getWatchdogProgress(serverId);
    },
    [engine]
  );

  const restartServer = useCallback(
    (serverId: string) => {
      engine.manualRestartServer(serverId);
    },
    [engine]
  );

  const addServerNode = useCallback(() => {
    engine.addServerNode();
  }, [engine]);

  const removeServerNode = useCallback(() => {
    engine.removeServerNode();
  }, [engine]);

  const setReplicationMode = useCallback(
    (mode: ReplicationMode) => {
      engine.setDbReplicationMode(mode);
    },
    [engine]
  );

  const promoteDbReplica = useCallback(
    (replicaId: string) => {
      engine.promoteDbReplica(replicaId);
    },
    [engine]
  );

  const toggleDbNodeHealth = useCallback(
    (nodeId: string) => {
      engine.toggleDbNodeHealth(nodeId);
    },
    [engine]
  );

  const triggerSplitBrain = useCallback(() => {
    engine.triggerSplitBrain();
  }, [engine]);

  const resolveSplitBrain = useCallback(
    (strategy: 'stonith' | 'demote') => {
      engine.resolveSplitBrain(strategy);
    },
    [engine]
  );

  const resolveWriteConflicts = useCallback(
    (strategy: 'lww' | 'highest_lsn') => {
      engine.resolveWriteConflicts(strategy);
    },
    [engine]
  );

  const setCachePolicy = useCallback(
    (policy: EvictionPolicy) => {
      engine.setCachePolicy(policy);
    },
    [engine]
  );

  const setCacheMitigationStrategy = useCallback(
    (strategy: StampedeMitigationStrategy) => {
      engine.setCacheMitigationStrategy(strategy);
    },
    [engine]
  );

  const triggerCacheStampede = useCallback(
    (key?: string) => {
      engine.triggerCacheStampede(key);
    },
    [engine]
  );

  const invalidateCacheKey = useCallback(
    (key: string) => {
      engine.invalidateCacheKey(key);
    },
    [engine]
  );

  const clearCache = useCallback(() => {
    engine.clearCache();
  }, [engine]);

  const toggleCircuitBreaker = useCallback(() => {
    engine.toggleCircuitBreaker();
  }, [engine]);

  const updateCircuitBreakerConfig = useCallback(
    (cfg: Partial<CircuitBreakerConfig>) => {
      engine.updateCircuitBreakerConfig(cfg);
    },
    [engine]
  );

  const forceTripCircuit = useCallback(
    (serverId?: string) => {
      engine.forceTripCircuit(serverId);
    },
    [engine]
  );

  const forceResetCircuit = useCallback(
    (serverId?: string) => {
      engine.forceResetCircuit(serverId);
    },
    [engine]
  );

  const setRetryStrategy = useCallback(
    (strategy: BackoffStrategy) => {
      engine.setRetryStrategy(strategy);
    },
    [engine]
  );

  const setFallbackStrategy = useCallback(
    (strategy: FallbackStrategy) => {
      engine.setFallbackStrategy(strategy);
    },
    [engine]
  );

  const triggerCascadingFailure = useCallback(() => {
    engine.triggerCascadingFailure();
  }, [engine]);

  const resetResilience = useCallback(() => {
    engine.resetResilience();
  }, [engine]);

  const setBulkheadPoolCapacity = useCallback(
    (domain: BulkheadDomain, maxConcurrency: number, maxQueue: number) => {
      engine.setBulkheadPoolCapacity(domain, maxConcurrency, maxQueue);
    },
    [engine]
  );

  const toggleTenantQuarantine = useCallback(
    (tier: TenantTier) => {
      engine.toggleTenantQuarantine(tier);
    },
    [engine]
  );

  const triggerNoisyNeighborSurge = useCallback(() => {
    engine.triggerNoisyNeighborSurge();
  }, [engine]);

  const resetBulkheads = useCallback(() => {
    engine.resetBulkheads();
  }, [engine]);

  return {
    isRunning,
    speed,
    metrics,
    lbNode,
    serverNodes,
    dbNode,
    cacheNode,
    incidents,
    config,
    uptimeSeconds,
    dbNodes,
    replicationMode,
    isSplitBrain,
    splitBrainPrimaries,
    writeConflicts,
    cacheMetrics,
    cacheEntries,
    cachePolicy,
    cacheMitigationStrategy,
    isStampedeActive,
    activeStampede,
    cbMetrics,
    cbConfig,
    retryMetrics,
    fallbackMetrics,
    bulkheadPoolMetrics,
    connPoolMetrics,
    tenantQuotas,
    isNoisyNeighborActive,
    toggleRunning,
    setSpeed,
    reset,
    setRps,
    setLatency,
    setLossRate,
    setLbAlgorithm,
    toggleServer,
    toggleDb,
    toggleCache,
    getServerResources,
    getServerMode,
    setServerDetailedMode,
    isWatchdogEnabled,
    toggleWatchdog,
    getWatchdogProgress,
    restartServer,
    addServerNode,
    removeServerNode,
    setReplicationMode,
    promoteDbReplica,
    toggleDbNodeHealth,
    triggerSplitBrain,
    resolveSplitBrain,
    resolveWriteConflicts,
    setCachePolicy,
    setCacheMitigationStrategy,
    triggerCacheStampede,
    invalidateCacheKey,
    clearCache,
    toggleCircuitBreaker,
    updateCircuitBreakerConfig,
    forceTripCircuit,
    forceResetCircuit,
    setRetryStrategy,
    setFallbackStrategy,
    triggerCascadingFailure,
    resetResilience,
    setBulkheadPoolCapacity,
    toggleTenantQuarantine,
    triggerNoisyNeighborSurge,
    resetBulkheads,
  };
}
