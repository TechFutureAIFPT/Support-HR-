/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
  readonly VITE_APP_MODE?: 'web' | 'desktop';
  readonly VITE_ENABLE_TELEMETRY?: 'true' | 'false';
  readonly VITE_GOOGLE_DRIVE_REDIRECT_URI?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
