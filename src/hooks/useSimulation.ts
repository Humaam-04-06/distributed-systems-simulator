/**
 * useSimulation — Reactive React hook interfacing with SimulationEngine
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { SimulationEngine } from '../engine/SimulationEngine';
import { DetailedServerMode } from '../engine/ServerStateMachine';
import { ServerResources } from '../engine/ServerResourceManager';
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
  };
}
