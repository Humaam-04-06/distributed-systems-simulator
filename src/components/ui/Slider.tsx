import React from 'react';
import { cn } from '../../utils/cn';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  dangerThreshold?: number;
  warningThreshold?: number;
  helpText?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  dangerThreshold,
  warningThreshold,
  helpText,
  className,
}) => {
  const isDanger = dangerThreshold !== undefined && value >= dangerThreshold;
  const isWarning =
    !isDanger && warningThreshold !== undefined && value >= warningThreshold;

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300 font-mono flex items-center gap-1.5">
          {label}
          {isDanger && (
            <span className="text-rose-400 font-bold animate-pulse text-[10px] px-1 py-0.2 bg-rose-950/60 border border-rose-800/80 rounded">
              CRITICAL 💀
            </span>
          )}
          {isWarning && (
            <span className="text-amber-400 font-bold text-[10px] px-1 py-0.2 bg-amber-950/60 border border-amber-800/80 rounded">
              HIGH LOAD ⚠️
            </span>
          )}
        </span>
        <span
          className={cn(
            'font-mono font-bold px-2 py-0.5 rounded text-xs transition-colors duration-200',
            isDanger
              ? 'text-rose-400 bg-rose-950/50 border border-rose-800/60'
              : isWarning
              ? 'text-amber-400 bg-amber-950/50 border border-amber-800/60'
              : 'text-cyan-400 bg-cyan-950/50 border border-cyan-800/60'
          )}
        >
          {value.toLocaleString()} {unit}
        </span>
      </div>

      <div className="relative py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          style={{
            background: `linear-gradient(to right, ${
              isDanger
                ? '#ef4444'
                : isWarning
                ? '#f59e0b'
                : '#06b6d4'
            } 0%, ${
              isDanger
                ? '#ef4444'
                : isWarning
                ? '#f59e0b'
                : '#06b6d4'
            } ${percentage}%, #1e293b ${percentage}%, #1e293b 100%)`,
          }}
        />
      </div>

      {helpText && (
        <div className="text-[11px] text-slate-500 font-mono flex justify-between">
          <span>{helpText}</span>
          <span>
            {min} - {max} {unit}
          </span>
        </div>
      )}
    </div>
  );
};
