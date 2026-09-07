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
    none: 'border-surface-border/80',
    blue: 'border-[#778da9] shadow-[0_0_15px_rgba(119,141,169,0.2)]',
    emerald: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    crimson: 'border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    amber: 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  };

  return (
    <div
      className={cn(
        'bg-surface-card rounded-xl border transition-all duration-200 overflow-hidden flex flex-col shadow-card',
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4 py-3 border-b border-surface-border/70 flex items-center justify-between gap-2 bg-[#172235]">
          <div>
            {title && (
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#e0e1dd] flex items-center gap-2">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[11px] text-[#778da9] font-sans mt-0.5">
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
