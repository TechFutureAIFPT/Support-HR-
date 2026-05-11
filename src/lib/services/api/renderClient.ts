import { auth } from '@/lib/services/firebase';
import { SAFE_ERROR_MESSAGES, sanitizeApiErrorMessage } from '@/shared/utils/errorMessages';

export const RENDER_API_URL = 'https://backendsupporthr.onrender.com';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  authRequired?: boolean;
  timeoutMs?: number;
  body?: BodyInit | null;
  jsonBody?: unknown;
}

function buildUrl(path: string): string {
  return path.startsWith('http') ? path : `${RENDER_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;

  const record = payload as Record<string, unknown>;

  if (typeof record.detail === 'string') return sanitizeApiErrorMessage(record.detail, fallback);
  if (typeof record.message === 'string') return sanitizeApiErrorMessage(record.message, fallback);
  if (typeof record.error === 'string') return sanitizeApiErrorMessage(record.error, fallback);

  if (Array.isArray(record.detail)) {
    const combined = record.detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).msg === 'string') {
          return (item as Record<string, unknown>).msg as string;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');

    if (combined) return sanitizeApiErrorMessage(combined, fallback);
  }

  return fallback;
}

async function getAuthorizationHeader(authRequired: boolean): Promise<string | undefined> {
  if (!authRequired) return undefined;

  const user = auth.currentUser;
  if (!user) {
    throw new Error(SAFE_ERROR_MESSAGES.auth);
  }

  const token = await user.getIdToken();
  return `Bearer ${token}`;
}

async function request<T>(
  method: ApiMethod,
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 120000;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(options.headers);
    const authHeader = await getAuthorizationHeader(options.authRequired ?? false);

    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    let body = options.body ?? null;
    if (options.jsonBody !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.jsonBody);
    }

    const response = await fetch(buildUrl(path), {
      ...options,
      method,
      body,
      headers,
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        })()
      : null;

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, SAFE_ERROR_MESSAGES.generic));
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(SAFE_ERROR_MESSAGES.network);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function pickArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (record.data && typeof record.data === 'object') {
    for (const key of keys) {
      const nestedValue = (record.data as Record<string, unknown>)[key];
      if (Array.isArray(nestedValue)) return nestedValue as T[];
    }
  }

  return [];
}

export function pickObject<T extends Record<string, unknown>>(payload: unknown, keys: string[]): T | null {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;

    for (const key of keys) {
      const value = record[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as T;
      }
    }

    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      const nested = record.data as Record<string, unknown>;
      for (const key of keys) {
        const value = nested[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return value as T;
        }
      }
    }

    return record as T;
  }

  return null;
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return request<T>('GET', path, options);
}

export async function apiPost<T>(path: string, jsonBody?: unknown, options?: ApiRequestOptions): Promise<T> {
  return request<T>('POST', path, { ...options, jsonBody });
}

export async function apiPut<T>(path: string, jsonBody?: unknown, options?: ApiRequestOptions): Promise<T> {
  return request<T>('PUT', path, { ...options, jsonBody });
}

export async function apiPatch<T>(path: string, jsonBody?: unknown, options?: ApiRequestOptions): Promise<T> {
  return request<T>('PATCH', path, { ...options, jsonBody });
}

export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return request<T>('DELETE', path, options);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: ApiRequestOptions
): Promise<T> {
  return request<T>('POST', path, { ...options, body: formData });
}
