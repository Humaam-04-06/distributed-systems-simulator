import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'blue' | 'cyan' | 'amber' | 'crimson' | 'violet' | 'slate';
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'slate',
  pulse = false,
  size = 'md',
  ...props
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    crimson: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  };

  const dotStyles = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    cyan: 'bg-sky-400',
    amber: 'bg-amber-400',
    crimson: 'bg-rose-400',
    violet: 'bg-violet-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-mono tracking-tight select-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotStyles[variant]
            )}
          />
          <span
            className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotStyles[variant])}
          />
        </span>
      )}
      {children}
    </span>
  );
};
