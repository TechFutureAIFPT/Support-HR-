/**
 * Shared light palette for components that still use inline style objects.
 */

export function useThemeColors() {
  return {
    isDark: false,

    pageBg: '#ffffff',
    cardBg: '#ffffff',
    cardBg2: '#ffffff',
    hoverBg: '#f2f2f5',
    headerBg: '#ffffff',
    tableBg: '#ffffff',
    tableRowBg: '#ffffff',
    modalBg: '#ffffff',
    overlayBg: 'rgba(29,29,31,0.22)',
    scrollBg: 'rgba(134,134,139,0.3)',
    inputBg: '#f5f5f7',

    border: '1px solid #d2d2d7',
    borderSoft: '1px solid #e5e5ea',
    borderCard: '1px solid #d2d2d7',
    borderAccent: '1px solid rgba(0,122,255,0.38)',
    borderColor: '#d2d2d7',

    textPrimary: '#1d1d1f',
    textSecondary: '#3a3a3c',
    textMuted: '#6e6e73',
    textDim: '#86868b',
    textAccent: '#007aff',

    gradeA: { bg: '#eefaf2', border: '1px solid rgba(52,199,89,0.28)', color: '#16883f' },
    gradeB: { bg: '#fff7e8', border: '1px solid rgba(255,159,10,0.28)', color: '#a35d00' },
    gradeC: { bg: '#fff1f0', border: '1px solid rgba(255,59,48,0.26)', color: '#d70015' },
    gradeFail: { bg: '#f2f2f5', color: '#6e6e73' },

    kpi: (accent: string, border: string, text: string) => ({
      bg: accent,
      border: `1px solid ${border}`,
      text,
    }),

    modalShadow: '0 24px 70px rgba(29,29,31,0.14)',
  };
}
