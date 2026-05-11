import { apiDelete, apiGet, apiPost, pickArray } from '@/lib/services/api/renderClient';
import type { AnalysisRunData } from '@/shared/types';

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

export class DataSyncService {
  static async syncCacheToFirebase(
    cacheKey: string,
    candidateData: any,
    jdHash: string,
    weightsHash: string,
    filtersHash: string,
    fileInfo: { name: string; size: number; lastModified: number }
  ): Promise<void> {
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
    const response = await apiGet<unknown>(
      `/api/account/sync/cache/${encodeURIComponent(cacheKey)}`,
      { authRequired: true }
    );

    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const record = response as Record<string, unknown>;
      return record.candidateData ?? record.data ?? record.entry ?? response;
    }

    return null;
  }

  static async getAllUserCacheFromFirebase(): Promise<Map<string, any>> {
    const response = await apiGet<unknown>('/api/account/sync/cache', { authRequired: true });
    const entries = pickArray<unknown>(response, ['items', 'entries', 'cache', 'data']);
    const cacheMap = new Map<string, any>();

    if (entries.length > 0) {
      entries.forEach((raw) => {
        const entry = raw as CacheEntryRecord;
        if (entry.cacheKey) {
          cacheMap.set(entry.cacheKey, entry.candidateData);
        }
      });
      return cacheMap;
    }

    if (response && typeof response === 'object' && !Array.isArray(response)) {
      Object.entries(response as Record<string, unknown>).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'candidateData' in (value as Record<string, unknown>)) {
          cacheMap.set(key, (value as Record<string, unknown>).candidateData);
        }
      });
    }

    return cacheMap;
  }

  static async syncHistoryToFirebase(analysisData: AnalysisRunData): Promise<void> {
    await apiPost('/api/account/sync/history', analysisData, { authRequired: true });
  }

  static async getHistoryFromFirebase(limitCount: number = 20): Promise<AnalysisRunData[]> {
    const response = await apiGet<unknown>(
      `/api/account/sync/history?limit_count=${limitCount}`,
      { authRequired: true }
    );

    return pickArray<AnalysisRunData>(response, ['items', 'history', 'entries', 'data']);
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
    localStorage.removeItem('cvAnalysisCache');
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
