/**
 * ThemeToggle — Nút chuyển đổi Dark / Light Mode
 * Sử dụng useTheme() hook để toggle theme toàn app
 */
import React from 'react';
import { useTheme } from '../ThemeProvider.tsx';

interface DarkThemeToggleProps {
  variant?: 'button' | 'switch' | 'icon' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DarkThemeToggle: React.FC<DarkThemeToggleProps> = ({
  variant = 'pill',
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  // ===== Pill (default, most beautiful) =====
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDarkMode ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
        title={isDarkMode ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
        className={`
          group relative inline-flex items-center gap-2.5 rounded-full
          px-3.5 py-1.5 text-xs font-semibold
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${isDarkMode
            ? 'bg-slate-800/80 border border-slate-700 text-amber-300 hover:bg-slate-700/80 hover:border-slate-600 focus:ring-amber-400/30 focus:ring-offset-slate-900'
            : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm shadow-indigo-100 focus:ring-indigo-400/30 focus:ring-offset-white'
          }
          ${className}
        `}
      >
        {/* Animated icon */}
        <span className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
          {/* Moon icon */}
          <i
            className={`fa-solid fa-moon absolute inset-0 flex items-center justify-center text-sm transition-all duration-300 ${
              isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
            }`}
          />
          {/* Sun icon */}
          <i
            className={`fa-solid fa-sun absolute inset-0 flex items-center justify-center text-sm transition-all duration-300 ${
              !isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
          />
        </span>

        {showLabel && (
          <span className="whitespace-nowrap tracking-wide">
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
    );
  }

  // ===== Switch (track + thumb) =====
  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!isDarkMode}
        onClick={toggleTheme}
        title={isDarkMode ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
        className={`group flex items-center gap-2.5 focus:outline-none ${className}`}
      >
        {/* Sun icon */}
        <i className={`fa-solid fa-sun text-xs transition-colors duration-200 ${
          !isDarkMode ? 'text-amber-500' : 'text-slate-600'
        }`} />

        {/* Track */}
        <div className={`relative w-10 h-5.5 rounded-full transition-all duration-300 border ${
          isDarkMode
            ? 'bg-slate-700 border-slate-600'
            : 'bg-indigo-500 border-indigo-400'
        }`}
          style={{ height: '22px' }}
        >
          {/* Thumb */}
          <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-md transition-all duration-300 ${
            isDarkMode ? 'left-[2px]' : 'left-[calc(100%-20px)]'
          }`} />
        </div>

        {/* Moon icon */}
        <i className={`fa-solid fa-moon text-xs transition-colors duration-200 ${
          isDarkMode ? 'text-amber-300' : 'text-slate-400'
        }`} />
      </button>
    );
  }

  // ===== Icon only =====
  if (variant === 'icon') {
    const sizeClasses = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-11 h-11' };
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={isDarkMode ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
        className={`
          ${sizeClasses[size]} rounded-xl flex items-center justify-center
          transition-all duration-300 focus:outline-none
          ${isDarkMode
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
            : 'bg-indigo-100 border border-indigo-200 text-indigo-600 hover:bg-indigo-200'
          }
          ${className}
        `}
      >
        <i className={`fa-solid ${isDarkMode ? 'fa-moon' : 'fa-sun'} text-sm transition-all duration-300`} />
      </button>
    );
  }

  // ===== Button =====
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        inline-flex items-center font-medium rounded-xl transition-all duration-200
        ${isDarkMode
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15'
          : 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200'
        }
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <i className={`fa-solid ${isDarkMode ? 'fa-moon' : 'fa-sun'} text-xs`} />
      {showLabel && <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>}
    </button>
  );
};
