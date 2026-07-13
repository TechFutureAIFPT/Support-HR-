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
      base: 'bg-white border border-[#e4e7ec] shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
      hover: 'hover:border-[#d0d5dd] hover:shadow-[0_2px_8px_rgba(16,24,40,0.08)]',
    },
    elevated: {
      base: 'bg-white border border-[#e4e7ec] shadow-[0_2px_8px_rgba(16,24,40,0.06)]',
      hover: 'hover:border-[#d0d5dd] hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]',
    },
    bordered: {
      base: 'bg-white border border-[#d0d5dd]',
      hover: 'hover:border-[#98a2b3]',
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
        rounded-xl transition-[border-color,box-shadow] duration-150
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
          border-b border-[#eaecf0]
        `}>
          {title && (
            <h3 className="text-base font-semibold text-[#172033]">
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
