import { apiGet, apiPost, pickArray } from '@/services/api/renderClient';

export interface AccountNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: number;
  actionUrl?: string;
}

function normalizeTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function normalizeType(value: unknown): AccountNotification['type'] {
  const normalized = String(value || 'info').toLowerCase();
  if (normalized === 'success' || normalized === 'warning' || normalized === 'error') return normalized;
  return 'info';
}

function normalizeNotification(raw: unknown): AccountNotification | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const id = String(item.id || item.notificationId || item.notification_id || '');
  if (!id) return null;

  return {
    id,
    title: String(item.title || item.heading || 'Thông báo'),
    message: String(item.message || item.content || item.description || ''),
    type: normalizeType(item.type || item.level || item.severity),
    read: Boolean(item.read ?? item.isRead ?? item.is_read),
    createdAt: normalizeTimestamp(item.createdAt || item.created_at || item.timestamp),
    actionUrl: typeof item.actionUrl === 'string'
      ? item.actionUrl
      : typeof item.action_url === 'string'
        ? item.action_url
        : undefined,
  };
}

export class NotificationService {
  static async list(limitCount: number = 20): Promise<AccountNotification[]> {
    const response = await apiGet<unknown>(
      `/api/account/notifications?limit_count=${limitCount}`,
      { authRequired: true, timeoutMs: 15000 },
    );

    return pickArray<unknown>(response, ['notifications', 'items', 'data', 'results'])
      .map(normalizeNotification)
      .filter((item): item is AccountNotification => Boolean(item));
  }

  static async markRead(notificationId: string): Promise<void> {
    await apiPost(
      `/api/account/notifications/${encodeURIComponent(notificationId)}/read`,
      undefined,
      { authRequired: true, timeoutMs: 15000 },
    );
  }

  static async markAllRead(): Promise<void> {
    await apiPost(
      '/api/account/notifications/read-all',
      undefined,
      { authRequired: true, timeoutMs: 15000 },
    );
  }
}
