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
    <header className="bg-[#1b263b] border-b border-[#415a77]/70 px-5 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#415a77]/30 border border-[#778da9]/40 text-[#e0e1dd]">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-[#e0e1dd] font-sans">
              Distributed Systems Simulator
            </h1>
            <Badge variant="blue" size="sm" pulse>
              v1.0.0
            </Badge>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Phase 12: Interview Sandbox
            </span>
          </div>
          <p className="text-[11px] text-[#778da9] font-sans">
            High-Scale Architecture, Queuing & Failure Sandbox
          </p>
        </div>
      </div>

      {/* Center: Playback / Speed Engine Controls */}
      <div className="flex items-center gap-2 bg-[#223049] px-2.5 py-1 rounded-lg border border-[#415a77]/60">
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

        <div className="h-4 w-px bg-[#415a77] mx-1" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono text-[#778da9] mr-1">TICK:</span>
          {[0.5, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                speed === s
                  ? 'bg-[#415a77] text-[#e0e1dd] font-medium shadow-sm'
                  : 'text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#1b263b]'
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
          icon={<FileText className="w-3.5 h-3.5 text-[#778da9]" />}
          onClick={onExportReport}
          title="Export Incident Post-Mortem Report"
        >
          Post-Mortem
        </Button>
      </div>
    </header>
  );
};
