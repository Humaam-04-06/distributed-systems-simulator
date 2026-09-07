import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
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
    <header className="bg-surface/90 border-b border-surface-border px-5 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-white font-sans">
              Distributed Systems Simulator
            </h1>
            <Badge variant="blue" size="sm" pulse>
              v1.0.0
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            High-Scale Architecture, Queuing & Failure Sandbox
          </p>
        </div>
      </div>

      {/* Center: Playback / Speed Engine Controls */}
      <div className="flex items-center gap-2 bg-surface-elevated/80 px-2.5 py-1 rounded-lg border border-surface-border">
        <Button
          size="sm"
          variant={isRunning ? 'secondary' : 'primary'}
          icon={isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          onClick={onToggleRunning}
        >
          {isRunning ? 'Pause' : 'Simulate'}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onReset}
          title="Reset Simulation State"
        >
          Reset
        </Button>

        <div className="h-4 w-px bg-surface-border mx-1" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono text-slate-500 mr-1">TICK:</span>
          {[0.5, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
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
          {chaosActive ? 'Chaos: Active' : 'Chaos Monkey'}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          icon={<Target className="w-3.5 h-3.5 text-amber-400" />}
          onClick={onOpenDrills}
          title="System Design Scenario Challenges"
        >
          Drills
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
          onClick={onExportReport}
          title="Export Incident Post-Mortem Report"
        >
          Post-Mortem
        </Button>
      </div>
    </header>
  );
};
