// Main responsive layout
export { default as ResponsiveLayout } from '@/shared/components/responsive/desktop/DesktopLayout';
export { default as TabletLayout } from '@/shared/components/responsive/tablet/TabletLayout';
export { default as MobileLayout } from '@/shared/components/responsive/mobile/MobileLayout';

// Hooks and utilities
export { useDeviceDetection, useBreakpoint, breakpoints } from '@/shared/components/responsive/useDeviceDetection';
export type { DeviceType } from '@/shared/components/responsive/useDeviceDetection';