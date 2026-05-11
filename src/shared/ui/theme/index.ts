/**
 * Theme System — Barrel Export
 * Chỉ hỗ trợ Dark Mode
 */

// Core Provider & Hooks
export { ThemeProvider, useTheme, useThemeVar, useThemeVars } from '@/shared/ui/theme/ThemeProvider.tsx';
export type { ThemeMode } from '@/shared/ui/theme/tokens.ts';


// Design Tokens
export { tokens, getToken, themeClasses } from '@/shared/ui/theme/tokens.ts';
export type { TokenKey } from '@/shared/ui/theme/tokens.ts';

// Dark Mode Components
export { DarkCard, DarkCardSkeleton } from '@/shared/ui/theme/dark/Card.tsx';
export { DarkButton } from '@/shared/ui/theme/dark/Button.tsx';
export { DarkInput } from '@/shared/ui/theme/dark/Input.tsx';
export { DarkBadge } from '@/shared/ui/theme/dark/Badge.tsx';
export { DarkProgressBar } from '@/shared/ui/theme/dark/ProgressBar.tsx';
export { DarkLoader } from '@/shared/ui/theme/dark/Loader.tsx';
export { DarkSection, DarkContainer, DarkDivider } from '@/shared/ui/theme/dark/Layout.tsx';
