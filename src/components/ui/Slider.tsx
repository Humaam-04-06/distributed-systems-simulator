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
        <span className="font-medium text-slate-300 font-sans flex items-center gap-1.5">
          {label}
          {isDanger && (
            <span className="text-rose-400 font-mono font-semibold text-[10px] px-1.5 py-0.2 bg-rose-500/10 border border-rose-500/30 rounded">
              CRITICAL 💀
            </span>
          )}
          {isWarning && (
            <span className="text-amber-400 font-mono font-semibold text-[10px] px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 rounded">
              HIGH LOAD
            </span>
          )}
        </span>
        <span
          className={cn(
            'font-mono font-semibold px-2 py-0.5 rounded text-xs transition-colors duration-150',
            isDanger
              ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
              : isWarning
              ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
              : 'text-slate-100 bg-surface-elevated border border-surface-border'
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
          className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          style={{
            background: `linear-gradient(to right, ${
              isDanger
                ? '#f43f5e'
                : isWarning
                ? '#f59e0b'
                : '#3b82f6'
            } 0%, ${
              isDanger
                ? '#f43f5e'
                : isWarning
                ? '#f59e0b'
                : '#3b82f6'
            } ${percentage}%, #1e2436 ${percentage}%, #1e2436 100%)`,
          }}
        />
      </div>

      {helpText && (
        <div className="text-[11px] text-slate-500 font-sans flex justify-between">
          <span>{helpText}</span>
          <span className="font-mono">
            {min} - {max} {unit}
          </span>
        </div>
      )}
    </div>
  );
};
