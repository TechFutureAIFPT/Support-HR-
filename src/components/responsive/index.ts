// Main responsive layout
export { default as ResponsiveLayout } from '@/components/responsive/desktop/DesktopLayout';
export { default as TabletLayout } from '@/components/responsive/tablet/TabletLayout';
export { default as MobileLayout } from '@/components/responsive/mobile/MobileLayout';

// Hooks and utilities
export { useDeviceDetection, useBreakpoint, breakpoints } from '@/hooks/useDeviceDetection';
export type { DeviceType } from '@/hooks/useDeviceDetection';