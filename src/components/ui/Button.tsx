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
    'relative inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#778da9]/40 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 font-medium',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#415a77] text-[#e0e1dd] hover:bg-[#526e8f] border border-[#778da9]/50 shadow-sm font-semibold',
    secondary:
      'bg-[#223049] text-[#e0e1dd] hover:bg-[#2b3d5b] hover:text-white border border-[#415a77] shadow-sm',
    danger:
      'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50',
    warning:
      'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50',
    ghost:
      'bg-transparent text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#223049] border border-transparent',
    outline:
      'bg-transparent text-[#e0e1dd] hover:text-white hover:bg-[#223049] border border-[#415a77] hover:border-[#778da9]',
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
