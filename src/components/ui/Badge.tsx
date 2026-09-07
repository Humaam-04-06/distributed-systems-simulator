import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'cyan' | 'amber' | 'crimson' | 'violet' | 'slate';
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
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm',
    crimson: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm',
    violet: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-sm',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60 shadow-sm',
  };

  const dotStyles = {
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    crimson: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    violet: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-mono uppercase tracking-wider',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotStyles[variant]
            )}
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', dotStyles[variant])}
          />
        </span>
      )}
      {children}
    </span>
  );
};
