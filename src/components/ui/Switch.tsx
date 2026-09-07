import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'blue' | 'emerald' | 'crimson' | 'amber';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  variant = 'blue',
  className,
}) => {
  const variantStyles = {
    blue: checked ? 'bg-blue-600' : 'bg-surface-elevated',
    emerald: checked ? 'bg-emerald-600' : 'bg-surface-elevated',
    crimson: checked ? 'bg-rose-600' : 'bg-surface-elevated',
    amber: checked ? 'bg-amber-600' : 'bg-surface-elevated',
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
            <span className="text-xs font-sans font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-slate-500 font-sans">{description}</span>
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
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-surface-border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/30',
          variantStyles[variant]
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-3.5 w-3.5 mt-0.5 ml-0.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-150 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  );
};
