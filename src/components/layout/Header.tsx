import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Target,
  FileText,
  Radio,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface HeaderProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onOpenDrills: () => void;
  onOpenChaos: () => void;
  onExportReport: () => void;
  chaosActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleRunning,
  onReset,
  speed,
  onSpeedChange,
  onOpenDrills,
  onOpenChaos,
  onExportReport,
  chaosActive = false,
}) => {
  return (
    <header className="glass-panel border-b border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-glow-cyan">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold font-mono tracking-tight text-white uppercase">
              Distributed Systems Simulator
            </h1>
            <Badge variant="cyan" size="sm" pulse>
              Live v1.0
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            High-Scale Architecture, Queuing & Failure Sandbox
          </p>
        </div>
      </div>

      {/* Center: Playback / Speed Engine Controls */}
      <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
        <Button
          size="sm"
          variant={isRunning ? 'secondary' : 'primary'}
          icon={isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          onClick={onToggleRunning}
        >
          {isRunning ? 'PAUSE' : 'SIMULATE'}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onReset}
          title="Reset Simulation State"
        >
          RESET
        </Button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono text-slate-500 mr-1">TICK:</span>
          {[0.5, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                speed === s
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Quick Action Modals (Chaos, Drills, Report) */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={chaosActive ? 'danger' : 'outline'}
          icon={<Radio className="w-3.5 h-3.5" />}
          onClick={onOpenChaos}
          title="Toggle Chaos Engineering Monkey"
        >
          {chaosActive ? 'CHAOS: ACTIVE' : 'CHAOS MONKEY'}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          icon={<Target className="w-3.5 h-3.5 text-amber-400" />}
          onClick={onOpenDrills}
          title="System Design Scenario Challenges"
        >
          DRILLS
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={onExportReport}
          title="Export Incident Post-Mortem Report"
        >
          POST-MORTEM
        </Button>
      </div>
    </header>
  );
};
