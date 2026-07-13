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
      base: 'border border-transparent bg-[#1d4e89] text-white shadow-sm hover:bg-[#163a5f]',
      focus: 'focus:ring-[#1d4e89]/35 focus:ring-offset-white',
    },
    secondary: {
      base: 'border border-[#d0d5dd] bg-white text-[#344054] shadow-sm hover:border-[#98a2b3] hover:bg-[#f8fafc]',
      focus: 'focus:ring-[#1d4e89]/25 focus:ring-offset-white',
    },
    outline: {
      base: 'bg-transparent border border-[#1d4e89]/40 text-[#1d4e89] hover:bg-[#1d4e89]/[0.06] hover:border-[#1d4e89]/60',
      focus: 'focus:ring-[#1d4e89]/30 focus:ring-offset-white',
    },
    ghost: {
      base: 'bg-transparent border border-transparent text-[#475467] hover:bg-[#f2f4f7] hover:text-[#172033]',
      focus: 'focus:ring-[#1d4e89]/25 focus:ring-offset-white',
    },
    danger: {
      base: 'border border-transparent bg-[#d92d20] text-white shadow-sm hover:bg-[#b42318]',
      focus: 'focus:ring-[#d92d20]/35 focus:ring-offset-white',
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
        font-medium rounded-[10px]
        transition-colors duration-150
        focus:outline-none focus:ring-2 ${v.focus}
        disabled:opacity-50 disabled:cursor-not-allowed
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
