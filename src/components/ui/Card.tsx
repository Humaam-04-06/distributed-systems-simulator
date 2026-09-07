import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  glow?: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'none';
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
    none: 'border-slate-800/80 shadow-lg',
    cyan: 'border-cyan-500/40 shadow-glow-cyan',
    emerald: 'border-emerald-500/40 shadow-glow-emerald',
    crimson: 'border-rose-500/40 shadow-glow-crimson',
    amber: 'border-amber-500/40 shadow-glow-amber',
  };

  return (
    <div
      className={cn(
        'glass-panel rounded-xl transition-all duration-300 overflow-hidden flex flex-col',
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/50">
          <div>
            {title && (
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[11px] text-slate-500 font-sans mt-0.5">
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
