/**
 * useThemeColors — Hook tiện ích cho theme-aware inline styles
 * Trả về bộ màu phù hợp với dark/light mode hiện tại
 * Dùng ở bất kỳ component nào có inline style={{}} hardcode màu tối
 */
import { useTheme } from '@/context/theme/ThemeProvider.tsx';

export function useThemeColors() {
  return {
    isDark: true,

    // ── Backgrounds ──
    pageBg:      'linear-gradient(180deg, #000000 0%, #020202 52%, #000000 100%)',
    cardBg:      'rgba(255,255,255,0.035)',
    cardBg2:     'rgba(255,255,255,0.05)',
    hoverBg:     'rgba(255,255,255,0.065)',
    headerBg:    'linear-gradient(180deg, rgba(5,5,7,0.96) 0%, rgba(0,0,0,0.94) 100%)',
    tableBg:     'rgba(4,4,6,0.9)',
    tableRowBg:  undefined,
    modalBg:     'linear-gradient(180deg, rgba(10,10,12,0.98) 0%, rgba(2,2,4,0.98) 100%)',
    overlayBg:   'rgba(0,0,0,0.65)',
    scrollBg:    'rgba(255,255,255,0.08)',
    inputBg:     'rgba(255,255,255,0.05)',

    // ── Borders ──
    border:      '1px solid rgba(226,232,240,0.08)',
    borderSoft:  '1px solid rgba(226,232,240,0.06)',
    borderCard:  '1px solid rgba(226,232,240,0.11)',
    borderAccent:'1px solid rgba(245,214,187,0.24)',
    borderColor: 'rgba(226,232,240,0.1)',

    // ── Text ──
    textPrimary: '#f1f5f9',
    textSecondary: '#dbe7f3',
    textMuted:   '#94a3b8',
    textDim:     '#64748b',
    textAccent:  'rgba(245,214,187,0.74)',

    // ── Accent badges (keep same for both) ──
    gradeA:      { bg: 'rgba(245,214,187,0.13)', border: '1px solid rgba(245,214,187,0.28)', color: '#f5d6bb' },
    gradeB:      { bg: 'rgba(245,214,187,0.08)', border: '1px solid rgba(245,214,187,0.2)', color: '#ffd8a8' },
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
