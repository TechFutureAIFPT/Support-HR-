import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { getActiveTokens, tokens, type ThemeMode } from '@/context/theme/tokens.ts';
import {
  readLocalUserSettings,
  USER_SETTINGS_EVENT,
  USER_SETTINGS_LOCAL_KEY,
  USER_SETTINGS_THEME_KEY,
} from '@/services/settings/userSettingsService';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isAccessibleMode: boolean;
  setAccessibleMode: (enabled: boolean) => void;
  toggleAccessibleMode: () => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isAccessibleMode: false,
  setAccessibleMode: () => {},
  toggleAccessibleMode: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
});

function resolveEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function readThemeFromSettingsSnapshot(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(USER_SETTINGS_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ui?: { theme?: unknown } };
    const nextTheme = parsed?.ui?.theme;
    if (nextTheme === 'dark' || nextTheme === 'system' || nextTheme === 'light') {
      return nextTheme;
    }
  } catch {}
  return null;
}

function applyThemeVariables(mode: ThemeMode) {
  const effective = resolveEffectiveMode(mode);
  const t = getActiveTokens(effective);
  const root = document.documentElement;

  root.classList.remove('dark', 'light');
  root.classList.add(effective);
  root.style.colorScheme = effective;

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

function readStoredTheme(): ThemeMode {
  try {
    const snapshotTheme = readThemeFromSettingsSnapshot();
    if (snapshotTheme) return snapshotTheme;
    const raw = localStorage.getItem(USER_SETTINGS_THEME_KEY);
    if (raw === 'dark' || raw === 'system' || raw === 'light') return raw;
  } catch {}
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const localSettings = readLocalUserSettings();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => readStoredTheme());
  const [isAccessibleMode, setIsAccessibleMode] = useState<boolean>(() => localSettings.ui.accessibleMode);
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => localSettings.ui.reducedMotion);

  const isDarkMode = resolveEffectiveMode(themeMode) === 'dark';

  useEffect(() => {
    applyThemeVariables(themeMode);
  }, [themeMode]);

  // Re-resolve when OS preference changes (for 'system' mode)
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeVariables('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (isAccessibleMode) root.classList.add('supporthr-accessible');
    else root.classList.remove('supporthr-accessible');
  }, [isAccessibleMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('supporthr-reduced-motion');
      root.style.setProperty('scroll-behavior', 'auto');
    } else {
      root.classList.remove('supporthr-reduced-motion');
      root.style.removeProperty('scroll-behavior');
    }
  }, [reducedMotion]);

  useEffect(() => {
    const syncFromSettings = () => {
      const next = readLocalUserSettings();
      setIsAccessibleMode(next.ui.accessibleMode);
      setReducedMotionState(next.ui.reducedMotion);
      const nextTheme = next.ui.theme as ThemeMode;
      setThemeModeState(nextTheme);
    };

    window.addEventListener(USER_SETTINGS_EVENT, syncFromSettings as EventListener);
    return () => window.removeEventListener(USER_SETTINGS_EVENT, syncFromSettings as EventListener);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    try { localStorage.setItem(USER_SETTINGS_THEME_KEY, mode); } catch {}
    setThemeModeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolveEffectiveMode(themeMode) === 'dark' ? 'light' : 'dark');
  }, [setTheme, themeMode]);

  const setAccessibleMode = useCallback((enabled: boolean) => {
    localStorage.setItem('accessibleMode', String(enabled));
    setIsAccessibleMode(enabled);
  }, []);

  const toggleAccessibleMode = useCallback(() => {
    setIsAccessibleMode((prev) => {
      const next = !prev;
      localStorage.setItem('accessibleMode', String(next));
      return next;
    });
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    localStorage.setItem('supporthr.reducedMotion', String(enabled));
    setReducedMotionState(enabled);
  }, []);

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      themeMode,
      toggleTheme,
      setTheme,
      isAccessibleMode,
      setAccessibleMode,
      toggleAccessibleMode,
      reducedMotion,
      setReducedMotion,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export function useThemeVar(varName: string): string {
  const { isDarkMode } = useTheme();
  const t = isDarkMode ? tokens.dark : tokens.light;
  const key = varName.replace('--th-', '') as keyof typeof t;
  return (t as any)[key] as string;
}

export function useThemeVars(...varNames: string[]): Record<string, string> {
  const { isDarkMode } = useTheme();
  const t = isDarkMode ? tokens.dark : tokens.light;
  const result: Record<string, string> = {};
  for (const name of varNames) {
    const key = name.replace('--th-', '') as keyof typeof t;
    result[name] = (t as any)[key] as string;
  }
  return result;
}
