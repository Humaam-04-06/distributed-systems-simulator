import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 font-semibold',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold shadow-glow-cyan border border-cyan-400/50 hover:shadow-cyan-500/50',
    secondary:
      'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80 shadow-sm',
    danger:
      'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/40 hover:border-rose-500/70 shadow-glow-crimson',
    warning:
      'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-500/70 shadow-glow-amber',
    ghost:
      'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent',
    outline:
      'bg-transparent text-slate-300 hover:bg-slate-850 border border-slate-700 hover:border-slate-500',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : icon && iconPosition === 'left' ? (
        <span className="inline-flex shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' ? (
        <span className="inline-flex shrink-0">{icon}</span>
      ) : null}
    </button>
  );
};
