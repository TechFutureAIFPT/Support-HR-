/**
 * Light-only design tokens for the Support HR frontend.
 * The ThemeMode union is kept to avoid breaking existing imports, but runtime
 * code always applies the light palette.
 */

export type ThemeMode = 'dark' | 'light';

const lightTokens = {
  bgPrimary: '#f6f9ff',
  bgSecondary: '#eef5ff',
  bgTertiary: '#e7f0ff',
  bgElevated: '#ffffff',
  bgGlass: 'rgba(255, 255, 255, 0.84)',
  bgOverlay: 'rgba(15, 23, 42, 0.34)',
  surfaceCard: '#ffffff',
  surfaceHover: '#f2f8ff',
  surfaceActive: '#e8f3ff',
  surfaceBorder: 'rgba(55, 125, 255, 0.14)',
  surfaceBorderHover: 'rgba(55, 125, 255, 0.26)',
  textPrimary: '#102033',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textDisabled: '#94a3b8',
  textInverse: '#ffffff',
  primary: '#2388ff',
  primaryHover: '#0875ee',
  primaryActive: '#0564cc',
  primaryMuted: 'rgba(35, 136, 255, 0.1)',
  accent: '#14b8a6',
  accentHover: '#0f9f93',
  accentMuted: 'rgba(20, 184, 166, 0.12)',
  success: '#23b26d',
  successMuted: 'rgba(35, 178, 109, 0.12)',
  warning: '#ff9f43',
  warningMuted: 'rgba(255, 159, 67, 0.14)',
  error: '#f04468',
  errorMuted: 'rgba(240, 68, 104, 0.12)',
  info: '#2388ff',
  infoMuted: 'rgba(35, 136, 255, 0.1)',
  borderSubtle: 'rgba(15, 23, 42, 0.06)',
  borderDefault: 'rgba(55, 125, 255, 0.14)',
  borderStrong: 'rgba(55, 125, 255, 0.24)',
  borderFocus: 'rgba(35, 136, 255, 0.48)',
  shadowSm: '0 1px 2px rgba(15, 23, 42, 0.05)',
  shadowMd: '0 10px 28px rgba(30, 64, 175, 0.08)',
  shadowLg: '0 18px 48px rgba(30, 64, 175, 0.12)',
  shadowXl: '0 26px 70px rgba(30, 64, 175, 0.14)',
  shadowGlow: '0 18px 52px rgba(35, 136, 255, 0.18)',
  shadowGlowAccent: '0 18px 52px rgba(20, 184, 166, 0.18)',
  gradientPrimary: 'linear-gradient(135deg, #2388ff 0%, #14b8a6 100%)',
  gradientSurface: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  gradientCard: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
  gradientHero: 'linear-gradient(135deg, #f7fbff 0%, #edf5ff 58%, #fff7ef 100%)',
  gradientHeader: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,251,255,0.94) 100%)',
  scrollbarThumb: 'rgba(35, 136, 255, 0.26)',
  scrollbarThumbHover: 'rgba(35, 136, 255, 0.42)',
  auroraOpacity: 0.28,
  gridOpacity: 0.18,
  sidebarHeaderGradient: 'linear-gradient(135deg, #ffffff, #edf6ff)',
} as const;

export const tokens = {
  light: lightTokens,
  dark: lightTokens,
} as const;

export type TokenKey = keyof typeof lightTokens;

export function getToken<K extends TokenKey>(key: K): typeof lightTokens[K] {
  return lightTokens[key];
}

export function themeClasses() {
  return {
    bg: lightTokens.bgPrimary,
    bgSecondary: lightTokens.bgSecondary,
    bgTertiary: lightTokens.bgTertiary,
    bgGlass: lightTokens.bgGlass,
    text: lightTokens.textPrimary,
    textMuted: lightTokens.textMuted,
    primary: lightTokens.primary,
    border: lightTokens.borderDefault,
  };
}
