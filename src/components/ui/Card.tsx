import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  glow?: 'blue' | 'emerald' | 'crimson' | 'amber' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  headerAction,
  glow = 'none',
  ...props
}) => {
  const glowStyles = {
    none: 'border-surface-border',
    blue: 'border-blue-500/40 shadow-glow-blue',
    emerald: 'border-emerald-500/40 shadow-glow-emerald',
    crimson: 'border-rose-500/40 shadow-glow-rose',
    amber: 'border-amber-500/40 shadow-glow-amber',
  };

  return (
    <div
      className={cn(
        'bg-surface-card rounded-xl border transition-all duration-200 overflow-hidden flex flex-col',
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4 py-3 border-b border-surface-border/80 flex items-center justify-between gap-2 bg-surface/80">
          <div>
            {title && (
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-1.5">{headerAction}</div>}
        </div>
      )}
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
};
