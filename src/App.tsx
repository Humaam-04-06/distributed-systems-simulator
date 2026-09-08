import React, { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/layout/Header';
import { StatusBar, ClusterStatus } from './components/layout/StatusBar';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { Slider } from './components/ui/Slider';
import { Switch } from './components/ui/Switch';
import { ConsistentHashRingModal } from './components/modals/ConsistentHashRingModal';
import { showInfoAlert, showWarningAlert } from './utils/alerts';
import {
  Server,
  Database,
  Activity,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  Network,
  Radio,
  CheckCircle2,
  Disc3,
  Anchor,
  BarChart3,
  FlaskConical,
} from 'lucide-react';
import { LoadBalancingAlgorithm } from './engine/types';
import { ServerClusterGrid } from './components/nodes/ServerClusterGrid';
import { DatabaseClusterView } from './components/database/DatabaseClusterView';
import { CacheClusterView } from './components/cache/CacheClusterView';
import { CascadingFailurePanel } from './components/resilience/CascadingFailurePanel';
import { BulkheadClusterView } from './components/bulkhead/BulkheadClusterView';
import { TraceWaterfallViewer } from './components/telemetry/TraceWaterfallViewer';
import { TelemetryMetricsConsole } from './components/telemetry/TelemetryMetricsConsole';
import { CircuitBreakerModal } from './components/modals/CircuitBreakerModal';
import { TraceInspectorModal } from './components/modals/TraceInspectorModal';
import { NetworkPartitionCanvas } from './components/chaos/NetworkPartitionCanvas';
import { ByzantineTraitorPanel } from './components/chaos/ByzantineTraitorPanel';
import { ChaosExperimentConsole } from './components/chaos/ChaosExperimentConsole';

export const App: React.FC = () => {
  const {
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
    cacheMetrics,
    cacheEntries,
    cachePolicy,
    cacheMitigationStrategy,
    isStampedeActive,
    activeStampede,
    setCachePolicy,
    setCacheMitigationStrategy,
    triggerCacheStampede,
    invalidateCacheKey,
    clearCache,
    cbMetrics,
    cbConfig,
    retryMetrics,
    fallbackMetrics,
    toggleCircuitBreaker,
    updateCircuitBreakerConfig,
    forceTripCircuit,
    forceResetCircuit,
    setRetryStrategy,
    setFallbackStrategy,
    triggerCascadingFailure,
    resetResilience,
    bulkheadPoolMetrics,
    connPoolMetrics,
    tenantQuotas,
    isNoisyNeighborActive,
    setBulkheadPoolCapacity,
    toggleTenantQuarantine,
    triggerNoisyNeighborSurge,
    resetBulkheads,
    traces,
    telemetrySnapshot,
    prometheusText,
    otlpJson,
    selectedTrace,
    isTraceModalOpen,
    selectTrace,
    openTraceModal,
    closeTraceModal,
    clearTraces,
    partitionMatrix,
    subnets,
    byzantineTraitors,
    byzantineEvents,
    chaosState,
    chaosScenarios,
    severPartitionLink,
    connectPartitionLink,
    degradePartitionLink,
    applyPartitionPreset,
    healAllPartitions,
    toggleByzantineTraitor,
    clearByzantineEvents,
    resetByzantine,
    startChaosScenario,
    stopChaosScenario,
  } = useSimulation();

  const [chaosActive, setChaosActive] = useState<boolean>(false);
  const [isHashRingOpen, setIsHashRingOpen] = useState<boolean>(false);
  const [isCircuitModalOpen, setIsCircuitModalOpen] = useState<boolean>(false);
  const [centerTab, setCenterTab] = useState<
    'topology' | 'cluster' | 'database' | 'cache' | 'resilience' | 'bulkhead' | 'telemetry' | 'chaos'
  >('topology');
  const [chaosSubTab, setChaosSubTab] = useState<'scenarios' | 'partitions' | 'byzantine'>('scenarios');

  const activeServers = serverNodes.filter((s) => s.health !== 'crashed').length;
  const totalServers = serverNodes.length;

  // Determine overall cluster health
  let clusterStatus: ClusterStatus = 'HEALTHY';
  if (activeServers === 0 || dbNode.health === 'crashed') {
    clusterStatus = 'COLLAPSED';
  } else if (metrics.errorRatePercentage > 20 || activeServers === 1) {
    clusterStatus = 'CRITICAL';
  } else if (metrics.errorRatePercentage > 3 || activeServers === 2) {
    clusterStatus = 'DEGRADED';
  }

  // Calculate Cache Hit Ratio
  const totalCacheLookups = cacheNode.hitCount + cacheNode.missCount;
  const cacheHitRatio =
    totalCacheLookups > 0
      ? ((cacheNode.hitCount / totalCacheLookups) * 100).toFixed(1)
      : '89.4';

  const handleOpenDrills = () => {
    showInfoAlert(
      'System Design Drills',
      'System Design Challenge Drills will be loaded in Phase 10 with interactive failure scenarios!'
    );
  };

  const handleOpenPostMortem = () => {
    showInfoAlert(
      'Post-Mortem Generator',
      'The FAANG-Grade Post-Mortem Incident Report Generator will be unlocked in Phase 10!'
    );
  };

  const handleToggleChaos = () => {
    const next = !chaosActive;
    setChaosActive(next);
    if (next) {
      showWarningAlert(
        'Chaos Monkey Activated',
        'Automated chaos engine is now actively inspecting and injecting randomized faults!'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-[#e0e1dd] flex flex-col font-sans modern-grid selection:bg-[#415a77] selection:text-[#e0e1dd]">
      {/* Top Header */}
      <Header
        isRunning={isRunning}
        onToggleRunning={toggleRunning}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
        onOpenDrills={handleOpenDrills}
        onOpenChaos={handleToggleChaos}
        onExportReport={handleOpenPostMortem}
        chaosActive={chaosActive}
      />

      {/* Main Workspace Frame: 3 Columns */}
      <main className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1920px] w-full mx-auto">
        {/* Left Column: Control Console (3 Cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-5">
          <Card
            title={
              <span className="flex items-center gap-2 text-[#e0e1dd]">
                <Activity className="w-4 h-4 text-[#778da9]" />
                Traffic Generator
              </span>
            }
            subtitle="Configure client ingress load and queuing limits"
          >
            <div className="space-y-4">
              <Slider
                label="Requests / Second"
                value={config.targetRps}
                min={10}
                max={2000}
                step={25}
                unit="RPS"
                onChange={setRps}
                warningThreshold={500}
                dangerThreshold={1000}
                helpText="Push past 1,000 to saturate server queues 💀"
              />

              <Slider
                label="Network Link Latency"
                value={config.networkLatencyMs}
                min={5}
                max={500}
                step={5}
                unit="ms"
                onChange={setLatency}
                warningThreshold={150}
                dangerThreshold={300}
                helpText="Round-trip transmission delay"
              />

              <Slider
                label="Packet Loss Rate"
                value={config.packetLossPercentage}
                min={0}
                max={50}
                step={1}
                unit="%"
                onChange={setLossRate}
                warningThreshold={10}
                dangerThreshold={25}
                helpText="Simulated dropped packets"
              />

              {/* Load Balancing Algorithm Selector */}
              <div className="pt-3 border-t border-[#415a77]/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans font-medium text-[#e0e1dd]">
                    Load Balancing Algorithm
                  </label>
                  {lbNode.algorithm === 'consistent-hash' && (
                    <button
                      onClick={() => setIsHashRingOpen(true)}
                      className="text-[11px] font-sans text-[#778da9] hover:text-[#e0e1dd] underline flex items-center gap-1"
                    >
                      <Disc3 className="w-3 h-3 animate-spin" /> View 360° Ring
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#223049] rounded-lg border border-[#415a77]">
                  {[
                    { id: 'round-robin', label: 'Round Robin' },
                    { id: 'least-connections', label: 'Least Conn' },
                    { id: 'consistent-hash', label: 'Hash Ring' },
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => setLbAlgorithm(algo.id as LoadBalancingAlgorithm)}
                      className={`text-[11px] font-sans py-1.5 rounded transition-all font-medium ${
                        lbNode.algorithm === algo.id
                          ? 'bg-[#415a77] text-[#e0e1dd] font-semibold shadow-sm'
                          : 'text-[#778da9] hover:text-[#e0e1dd]'
                      }`}
                    >
                      {algo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resilience Toggles */}
              <div className="pt-3 border-t border-[#415a77]/60 space-y-2">
                <Switch
                  label="Redis Distributed Cache"
                  description="Cache layer intercepts read traffic"
                  checked={config.cacheEnabled}
                  onChange={toggleCache}
                  variant="blue"
                />

                <Switch
                  label="Circuit Breaker Pattern"
                  description="Fast-fail 503 on failing instances"
                  checked={config.circuitBreakerEnabled}
                  onChange={toggleCircuitBreaker}
                  variant="amber"
                />
              </div>
            </div>
          </Card>

          {/* Fault & Chaos Injection Console */}
          <Card
            title={
              <span className="flex items-center gap-2 text-[#e0e1dd]">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Fault Injection Console
              </span>
            }
            subtitle="Trigger server crashes & partition events"
            glow={activeServers < 3 || dbNode.health === 'crashed' ? 'crimson' : 'none'}
          >
            <div className="space-y-3">
              <div className="text-xs text-[#778da9] font-sans mb-1">
                Toggle Worker Server Availability:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {serverNodes.map((server, idx) => {
                  const isAlive = server.health !== 'crashed';
                  return (
                    <Button
                      key={server.id}
                      size="sm"
                      variant={isAlive ? 'secondary' : 'danger'}
                      onClick={() => toggleServer(idx)}
                      className="text-xs font-mono"
                    >
                      {isAlive ? `Kill S${idx + 1}` : `Revive S${idx + 1}`}
                    </Button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#415a77]/60">
                <Button
                  size="sm"
                  variant={dbNode.health !== 'crashed' ? 'outline' : 'danger'}
                  className="w-full"
                  onClick={toggleDb}
                  icon={<Database className="w-3.5 h-3.5" />}
                >
                  {dbNode.health !== 'crashed'
                    ? 'Simulate Primary DB Outage'
                    : 'Restore Primary Database'}
                </Button>
              </div>
            </div>
          </Card>
        </aside>

        {/* Center Column: Architecture Topology Canvas or Worker Server Cluster (6 Cols) */}
        <section className="lg:col-span-6 flex flex-col gap-4">
          {/* Tab Navigation Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-[#1b263b] p-1 rounded-xl border border-[#415a77]">
              <button
                onClick={() => setCenterTab('topology')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'topology'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Architecture Topology
              </button>
              <button
                onClick={() => setCenterTab('cluster')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'cluster'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Worker Server Cluster
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d1b2a] text-cyan-300 font-mono font-semibold">
                  {serverNodes.length} Nodes
                </span>
              </button>
              <button
                onClick={() => setCenterTab('database')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'database'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-300" />
                Database Cluster
                {isSplitBrain ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold animate-pulse">
                    SPLIT-BRAIN
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d1b2a] text-amber-300 font-mono font-semibold">
                    {replicationMode.toUpperCase()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCenterTab('cache')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'cache'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-cyan-300" />
                Redis Cache Layer
                {isStampedeActive ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-mono font-bold animate-pulse">
                    STAMPEDE
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d1b2a] text-cyan-300 font-mono font-semibold">
                    {cacheMetrics.hitRatioPercentage}% HIT
                  </span>
                )}
              </button>
              <button
                onClick={() => setCenterTab('resilience')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'resilience'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Resilience & Cascading Defense
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                    cbMetrics.state === 'closed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : cbMetrics.state === 'open'
                      ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {cbMetrics.state}
                </span>
              </button>
              <button
                onClick={() => setCenterTab('bulkhead')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'bulkhead'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <Anchor className="w-3.5 h-3.5 text-cyan-300" />
                Bulkhead Compartments
                {isNoisyNeighborActive ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold animate-pulse">
                    SURGE
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d1b2a] text-cyan-300 font-mono font-semibold">
                    3 POOLS
                  </span>
                )}
              </button>
              <button
                onClick={() => setCenterTab('telemetry')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'telemetry'
                    ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
                Traces & OpenTelemetry
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d1b2a] text-cyan-300 font-mono font-semibold">
                  {traces.length} TRACES
                </span>
              </button>
              <button
                onClick={() => setCenterTab('chaos')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  centerTab === 'chaos'
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50 shadow font-semibold'
                    : 'text-[#778da9] hover:text-[#e0e1dd]'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-rose-400" />
                Chaos Lab & Partitions
                {chaosState.status === 'running' ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold animate-pulse">
                    DRILL ACTIVE
                  </span>
                ) : byzantineTraitors.length > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-mono font-bold animate-pulse">
                    TRAITOR ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d1b2a] text-rose-300 font-mono font-semibold">
                    {chaosScenarios.length} DRILLS
                  </span>
                )}
              </button>
            </div>
          </div>

          {centerTab === 'cluster' ? (
            <ServerClusterGrid
              servers={serverNodes}
              getServerResources={getServerResources}
              getServerMode={getServerMode}
              isWatchdogEnabled={isWatchdogEnabled}
              getWatchdogProgress={getWatchdogProgress}
              onModeChange={setServerDetailedMode}
              onWatchdogToggle={toggleWatchdog}
              onManualRestart={restartServer}
              onAddServer={addServerNode}
              onRemoveServer={removeServerNode}
            />
          ) : centerTab === 'database' ? (
            <DatabaseClusterView
              nodes={dbNodes}
              replicationMode={replicationMode}
              isSplitBrain={isSplitBrain}
              splitBrainPrimaries={splitBrainPrimaries}
              conflicts={writeConflicts}
              onSetReplicationMode={setReplicationMode}
              onPromoteReplica={promoteDbReplica}
              onToggleNodeHealth={toggleDbNodeHealth}
              onTriggerSplitBrain={triggerSplitBrain}
              onResolveSplitBrain={resolveSplitBrain}
              onResolveConflicts={resolveWriteConflicts}
            />
          ) : centerTab === 'cache' ? (
            <CacheClusterView
              metrics={cacheMetrics}
              policy={cachePolicy}
              mitigationStrategy={cacheMitigationStrategy}
              isStampedeActive={isStampedeActive}
              activeStampede={activeStampede}
              entries={cacheEntries}
              cacheEnabled={config.cacheEnabled}
              onToggleCacheEnabled={toggleCache}
              onSetPolicy={setCachePolicy}
              onSetMitigationStrategy={setCacheMitigationStrategy}
              onTriggerStampede={triggerCacheStampede}
              onInvalidateKey={invalidateCacheKey}
              onClearCache={clearCache}
            />
          ) : centerTab === 'resilience' ? (
            <CascadingFailurePanel
              cbMetrics={cbMetrics}
              retryMetrics={retryMetrics}
              fallbackMetrics={fallbackMetrics}
              circuitBreakerEnabled={config.circuitBreakerEnabled}
              onToggleCircuitBreaker={toggleCircuitBreaker}
              onSetRetryStrategy={setRetryStrategy}
              onSetFallbackStrategy={setFallbackStrategy}
              onTriggerCascadingFailure={triggerCascadingFailure}
              onResetResilience={resetResilience}
              onOpenCircuitModal={() => setIsCircuitModalOpen(true)}
            />
          ) : centerTab === 'bulkhead' ? (
            <BulkheadClusterView
              poolMetrics={bulkheadPoolMetrics}
              connPoolMetrics={connPoolMetrics}
              tenantQuotas={tenantQuotas}
              isNoisyNeighborActive={isNoisyNeighborActive}
              onSetPoolCapacity={setBulkheadPoolCapacity}
              onToggleTenantQuarantine={toggleTenantQuarantine}
              onTriggerNoisyNeighborSurge={triggerNoisyNeighborSurge}
              onResetBulkheads={resetBulkheads}
            />
          ) : centerTab === 'telemetry' ? (
            <div className="flex flex-col space-y-4">
              <TraceWaterfallViewer
                traces={traces}
                selectedTrace={selectedTrace}
                onSelectTrace={selectTrace}
                onInspectTrace={(t) => openTraceModal(t)}
                onClearTraces={clearTraces}
              />
              <TelemetryMetricsConsole
                snapshot={telemetrySnapshot}
                prometheusText={prometheusText}
                otlpJson={otlpJson}
              />
            </div>
          ) : centerTab === 'chaos' ? (
            <div className="flex flex-col space-y-4">
              {/* Chaos Lab Sub-Navigation Bar */}
              <div className="flex items-center justify-between bg-[#1b263b] p-1.5 rounded-xl border border-[#415a77]/80">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setChaosSubTab('scenarios')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      chaosSubTab === 'scenarios'
                        ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                        : 'text-[#778da9] hover:text-[#e0e1dd]'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-rose-400" />
                    Chaos Monkey Drills
                  </button>
                  <button
                    onClick={() => setChaosSubTab('partitions')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      chaosSubTab === 'partitions'
                        ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                        : 'text-[#778da9] hover:text-[#e0e1dd]'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 text-amber-400" />
                    Network Partition Matrix & Mesh
                  </button>
                  <button
                    onClick={() => setChaosSubTab('byzantine')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      chaosSubTab === 'byzantine'
                        ? 'bg-[#415a77] text-[#e0e1dd] shadow font-semibold'
                        : 'text-[#778da9] hover:text-[#e0e1dd]'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                    Byzantine Fault Injector
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#778da9] px-2">
                  <span>Subnets: <strong className="text-[#e0e1dd]">{subnets.length}</strong></span>
                  <span>|</span>
                  <span>Traitors: <strong className="text-rose-400">{byzantineTraitors.length}</strong></span>
                </div>
              </div>

              {chaosSubTab === 'scenarios' ? (
                <ChaosExperimentConsole
                  scenarios={chaosScenarios}
                  state={chaosState}
                  onStartScenario={startChaosScenario}
                  onStopScenario={stopChaosScenario}
                />
              ) : chaosSubTab === 'partitions' ? (
                <NetworkPartitionCanvas
                  nodes={['lb-1', ...serverNodes.map((s) => s.id), ...dbNodes.map((d) => d.id), 'cache-1']}
                  matrix={partitionMatrix}
                  subnets={subnets}
                  onSeverLink={severPartitionLink}
                  onConnectLink={connectPartitionLink}
                  onDegradeLink={degradePartitionLink}
                  onApplyPreset={applyPartitionPreset}
                  onHealAll={healAllPartitions}
                />
              ) : (
                <ByzantineTraitorPanel
                  nodes={['lb-1', ...serverNodes.map((s) => s.id), ...dbNodes.map((d) => d.id), 'cache-1']}
                  traitors={byzantineTraitors}
                  events={byzantineEvents}
                  onToggleTraitor={toggleByzantineTraitor}
                  onClearEvents={clearByzantineEvents}
                  onResetByzantine={resetByzantine}
                />
              )}
            </div>
          ) : (
            <Card
              className="flex-1 min-h-[580px] relative overflow-hidden"
              title={
                <span className="flex items-center gap-2 text-[#e0e1dd]">
                  <Network className="w-4 h-4 text-[#778da9]" />
                  Distributed Architecture Topology
                </span>
              }
              headerAction={
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm">
                    {lbNode.algorithm.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={dbNode.health !== 'crashed' ? 'emerald' : 'crimson'}
                    size="sm"
                  >
                    {dbNode.health !== 'crashed' ? 'DB Cluster Synced' : 'DB Primary Down'}
                  </Badge>
                </div>
              }
            >
            {/* SVG Connector Conduit Paths Layer */}
            <div className="relative w-full h-full min-h-[520px] flex flex-col items-center justify-between p-4 select-none">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* Ingress to LB conduit */}
                <line
                  x1="50%"
                  y1="75"
                  x2="50%"
                  y2="135"
                  stroke="#415a77"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className={isRunning ? 'animate-flow-dash' : ''}
                />

                {/* LB to Server 1 conduit */}
                <path
                  d="M 50% 195 C 50% 230, 20% 230, 20% 265"
                  fill="none"
                  stroke={serverNodes[0]?.health !== 'crashed' ? '#778da9' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={
                    isRunning && serverNodes[0]?.health !== 'crashed'
                      ? 'animate-flow-dash'
                      : ''
                  }
                  opacity={serverNodes[0]?.health !== 'crashed' ? 0.8 : 0.3}
                />

                {/* LB to Server 2 conduit */}
                <line
                  x1="50%"
                  y1="195"
                  x2="50%"
                  y2="265"
                  stroke={serverNodes[1]?.health !== 'crashed' ? '#778da9' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={
                    isRunning && serverNodes[1]?.health !== 'crashed'
                      ? 'animate-flow-dash'
                      : ''
                  }
                  opacity={serverNodes[1]?.health !== 'crashed' ? 0.8 : 0.3}
                />

                {/* LB to Server 3 conduit */}
                <path
                  d="M 50% 195 C 50% 230, 80% 230, 80% 265"
                  fill="none"
                  stroke={serverNodes[2]?.health !== 'crashed' ? '#778da9' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={
                    isRunning && serverNodes[2]?.health !== 'crashed'
                      ? 'animate-flow-dash'
                      : ''
                  }
                  opacity={serverNodes[2]?.health !== 'crashed' ? 0.8 : 0.3}
                />

                {/* Servers to Database/Cache conduit */}
                <path
                  d="M 20% 365 C 20% 410, 50% 410, 50% 435"
                  fill="none"
                  stroke="#415a77"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={
                    isRunning && serverNodes[0]?.health !== 'crashed'
                      ? 'animate-flow-dash'
                      : ''
                  }
                />
                <line
                  x1="50%"
                  y1="365"
                  x2="50%"
                  y2="435"
                  stroke="#415a77"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={
                    isRunning && serverNodes[1]?.health !== 'crashed'
                      ? 'animate-flow-dash'
                      : ''
                  }
                />
                <path
                  d="M 80% 365 C 80% 410, 50% 410, 50% 435"
                  fill="none"
                  stroke="#415a77"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={
                    isRunning && serverNodes[2]?.health !== 'crashed'
                      ? 'animate-flow-dash'
                      : ''
                  }
                />
              </svg>

              {/* Node Layer 1: Client Traffic Ingress */}
              <div className="relative z-10">
                <div className="px-5 py-2.5 rounded-xl bg-[#223049] border border-[#415a77] shadow-sm text-center flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <div className="text-[11px] font-sans text-[#778da9] font-medium uppercase tracking-wider">
                      Client Ingress
                    </div>
                    <div className="text-base font-mono font-bold text-[#e0e1dd]">
                      {metrics.currentRps || config.targetRps}{' '}
                      <span className="text-xs font-normal text-[#778da9]">req/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Node Layer 2: Load Balancer */}
              <div className="relative z-10 w-full max-w-sm">
                <div className="p-3.5 rounded-xl bg-[#223049] border border-[#415a77] shadow-card text-center">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#e0e1dd] uppercase tracking-wide">
                      <Layers className="w-4 h-4 text-[#778da9]" />
                      {lbNode.name}
                    </div>
                    {lbNode.algorithm === 'consistent-hash' && (
                      <button
                        onClick={() => setIsHashRingOpen(true)}
                        className="text-[10px] text-[#778da9] hover:text-[#e0e1dd] flex items-center gap-1 font-mono"
                      >
                        <Disc3 className="w-3 h-3" /> 360° Ring
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-[#778da9] font-sans mt-1 flex items-center justify-center gap-3">
                    <span>
                      Algorithm:{' '}
                      <strong className="text-[#e0e1dd] capitalize">
                        {lbNode.algorithm.replace('-', ' ')}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active Probes
                    </span>
                  </div>
                </div>
              </div>

              {/* Node Layer 3: Server Worker Fleet */}
              <div className="relative z-10 grid grid-cols-3 gap-4 w-full max-w-2xl px-2">
                {serverNodes.map((server, idx) => {
                  const isAlive = server.health !== 'crashed';
                  const serverLoad = isAlive ? server.cpuLoad : 0;

                  return (
                    <div
                      key={server.id}
                      className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col items-center text-center ${
                        isAlive
                          ? 'bg-[#223049] border-[#415a77] hover:border-[#778da9] shadow-sm'
                          : 'bg-rose-950/20 border-rose-900/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-1.5">
                          <Server
                            className={`w-3.5 h-3.5 ${
                              isAlive ? 'text-[#778da9]' : 'text-rose-400'
                            }`}
                          />
                          <span className="text-xs font-mono font-semibold text-[#e0e1dd]">
                            Server {idx + 1}
                          </span>
                        </div>
                        <Badge
                          variant={isAlive ? 'emerald' : 'crimson'}
                          size="sm"
                          pulse={isAlive}
                        >
                          {isAlive ? 'Online' : 'Dead'}
                        </Badge>
                      </div>

                      {/* Server Load Meter */}
                      <div className="w-full space-y-1 my-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-[#778da9]">
                          <span>Load:</span>
                          <span
                            className={
                              serverLoad > 85
                                ? 'text-rose-400 font-bold'
                                : serverLoad > 60
                                ? 'text-amber-300 font-semibold'
                                : 'text-[#e0e1dd]'
                            }
                          >
                            {serverLoad}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1b263b] rounded-full overflow-hidden border border-[#415a77]/50">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              serverLoad > 85
                                ? 'bg-rose-500'
                                : serverLoad > 60
                                ? 'bg-amber-500'
                                : 'bg-[#778da9]'
                            }`}
                            style={{ width: `${serverLoad}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between w-full text-[10px] font-mono text-[#778da9] my-0.5">
                        <span>Queue: {server.queueDepth}</span>
                        <span>Conn: {server.activeConnections}</span>
                      </div>

                      <button
                        onClick={() => toggleServer(idx)}
                        className={`mt-2 text-[10px] font-sans font-medium px-2 py-1 rounded transition-colors w-full ${
                          isAlive
                            ? 'bg-[#1b263b] hover:bg-rose-500/15 text-[#778da9] hover:text-rose-300 border border-[#415a77]'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isAlive ? 'Crash Server' : 'Restore'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Node Layer 4: Cache & Database Storage Layer */}
              <div className="relative z-10 flex items-center justify-center gap-6 w-full max-w-xl">
                {config.cacheEnabled && (
                  <div className="p-3 rounded-xl bg-[#223049] border border-[#415a77] shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#415a77]/30 text-[#e0e1dd] border border-[#778da9]/40">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-[#e0e1dd]">
                        {cacheNode.name}
                      </div>
                      <div className="text-[11px] text-[#778da9] font-mono">
                        Hit Ratio:{' '}
                        <span className="text-emerald-300 font-semibold">
                          {cacheHitRatio}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    dbNode.health !== 'crashed'
                      ? 'bg-[#223049] border-[#415a77] shadow-sm'
                      : 'bg-rose-950/30 border-rose-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      dbNode.health !== 'crashed'
                        ? 'bg-[#415a77]/30 text-[#e0e1dd] border border-[#778da9]/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#e0e1dd]">
                        Database Cluster
                      </span>
                      <Badge
                        variant={dbNode.health !== 'crashed' ? 'emerald' : 'crimson'}
                        size="sm"
                      >
                        {dbNode.health !== 'crashed'
                          ? 'Primary + 2 Replicas'
                          : 'Outage'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-[#778da9] font-mono mt-0.5">
                      {dbNode.health !== 'crashed'
                        ? `Replication Lag: ${dbNode.replicationLagMs}ms`
                        : 'Connection Refused (ECONNREFUSED)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          )}
        </section>

        {/* Right Column: Telemetry HUD & Incident Feed (3 Cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-5">
          <Card
            title={
              <span className="flex items-center gap-2 text-[#e0e1dd]">
                <Cpu className="w-4 h-4 text-[#778da9]" />
                Cluster Telemetry HUD
              </span>
            }
            subtitle="P50 / P95 / P99 latency & error distribution"
            glow={clusterStatus === 'CRITICAL' ? 'crimson' : 'none'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#223049] border border-[#415a77]">
                  <div className="text-[11px] font-sans text-[#778da9] font-medium">
                    P99 Latency
                  </div>
                  <div
                    className={`text-lg font-mono font-bold mt-1 ${
                      metrics.latencies.p99 > 400
                        ? 'text-rose-300'
                        : metrics.latencies.p99 > 200
                        ? 'text-amber-300'
                        : 'text-[#e0e1dd]'
                    }`}
                  >
                    {metrics.latencies.p99}{' '}
                    <span className="text-xs text-[#778da9] font-normal">ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#223049] border border-[#415a77]">
                  <div className="text-[11px] font-sans text-[#778da9] font-medium">
                    Error Rate
                  </div>
                  <div
                    className={`text-lg font-mono font-bold mt-1 ${
                      metrics.errorRatePercentage > 10
                        ? 'text-rose-300'
                        : metrics.errorRatePercentage > 3
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {metrics.errorRatePercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Server Fleet Queue Saturation Meter */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-sans text-[#e0e1dd] flex justify-between font-medium">
                  <span>Queue Saturation</span>
                  <span className="font-mono text-[#e0e1dd]">
                    {Math.min(
                      100,
                      Math.round(
                        serverNodes.reduce((acc, s) => acc + s.queueDepth, 0) /
                          Math.max(1, activeServers * 1.5)
                      )
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-[#1b263b] rounded-full overflow-hidden border border-[#415a77]/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      clusterStatus === 'CRITICAL' || clusterStatus === 'COLLAPSED'
                        ? 'bg-rose-500'
                        : clusterStatus === 'DEGRADED'
                        ? 'bg-amber-500'
                        : 'bg-[#778da9]'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          Math.round(
                            serverNodes.reduce((acc, s) => acc + s.queueDepth, 0) /
                              Math.max(1, activeServers * 1.5)
                          )
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Incident Stream Feed */}
          <Card
            title={
              <span className="flex items-center gap-2 text-[#e0e1dd]">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Live Incident Stream
              </span>
            }
            subtitle="Automated health probe telemetry feed"
            className="flex-1"
          >
            <div className="space-y-2 font-mono text-[11px] max-h-64 overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-[#223049] border border-[#415a77] text-[#778da9]">
                  No incidents detected. Cluster operating nominally.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`p-2.5 rounded-lg border text-[#e0e1dd] flex items-start gap-2 ${
                      inc.severity === 'critical'
                        ? 'bg-rose-500/20 border-rose-500/40 animate-pulse text-rose-200'
                        : inc.severity === 'error'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                        : inc.severity === 'warn'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                        : 'bg-[#223049] border-[#415a77]'
                    }`}
                  >
                    <span
                      className={`font-bold ${
                        inc.severity === 'critical' || inc.severity === 'error'
                          ? 'text-rose-400'
                          : inc.severity === 'warn'
                          ? 'text-amber-300'
                          : 'text-[#778da9]'
                      }`}
                    >
                      [{inc.severity.toUpperCase()}]
                    </span>
                    <span>{inc.message}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>
      </main>

      {/* Real-time Status Footer */}
      <StatusBar
        status={clusterStatus}
        activeServers={activeServers}
        totalServers={totalServers}
        dbHealthy={dbNode.health !== 'crashed'}
        totalRequests={metrics.totalProcessed}
        errorRate={metrics.errorRatePercentage}
        avgLatency={metrics.latencies.avg || config.networkLatencyMs}
        uptimeSeconds={uptimeSeconds}
      />

      {/* 360 Consistent Hash Ring Modal */}
      <ConsistentHashRingModal
        isOpen={isHashRingOpen}
        onClose={() => setIsHashRingOpen(false)}
        activeServers={serverNodes.filter((s) => s.health !== 'crashed').map((s) => s.id)}
      />

      {/* Hystrix Circuit Breaker Modal */}
      <CircuitBreakerModal
        isOpen={isCircuitModalOpen}
        onClose={() => setIsCircuitModalOpen(false)}
        metrics={cbMetrics}
        config={cbConfig}
        enabled={config.circuitBreakerEnabled}
        onToggleEnabled={toggleCircuitBreaker}
        onUpdateConfig={updateCircuitBreakerConfig}
        onForceTrip={() => forceTripCircuit('server-1')}
        onForceReset={() => forceResetCircuit('server-1')}
      />

      {/* OpenTelemetry Trace Inspector Modal */}
      <TraceInspectorModal
        isOpen={isTraceModalOpen}
        onClose={closeTraceModal}
        trace={selectedTrace}
      />
    </div>
  );
};

export default App;
