/**
 * useThemeColors — Hook tiện ích cho theme-aware inline styles
 * Trả về bộ màu phù hợp với dark/light mode hiện tại
 * Dùng ở bất kỳ component nào có inline style={{}} hardcode màu tối
 */
import { useTheme } from './ThemeProvider.tsx';

export function useThemeColors() {
  const { isDarkMode } = useTheme();

  return {
    isDark: isDarkMode,

    // ── Backgrounds ──
    pageBg:      isDarkMode ? 'linear-gradient(180deg, #0B192C 0%, #0d1628 100%)' : 'linear-gradient(180deg, #f0f4ff 0%, #f8faff 100%)',
    cardBg:      isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.03)',
    cardBg2:     isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)',
    hoverBg:     isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.06)',
    headerBg:    isDarkMode ? 'linear-gradient(180deg, rgba(12,22,40,0.9) 0%, rgba(10,18,32,0.9) 100%)' : 'linear-gradient(180deg, rgba(248,250,255,0.95) 0%, rgba(240,244,255,0.95) 100%)',
    tableBg:     isDarkMode ? 'rgba(10,18,32,0.9)' : 'rgba(248,250,255,0.98)',
    tableRowBg:  isDarkMode ? undefined : undefined,
    modalBg:     isDarkMode ? 'linear-gradient(180deg, #11213A 0%, #0B192C 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
    overlayBg:   isDarkMode ? 'rgba(0,0,0,0.65)' : 'rgba(15,23,42,0.4)',
    scrollBg:    isDarkMode ? 'rgba(10,18,32,0.5)' : 'rgba(248,250,255,0.5)',
    inputBg:     isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',

    // ── Borders ──
    border:      isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.12)',
    borderSoft:  isDarkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(99,102,241,0.08)',
    borderCard:  isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.15)',
    borderAccent:isDarkMode ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(99,102,241,0.2)',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.12)',

    // ── Text ──
    textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
    textSecondary: isDarkMode ? '#cbd5e1' : '#1e293b',
    textMuted:   isDarkMode ? '#94a3b8' : '#475569',
    textDim:     isDarkMode ? '#475569' : '#94a3b8',
    textAccent:  isDarkMode ? 'rgba(99,102,241,0.6)' : '#4f46e5',

    // ── Accent badges (keep same for both) ──
    gradeA:      { bg: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: isDarkMode ? '#34d399' : '#059669' },
    gradeB:      { bg: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: isDarkMode ? '#60a5fa' : '#2563eb' },
    gradeC:      { bg: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: isDarkMode ? '#f87171' : '#dc2626' },
    gradeFail:   { bg: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(100,116,139,0.08)', color: isDarkMode ? '#475569' : '#64748b' },

    // ── KPI card helper ──
    kpi: (accent: string, border: string, text: string) => ({
      bg: accent,
      border: `1px solid ${border}`,
      text: isDarkMode ? text : text,
    }),

    // ── Shadows ──
    modalShadow: isDarkMode ? '0 0 60px rgba(99,102,241,0.1)' : '0 0 60px rgba(99,102,241,0.08)',
  };
}
