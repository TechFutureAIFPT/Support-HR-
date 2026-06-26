import { apiGet, apiPatch, apiPost } from '@/services/api/renderClient';
import type {
  HistoryRetention,
  RecruiterInfo,
  SidebarDensity,
  UserSettings,
  UserSettingsPatch,
} from '@/types';

export const USER_SETTINGS_LOCAL_KEY = 'supporthr.userSettings.snapshot';
export const USER_SETTINGS_DIRTY_KEY = 'supporthr.userSettings.dirty';
export const USER_SETTINGS_EVENT = 'supporthr:settings-updated';

type AccountSeed = {
  email?: string;
  displayName?: string;
  avatar?: string | null;
};

function normalizeSidebarDensity(value: unknown): SidebarDensity {
  return value === 'cozy' ? 'cozy' : 'compact';
}

function normalizeTheme(value: unknown): import('@/types').UserSettingsTheme {
  if (value === 'dark' || value === 'system') return value;
  return 'light';
}

function normalizeLanguage(value: unknown): import('@/types').UserSettingsLanguage {
  if (value === 'en-US') return value;
  return 'vi-VN';
}

function normalizeHistoryRetention(value: unknown): HistoryRetention {
  if (value === 100 || value === 200) return value;
  return 50;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function createDefaultUserSettings(seed: AccountSeed = {}): UserSettings {
  return {
    version: 1,
    ui: {
      sidebarDensity: 'compact',
      accessibleMode: false,
      reducedMotion: false,
      language: 'vi-VN',
      theme: 'light',
    },
    account: {
      displayName: seed.displayName || '',
      avatar: seed.avatar || null,
      email: seed.email || '',
    },
    workflow: {
      autoSaveDraft: true,
      restoreDraft: true,
      rememberScoringConfig: true,
      autoSaveHistory: true,
      autoFillHardFiltersOnContinue: false,
      newSessionMode: 'reset',
    },
    notifications: {
      analysisComplete: true,
      syncErrors: true,
      historySaved: true,
      sidebarBadge: true,
      inAppOnly: true,
    },
    sync: {
      autoSync: true,
      historyRetention: 50,
      lastSyncedAt: null,
    },
  };
}

function readLegacyBootstrap(seed: AccountSeed): Partial<UserSettings> {
  if (typeof window === 'undefined') return {};

  return {
    ui: {
      sidebarDensity: normalizeSidebarDensity(window.localStorage.getItem('supporthr.sidebar.density')),
      accessibleMode: window.localStorage.getItem('accessibleMode') === 'true',
      reducedMotion: window.localStorage.getItem('supporthr.reducedMotion') === 'true',
      language: 'vi-VN',
      theme: 'light',
    },
    account: {
      displayName: seed.displayName || '',
      avatar: seed.avatar || null,
      email: seed.email || '',
    },
    notifications: {
      analysisComplete: true,
      syncErrors: true,
      historySaved: true,
      sidebarBadge: window.localStorage.getItem('supporthr.sidebar.notifications') !== 'false',
      inAppOnly: true,
    },
  };
}

export function mergeUserSettings(base: UserSettings, patch?: UserSettingsPatch | Partial<UserSettings>): UserSettings {
  if (!patch) return base;

  return {
    ...base,
    version: 1,
    ui: {
      ...base.ui,
      ...(patch.ui || {}),
    },
    account: {
      ...base.account,
      ...(patch.account || {}),
      avatar: patch.account?.avatar === undefined ? base.account.avatar : patch.account.avatar,
    },
    workflow: {
      ...base.workflow,
      ...(patch.workflow || {}),
    },
    notifications: {
      ...base.notifications,
      ...(patch.notifications || {}),
      inAppOnly: true,
    },
    sync: {
      ...base.sync,
      ...(patch.sync || {}),
    },
  };
}

export function normalizeUserSettings(raw: unknown, seed: AccountSeed = {}): UserSettings {
  const defaults = mergeUserSettings(createDefaultUserSettings(seed), readLegacyBootstrap(seed));
  const payload = toRecord(raw);

  const nested =
    toRecord(payload.settings).version ||
    payload.settings
      ? toRecord(payload.settings)
      : toRecord(payload.data).version || toRecord(payload.data).settings
        ? toRecord(toRecord(payload.data).settings || payload.data)
        : payload;

  const ui = toRecord(nested.ui);
  const account = toRecord(nested.account);
  const workflow = toRecord(nested.workflow);
  const notifications = toRecord(nested.notifications);
  const sync = toRecord(nested.sync);

  return {
    version: 1,
    ui: {
      sidebarDensity: normalizeSidebarDensity(ui.sidebarDensity ?? defaults.ui.sidebarDensity),
      accessibleMode: normalizeBoolean(ui.accessibleMode, defaults.ui.accessibleMode),
      reducedMotion: normalizeBoolean(ui.reducedMotion, defaults.ui.reducedMotion),
      language: normalizeLanguage(ui.language ?? defaults.ui.language),
      theme: normalizeTheme(ui.theme ?? defaults.ui.theme),
    },
    account: {
      displayName: String(account.displayName ?? seed.displayName ?? defaults.account.displayName),
      avatar: account.avatar === null ? null : String(account.avatar ?? seed.avatar ?? defaults.account.avatar ?? '') || null,
      email: String(account.email ?? seed.email ?? defaults.account.email),
      ...((() => {
        const ri = account.recruiterInfo && typeof account.recruiterInfo === 'object'
          ? account.recruiterInfo as Record<string, unknown>
          : null;
        if (!ri) return {};
        const info: RecruiterInfo = {
          title:          String(ri.title          ?? ''),
          company:        String(ri.company        ?? ''),
          department:     String(ri.department     ?? ''),
          phone:          String(ri.phone          ?? ''),
          emailSignature: String(ri.emailSignature ?? ''),
        };
        return { recruiterInfo: info };
      })()),
    },
    workflow: {
      autoSaveDraft: normalizeBoolean(workflow.autoSaveDraft, defaults.workflow.autoSaveDraft),
      restoreDraft: normalizeBoolean(workflow.restoreDraft, defaults.workflow.restoreDraft),
      rememberScoringConfig: normalizeBoolean(workflow.rememberScoringConfig, defaults.workflow.rememberScoringConfig),
      autoSaveHistory: normalizeBoolean(workflow.autoSaveHistory, defaults.workflow.autoSaveHistory),
      autoFillHardFiltersOnContinue: normalizeBoolean(
        workflow.autoFillHardFiltersOnContinue,
        defaults.workflow.autoFillHardFiltersOnContinue,
      ),
      newSessionMode: workflow.newSessionMode === 'keep-config' ? 'keep-config' : 'reset',
      fixedJD: (() => {
        const raw = toRecord(workflow.fixedJD);
        if (!raw) return undefined;
        const jdText = typeof raw.jdText === 'string' ? raw.jdText.trim() : '';
        return {
          enabled: normalizeBoolean(raw.enabled, false),
          name: String(raw.name || ''),
          jdText,
          savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : Date.now(),
          scoringEnabled: normalizeBoolean(raw.scoringEnabled, false),
          weights: raw.weights && typeof raw.weights === 'object' ? raw.weights as Record<string, unknown> : undefined,
          hardFilters: raw.hardFilters && typeof raw.hardFilters === 'object' ? raw.hardFilters as Record<string, unknown> : undefined,
        } as unknown as import('@/types').FixedJDConfig;
      })(),
    },
    notifications: {
      analysisComplete: normalizeBoolean(notifications.analysisComplete, defaults.notifications.analysisComplete),
      syncErrors: normalizeBoolean(notifications.syncErrors, defaults.notifications.syncErrors),
      historySaved: normalizeBoolean(notifications.historySaved, defaults.notifications.historySaved),
      sidebarBadge: normalizeBoolean(notifications.sidebarBadge, defaults.notifications.sidebarBadge),
      inAppOnly: true,
    },
    sync: {
      autoSync: normalizeBoolean(sync.autoSync, defaults.sync.autoSync),
      historyRetention: normalizeHistoryRetention(sync.historyRetention ?? defaults.sync.historyRetention),
      lastSyncedAt: normalizeNumber(sync.lastSyncedAt ?? defaults.sync.lastSyncedAt),
    },
  };
}

export function readUserSettingsDirtyFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(USER_SETTINGS_DIRTY_KEY) === 'true';
}

function writeUserSettingsDirtyFlag(isDirty: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_SETTINGS_DIRTY_KEY, String(isDirty));
}

function dispatchUserSettingsEvent(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(USER_SETTINGS_EVENT, { detail: { settings } }));
}

export function writeLocalUserSettings(settings: UserSettings, isDirty: boolean): UserSettings {
  if (typeof window === 'undefined') return settings;
  window.localStorage.setItem(USER_SETTINGS_LOCAL_KEY, JSON.stringify(settings));
  window.localStorage.setItem('supporthr.sidebar.density', settings.ui.sidebarDensity);
  window.localStorage.setItem('supporthr.sidebar.notifications', String(settings.notifications.sidebarBadge));
  window.localStorage.setItem('accessibleMode', String(settings.ui.accessibleMode));
  window.localStorage.setItem('supporthr.reducedMotion', String(settings.ui.reducedMotion));
  writeUserSettingsDirtyFlag(isDirty);
  dispatchUserSettingsEvent(settings);
  return settings;
}

export function readLocalUserSettings(seed: AccountSeed = {}): UserSettings {
  if (typeof window === 'undefined') return createDefaultUserSettings(seed);

  try {
    const raw = window.localStorage.getItem(USER_SETTINGS_LOCAL_KEY);
    if (!raw) {
      const bootstrapped = mergeUserSettings(createDefaultUserSettings(seed), readLegacyBootstrap(seed));
      return writeLocalUserSettings(bootstrapped, false);
    }

    const settings = normalizeUserSettings(JSON.parse(raw), seed);
    return mergeUserSettings(settings, { account: seed });
  } catch {
    return createDefaultUserSettings(seed);
  }
}

export async function fetchRemoteUserSettings(seed: AccountSeed = {}): Promise<UserSettings> {
  const response = await apiGet<unknown>('/api/account/settings', { authRequired: true });
  return normalizeUserSettings(response, seed);
}

export async function patchRemoteUserSettings(
  patch: UserSettingsPatch,
  seed: AccountSeed = {},
): Promise<UserSettings> {
  const response = await apiPatch<unknown>('/api/account/settings', patch, { authRequired: true });
  const candidate = response ? normalizeUserSettings(response, seed) : mergeUserSettings(readLocalUserSettings(seed), patch);
  const synced = mergeUserSettings(candidate, { sync: { lastSyncedAt: Date.now() } });
  writeLocalUserSettings(synced, false);
  return synced;
}

export async function syncRemoteUserSettings(settings: UserSettings, seed: AccountSeed = {}): Promise<UserSettings> {
  const response = await apiPatch<unknown>('/api/account/settings', settings, { authRequired: true });
  const candidate = response ? normalizeUserSettings(response, seed) : settings;
  const synced = mergeUserSettings(candidate, { sync: { lastSyncedAt: Date.now() } });
  writeLocalUserSettings(synced, false);
  return synced;
}

export async function resetRemoteUserSettings(seed: AccountSeed = {}): Promise<UserSettings> {
  const response = await apiPost<unknown>('/api/account/settings/reset', undefined, { authRequired: true });
  const candidate = response ? normalizeUserSettings(response, seed) : createDefaultUserSettings(seed);
  const synced = mergeUserSettings(candidate, { sync: { lastSyncedAt: Date.now() } });
  writeLocalUserSettings(synced, false);
  return synced;
}
