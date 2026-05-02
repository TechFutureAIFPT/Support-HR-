/**
 * Theme System — Barrel Export
 * Chỉ hỗ trợ Dark Mode
 */

// Core Provider & Hooks
export { ThemeProvider, useTheme, useThemeVar, useThemeVars } from '@/components/ui/theme/ThemeProvider.tsx';
export type { ThemeMode } from '@/components/ui/theme/tokens.ts';


// Design Tokens
export { tokens, getToken, themeClasses } from '@/components/ui/theme/tokens.ts';
export type { TokenKey } from '@/components/ui/theme/tokens.ts';

// Dark Mode Components
export { DarkCard, DarkCardSkeleton } from '@/components/ui/theme/dark/Card.tsx';
export { DarkButton } from '@/components/ui/theme/dark/Button.tsx';
export { DarkInput } from '@/components/ui/theme/dark/Input.tsx';
export { DarkBadge } from '@/components/ui/theme/dark/Badge.tsx';
export { DarkProgressBar } from '@/components/ui/theme/dark/ProgressBar.tsx';
export { DarkLoader } from '@/components/ui/theme/dark/Loader.tsx';
export { DarkSection, DarkContainer, DarkDivider } from '@/components/ui/theme/dark/Layout.tsx';
