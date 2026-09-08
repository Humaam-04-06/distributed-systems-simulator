import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  AlertTriangle,
  Clock,
  HardDrive,
  Flame,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import { ScenarioSimulatorFactory } from '../../engine/scenarios/simulators/ScenarioSimulatorFactory';
import { ScenarioSimulationStats, ScenarioSimulationEvent } from '../../engine/scenarios/simulators/ScenarioSimulatorTypes';

interface ScenarioSimulationWidgetProps {
  scenarioId: ScenarioId;
}

export const ScenarioSimulationWidget: React.FC<ScenarioSimulationWidgetProps> = ({
  scenarioId,
}) => {
  const simulator = ScenarioSimulatorFactory.getSimulator(scenarioId);

  const [isRunning, setIsRunning] = useState(simulator.isRunning());
  const [stats, setStats] = useState<ScenarioSimulationStats>(simulator.getStats());
  const [events, setEvents] = useState<ScenarioSimulationEvent[]>(simulator.getEvents(6));
  const [loadMultiplier, setLoadMultiplier] = useState(1.0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (simulator.isRunning()) {
        simulator.step(250);
        setStats(simulator.getStats());
        setEvents(simulator.getEvents(6));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [simulator]);

  const handleToggleRun = () => {
    if (isRunning) {
      simulator.stop();
      setIsRunning(false);
    } else {
      simulator.start();
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    simulator.reset();
    setStats(simulator.getStats());
    setEvents(simulator.getEvents(6));
    setLoadMultiplier(1.0);
  };

  const handleLoadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLoadMultiplier(val);
    simulator.injectLoadMultiplier(val);
  };

  const handleTriggerAnomaly = (type: string) => {
    simulator.injectAnomaly(type);
    setStats(simulator.getStats());
    setEvents(simulator.getEvents(6));
  };

  const getAnomalyButtons = () => {
    switch (scenarioId) {
      case 'twitter-feed':
        return [
          { id: 'celebrity-storm', label: 'Celebrity Storm (>1M Fans)' },
          { id: 'redis-node-failover', label: 'Redis Shard Crash' },
        ];
      case 'uber-ride-matching':
        return [
          { id: 'stadium-surge', label: 'Stadium Concert Surge' },
          { id: 'geohash-partition', label: 'Geospatial Partition' },
        ];
      case 'black-friday-sale':
        return [
          { id: 'botnet-ddos', label: 'Botnet Scraping Storm' },
          { id: 'redlock-timeout', label: 'Distributed Lock Timeout' },
        ];
      case 'netflix-streaming':
        return [
          { id: 'cdn-cache-eviction', label: 'CDN POP Eviction' },
          { id: 'transcoding-stall', label: 'Transcoder Stall' },
        ];
      case 'url-shortener':
        return [
          { id: 'cache-stampede', label: 'Cache Stampede' },
          { id: 'bloom-filter-saturation', label: 'Bloom Bit Saturation' },
        ];
      case 'whatsapp-chat':
        return [
          { id: 'gateway-fd-exhaustion', label: 'Socket FD Exhaustion' },
          { id: 'cassandra-compaction-lag', label: 'Cassandra Compaction Lag' },
        ];
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#1b263b] border border-[#415a77]/80 shadow-2xl p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#415a77]/60 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#e0e1dd]">
              Live Domain Workload Simulator
            </h4>
            <div className="text-[11px] text-[#778da9]">
              Active Engine: <span className="text-cyan-300 font-mono">{scenarioId}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRun}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause Traffic' : 'Simulate Traffic'}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-[#0d1b2a] hover:bg-[#415a77] text-[#778da9] hover:text-[#e0e1dd] transition-all cursor-pointer border border-[#415a77]/60"
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="text-[10px] text-[#778da9] uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Throughput QPS
          </div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {stats.currentQps.toLocaleString()}
          </div>
          <div className="text-[9px] text-[#778da9]">Peak: {stats.peakQps.toLocaleString()}</div>
        </div>

        <div className="p-3 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="text-[10px] text-[#778da9] uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            P99 Latency
          </div>
          <div
            className={`text-lg font-bold mt-1 ${
              stats.p99LatencyMs <= 50
                ? 'text-emerald-400'
                : stats.p99LatencyMs <= 100
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {stats.p99LatencyMs} ms
          </div>
          <div className="text-[9px] text-[#778da9]">Avg: {stats.avgLatencyMs} ms</div>
        </div>

        <div className="p-3 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="text-[10px] text-[#778da9] uppercase flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            Cache / Match
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {(stats.cacheHitRatio * 100).toFixed(1)}%
          </div>
          <div className="text-[9px] text-[#778da9]">Efficiency Rate</div>
        </div>

        <div className="p-3 rounded-xl bg-[#0d1b2a] border border-[#415a77]/40">
          <div className="text-[10px] text-[#778da9] uppercase flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" />
            Saturation
          </div>
          <div className="text-lg font-bold text-[#e0e1dd] mt-1">
            {stats.resourceSaturationPercent}%
          </div>
          <div className="text-[9px] text-[#778da9]">Queue: {stats.queueDepth}</div>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className="p-2.5 rounded-xl bg-[#0d1b2a] border border-[#415a77]/60 text-xs font-mono text-cyan-300 truncate">
        📊 {stats.statusSummary}
      </div>

      {/* Traffic Scaling Slider & Chaos Injection */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-[#415a77]/60 items-center">
        <div className="md:col-span-5 flex items-center gap-3">
          <span className="text-xs font-semibold text-[#778da9] whitespace-nowrap">
            Load Multiplier:
          </span>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.5"
            value={loadMultiplier}
            onChange={handleLoadChange}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-cyan-400 min-w-[32px]">
            {loadMultiplier}x
          </span>
        </div>

        <div className="md:col-span-7 flex items-center justify-end gap-2 flex-wrap">
          <span className="text-[11px] text-[#778da9] flex items-center gap-1 mr-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Inject Anomaly:
          </span>
          {getAnomalyButtons().map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleTriggerAnomaly(btn.id)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/50 transition-all cursor-pointer"
            >
              ⚡ {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rolling Event Log */}
      {events.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-[#415a77]/60">
          <div className="text-[10px] uppercase font-mono text-[#778da9] tracking-wider mb-1">
            Real-Time Engine Telemetry
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-[#0d1b2a]/80 border border-[#415a77]/30"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      ev.severity === 'error'
                        ? 'bg-rose-500'
                        : ev.severity === 'warn'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-[#e0e1dd] truncate">{ev.message}</span>
                </div>
                <span className="text-[#778da9] text-[10px] ml-2 flex-shrink-0">
                  +{ev.latencyMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
