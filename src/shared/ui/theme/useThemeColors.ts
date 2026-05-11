/**
 * useThemeColors — Hook tiện ích cho theme-aware inline styles
 * Trả về bộ màu phù hợp với dark/light mode hiện tại
 * Dùng ở bất kỳ component nào có inline style={{}} hardcode màu tối
 */
import { useTheme } from '@/shared/ui/theme/ThemeProvider.tsx';

export function useThemeColors() {
  return {
    isDark: true,

    // ── Backgrounds ──
    pageBg:      'linear-gradient(180deg, #08111f 0%, #0b1322 52%, #0b1120 100%)',
    cardBg:      'rgba(255,255,255,0.045)',
    cardBg2:     'rgba(255,255,255,0.06)',
    hoverBg:     'rgba(255,255,255,0.075)',
    headerBg:    'linear-gradient(180deg, rgba(11,19,34,0.92) 0%, rgba(9,17,31,0.9) 100%)',
    tableBg:     'rgba(9,17,31,0.88)',
    tableRowBg:  undefined,
    modalBg:     'linear-gradient(180deg, rgba(17,33,58,0.96) 0%, rgba(9,17,31,0.98) 100%)',
    overlayBg:   'rgba(0,0,0,0.65)',
    scrollBg:    'rgba(10,18,32,0.5)',
    inputBg:     'rgba(255,255,255,0.05)',

    // ── Borders ──
    border:      '1px solid rgba(226,232,240,0.08)',
    borderSoft:  '1px solid rgba(226,232,240,0.06)',
    borderCard:  '1px solid rgba(226,232,240,0.11)',
    borderAccent:'1px solid rgba(99,102,241,0.18)',
    borderColor: 'rgba(226,232,240,0.1)',

    // ── Text ──
    textPrimary: '#f1f5f9',
    textSecondary: '#dbe7f3',
    textMuted:   '#94a3b8',
    textDim:     '#64748b',
    textAccent:  'rgba(99,102,241,0.6)',

    // ── Accent badges (keep same for both) ──
    gradeA:      { bg: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' },
    gradeB:      { bg: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' },
    gradeC:      { bg: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' },
    gradeFail:   { bg: 'rgba(255,255,255,0.05)', color: '#475569' },

    // ── KPI card helper ──
    kpi: (accent: string, border: string, text: string) => ({
      bg: accent,
      border: `1px solid ${border}`,
      text: text,
    }),

    // ── Shadows ──
    modalShadow: '0 24px 64px rgba(2,8,23,0.24)',
  };
}
