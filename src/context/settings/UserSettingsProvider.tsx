import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

interface UserSettingsContextValue {
  settings: UserSettings;
  isHydrating: boolean;
  syncStatus: SyncStatus;
  syncError: string;
  saveSettings: (patch: UserSettingsPatch) => Promise<UserSettings>;
  resetSettings: () => Promise<UserSettings>;
  updateAccountSnapshot: (patch: UserSettingsPatch['account']) => void;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

function buildSeed(currentUser: AuthUser | null, fallbackEmail?: string, fallbackDisplayName?: string, fallbackAvatar?: string | null) {
  return {
    email: currentUser?.email || fallbackEmail || '',
    displayName: fallbackDisplayName || currentUser?.displayName || '',
    avatar: fallbackAvatar ?? currentUser?.photoURL ?? null,
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
  const { setAccessibleMode, setReducedMotion } = useTheme();
  const seed = useMemo(
    () => buildSeed(currentUser, fallbackEmail, fallbackDisplayName, fallbackAvatar),
    [currentUser, fallbackAvatar, fallbackDisplayName, fallbackEmail],
  );
  const [settings, setSettings] = useState<UserSettings>(() => readLocalUserSettings(seed));
  const [isHydrating, setIsHydrating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => readUserSettingsDirtyFlag() ? 'pending' : currentUser ? 'pending' : 'local');
  const [syncError, setSyncError] = useState('');

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
  }, [setAccessibleMode, setReducedMotion, settings.ui.accessibleMode, settings.ui.reducedMotion]);

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
            setSyncError(error instanceof Error ? error.message : 'Không thể đồng bộ cài đặt.');
          }
        }
      } catch (error) {
        if (isDisposed) return;
        setSettings(readLocalUserSettings(seed));
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'Không thể tải cài đặt từ máy chủ.');
      } finally {
        if (!isDisposed) setIsHydrating(false);
      }
    };

    void hydrate();

    return () => {
      isDisposed = true;
    };
  }, [currentUser, seed]);

  const saveSettings = useCallback(async (patch: UserSettingsPatch) => {
    const optimistic = mergeUserSettings(readLocalUserSettings(seed), patch);
    writeLocalUserSettings(optimistic, Boolean(currentUser?.email));
    setSettings(optimistic);

    if (!currentUser?.email) {
      setSyncStatus('local');
      return optimistic;
    }

    setSyncStatus('pending');
    setSyncError('');

    try {
      const synced = await patchRemoteUserSettings(patch, seed);
      setSettings(synced);
      setSyncStatus('synced');
      return synced;
    } catch (error) {
      writeLocalUserSettings(optimistic, true);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Không thể lưu cài đặt.');
      return optimistic;
    }
  }, [currentUser, seed]);

  const resetSettings = useCallback(async () => {
    const fallback = createDefaultUserSettings(seed);

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
      setSyncError(error instanceof Error ? error.message : 'Không thể đặt lại cài đặt.');
      return fallback;
    }
  }, [currentUser, seed]);

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

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
};

export function useUserSettings(): UserSettingsContextValue {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return context;
}
