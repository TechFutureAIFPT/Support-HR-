// Main responsive layout
export { default as ResponsiveLayout } from '@/components/shared/responsive/desktop/DesktopLayout';
export { default as TabletLayout } from '@/components/shared/responsive/tablet/TabletLayout';
export { default as MobileLayout } from '@/components/shared/responsive/mobile/MobileLayout';

// Hooks and utilities
export { useDeviceDetection, useBreakpoint, breakpoints } from '@/components/shared/responsive/useDeviceDetection';
export type { DeviceType } from '@/components/shared/responsive/useDeviceDetection';