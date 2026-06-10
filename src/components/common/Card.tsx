/**
 * Card — light-only shared surface
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
      base: 'bg-white backdrop-blur-xl border border-blue-100 shadow-[0_18px_48px_rgba(30,64,175,0.08)]',
      hover: 'hover:shadow-[0_22px_60px_rgba(30,64,175,0.12)] hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30',
    },
    elevated: {
      base: 'bg-white backdrop-blur-xl border border-blue-100 shadow-[0_24px_64px_rgba(30,64,175,0.1)]',
      hover: 'hover:shadow-[0_28px_72px_rgba(30,64,175,0.14)] hover:-translate-y-0.5 hover:border-blue-200',
    },
    bordered: {
      base: 'bg-white backdrop-blur-lg border border-blue-200 shadow-[0_18px_40px_rgba(30,64,175,0.08)]',
      hover: 'hover:border-blue-300 hover:shadow-[0_22px_54px_rgba(30,64,175,0.12)]',
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
          border-b border-blue-100
        `}>
          {title && (
            <h3 className="text-lg font-semibold text-slate-900">
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
