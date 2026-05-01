/**
 * ThemeProvider — Hỗ trợ Dark Mode và Light Mode
 * - Toggle được lưu vào localStorage để nhớ qua các lần load
 * - Đặt CSS variables trên documentElement để dùng xuyên suốt app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokens, ThemeMode } from './tokens.ts';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  themeMode: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'supporthr-theme';

function applyThemeVariables(mode: ThemeMode) {
  const root = document.documentElement;
  const t = tokens[mode];

  // Update HTML class for Tailwind dark: selectors and our .light/.dark CSS
  root.classList.remove('light', 'dark');
  root.classList.add(mode);

  // Color scheme for browser native UI
  root.style.colorScheme = mode === 'dark' ? 'dark' : 'light';

  // Apply all CSS custom properties
  root.style.setProperty('--th-bg', t.bgPrimary);
  root.style.setProperty('--th-bg-secondary', t.bgSecondary);
  root.style.setProperty('--th-bg-tertiary', t.bgTertiary);
  root.style.setProperty('--th-bg-elevated', t.bgElevated);
  root.style.setProperty('--th-bg-glass', t.bgGlass);
  root.style.setProperty('--th-bg-overlay', t.bgOverlay);

  root.style.setProperty('--th-surface-card', t.surfaceCard);
  root.style.setProperty('--th-surface-hover', t.surfaceHover);
  root.style.setProperty('--th-surface-active', t.surfaceActive);
  root.style.setProperty('--th-surface-border', t.surfaceBorder);
  root.style.setProperty('--th-surface-border-hover', t.surfaceBorderHover);

  root.style.setProperty('--th-text', t.textPrimary);
  root.style.setProperty('--th-text-secondary', t.textSecondary);
  root.style.setProperty('--th-text-muted', t.textMuted);
  root.style.setProperty('--th-text-disabled', t.textDisabled);
  root.style.setProperty('--th-text-inverse', t.textInverse);

  root.style.setProperty('--th-primary', t.primary);
  root.style.setProperty('--th-primary-hover', t.primaryHover);
  root.style.setProperty('--th-primary-active', t.primaryActive);
  root.style.setProperty('--th-primary-muted', t.primaryMuted);

  root.style.setProperty('--th-accent', t.accent);
  root.style.setProperty('--th-accent-hover', t.accentHover);
  root.style.setProperty('--th-accent-muted', t.accentMuted);

  root.style.setProperty('--th-success', t.success);
  root.style.setProperty('--th-success-muted', t.successMuted);
  root.style.setProperty('--th-warning', t.warning);
  root.style.setProperty('--th-warning-muted', t.warningMuted);
  root.style.setProperty('--th-error', t.error);
  root.style.setProperty('--th-error-muted', t.errorMuted);
  root.style.setProperty('--th-info', t.info);
  root.style.setProperty('--th-info-muted', t.infoMuted);

  root.style.setProperty('--th-border-subtle', t.borderSubtle);
  root.style.setProperty('--th-border', t.borderDefault);
  root.style.setProperty('--th-border-strong', t.borderStrong);
  root.style.setProperty('--th-border-focus', t.borderFocus);

  root.style.setProperty('--th-shadow-sm', t.shadowSm);
  root.style.setProperty('--th-shadow-md', t.shadowMd);
  root.style.setProperty('--th-shadow-lg', t.shadowLg);
  root.style.setProperty('--th-shadow-xl', t.shadowXl);
  root.style.setProperty('--th-shadow-glow', t.shadowGlow);
  root.style.setProperty('--th-shadow-glow-accent', t.shadowGlowAccent);

  root.style.setProperty('--th-gradient-primary', t.gradientPrimary);
  root.style.setProperty('--th-gradient-surface', t.gradientSurface);
  root.style.setProperty('--th-gradient-card', t.gradientCard);

  root.style.setProperty('--th-scrollbar-thumb', t.scrollbarThumb);
  root.style.setProperty('--th-scrollbar-thumb-hover', t.scrollbarThumbHover);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    applyThemeVariables(themeMode);
  }, [themeMode]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setTheme]);

  return (
    <ThemeContext.Provider value={{
      isDarkMode: themeMode === 'dark',
      themeMode,
      toggleTheme,
      setTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export function useThemeVar(varName: string): string {
  const { themeMode } = useTheme();
  const t = tokens[themeMode];
  const key = varName.replace('--th-', '') as keyof typeof t;
  return (t as any)[key] as string;
}

export function useThemeVars(...varNames: string[]): Record<string, string> {
  const { themeMode } = useTheme();
  const t = tokens[themeMode];
  const result: Record<string, string> = {};
  for (const name of varNames) {
    const key = name.replace('--th-', '') as keyof typeof t;
    result[name] = (t as any)[key] as string;
  }
  return result;
}
