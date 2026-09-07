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
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    blue: 'bg-[#415a77]/30 text-[#e0e1dd] border-[#778da9]/50',
    cyan: 'bg-[#415a77]/40 text-[#e0e1dd] border-[#778da9]',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    crimson: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    slate: 'bg-[#223049] text-[#778da9] border-[#415a77]/60',
  };

  const dotStyles = {
    emerald: 'bg-emerald-400',
    blue: 'bg-[#778da9]',
    cyan: 'bg-[#e0e1dd]',
    amber: 'bg-amber-400',
    crimson: 'bg-rose-400',
    violet: 'bg-violet-400',
    slate: 'bg-[#778da9]',
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
