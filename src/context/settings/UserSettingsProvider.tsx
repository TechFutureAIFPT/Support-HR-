import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser } from '@/services/auth/authTypes';
import type { UserSettings, UserSettingsPatch } from '@/types';
import {
  createDefaultUserSettings,
  fetchRemoteUserSettings,
  mergeUserSettings,
  patchRemoteUserSettings,
  readLocalUserSettings,
  readUserSettingsDirtyFlag,
  resetRemoteUserSettings,
  syncRemoteUserSettings,
  USER_SETTINGS_EVENT,
  writeLocalUserSettings,
} from '@/services/settings/userSettingsService';
import { useTheme } from '@/context/theme/ThemeProvider';

type SyncStatus = 'local' | 'pending' | 'synced' | 'error';
type SaveSyncMode = 'background' | 'await-remote';

interface SaveSettingsOptions {
  saveKey?: string;
  syncMode?: SaveSyncMode;
}

interface UserSettingsContextValue {
  settings: UserSettings;
  isHydrating: boolean;
  syncStatus: SyncStatus;
  syncError: string;
  saveSettings: (patch: UserSettingsPatch, options?: SaveSettingsOptions) => Promise<UserSettings>;
  resetSettings: () => Promise<UserSettings>;
  updateAccountSnapshot: (patch: UserSettingsPatch['account']) => void;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

function buildSeed(
  currentUser: AuthUser | null,
  fallbackEmail?: string,
  fallbackDisplayName?: string,
  fallbackAvatar?: string | null,
) {
  return {
    email: currentUser?.email || fallbackEmail || '',
    displayName: fallbackDisplayName || currentUser?.displayName || '',
    avatar: fallbackAvatar ?? currentUser?.photoURL ?? null,
  };
}

function mergeSettingsPatch(
  base: UserSettingsPatch | null | undefined,
  patch: UserSettingsPatch,
): UserSettingsPatch {
  return {
    ...(base || {}),
    ...(patch.ui ? { ui: { ...(base?.ui || {}), ...patch.ui } } : {}),
    ...(patch.account ? { account: { ...(base?.account || {}), ...patch.account } } : {}),
    ...(patch.workflow ? { workflow: { ...(base?.workflow || {}), ...patch.workflow } } : {}),
    ...(patch.notifications ? { notifications: { ...(base?.notifications || {}), ...patch.notifications } } : {}),
    ...(patch.sync ? { sync: { ...(base?.sync || {}), ...patch.sync } } : {}),
  };
}

export const UserSettingsProvider: React.FC<{
  children: React.ReactNode;
  currentUser: AuthUser | null;
  fallbackEmail?: string;
  fallbackDisplayName?: string;
  fallbackAvatar?: string | null;
}> = ({
  children,
  currentUser,
  fallbackEmail,
  fallbackDisplayName,
  fallbackAvatar,
}) => {
  const { setAccessibleMode, setReducedMotion, setTheme } = useTheme();
  const seed = useMemo(
    () => buildSeed(currentUser, fallbackEmail, fallbackDisplayName, fallbackAvatar),
    [currentUser, fallbackAvatar, fallbackDisplayName, fallbackEmail],
  );
  const [settings, setSettings] = useState<UserSettings>(() => readLocalUserSettings(seed));
  const [isHydrating, setIsHydrating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => readUserSettingsDirtyFlag() ? 'pending' : currentUser ? 'pending' : 'local');
  const [syncError, setSyncError] = useState('');
  const queuedPatchRef = useRef<UserSettingsPatch | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);
  const localChangeVersionRef = useRef(0);

  const clearFlushTimer = useCallback(() => {
    if (!flushTimerRef.current) return;
    clearTimeout(flushTimerRef.current);
    flushTimerRef.current = null;
  }, []);

  useEffect(() => {
    setSettings((prev) => {
      const next = mergeUserSettings(prev, { account: seed });
      writeLocalUserSettings(next, readUserSettingsDirtyFlag());
      return next;
    });
  }, [seed.avatar, seed.displayName, seed.email]);

  useEffect(() => {
    setAccessibleMode(settings.ui.accessibleMode);
    setReducedMotion(settings.ui.reducedMotion);
    setTheme(settings.ui.theme as 'light' | 'dark' | 'system');
  }, [setAccessibleMode, setReducedMotion, setTheme, settings.ui.accessibleMode, settings.ui.reducedMotion, settings.ui.theme]);

  useEffect(() => {
    const handleExternalUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ settings?: UserSettings }>).detail;
      if (detail?.settings) {
        setSettings(detail.settings);
      } else {
        setSettings(readLocalUserSettings(seed));
      }
    };

    window.addEventListener(USER_SETTINGS_EVENT, handleExternalUpdate as EventListener);
    return () => {
      window.removeEventListener(USER_SETTINGS_EVENT, handleExternalUpdate as EventListener);
    };
  }, [seed]);

  useEffect(() => {
    let isDisposed = false;

    const hydrate = async () => {
      if (!currentUser?.email) {
        setSettings(readLocalUserSettings(seed));
        setSyncStatus(readUserSettingsDirtyFlag() ? 'pending' : 'local');
        return;
      }

      setIsHydrating(true);
      setSyncError('');

      try {
        const remoteSettings = await fetchRemoteUserSettings(seed);
        const localSettings = readLocalUserSettings(seed);
        const dirty = readUserSettingsDirtyFlag();
        const mergedSettings = dirty ? mergeUserSettings(remoteSettings, localSettings) : remoteSettings;
        writeLocalUserSettings(mergedSettings, dirty);
        if (isDisposed) return;
        setSettings(mergedSettings);
        setSyncStatus(dirty ? 'pending' : 'synced');

        if (dirty) {
          try {
            const synced = await syncRemoteUserSettings(mergedSettings, seed);
            if (isDisposed) return;
            setSettings(synced);
            setSyncStatus('synced');
          } catch (error) {
            if (isDisposed) return;
            setSyncStatus('error');
            setSyncError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ Ä‘á»“ng bá»™ cÃ i Ä‘áº·t.');
          }
        }
      } catch (error) {
        if (isDisposed) return;
        setSettings(readLocalUserSettings(seed));
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº£i cÃ i Ä‘áº·t tá»« mÃ¡y chá»§.');
      } finally {
        if (!isDisposed) setIsHydrating(false);
      }
    };

    void hydrate();

    return () => {
      isDisposed = true;
    };
  }, [currentUser, seed]);

  const flushQueuedSettings = useCallback(async (): Promise<UserSettings> => {
    if (isFlushingRef.current) {
      return readLocalUserSettings(seed);
    }

    const patch = queuedPatchRef.current;
    if (!patch) {
      return readLocalUserSettings(seed);
    }

    if (!currentUser?.email) {
      queuedPatchRef.current = null;
      setSyncStatus('local');
      return readLocalUserSettings(seed);
    }

    queuedPatchRef.current = null;
    clearFlushTimer();
    isFlushingRef.current = true;
    const flushVersion = localChangeVersionRef.current;

    setSyncStatus('pending');
    setSyncError('');

    try {
      const synced = await patchRemoteUserSettings(patch, seed, { persistLocal: false });
      const hasNewerLocalChanges = flushVersion !== localChangeVersionRef.current || queuedPatchRef.current !== null;

      if (hasNewerLocalChanges) {
        const latestLocal = readLocalUserSettings(seed);
        writeLocalUserSettings(latestLocal, true);
        setSettings(latestLocal);
        setSyncStatus('pending');
        return latestLocal;
      }

      writeLocalUserSettings(synced, false);
      setSettings(synced);
      setSyncStatus('synced');
      return synced;
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ lÆ°u cÃ i Ä‘áº·t.');
      return readLocalUserSettings(seed);
    } finally {
      isFlushingRef.current = false;
    }
  }, [clearFlushTimer, currentUser, seed]);

  const scheduleQueuedSettingsFlush = useCallback(() => {
    if (!currentUser?.email) return;
    clearFlushTimer();
    flushTimerRef.current = setTimeout(() => {
      void flushQueuedSettings();
    }, 300);
  }, [clearFlushTimer, currentUser, flushQueuedSettings]);

  const saveSettings = useCallback(async (patch: UserSettingsPatch, options?: SaveSettingsOptions) => {
    const syncMode = options?.syncMode ?? 'background';
    const optimistic = mergeUserSettings(readLocalUserSettings(seed), patch);
    writeLocalUserSettings(optimistic, Boolean(currentUser?.email));
    setSettings(optimistic);
    localChangeVersionRef.current += 1;

    if (!currentUser?.email) {
      setSyncStatus('local');
      return optimistic;
    }

    if (syncMode === 'background') {
      queuedPatchRef.current = mergeSettingsPatch(queuedPatchRef.current, patch);
      setSyncStatus('pending');
      setSyncError('');
      scheduleQueuedSettingsFlush();
      return optimistic;
    }

    clearFlushTimer();
    queuedPatchRef.current = null;
    setSyncStatus('pending');
    setSyncError('');

    try {
      const synced = await patchRemoteUserSettings(patch, seed, { persistLocal: false });
      writeLocalUserSettings(synced, false);
      setSettings(synced);
      setSyncStatus('synced');
      return synced;
    } catch (error) {
      writeLocalUserSettings(optimistic, true);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ lÆ°u cÃ i Ä‘áº·t.');
      return optimistic;
    }
  }, [clearFlushTimer, currentUser, scheduleQueuedSettingsFlush, seed]);

  const resetSettings = useCallback(async () => {
    const fallback = createDefaultUserSettings(seed);

    clearFlushTimer();
    queuedPatchRef.current = null;

    if (!currentUser?.email) {
      writeLocalUserSettings(fallback, false);
      setSettings(fallback);
      setSyncStatus('local');
      setSyncError('');
      return fallback;
    }

    setSyncStatus('pending');
    setSyncError('');

    try {
      const reset = await resetRemoteUserSettings(seed);
      setSettings(reset);
      setSyncStatus('synced');
      return reset;
    } catch (error) {
      writeLocalUserSettings(fallback, true);
      setSettings(fallback);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ Ä‘áº·t láº¡i cÃ i Ä‘áº·t.');
      return fallback;
    }
  }, [clearFlushTimer, currentUser, seed]);

  const updateAccountSnapshot = useCallback((patch?: UserSettingsPatch['account']) => {
    if (!patch) return;
    const next = mergeUserSettings(readLocalUserSettings(seed), { account: patch });
    writeLocalUserSettings(next, Boolean(currentUser?.email));
    setSettings(next);
  }, [currentUser, seed]);

  const value = useMemo<UserSettingsContextValue>(() => ({
    settings,
    isHydrating,
    syncStatus,
    syncError,
    saveSettings,
    resetSettings,
    updateAccountSnapshot,
  }), [isHydrating, resetSettings, saveSettings, settings, syncError, syncStatus, updateAccountSnapshot]);

  useEffect(() => () => clearFlushTimer(), [clearFlushTimer]);

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
};

export function useUserSettings(): UserSettingsContextValue {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return context;
}
