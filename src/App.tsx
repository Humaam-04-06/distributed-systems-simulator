import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { StatusBar, ClusterStatus } from './components/layout/StatusBar';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { Slider } from './components/ui/Slider';
import { Switch } from './components/ui/Switch';
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
} from 'lucide-react';

export const App: React.FC = () => {
  // Simulator State Controls
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [rps, setRps] = useState<number>(250);
  const [latency, setLatency] = useState<number>(45);
  const [lossRate, setLossRate] = useState<number>(0);
  const [lbAlgorithm, setLbAlgorithm] = useState<'round-robin' | 'least-conn' | 'consistent-hash'>('round-robin');
  const [chaosActive, setChaosActive] = useState<boolean>(false);
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(true);
  const [circuitBreaker, setCircuitBreaker] = useState<boolean>(true);

  // Cluster State
  const [serverStates, setServerStates] = useState<boolean[]>([true, true, true]);
  const [dbHealthy, setDbHealthy] = useState<boolean>(true);
  const [totalRequests, setTotalRequests] = useState<number>(2480);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(48);

  const activeServers = serverStates.filter(Boolean).length;
  const totalServers = serverStates.length;

  // Dynamic status evaluation based on RPS & server health
  let clusterStatus: ClusterStatus = 'HEALTHY';
  let errorRate = 0.1;
  let dynamicLatency = latency;

  if (activeServers === 0 || !dbHealthy) {
    clusterStatus = 'COLLAPSED';
    errorRate = 99.2;
    dynamicLatency = 1500;
  } else if (rps >= 1000 || activeServers === 1) {
    clusterStatus = 'CRITICAL';
    errorRate = 26.5;
    dynamicLatency = latency * 5.2;
  } else if (rps >= 500 || activeServers === 2) {
    clusterStatus = 'DEGRADED';
    errorRate = 4.2;
    dynamicLatency = latency * 1.9;
  }

  // Ticking effect when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
      setTotalRequests((prev) => prev + Math.floor(rps * 0.1 * speed));
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, rps, speed]);

  const toggleServer = (index: number) => {
    setServerStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-[#e0e1dd] flex flex-col font-sans modern-grid selection:bg-[#415a77] selection:text-[#e0e1dd]">
      {/* Top Header */}
      <Header
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(!isRunning)}
        onReset={() => {
          setTotalRequests(0);
          setUptimeSeconds(0);
          setServerStates([true, true, true]);
          setDbHealthy(true);
          setRps(200);
        }}
        speed={speed}
        onSpeedChange={setSpeed}
        onOpenDrills={() => alert('Drills Scenario Modal will be implemented in upcoming phase!')}
        onOpenChaos={() => setChaosActive(!chaosActive)}
        onExportReport={() => alert('Post-Mortem Export will be implemented in upcoming phase!')}
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
            subtitle="Configure client ingress load and network physics"
          >
            <div className="space-y-4">
              <Slider
                label="Requests / Second"
                value={rps}
                min={10}
                max={2000}
                step={25}
                unit="RPS"
                onChange={setRps}
                warningThreshold={500}
                dangerThreshold={1000}
                helpText="Threshold > 1,000 simulates traffic spike 💀"
              />

              <Slider
                label="Network Link Latency"
                value={latency}
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
                value={lossRate}
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
                <label className="text-xs font-sans font-medium text-[#e0e1dd] block mb-2">
                  Load Balancing Algorithm
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#223049] rounded-lg border border-[#415a77]">
                  {[
                    { id: 'round-robin', label: 'Round Robin' },
                    { id: 'least-conn', label: 'Least Conn' },
                    { id: 'consistent-hash', label: 'Hash Ring' },
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => setLbAlgorithm(algo.id as any)}
                      className={`text-[11px] font-sans py-1.5 rounded transition-all font-medium ${
                        lbAlgorithm === algo.id
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
                  checked={cacheEnabled}
                  onChange={setCacheEnabled}
                  variant="blue"
                />

                <Switch
                  label="Circuit Breaker Pattern"
                  description="Fast-fail 503 on failing instances"
                  checked={circuitBreaker}
                  onChange={setCircuitBreaker}
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
            glow={activeServers < 3 || !dbHealthy ? 'crimson' : 'none'}
          >
            <div className="space-y-3">
              <div className="text-xs text-[#778da9] font-sans mb-1">
                Toggle Worker Server Availability:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {serverStates.map((isAlive, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant={isAlive ? 'secondary' : 'danger'}
                    onClick={() => toggleServer(idx)}
                    className="text-xs font-mono"
                  >
                    {isAlive ? `Kill S${idx + 1}` : `Revive S${idx + 1}`}
                  </Button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#415a77]/60">
                <Button
                  size="sm"
                  variant={dbHealthy ? 'outline' : 'danger'}
                  className="w-full"
                  onClick={() => setDbHealthy(!dbHealthy)}
                  icon={<Database className="w-3.5 h-3.5" />}
                >
                  {dbHealthy ? 'Simulate Primary DB Outage' : 'Restore Primary Database'}
                </Button>
              </div>
            </div>
          </Card>
        </aside>

        {/* Center Column: Architecture Topology Canvas (6 Cols) */}
        <section className="lg:col-span-6 flex flex-col gap-5">
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
                  {lbAlgorithm.toUpperCase()}
                </Badge>
                <Badge variant={dbHealthy ? 'emerald' : 'crimson'} size="sm">
                  {dbHealthy ? 'DB Cluster Synced' : 'DB Primary Down'}
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
                  stroke={serverStates[0] ? '#778da9' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[0] ? 'animate-flow-dash' : ''}
                  opacity={serverStates[0] ? 0.8 : 0.3}
                />

                {/* LB to Server 2 conduit */}
                <line
                  x1="50%"
                  y1="195"
                  x2="50%"
                  y2="265"
                  stroke={serverStates[1] ? '#778da9' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[1] ? 'animate-flow-dash' : ''}
                  opacity={serverStates[1] ? 0.8 : 0.3}
                />

                {/* LB to Server 3 conduit */}
                <path
                  d="M 50% 195 C 50% 230, 80% 230, 80% 265"
                  fill="none"
                  stroke={serverStates[2] ? '#778da9' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[2] ? 'animate-flow-dash' : ''}
                  opacity={serverStates[2] ? 0.8 : 0.3}
                />

                {/* Servers to Database/Cache conduit */}
                <path
                  d="M 20% 365 C 20% 410, 50% 410, 50% 435"
                  fill="none"
                  stroke="#415a77"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[0] ? 'animate-flow-dash' : ''}
                />
                <line
                  x1="50%"
                  y1="365"
                  x2="50%"
                  y2="435"
                  stroke="#415a77"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[1] ? 'animate-flow-dash' : ''}
                />
                <path
                  d="M 80% 365 C 80% 410, 50% 410, 50% 435"
                  fill="none"
                  stroke="#415a77"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[2] ? 'animate-flow-dash' : ''}
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
                      {rps}{' '}
                      <span className="text-xs font-normal text-[#778da9]">req/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Node Layer 2: Load Balancer */}
              <div className="relative z-10 w-full max-w-sm">
                <div className="p-3.5 rounded-xl bg-[#223049] border border-[#415a77] shadow-card text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#e0e1dd] uppercase tracking-wide">
                    <Layers className="w-4 h-4 text-[#778da9]" />
                    Application Load Balancer
                  </div>
                  <div className="text-[11px] text-[#778da9] font-sans mt-1 flex items-center justify-center gap-3">
                    <span>Algorithm: <strong className="text-[#e0e1dd] capitalize">{lbAlgorithm.replace('-', ' ')}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active Probing
                    </span>
                  </div>
                </div>
              </div>

              {/* Node Layer 3: Server Worker Fleet */}
              <div className="relative z-10 grid grid-cols-3 gap-4 w-full max-w-2xl px-2">
                {serverStates.map((isAlive, idx) => {
                  const serverLoad = isAlive
                    ? Math.min(99, Math.floor((rps / (activeServers || 1)) / 4.5))
                    : 0;

                  return (
                    <div
                      key={idx}
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
                {cacheEnabled && (
                  <div className="p-3 rounded-xl bg-[#223049] border border-[#415a77] shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#415a77]/30 text-[#e0e1dd] border border-[#778da9]/40">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-[#e0e1dd]">
                        Redis Cache
                      </div>
                      <div className="text-[11px] text-[#778da9] font-mono">
                        Hit Ratio: <span className="text-emerald-300 font-semibold">89.2%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    dbHealthy
                      ? 'bg-[#223049] border-[#415a77] shadow-sm'
                      : 'bg-rose-950/30 border-rose-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      dbHealthy
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
                      <Badge variant={dbHealthy ? 'emerald' : 'crimson'} size="sm">
                        {dbHealthy ? 'Primary + 2 Replicas' : 'Outage'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-[#778da9] font-mono mt-0.5">
                      {dbHealthy ? 'Replication Lag: 1.8ms' : 'Connection Refused (ECONNREFUSED)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
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
                      dynamicLatency > 400
                        ? 'text-rose-300'
                        : dynamicLatency > 200
                        ? 'text-amber-300'
                        : 'text-[#e0e1dd]'
                    }`}
                  >
                    {dynamicLatency.toFixed(0)}{' '}
                    <span className="text-xs text-[#778da9] font-normal">ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#223049] border border-[#415a77]">
                  <div className="text-[11px] font-sans text-[#778da9] font-medium">
                    Error Rate
                  </div>
                  <div
                    className={`text-lg font-mono font-bold mt-1 ${
                      errorRate > 10
                        ? 'text-rose-300'
                        : errorRate > 3
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {errorRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Server Fleet Queue Saturation Meter */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-sans text-[#e0e1dd] flex justify-between font-medium">
                  <span>Queue Saturation</span>
                  <span className="font-mono text-[#e0e1dd]">
                    {Math.min(100, Math.floor((rps / 1000) * 85))}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#1b263b] rounded-full overflow-hidden border border-[#415a77]/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rps >= 1000
                        ? 'bg-rose-500'
                        : rps >= 500
                        ? 'bg-amber-500'
                        : 'bg-[#778da9]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.floor((rps / 1000) * 85))}%`,
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
              <div className="p-2.5 rounded-lg bg-[#223049] border border-[#415a77] text-[#e0e1dd] flex items-start gap-2">
                <span className="text-[#778da9] font-bold">[INFO]</span>
                <span>Load Balancer active with {activeServers} healthy backends.</span>
              </div>
              {rps >= 500 && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">[WARN]</span>
                  <span>Ingress queue congestion detected (&gt;500 RPS).</span>
                </div>
              )}
              {rps >= 1000 && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-2 animate-pulse">
                  <span className="text-rose-400 font-bold">[ALERT]</span>
                  <span>Critical spike! 1,000+ RPS reached 💀.</span>
                </div>
              )}
              {activeServers < 3 && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-2">
                  <span className="text-rose-400 font-bold">[FAIL]</span>
                  <span>Worker node health check failed. Ejected from pool.</span>
                </div>
              )}
              {!dbHealthy && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-start gap-2 animate-pulse">
                  <span className="text-rose-400 font-bold">[PANIC]</span>
                  <span>Primary database unreachable! Read-only failover.</span>
                </div>
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
        dbHealthy={dbHealthy}
        totalRequests={totalRequests}
        errorRate={errorRate}
        avgLatency={dynamicLatency}
        uptimeSeconds={uptimeSeconds}
      />
    </div>
  );
};

export default App;
