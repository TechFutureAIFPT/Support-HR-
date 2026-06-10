/**
 * Button — light-only shared control
 */
import React, { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  const sizeConfig = {
    sm: { padding: 'px-3 py-2', text: 'text-sm', height: 'h-9', iconSize: 'text-sm' },
    md: { padding: 'px-4 py-2.5', text: 'text-base', height: 'h-11', iconSize: 'text-base' },
    lg: { padding: 'px-6 py-3', text: 'text-lg', height: 'h-13', iconSize: 'text-lg' }
  };

  const variantStyles = {
    primary: {
      base: 'border border-blue-500/20 bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-[0_14px_34px_rgba(35,136,255,0.2)] hover:brightness-105',
      focus: 'focus:ring-blue-400/40 focus:ring-offset-white',
    },
    secondary: {
      base: 'border border-blue-100 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
      focus: 'focus:ring-blue-300/30 focus:ring-offset-white',
    },
    outline: {
      base: 'bg-transparent border border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700',
      focus: 'focus:ring-blue-300/35 focus:ring-offset-white',
    },
    ghost: {
      base: 'bg-transparent hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-transparent',
      focus: 'focus:ring-blue-300/30 focus:ring-offset-white',
    },
    danger: {
      base: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_14px_30px_rgba(127,29,29,0.2)] hover:shadow-[0_18px_36px_rgba(239,68,68,0.22)]',
      focus: 'focus:ring-red-500/35 focus:ring-offset-white',
    },
  };

  const config = sizeConfig[size];
  const v = variantStyles[variant];

  const LoadingSpinner = () => (
    <div className={`
      animate-spin rounded-full border-2 border-white/30 border-t-white
      ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
    `} />
  );

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`
        ${config.padding} ${config.text} ${config.height}
        ${v.base}
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-all duration-200
        focus:outline-none focus:ring-2 ${v.focus}
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:-translate-y-px active:translate-y-0
        ${className}
      `}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className={config.iconSize}>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className={config.iconSize}>{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
