const rawAppMode = import.meta.env.VITE_APP_MODE;
const rawTelemetry = import.meta.env.VITE_ENABLE_TELEMETRY;

export const APP_MODE = rawAppMode === 'desktop' ? 'desktop' : 'web';
export const IS_DESKTOP_APP = APP_MODE === 'desktop';
export const TELEMETRY_ENABLED = rawTelemetry
  ? rawTelemetry === 'true'
  : !IS_DESKTOP_APP;
