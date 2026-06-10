/**
 * Badge — light-only shared status label
 */
import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  icon,
  className = '',
  dot = false
}) => {
  const sizeConfig = {
    sm: { text: 'text-xs', padding: 'py-0.5 px-2', dotSize: 'w-1.5 h-1.5', gap: 'gap-1' },
    md: { text: 'text-sm', padding: 'py-1 px-2.5', dotSize: 'w-2 h-2', gap: 'gap-1.5' }
  };

  const variantStyles = {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    error: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
    info: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
    neutral: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    primary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  };

  const config = sizeConfig[size];
  const styles = variantStyles[variant];

  if (dot) {
    return (
      <span
        className={`${config.dotSize} ${styles.dot} rounded-full inline-block ${className}`}
        role="status"
        aria-label={typeof children === 'string' ? children : variant}
      />
    );
  }

  return (
    <span
      className={`
        ${config.text} ${config.padding} ${styles.bg} ${styles.text} ${styles.border}
        inline-flex items-center ${config.gap}
        font-medium border
        ${className}
      `}
      role="status"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
