import { useTheme } from '@/context/theme/ThemeProvider';
import { tokens } from '@/context/theme/tokens';

export function useThemeColors() {
  const { isDarkMode } = useTheme();
  const t = isDarkMode ? tokens.dark : tokens.light;

  return {
    isDark: isDarkMode,

    pageBg: isDarkMode ? t.bgPrimary : '#ffffff',
    cardBg: isDarkMode ? t.surfaceCard : '#ffffff',
    cardBg2: isDarkMode ? t.bgElevated : '#ffffff',
    hoverBg: isDarkMode ? t.surfaceHover : '#f2f2f5',
    headerBg: isDarkMode ? t.bgSecondary : '#ffffff',
    tableBg: isDarkMode ? t.surfaceCard : '#ffffff',
    tableRowBg: isDarkMode ? t.surfaceCard : '#ffffff',
    modalBg: isDarkMode ? t.surfaceCard : '#ffffff',
    overlayBg: isDarkMode ? t.bgOverlay : 'rgba(29,29,31,0.22)',
    scrollBg: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(134,134,139,0.3)',
    inputBg: isDarkMode ? t.bgElevated : '#f5f5f7',

    border: isDarkMode ? `1px solid ${t.borderDefault}` : '1px solid #d2d2d7',
    borderSoft: isDarkMode ? `1px solid ${t.borderSubtle}` : '1px solid #e5e5ea',
    borderCard: isDarkMode ? `1px solid ${t.borderDefault}` : '1px solid #d2d2d7',
    borderAccent: isDarkMode ? `1px solid ${t.borderFocus}` : '1px solid rgba(0,122,255,0.38)',
    borderColor: isDarkMode ? t.borderDefault : '#d2d2d7',

    textPrimary: isDarkMode ? t.textPrimary : '#1d1d1f',
    textSecondary: isDarkMode ? t.textSecondary : '#3a3a3c',
    textMuted: isDarkMode ? t.textMuted : '#6e6e73',
    textDim: isDarkMode ? t.textDisabled : '#86868b',
    textAccent: isDarkMode ? t.primary : '#007aff',

    gradeA: isDarkMode
      ? { bg: t.successMuted, border: `1px solid rgba(52,211,153,0.28)`, color: t.success }
      : { bg: '#eefaf2', border: '1px solid rgba(52,199,89,0.28)', color: '#16883f' },
    gradeB: isDarkMode
      ? { bg: t.warningMuted, border: `1px solid rgba(251,191,36,0.28)`, color: t.warning }
      : { bg: '#fff7e8', border: '1px solid rgba(255,159,10,0.28)', color: '#a35d00' },
    gradeC: isDarkMode
      ? { bg: t.errorMuted, border: `1px solid rgba(251,113,133,0.26)`, color: t.error }
      : { bg: '#fff1f0', border: '1px solid rgba(255,59,48,0.26)', color: '#d70015' },
    gradeFail: isDarkMode
      ? { bg: t.bgSecondary, color: t.textMuted }
      : { bg: '#f2f2f5', color: '#6e6e73' },

    kpi: (accent: string, border: string, text: string) => ({
      bg: accent,
      border: `1px solid ${border}`,
      text,
    }),

    modalShadow: isDarkMode ? t.shadowXl : '0 24px 70px rgba(29,29,31,0.14)',
  };
}
