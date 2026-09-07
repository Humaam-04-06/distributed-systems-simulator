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
        <span className="font-medium text-[#e0e1dd] font-sans flex items-center gap-1.5">
          {label}
          {isDanger && (
            <span className="text-rose-300 font-mono font-semibold text-[10px] px-1.5 py-0.2 bg-rose-500/15 border border-rose-500/40 rounded">
              CRITICAL 💀
            </span>
          )}
          {isWarning && (
            <span className="text-amber-300 font-mono font-semibold text-[10px] px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/40 rounded">
              HIGH LOAD
            </span>
          )}
        </span>
        <span
          className={cn(
            'font-mono font-semibold px-2 py-0.5 rounded text-xs transition-colors duration-150',
            isDanger
              ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
              : isWarning
              ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
              : 'text-[#e0e1dd] bg-[#223049] border border-[#415a77]'
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
          className="w-full h-1.5 bg-[#223049] rounded-lg appearance-none cursor-pointer accent-[#778da9] focus:outline-none"
          style={{
            background: `linear-gradient(to right, ${
              isDanger
                ? '#ef4444'
                : isWarning
                ? '#f59e0b'
                : '#778da9'
            } 0%, ${
              isDanger
                ? '#ef4444'
                : isWarning
                ? '#f59e0b'
                : '#778da9'
            } ${percentage}%, #223049 ${percentage}%, #223049 100%)`,
          }}
        />
      </div>

      {helpText && (
        <div className="text-[11px] text-[#778da9] font-sans flex justify-between">
          <span>{helpText}</span>
          <span className="font-mono">
            {min} - {max} {unit}
          </span>
        </div>
      )}
    </div>
  );
};
