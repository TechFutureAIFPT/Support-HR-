/**
 * Theme System — Barrel Export
 * Light-only theme system with legacy component exports
 */

// Core Provider & Hooks
export { ThemeProvider, useTheme, useThemeVar, useThemeVars } from '@/context/theme/ThemeProvider.tsx';
export type { ThemeMode } from '@/context/theme/tokens.ts';


// Design Tokens
export { tokens, getToken, themeClasses } from '@/context/theme/tokens.ts';
export type { TokenKey } from '@/context/theme/tokens.ts';

// Legacy component exports kept for import compatibility.
export { DarkCard, DarkCardSkeleton } from '@/context/theme/dark/Card.tsx';
export { DarkButton } from '@/context/theme/dark/Button.tsx';
export { DarkInput } from '@/context/theme/dark/Input.tsx';
export { DarkBadge } from '@/context/theme/dark/Badge.tsx';
export { DarkProgressBar } from '@/context/theme/dark/ProgressBar.tsx';
export { DarkLoader } from '@/context/theme/dark/Loader.tsx';
export { DarkSection, DarkContainer, DarkDivider } from '@/context/theme/dark/Layout.tsx';
