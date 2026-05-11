/**
 * Card — Chỉ hỗ trợ Dark Mode
 */
import React, { ReactNode } from 'react';

interface CardProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  title,
  headerActions,
  className = '',
  onClick,
  hoverable = false
}) => {
  const paddingConfig = {
    none: '', sm: 'p-3', md: 'p-5', lg: 'p-8'
  };

  const variantStyles = {
    default: {
      base: 'bg-slate-900/58 backdrop-blur-xl border border-white/[0.08] shadow-[0_18px_48px_rgba(2,8,23,0.18)]',
      hover: 'hover:shadow-[0_22px_60px_rgba(8,47,73,0.18)] hover:-translate-y-0.5 hover:border-cyan-500/28 hover:bg-slate-900/72',
    },
    elevated: {
      base: 'bg-slate-900/72 backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_64px_rgba(2,8,23,0.24)]',
      hover: 'hover:shadow-[0_28px_72px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 hover:border-cyan-500/28',
    },
    bordered: {
      base: 'bg-slate-950/78 backdrop-blur-lg border border-blue-500/24 shadow-[0_18px_40px_rgba(15,23,42,0.2)]',
      hover: 'hover:border-cyan-500/32 hover:shadow-[0_22px_54px_rgba(8,47,73,0.18)]',
    },
    ghost: {
      base: 'bg-transparent border border-transparent',
      hover: '',
    }
  };

  const v = variantStyles[variant];
  const hoverClass = (hoverable || onClick) ? v.hover : '';

  return (
    <div
      className={`
        ${v.base} ${hoverClass}
        rounded-[18px] transition-all duration-300
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {(title || headerActions) && (
        <div className={`
          flex items-center justify-between
          ${paddingConfig[padding]} ${padding !== 'none' && children ? 'pb-0' : ''}
          border-b border-white/[0.08]
        `}>
          {title && (
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          )}
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      )}

      <div className={`
        ${paddingConfig[padding]}
        ${(title || headerActions) && padding !== 'none' ? 'pt-5' : ''}
      `}>
        {children}
      </div>
    </div>
  );
};

export default Card;
