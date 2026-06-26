import { apiGet, apiPatch, apiPost, apiPut, pickArray, pickObject } from '@/services/api/renderClient';
import type { RecruiterInfo } from '@/types';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  avatar?: string;
  recruiterInfo?: RecruiterInfo;
  createdAt: any;
  updatedAt: any;
}

export interface UserCVHistory {
  id?: string;
  uid: string;
  email: string;
  jdText: string;
  jdTitle: string;
  cvCount: number;
  timestamp: any;
  results?: any[];
}

function normalizeTimestamp(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && typeof (value as Record<string, unknown>).seconds === 'number') {
    return Number((value as Record<string, unknown>).seconds) * 1000;
  }
  return Date.now();
}

function normalizeUserProfile(raw: unknown): UserProfile | null {
  const profile = pickObject<Record<string, unknown>>(raw, ['profile', 'user', 'data']);
  if (!profile) return null;

  return {
    uid: String(profile.uid || ''),
    email: String(profile.email || ''),
    displayName: profile.displayName ? String(profile.displayName) : undefined,
    avatar: profile.avatar ? String(profile.avatar) : undefined,
    createdAt: profile.createdAt ?? Date.now(),
    updatedAt: profile.updatedAt ?? Date.now(),
  };
}

function normalizeUserCVHistory(raw: unknown): UserCVHistory {
  const record = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    id: record.id ? String(record.id) : undefined,
    uid: String(record.uid || ''),
    email: String(record.email || ''),
    jdText: String(record.jdText || ''),
    jdTitle: String(record.jdTitle || 'Vị trí tuyển dụng'),
    cvCount: Number(record.cvCount || 0),
    timestamp: normalizeTimestamp(record.timestamp),
    results: Array.isArray(record.results) ? record.results : [],
  };
}

export class UserProfileService {
  static async saveUserProfile(uid: string, email: string, displayName?: string, avatar?: string, recruiterInfo?: RecruiterInfo): Promise<void> {
    await apiPut(
      '/api/account/profile',
      {
        email,
        displayName,
        avatar,
        provider: 'firebase-auth',
        ...(recruiterInfo ? {
          recruiterTitle: recruiterInfo.title,
          recruiterCompany: recruiterInfo.company,
          recruiterDepartment: recruiterInfo.department,
          recruiterPhone: recruiterInfo.phone,
          emailSignature: recruiterInfo.emailSignature,
        } : {}),
      },
      { authRequired: true }
    );
  }

  static async getUserProfile(_uid: string): Promise<UserProfile | null> {
    const response = await apiGet<unknown>('/api/account/profile', { authRequired: true });
    return normalizeUserProfile(response);
  }

  static async updateUserAvatar(_uid: string, avatar: string): Promise<void> {
    await apiPatch('/api/account/profile/avatar', { avatar }, { authRequired: true });
  }

  static async saveCVHistory(uid: string, email: string, historyData: Omit<UserCVHistory, 'uid' | 'email' | 'timestamp' | 'id'>): Promise<void> {
    await apiPost(
      '/api/account/profile/cv-history',
      {
        email,
        jdText: historyData.jdText ?? '',
        jdTitle: historyData.jdTitle ?? 'Vị trí tuyển dụng',
        cvCount: typeof historyData.cvCount === 'number' ? historyData.cvCount : 0,
        results: Array.isArray(historyData.results) ? historyData.results : [],
      },
      { authRequired: true }
    );
  }

  static async getUserCVHistory(_uid: string, limitCount: number = 50): Promise<UserCVHistory[]> {
    const response = await apiGet<unknown>(
      `/api/account/profile/cv-history?limit_count=${limitCount}`,
      { authRequired: true }
    );

    return pickArray<unknown>(response, ['items', 'history', 'entries', 'data']).map(normalizeUserCVHistory);
  }

  static async cleanupOldHistory(_uid: string, keepCount: number = 100): Promise<void> {
    await apiPost(
      `/api/account/profile/cv-history/cleanup?keep_count=${keepCount}`,
      undefined,
      { authRequired: true }
    );
  }

  static async migrateLocalDataToFirebase(uid: string, email: string): Promise<void> {
    const localAvatar = localStorage.getItem(`avatar_${email}`) || localStorage.getItem('userAvatar');
    const localHistory = localStorage.getItem('cvFilterHistory');

    const history = (() => {
      if (!localHistory) return [];

      try {
        const parsed = JSON.parse(localHistory) as Array<Record<string, unknown>>;
        return parsed.map((entry) => ({
          jdText: String(entry.jdText || ''),
          jdTitle: String(entry.jdTitle || 'Vị trí tuyển dụng'),
          cvCount: Number(entry.cvCount || 0),
          results: Array.isArray(entry.results) ? entry.results : [],
        }));
      } catch {
        return [];
      }
    })();

    if (!localAvatar && history.length === 0) return;

    await apiPost(
      '/api/account/profile/migrate-local',
      {
        avatar: localAvatar || null,
        history,
      },
      { authRequired: true }
    );

    localStorage.removeItem('cvFilterHistory');
    localStorage.removeItem('userAvatar');
  }
}
