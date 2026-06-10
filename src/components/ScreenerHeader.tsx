/**
 * ScreenerHeader - light workflow header
 */
import React from 'react';

interface ScreenerHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
}

const ScreenerHeader: React.FC<ScreenerHeaderProps> = ({
  title = "Screener",
  subtitle = "JOB DESCRIPTION ANALYTICS",
  icon = "fa-wand-magic-sparkles",
  children,
  className = ""
}) => {
  return (
    <div className={`
      w-full flex flex-col md:flex-row md:items-center justify-between gap-4
      py-2.5 px-6 border-b sticky top-0 z-30
      bg-white/95 border-blue-100 shadow-[0_1px_0_rgba(219,234,254,0.85)]
      ${className}
    `}>
      <div className="flex items-center gap-3 min-w-max">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg bg-blue-50 border-blue-100 shadow-blue-500/10">
          <i className={`fa-solid ${icon} text-xl text-blue-600 transition-transform group-hover:scale-110`} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wide leading-tight text-slate-900">
            {title}
          </h2>
          <p className="text-[9px] tracking-[0.2em] font-medium uppercase mt-0.5 text-blue-600">
            {subtitle}
          </p>
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-3 ml-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default ScreenerHeader;
