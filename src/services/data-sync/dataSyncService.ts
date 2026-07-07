import { apiDelete, apiGet, apiGetWithMeta, apiPost, pickArray } from '@/services/api/renderClient';
import type { AnalysisRunData } from '@/types';
import { readLocalUserSettings } from '@/services/settings/userSettingsService';

interface CacheEntryRecord {
  cacheKey: string;
  candidateData: any;
  timestamp?: number;
  jdHash?: string;
  weightsHash?: string;
  filtersHash?: string;
  fileInfo?: {
    name: string;
    size: number;
    lastModified: number;
  };
}

type QueryCacheEntry<T> = {
  etag: string | null;
  value: T;
};

const syncCacheEntryCache = new Map<string, QueryCacheEntry<any | null>>();
const syncCacheCollectionCache = new Map<string, QueryCacheEntry<Map<string, any>>>();
const syncHistoryCache = new Map<string, QueryCacheEntry<AnalysisRunData[]>>();

export class DataSyncService {
  static async syncCacheToFirebase(
    cacheKey: string,
    candidateData: any,
    jdHash: string,
    weightsHash: string,
    filtersHash: string,
    fileInfo: { name: string; size: number; lastModified: number }
  ): Promise<void> {
    if (!readLocalUserSettings().sync.autoSync) return;
    await apiPost(
      '/api/account/sync/cache',
      {
        cacheKey,
        candidateData,
        jdHash,
        weightsHash,
        filtersHash,
        fileInfo,
      },
      { authRequired: true }
    );
  }

  static async getCacheFromFirebase(cacheKey: string): Promise<any | null> {
    const cached = syncCacheEntryCache.get(cacheKey);
    const response = await apiGetWithMeta<unknown>(
      `/api/account/sync/cache/${encodeURIComponent(cacheKey)}`,
      {
        authRequired: true,
        allowNotModified: true,
        headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
      }
    );

    if (response.notModified) {
      return cached?.value ?? null;
    }

    let value: any | null = null;
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      const record = response.data as Record<string, unknown>;
      value = record.candidateData ?? record.data ?? record.entry ?? response.data;
    }
    syncCacheEntryCache.set(cacheKey, { etag: response.etag, value });
    return value;
  }

  static async getAllUserCacheFromFirebase(): Promise<Map<string, any>> {
    const cacheKey = 'all';
    const cached = syncCacheCollectionCache.get(cacheKey);
    const response = await apiGetWithMeta<unknown>('/api/account/sync/cache', {
      authRequired: true,
      allowNotModified: true,
      headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
    });
    if (response.notModified) {
      return cached?.value ?? new Map<string, any>();
    }

    const payload = response.data;
    const entries = pickArray<unknown>(payload, ['items', 'entries', 'cache', 'data']);
    const cacheMap = new Map<string, any>();

    if (entries.length > 0) {
      entries.forEach((raw) => {
        const entry = raw as CacheEntryRecord;
        if (entry.cacheKey) {
          cacheMap.set(entry.cacheKey, entry.candidateData);
        }
      });
      syncCacheCollectionCache.set(cacheKey, { etag: response.etag, value: cacheMap });
      return cacheMap;
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'candidateData' in (value as Record<string, unknown>)) {
          cacheMap.set(key, (value as Record<string, unknown>).candidateData);
        }
      });
    }

    syncCacheCollectionCache.set(cacheKey, { etag: response.etag, value: cacheMap });
    return cacheMap;
  }

  static async syncHistoryToFirebase(analysisData: AnalysisRunData): Promise<void> {
    if (!readLocalUserSettings().sync.autoSync) return;
    await apiPost('/api/account/sync/history', analysisData, { authRequired: true });
  }

  static async getHistoryFromFirebase(limitCount: number = 20): Promise<AnalysisRunData[]> {
    const cacheKey = String(limitCount);
    const cached = syncHistoryCache.get(cacheKey);
    const response = await apiGetWithMeta<unknown>(
      `/api/account/sync/history?limit_count=${limitCount}`,
      {
        authRequired: true,
        allowNotModified: true,
        headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
      }
    );

    if (response.notModified) {
      return cached?.value ?? [];
    }

    const items = pickArray<AnalysisRunData>(response.data, ['items', 'history', 'entries', 'data']);
    syncHistoryCache.set(cacheKey, { etag: response.etag, value: items });
    return items;
  }

  static async migrateLocalDataToFirebase(): Promise<void> {
    try {
      await this.migrateCacheFromLocalStorage();
      await this.migrateHistoryFromLocalStorage();
    } catch (error) {
      console.error('Error during data migration:', error);
    }
  }

  private static async migrateCacheFromLocalStorage(): Promise<void> {
    const localCache = localStorage.getItem('cvAnalysisCache');
    if (!localCache) return;

    try {
      const cacheData = JSON.parse(localCache) as Record<string, any>;
      await Promise.all(
        Object.entries(cacheData).map(([key, entry]) => this.syncCacheToFirebase(
          key,
          entry.candidateData,
          entry.jdHash,
          entry.weightsHash,
          entry.filtersHash,
          {
            name: key.split('_')[0] || 'unknown',
            size: entry.fileSize || 0,
            lastModified: entry.fileLastModified || 0,
          }
        ))
      );

      localStorage.removeItem('cvAnalysisCache');
    } catch (error) {
      console.error('Error migrating cache from localStorage:', error);
    }
  }

  private static async migrateHistoryFromLocalStorage(): Promise<void> {
    const sources = ['cvAnalysis.latest', 'cvFilterHistory', 'analysisHistory'];

    for (const source of sources) {
      const raw = localStorage.getItem(source);
      if (!raw) continue;

      try {
        if (source === 'cvAnalysis.latest') {
          await this.syncHistoryToFirebase(JSON.parse(raw) as AnalysisRunData);
        } else {
          const parsed = JSON.parse(raw) as AnalysisRunData[];
          if (Array.isArray(parsed)) {
            for (const entry of parsed) {
              if (entry?.job && entry?.candidates) {
                await this.syncHistoryToFirebase(entry);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error migrating history source ${source}:`, error);
      }
    }

    sources.forEach((source) => localStorage.removeItem(source));
  }

  static async loadDataFromFirebase(): Promise<void> {
    if (!readLocalUserSettings().sync.autoSync) return;
    try {
      const cacheMap = await this.getAllUserCacheFromFirebase();
      if (cacheMap.size > 0) {
        const cacheObject: Record<string, any> = {};
        cacheMap.forEach((value, key) => {
          cacheObject[key] = value;
        });
        localStorage.setItem('cvAnalysisCache', JSON.stringify(cacheObject));
      }

      const history = await this.getHistoryFromFirebase(50);
      if (history.length > 0) {
        localStorage.setItem('cvAnalysis.latest', JSON.stringify(history[0]));
        localStorage.setItem('analysisHistory', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error loading data from backend sync:', error);
    }
  }

  static async clearUserSyncedData(): Promise<void> {
    await apiDelete('/api/account/sync/cache', { authRequired: true });
  }

  static async getSyncStats(): Promise<{
    cacheEntries: number;
    historyEntries: number;
    lastSyncTime: Date | null;
  }> {
    const response = await apiGet<Record<string, unknown>>('/api/account/sync/stats', { authRequired: true });
    const lastSyncValue = response.lastSyncTime || response.last_sync_time || response.lastHistoryTime || null;

    return {
      cacheEntries: Number(response.cacheEntries || response.cache_entries || 0),
      historyEntries: Number(response.historyEntries || response.history_entries || 0),
      lastSyncTime: lastSyncValue ? new Date(String(lastSyncValue)) : null,
    };
  }
}
