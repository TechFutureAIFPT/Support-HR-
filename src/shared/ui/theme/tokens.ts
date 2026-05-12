/**
 * Design Tokens — Single Source of Truth cho toàn bộ màu sắc app
 * Hỗ trợ Dark Mode (Navy Blue) và Light Mode (Indigo/Slate)
 */

export type ThemeMode = 'dark' | 'light';

export const tokens = {
  // ======== DARK MODE TOKENS — NAVY BLUE THEME ========
  dark: {
    bgPrimary: '#000000',
    bgSecondary: '#050505',
    bgTertiary: '#0b0b0f',
    bgElevated: 'rgba(255, 255, 255, 0.03)',
    bgGlass: 'rgba(255, 255, 255, 0.03)',
    bgOverlay: 'rgba(0, 0, 0, 0.85)',
    surfaceCard: 'rgba(255, 255, 255, 0.035)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    surfaceActive: 'rgba(255, 255, 255, 0.1)',
    surfaceBorder: 'rgba(255, 255, 255, 0.08)',
    surfaceBorderHover: 'rgba(255, 255, 255, 0.14)',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textDisabled: '#64748B',
    textInverse: '#0f172a',
    primary: '#60a5fa',
    primaryHover: '#93C5FD',
    primaryActive: '#3B82F6',
    primaryMuted: 'rgba(96, 165, 250, 0.12)',
    accent: '#818cf8',
    accentHover: '#A5B4FC',
    accentMuted: 'rgba(129, 140, 248, 0.12)',
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.12)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.12)',
    info: '#06b6d4',
    infoMuted: 'rgba(6, 182, 212, 0.12)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderDefault: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    borderFocus: 'rgba(96, 165, 250, 0.5)',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 30px rgba(0, 0, 0, 0.5)',
    shadowXl: '0 20px 60px rgba(0, 0, 0, 0.6)',
    shadowGlow: '0 0 20px rgba(96, 165, 250, 0.3)',
    shadowGlowAccent: '0 0 20px rgba(129, 140, 248, 0.3)',
    gradientPrimary: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    gradientSurface: 'linear-gradient(145deg, rgba(14, 14, 18, 0.92), rgba(4, 4, 6, 0.96))',
    gradientCard: 'linear-gradient(145deg, #09090b 0%, #020202 100%)',
    gradientHero: 'radial-gradient(60% 60% at 20% 10%, rgba(34, 211, 238, 0.08), transparent 60%)',
    gradientHeader: 'linear-gradient(135deg, #0a0a0d 0%, #000000 100%)',
    scrollbarThumb: 'rgba(255, 255, 255, 0.2)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.3)',
    auroraOpacity: 0.2,
    gridOpacity: 0.02,
    sidebarHeaderGradient: 'linear-gradient(135deg, #0c0c10, #020202)',
  },

  // ======== LIGHT MODE TOKENS REMOVED ========
} as const;

export type TokenKey = keyof typeof tokens.dark;

export function getToken<K extends TokenKey>(key: K): typeof tokens.dark[K] {
  return tokens.dark[key] as typeof tokens.dark[K];
}

export function themeClasses() {
  const t = tokens.dark;
  return {
    bg: t.bgPrimary,
    bgSecondary: t.bgSecondary,
    bgTertiary: t.bgTertiary,
    bgGlass: t.bgGlass,
    text: t.textPrimary,
    textMuted: t.textMuted,
    primary: t.primary,
    border: t.borderDefault,
  };
}
