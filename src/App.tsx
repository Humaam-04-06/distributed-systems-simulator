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
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans modern-grid">
      {/* Top Enterprise Header */}
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
              <span className="flex items-center gap-2 text-slate-200">
                <Activity className="w-4 h-4 text-blue-500" />
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
              <div className="pt-3 border-t border-surface-border">
                <label className="text-xs font-sans font-medium text-slate-300 block mb-2">
                  Load Balancing Algorithm
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-elevated rounded-lg border border-surface-border">
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
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {algo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resilience Toggles */}
              <div className="pt-3 border-t border-surface-border space-y-2">
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
              <span className="flex items-center gap-2 text-slate-200">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Fault Injection Console
              </span>
            }
            subtitle="Trigger server crashes & partition events"
            glow={activeServers < 3 || !dbHealthy ? 'crimson' : 'none'}
          >
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-sans mb-1">
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

              <div className="pt-2 border-t border-surface-border">
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

        {/* Center Column: Interactive Architecture Topology Canvas (6 Cols) */}
        <section className="lg:col-span-6 flex flex-col gap-5">
          <Card
            className="flex-1 min-h-[580px] relative overflow-hidden"
            title={
              <span className="flex items-center gap-2 text-slate-200">
                <Network className="w-4 h-4 text-blue-400" />
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
                <defs>
                  <linearGradient id="streamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Ingress to LB conduit */}
                <line
                  x1="50%"
                  y1="75"
                  x2="50%"
                  y2="135"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className={isRunning ? 'animate-flow-dash' : ''}
                />

                {/* LB to Server 1 conduit */}
                <path
                  d="M 50% 195 C 50% 230, 20% 230, 20% 265"
                  fill="none"
                  stroke={serverStates[0] ? '#3b82f6' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[0] ? 'animate-flow-dash' : ''}
                  opacity={serverStates[0] ? 0.7 : 0.2}
                />

                {/* LB to Server 2 conduit */}
                <line
                  x1="50%"
                  y1="195"
                  x2="50%"
                  y2="265"
                  stroke={serverStates[1] ? '#3b82f6' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[1] ? 'animate-flow-dash' : ''}
                  opacity={serverStates[1] ? 0.7 : 0.2}
                />

                {/* LB to Server 3 conduit */}
                <path
                  d="M 50% 195 C 50% 230, 80% 230, 80% 265"
                  fill="none"
                  stroke={serverStates[2] ? '#3b82f6' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[2] ? 'animate-flow-dash' : ''}
                  opacity={serverStates[2] ? 0.7 : 0.2}
                />

                {/* Servers to Database/Cache conduit */}
                <path
                  d="M 20% 365 C 20% 410, 50% 410, 50% 435"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[0] ? 'animate-flow-dash' : ''}
                />
                <line
                  x1="50%"
                  y1="365"
                  x2="50%"
                  y2="435"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[1] ? 'animate-flow-dash' : ''}
                />
                <path
                  d="M 80% 365 C 80% 410, 50% 410, 50% 435"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={isRunning && serverStates[2] ? 'animate-flow-dash' : ''}
                />
              </svg>

              {/* Node Layer 1: Client Traffic Ingress */}
              <div className="relative z-10">
                <div className="px-5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border shadow-sm text-center flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <div className="text-[11px] font-sans text-slate-400 font-medium uppercase tracking-wider">
                      Client Ingress
                    </div>
                    <div className="text-base font-mono font-bold text-white">
                      {rps}{' '}
                      <span className="text-xs font-normal text-slate-400">req/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Node Layer 2: Load Balancer */}
              <div className="relative z-10 w-full max-w-sm">
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-blue-500/30 shadow-card text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wide">
                    <Layers className="w-4 h-4" />
                    Application Load Balancer
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-1 flex items-center justify-center gap-3">
                    <span>Algorithm: <strong className="text-slate-200 capitalize">{lbAlgorithm.replace('-', ' ')}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
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
                          ? 'bg-surface-elevated border-surface-border hover:border-blue-500/40 shadow-sm'
                          : 'bg-rose-950/20 border-rose-900/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-1.5">
                          <Server
                            className={`w-3.5 h-3.5 ${
                              isAlive ? 'text-blue-400' : 'text-rose-400'
                            }`}
                          />
                          <span className="text-xs font-mono font-semibold text-slate-200">
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
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Load:</span>
                          <span
                            className={
                              serverLoad > 85
                                ? 'text-rose-400 font-bold'
                                : serverLoad > 60
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }
                          >
                            {serverLoad}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              serverLoad > 85
                                ? 'bg-rose-500'
                                : serverLoad > 60
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${serverLoad}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => toggleServer(idx)}
                        className={`mt-2 text-[10px] font-sans font-medium px-2 py-1 rounded transition-colors w-full ${
                          isAlive
                            ? 'bg-surface hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-surface-border'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
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
                  <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-200">
                        Redis Cache
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Hit Ratio: <span className="text-pink-400 font-semibold">89.2%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    dbHealthy
                      ? 'bg-surface-elevated border-surface-border shadow-sm'
                      : 'bg-rose-950/30 border-rose-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      dbHealthy
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        Database Cluster
                      </span>
                      <Badge variant={dbHealthy ? 'emerald' : 'crimson'} size="sm">
                        {dbHealthy ? 'Primary + 2 Replicas' : 'Outage'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
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
              <span className="flex items-center gap-2 text-slate-200">
                <Cpu className="w-4 h-4 text-blue-500" />
                Cluster Telemetry HUD
              </span>
            }
            subtitle="P50 / P95 / P99 latency & error distribution"
            glow={clusterStatus === 'CRITICAL' ? 'crimson' : 'none'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border">
                  <div className="text-[11px] font-sans text-slate-400 font-medium">
                    P99 Latency
                  </div>
                  <div
                    className={`text-lg font-mono font-bold mt-1 ${
                      dynamicLatency > 400
                        ? 'text-rose-400'
                        : dynamicLatency > 200
                        ? 'text-amber-400'
                        : 'text-slate-100'
                    }`}
                  >
                    {dynamicLatency.toFixed(0)}{' '}
                    <span className="text-xs text-slate-400 font-normal">ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border">
                  <div className="text-[11px] font-sans text-slate-400 font-medium">
                    Error Rate
                  </div>
                  <div
                    className={`text-lg font-mono font-bold mt-1 ${
                      errorRate > 10
                        ? 'text-rose-400'
                        : errorRate > 3
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {errorRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Server Fleet Queue Saturation Meter */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-sans text-slate-300 flex justify-between font-medium">
                  <span>Queue Saturation</span>
                  <span className="font-mono text-slate-200">
                    {Math.min(100, Math.floor((rps / 1000) * 85))}%
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-surface-border">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rps >= 1000
                        ? 'bg-rose-500'
                        : rps >= 500
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
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
              <span className="flex items-center gap-2 text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Live Incident Stream
              </span>
            }
            subtitle="Automated health probe telemetry feed"
            className="flex-1"
          >
            <div className="space-y-2 font-mono text-[11px] max-h-64 overflow-y-auto pr-1">
              <div className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 flex items-start gap-2">
                <span className="text-blue-400 font-bold">[INFO]</span>
                <span>Load Balancer active with {activeServers} healthy backends.</span>
              </div>
              {rps >= 500 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">[WARN]</span>
                  <span>Ingress queue congestion detected (&gt;500 RPS).</span>
                </div>
              )}
              {rps >= 1000 && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2 animate-pulse">
                  <span className="text-rose-400 font-bold">[ALERT]</span>
                  <span>Critical spike! 1,000+ RPS reached 💀.</span>
                </div>
              )}
              {activeServers < 3 && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
                  <span className="text-rose-400 font-bold">[FAIL]</span>
                  <span>Worker node health check failed. Ejected from pool.</span>
                </div>
              )}
              {!dbHealthy && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start gap-2 animate-pulse">
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
