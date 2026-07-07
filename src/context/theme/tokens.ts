export type ThemeMode = 'light' | 'dark' | 'system';

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

const darkTokens = {
  bgPrimary: '#0f1523',
  bgSecondary: '#141b2d',
  bgTertiary: '#1a2235',
  bgElevated: '#1e2a3d',
  bgGlass: 'rgba(15, 21, 35, 0.88)',
  bgOverlay: 'rgba(0, 0, 0, 0.5)',
  surfaceCard: '#1e2a3d',
  surfaceHover: '#243044',
  surfaceActive: '#2a3750',
  surfaceBorder: 'rgba(100, 150, 255, 0.16)',
  surfaceBorderHover: 'rgba(100, 150, 255, 0.28)',
  textPrimary: '#e2e8f4',
  textSecondary: '#94a3c4',
  textMuted: '#64748b',
  textDisabled: '#475569',
  textInverse: '#0f1523',
  primary: '#3b9eff',
  primaryHover: '#5badff',
  primaryActive: '#2388ff',
  primaryMuted: 'rgba(59, 158, 255, 0.15)',
  accent: '#2dd4bf',
  accentHover: '#14b8a6',
  accentMuted: 'rgba(45, 212, 191, 0.15)',
  success: '#34d399',
  successMuted: 'rgba(52, 211, 153, 0.15)',
  warning: '#fbbf24',
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  error: '#fb7185',
  errorMuted: 'rgba(251, 113, 133, 0.15)',
  info: '#60a5fa',
  infoMuted: 'rgba(96, 165, 250, 0.15)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderDefault: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderFocus: 'rgba(59, 158, 255, 0.50)',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  shadowMd: '0 10px 28px rgba(0, 0, 0, 0.5)',
  shadowLg: '0 18px 48px rgba(0, 0, 0, 0.6)',
  shadowXl: '0 26px 70px rgba(0, 0, 0, 0.7)',
  shadowGlow: '0 18px 52px rgba(59, 158, 255, 0.22)',
  shadowGlowAccent: '0 18px 52px rgba(45, 212, 191, 0.22)',
  gradientPrimary: 'linear-gradient(135deg, #3b9eff 0%, #2dd4bf 100%)',
  gradientSurface: 'linear-gradient(180deg, #1e2a3d 0%, #192435 100%)',
  gradientCard: 'linear-gradient(180deg, #1e2a3d 0%, #1a2437 100%)',
  gradientHero: 'linear-gradient(135deg, #0f1523 0%, #141b2d 58%, #1a2235 100%)',
  gradientHeader: 'linear-gradient(180deg, rgba(30,42,61,0.96) 0%, rgba(20,27,45,0.94) 100%)',
  scrollbarThumb: 'rgba(59, 158, 255, 0.28)',
  scrollbarThumbHover: 'rgba(59, 158, 255, 0.44)',
  auroraOpacity: 0.12,
  gridOpacity: 0.06,
  sidebarHeaderGradient: 'linear-gradient(135deg, #1e2a3d, #162235)',
} as const;

export const tokens = {
  light: lightTokens,
  dark: darkTokens,
} as const;

export type TokenKey = keyof typeof lightTokens;

export function resolveThemeTokenMode(): ThemeMode | 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  if (root.classList.contains('dark')) return 'dark';
  if (root.classList.contains('light')) return 'light';
  return 'light';
}

export function getActiveTokens(mode?: 'light' | 'dark') {
  return tokens[mode ?? resolveThemeTokenMode()];
}

export function getToken<K extends TokenKey>(key: K, mode?: 'light' | 'dark'): typeof lightTokens[K] {
  return getActiveTokens(mode)[key];
}

export function themeClasses(mode?: 'light' | 'dark') {
  const active = getActiveTokens(mode);
  return {
    bg: active.bgPrimary,
    bgSecondary: active.bgSecondary,
    bgTertiary: active.bgTertiary,
    bgGlass: active.bgGlass,
    text: active.textPrimary,
    textMuted: active.textMuted,
    primary: active.primary,
    border: active.borderDefault,
  };
}
