/**
 * Button — Chỉ hỗ trợ Dark Mode
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
      base: 'border border-white bg-white text-black shadow-[0_14px_30px_rgba(245,214,187,0.12)] hover:bg-slate-100 hover:shadow-[0_18px_36px_rgba(245,214,187,0.18)]',
      focus: 'focus:ring-[#f5d6bb]/40 focus:ring-offset-black',
    },
    secondary: {
      base: 'bg-slate-800/80 hover:bg-slate-700/85 text-white border border-white/[0.08] shadow-[0_12px_28px_rgba(15,23,42,0.14)]',
      focus: 'focus:ring-slate-400/30 focus:ring-offset-slate-900',
    },
    outline: {
      base: 'bg-transparent border border-[#f5d6bb]/35 hover:bg-[#f5d6bb]/10 hover:border-[#f5d6bb]/45 text-[#f5d6bb] hover:text-white',
      focus: 'focus:ring-[#f5d6bb]/35 focus:ring-offset-black',
    },
    ghost: {
      base: 'bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white border border-transparent',
      focus: 'focus:ring-slate-400/30 focus:ring-offset-slate-900',
    },
    danger: {
      base: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_14px_30px_rgba(127,29,29,0.2)] hover:shadow-[0_18px_36px_rgba(239,68,68,0.22)]',
      focus: 'focus:ring-red-500/35 focus:ring-offset-slate-900',
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
          <span>Loading...</span>
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
