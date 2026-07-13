import { apiGetWithMeta } from '@/services/api/renderClient';
import { auth } from '@/services/firebase';

/**
 * Cache GET response theo localStorage + ETag, dùng để render "cache trước, đồng bộ ngầm sau"
 * (stale-while-revalidate) thay vì chặn UI chờ round-trip mỗi lần vào 1 màn hình.
 *
 * Cách dùng ở component: gọi `peekCache(namespace)` để lấy dữ liệu cũ hiển thị ngay (không
 * network), sau đó gọi `fetchWithStaleCache(...)` trong background và cập nhật state khi có
 * kết quả mới. Bản thân hàm fetch vẫn là 1 network round-trip thật (chỉ tiết kiệm băng thông
 * qua ETag/304) — phần "cảm giác nhanh hơn" nằm ở việc UI không đợi nó mới render.
 */

interface CacheEnvelope<T> {
  value: T;
  etag: string | null;
  savedAt: number;
}

function cacheStorageKey(namespace: string): string | null {
  const email = auth.currentUser?.email?.trim().toLowerCase() || localStorage.getItem('authEmail')?.trim().toLowerCase();
  return email ? `swr:${namespace}:${email}` : null;
}

function readEnvelope<T>(namespace: string): CacheEnvelope<T> | null {
  const key = cacheStorageKey(namespace);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeEnvelope<T>(namespace: string, value: T, etag: string | null): void {
  const key = cacheStorageKey(namespace);
  if (!key) return;
  try {
    const envelope: CacheEnvelope<T> = { value, etag, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.warn(`Failed to write stale-cache for ${namespace}:`, error);
  }
}

/** Đọc cache cũ ngay lập tức (đồng bộ, không network) — dùng để render optimistic trước. */
export function peekCache<T>(namespace: string): T | null {
  return readEnvelope<T>(namespace)?.value ?? null;
}

/** Gọi network kèm If-None-Match; nếu 304 trả lại cache cũ, nếu có dữ liệu mới thì ghi cache. */
export async function fetchWithStaleCache<T>(
  namespace: string,
  path: string,
  parse: (raw: unknown) => T,
): Promise<T> {
  const cached = readEnvelope<T>(namespace);
  const response = await apiGetWithMeta<unknown>(path, {
    authRequired: true,
    allowNotModified: true,
    headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
  });

  if (response.notModified) {
    return cached?.value ?? parse(null);
  }

  const parsed = parse(response.data);
  writeEnvelope(namespace, parsed, response.etag);
  return parsed;
}
