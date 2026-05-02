/**
 * useThemeColors — Hook tiện ích cho theme-aware inline styles
 * Trả về bộ màu phù hợp với dark/light mode hiện tại
 * Dùng ở bất kỳ component nào có inline style={{}} hardcode màu tối
 */
import { useTheme } from '@/components/ui/theme/ThemeProvider.tsx';

export function useThemeColors() {
  return {
    isDark: true,

    // ── Backgrounds ──
    pageBg:      'linear-gradient(180deg, #0B192C 0%, #0d1628 100%)',
    cardBg:      'rgba(255,255,255,0.03)',
    cardBg2:     'rgba(255,255,255,0.04)',
    hoverBg:     'rgba(255,255,255,0.06)',
    headerBg:    'linear-gradient(180deg, rgba(12,22,40,0.9) 0%, rgba(10,18,32,0.9) 100%)',
    tableBg:     'rgba(10,18,32,0.9)',
    tableRowBg:  undefined,
    modalBg:     'linear-gradient(180deg, #11213A 0%, #0B192C 100%)',
    overlayBg:   'rgba(0,0,0,0.65)',
    scrollBg:    'rgba(10,18,32,0.5)',
    inputBg:     'rgba(255,255,255,0.04)',

    // ── Borders ──
    border:      '1px solid rgba(255,255,255,0.06)',
    borderSoft:  '1px solid rgba(255,255,255,0.04)',
    borderCard:  '1px solid rgba(255,255,255,0.08)',
    borderAccent:'1px solid rgba(99,102,241,0.15)',
    borderColor: 'rgba(255,255,255,0.06)',

    // ── Text ──
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted:   '#94a3b8',
    textDim:     '#475569',
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
    modalShadow: '0 0 60px rgba(99,102,241,0.1)',
  };
}
