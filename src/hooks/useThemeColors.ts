/**
 * Shared light palette for components that still use inline style objects.
 */

export function useThemeColors() {
  return {
    isDark: false,

    pageBg: '#ffffff',
    cardBg: '#ffffff',
    cardBg2: '#ffffff',
    hoverBg: '#eef6ff',
    headerBg: '#ffffff',
    tableBg: '#ffffff',
    tableRowBg: '#ffffff',
    modalBg: '#ffffff',
    overlayBg: 'rgba(15,23,42,0.28)',
    scrollBg: 'rgba(35,136,255,0.2)',
    inputBg: '#ffffff',

    border: '1px solid rgba(55,125,255,0.14)',
    borderSoft: '1px solid rgba(15,23,42,0.06)',
    borderCard: '1px solid rgba(55,125,255,0.16)',
    borderAccent: '1px solid rgba(35,136,255,0.26)',
    borderColor: 'rgba(55,125,255,0.14)',

    textPrimary: '#102033',
    textSecondary: '#334155',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    textAccent: '#2388ff',

    gradeA: { bg: 'rgba(35,178,109,0.12)', border: '1px solid rgba(35,178,109,0.24)', color: '#15945a' },
    gradeB: { bg: 'rgba(35,136,255,0.1)', border: '1px solid rgba(35,136,255,0.22)', color: '#0875ee' },
    gradeC: { bg: 'rgba(255,159,67,0.14)', border: '1px solid rgba(255,159,67,0.26)', color: '#d97706' },
    gradeFail: { bg: 'rgba(148,163,184,0.14)', color: '#64748b' },

    kpi: (accent: string, border: string, text: string) => ({
      bg: accent,
      border: `1px solid ${border}`,
      text,
    }),

    modalShadow: '0 24px 70px rgba(30,64,175,0.14)',
  };
}
