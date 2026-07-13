export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * SupportHR design tokens — Modern HR SaaS, enterprise-ready.
 * Primary: professional navy #1D4E89. Nền xám xanh nhạt #F6F8FB.
 * Border 1px nhạt thay cho shadow lớn; không dùng glow/neon.
 */
const lightTokens = {
  bgPrimary: '#f6f8fb',
  bgSecondary: '#f8fafc',
  bgTertiary: '#eef2f6',
  bgElevated: '#ffffff',
  bgGlass: 'rgba(255, 255, 255, 0.9)',
  bgOverlay: 'rgba(16, 24, 40, 0.4)',
  surfaceCard: '#ffffff',
  surfaceHover: '#f8fafc',
  surfaceActive: '#eef4fb',
  surfaceBorder: '#e4e7ec',
  surfaceBorderHover: '#d0d5dd',
  textPrimary: '#172033',
  textSecondary: '#475467',
  textMuted: '#667085',
  textDisabled: '#98a2b3',
  textInverse: '#ffffff',
  primary: '#1d4e89',
  primaryHover: '#163a5f',
  primaryActive: '#122f4e',
  primaryMuted: 'rgba(29, 78, 137, 0.08)',
  accent: '#4e5ba6',
  accentHover: '#3e4a8c',
  accentMuted: 'rgba(78, 91, 166, 0.08)',
  success: '#17915f',
  successMuted: 'rgba(23, 145, 95, 0.1)',
  warning: '#b54708',
  warningMuted: 'rgba(247, 144, 9, 0.12)',
  error: '#d92d20',
  errorMuted: 'rgba(217, 45, 32, 0.08)',
  info: '#175cd3',
  infoMuted: 'rgba(23, 92, 211, 0.08)',
  borderSubtle: '#eaecf0',
  borderDefault: '#e4e7ec',
  borderStrong: '#d0d5dd',
  borderFocus: 'rgba(29, 78, 137, 0.4)',
  shadowSm: '0 1px 2px rgba(16, 24, 40, 0.05)',
  shadowMd: '0 2px 8px rgba(16, 24, 40, 0.06)',
  shadowLg: '0 8px 24px rgba(16, 24, 40, 0.08)',
  shadowXl: '0 16px 40px rgba(16, 24, 40, 0.1)',
  shadowGlow: '0 2px 8px rgba(16, 24, 40, 0.06)',
  shadowGlowAccent: '0 2px 8px rgba(16, 24, 40, 0.06)',
  gradientPrimary: 'linear-gradient(135deg, #1d4e89 0%, #2a62a6 100%)',
  gradientSurface: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  gradientCard: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
  gradientHero: 'linear-gradient(180deg, #f8fafc 0%, #f6f8fb 100%)',
  gradientHeader: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
  scrollbarThumb: 'rgba(16, 24, 40, 0.18)',
  scrollbarThumbHover: 'rgba(16, 24, 40, 0.3)',
  auroraOpacity: 0,
  gridOpacity: 0,
  sidebarHeaderGradient: 'linear-gradient(180deg, #ffffff, #ffffff)',
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
  primary: '#6ea8dc',
  primaryHover: '#8dbce7',
  primaryActive: '#5b97d1',
  primaryMuted: 'rgba(110, 168, 220, 0.14)',
  accent: '#98a4dd',
  accentHover: '#aeb8e6',
  accentMuted: 'rgba(152, 164, 221, 0.14)',
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
  shadowGlow: '0 10px 28px rgba(0, 0, 0, 0.5)',
  shadowGlowAccent: '0 10px 28px rgba(0, 0, 0, 0.5)',
  gradientPrimary: 'linear-gradient(135deg, #35608f 0%, #46739f 100%)',
  gradientSurface: 'linear-gradient(180deg, #1e2a3d 0%, #192435 100%)',
  gradientCard: 'linear-gradient(180deg, #1e2a3d 0%, #1a2437 100%)',
  gradientHero: 'linear-gradient(135deg, #0f1523 0%, #141b2d 58%, #1a2235 100%)',
  gradientHeader: 'linear-gradient(180deg, rgba(30,42,61,0.96) 0%, rgba(20,27,45,0.94) 100%)',
  scrollbarThumb: 'rgba(255, 255, 255, 0.16)',
  scrollbarThumbHover: 'rgba(255, 255, 255, 0.28)',
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
