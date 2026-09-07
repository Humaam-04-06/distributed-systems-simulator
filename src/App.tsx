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
  Network,
  Database,
  Activity,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  // Simulator State Controls
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [rps, setRps] = useState<number>(250);
  const [latency, setLatency] = useState<number>(45);
  const [lossRate, setLossRate] = useState<number>(0);
  const [chaosActive, setChaosActive] = useState<boolean>(false);
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(true);
  const [circuitBreaker, setCircuitBreaker] = useState<boolean>(true);

  // Cluster Health Simulated Metrics
  const [activeServers, setActiveServers] = useState<number>(3);
  const totalServers = 3;
  const [dbHealthy, setDbHealthy] = useState<boolean>(true);
  const [totalRequests, setTotalRequests] = useState<number>(1420);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(34);

  // Dynamic status evaluation based on RPS & server count
  let clusterStatus: ClusterStatus = 'HEALTHY';
  let errorRate = 0.2;
  let dynamicLatency = latency;

  if (activeServers === 0 || !dbHealthy) {
    clusterStatus = 'COLLAPSED';
    errorRate = 98.5;
    dynamicLatency = 1200;
  } else if (rps >= 1000 || activeServers === 1) {
    clusterStatus = 'CRITICAL';
    errorRate = 28.4;
    dynamicLatency = latency * 6.5;
  } else if (rps >= 500 || activeServers === 2) {
    clusterStatus = 'DEGRADED';
    errorRate = 4.8;
    dynamicLatency = latency * 2.2;
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

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 cyber-grid">
      {/* Top Header */}
      <Header
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(!isRunning)}
        onReset={() => {
          setTotalRequests(0);
          setUptimeSeconds(0);
          setActiveServers(3);
          setDbHealthy(true);
          setRps(200);
        }}
        speed={speed}
        onSpeedChange={setSpeed}
        onOpenDrills={() => alert('Drills Modal will be loaded in Phase 10!')}
        onOpenChaos={() => setChaosActive(!chaosActive)}
        onExportReport={() => alert('Post-Mortem Export will be loaded in Phase 10!')}
        chaosActive={chaosActive}
      />

      {/* Main Workspace Frame: 3 Columns (Controls, Topology Canvas, Telemetry HUD) */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] w-full mx-auto">
        {/* Left Column: Control Console (3 Cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <Card
            title={
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Activity className="w-4 h-4" />
                Traffic & Ingress Generator
              </span>
            }
            subtitle="Simulate real-time client demand curves"
            glow="cyan"
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
                helpText="Slide past 1,000 for critical spike"
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
              />

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <Switch
                  label="Redis Distributed Cache"
                  description="Intercept read queries before DB"
                  checked={cacheEnabled}
                  onChange={setCacheEnabled}
                  variant="cyan"
                />

                <Switch
                  label="Circuit Breaker Pattern"
                  description="Fast-fail 503 on degraded servers"
                  checked={circuitBreaker}
                  onChange={setCircuitBreaker}
                  variant="amber"
                />
              </div>
            </div>
          </Card>

          {/* Fault Injection Console */}
          <Card
            title={
              <span className="flex items-center gap-1.5 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                Fault & Chaos Injection
              </span>
            }
            subtitle="Trigger node crashes & network partitions"
            glow={activeServers < 3 || !dbHealthy ? 'crimson' : 'none'}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((serverIdx) => {
                  const isAlive = activeServers >= serverIdx;
                  return (
                    <Button
                      key={serverIdx}
                      size="sm"
                      variant={isAlive ? 'secondary' : 'danger'}
                      onClick={() =>
                        setActiveServers((prev) =>
                          isAlive ? Math.max(0, prev - 1) : Math.min(3, prev + 1)
                        )
                      }
                    >
                      {isAlive ? `Kill S${serverIdx}` : `Revive S${serverIdx}`}
                    </Button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <Button
                  size="sm"
                  variant={dbHealthy ? 'outline' : 'danger'}
                  className="w-full"
                  onClick={() => setDbHealthy(!dbHealthy)}
                  icon={<Database className="w-3.5 h-3.5" />}
                >
                  {dbHealthy ? 'Inject Database Meltdown' : 'Restore Primary Database'}
                </Button>
              </div>
            </div>
          </Card>
        </aside>

        {/* Center Column: Interactive Topology Canvas (6 Cols) */}
        <section className="lg:col-span-6 flex flex-col gap-4">
          <Card
            className="flex-1 min-h-[500px] relative overflow-hidden"
            title={
              <span className="flex items-center gap-2 text-slate-200">
                <Network className="w-4 h-4 text-cyan-400" />
                System Architecture & Live Conduit Mesh
              </span>
            }
            headerAction={
              <div className="flex items-center gap-2">
                <Badge variant="cyan" size="sm">
                  Round Robin LB
                </Badge>
                <Badge variant={dbHealthy ? 'emerald' : 'crimson'} size="sm">
                  {dbHealthy ? 'DB Master Synced' : 'DB Offline'}
                </Badge>
              </div>
            }
          >
            {/* Center Architecture Visualization Preview Frame */}
            <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-between p-6 relative">
              {/* Layer 1: Ingress / Client Cluster */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 rounded-lg bg-slate-900/90 border border-cyan-500/50 shadow-glow-cyan text-center">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Client Ingress
                  </div>
                  <div className="text-lg font-mono font-black text-white">
                    {rps} <span className="text-xs text-slate-400 font-normal">req/s</span>
                  </div>
                </div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 relative">
                  <span className="absolute top-1/2 -left-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                </div>
              </div>

              {/* Layer 2: Load Balancer */}
              <div className="w-72 px-4 py-3 rounded-xl bg-slate-900/90 border border-blue-500/50 shadow-lg text-center relative group">
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-blue-400 uppercase">
                  <Layers className="w-4 h-4" />
                  Load Balancer
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Algorithm: Round Robin | Health Checks: Active
                </div>
              </div>

              {/* Fan-out connection lines */}
              <div className="w-full max-w-md h-8 flex justify-between items-center px-12 relative">
                <div className="w-full h-px bg-slate-700" />
              </div>

              {/* Layer 3: Server Worker Cluster */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
                {[1, 2, 3].map((serverIdx) => {
                  const isAlive = activeServers >= serverIdx;
                  return (
                    <div
                      key={serverIdx}
                      className={`p-3 rounded-lg border transition-all duration-300 flex flex-col items-center text-center ${
                        isAlive
                          ? 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/50 shadow-sm'
                          : 'bg-rose-950/20 border-rose-900/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Server
                          className={`w-3.5 h-3.5 ${
                            isAlive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        />
                        <span className="text-xs font-mono font-bold text-slate-200">
                          Server {serverIdx}
                        </span>
                      </div>
                      <Badge
                        variant={isAlive ? 'emerald' : 'crimson'}
                        size="sm"
                        pulse={isAlive}
                      >
                        {isAlive ? 'ONLINE' : 'DEAD'}
                      </Badge>
                      <div className="mt-2 text-[10px] font-mono text-slate-400 w-full flex justify-between">
                        <span>CPU:</span>
                        <span className={isAlive ? 'text-slate-200' : 'text-slate-600'}>
                          {isAlive ? `${Math.min(99, Math.floor(rps / 10))}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fan-in line */}
              <div className="w-full max-w-md h-8 flex justify-between items-center px-12 relative">
                <div className="w-full h-px bg-slate-700" />
              </div>

              {/* Layer 4: Cache & Database */}
              <div className="flex items-center gap-6">
                {cacheEnabled && (
                  <div className="px-4 py-2.5 rounded-lg bg-slate-900/90 border border-pink-500/40 shadow-sm text-center">
                    <div className="text-[10px] font-mono text-pink-400 font-bold uppercase">
                      Redis Cache
                    </div>
                    <div className="text-xs font-mono text-slate-200">
                      Hit Ratio: 87.4%
                    </div>
                  </div>
                )}

                <div
                  className={`px-5 py-3 rounded-xl border text-center transition-all duration-300 ${
                    dbHealthy
                      ? 'bg-slate-900/90 border-purple-500/50 shadow-glow-violet'
                      : 'bg-rose-950/30 border-rose-800 shadow-glow-crimson'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase text-purple-400">
                    <Database className="w-4 h-4" />
                    Database Cluster
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Primary + 2 Read Replicas
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Right Column: Real-time Telemetry HUD & Incident Feed (3 Cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <Card
            title={
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Cpu className="w-4 h-4" />
                Cluster Telemetry HUD
              </span>
            }
            subtitle="P50 / P95 / P99 latency & error distribution"
            glow={clusterStatus === 'CRITICAL' ? 'crimson' : 'none'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    P99 Latency
                  </div>
                  <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                    {dynamicLatency.toFixed(0)} ms
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Error Rate
                  </div>
                  <div
                    className={`text-base font-mono font-bold mt-0.5 ${
                      errorRate > 10 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {errorRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 flex justify-between">
                  <span>Server Queue Saturation</span>
                  <span className="font-bold text-slate-200">
                    {Math.min(100, Math.floor((rps / 1000) * 85))}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rps >= 1000
                        ? 'bg-rose-500 shadow-glow-crimson'
                        : rps >= 500
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.floor((rps / 1000) * 85))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Incident Feed */}
          <Card
            title={
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-4 h-4" />
                Live Incident Stream
              </span>
            }
            subtitle="Automated fault detection events"
            className="flex-1"
          >
            <div className="space-y-2 font-mono text-[11px] max-h-56 overflow-y-auto pr-1">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                <span className="text-cyan-400 font-bold">[INFO]</span> Cluster initialized
                with 3 worker nodes.
              </div>
              {rps >= 500 && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-800/60 text-amber-300 animate-pulse">
                  <span className="text-amber-400 font-bold">[WARN]</span> Queue depth
                  exceeded 75% on Server 1.
                </div>
              )}
              {rps >= 1000 && (
                <div className="p-2 rounded bg-rose-950/30 border border-rose-800/60 text-rose-300 animate-pulse">
                  <span className="text-rose-400 font-bold">[ALERT]</span> Ingress spike:
                  1,000+ RPS threshold reached 💀
                </div>
              )}
              {activeServers < 3 && (
                <div className="p-2 rounded bg-rose-950/30 border border-rose-800/60 text-rose-300">
                  <span className="text-rose-400 font-bold">[FAIL]</span> Server node offline!
                  LB redistributing traffic.
                </div>
              )}
              {!dbHealthy && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-600 text-rose-200 animate-pulse">
                  <span className="text-rose-400 font-bold">[CRITICAL]</span> Database
                  unreachable! Promoting replica.
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
