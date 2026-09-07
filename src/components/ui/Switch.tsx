import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'cyan' | 'emerald' | 'crimson' | 'amber';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  variant = 'cyan',
  className,
}) => {
  const variantStyles = {
    cyan: checked ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-slate-800',
    emerald: checked ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-slate-800',
    crimson: checked ? 'bg-rose-500 shadow-glow-crimson' : 'bg-slate-800',
    amber: checked ? 'bg-amber-500 shadow-glow-amber' : 'bg-slate-800',
  };

  return (
    <label
      className={cn(
        'inline-flex items-center justify-between cursor-pointer select-none group w-full py-1',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {(label || description) && (
        <div className="flex flex-col mr-3">
          {label && (
            <span className="text-xs font-mono font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-slate-500">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
          variantStyles[variant]
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  );
};
