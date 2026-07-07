import { auth, db } from '@/services/firebase';
import { apiDelete, apiGetWithMeta, apiPatch, apiPost, pickArray } from '@/services/api/renderClient';
import { collection as firestoreCollection, getDocs, query, where } from 'firebase/firestore';

export interface UserJDTemplate {
  id: string;
  uid: string;
  name: string;
  category: string;
  jobPosition: string;
  jdText: string;
  hardFilters: any;
  createdAt: any;
  updatedAt: any;
}

export type CreateJDTemplateInput = Omit<UserJDTemplate, 'id' | 'uid' | 'createdAt' | 'updatedAt'>;

const TEMPLATE_CACHE_PREFIX = 'jdTemplatesCache:';

type TemplateCacheEnvelope = {
  templates: UserJDTemplate[];
  etag: string | null;
  dataRevision: string | null;
  savedAt: number;
};

function getTemplateCacheKey(): string | null {
  const email = auth.currentUser?.email?.trim().toLowerCase() || localStorage.getItem('authEmail')?.trim().toLowerCase();
  if (!email) return null;
  return `${TEMPLATE_CACHE_PREFIX}${email}`;
}

function writeTemplateCache(
  templates: UserJDTemplate[],
  meta?: { etag?: string | null; dataRevision?: string | null }
): void {
  const cacheKey = getTemplateCacheKey();
  if (!cacheKey) return;

  try {
    const envelope: TemplateCacheEnvelope = {
      templates,
      etag: meta?.etag ?? null,
      dataRevision: meta?.dataRevision ?? null,
      savedAt: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(envelope));
  } catch (error) {
    console.warn('Failed to cache JD templates locally:', error);
  }
}

function readTemplateCacheEnvelope(): TemplateCacheEnvelope | null {
  const cacheKey = getTemplateCacheKey();
  if (!cacheKey) return null;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        templates: parsed.map(normalizeTemplate),
        etag: null,
        dataRevision: null,
        savedAt: 0,
      };
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.templates)) return null;
    return {
      templates: (parsed.templates as unknown[]).map(normalizeTemplate),
      etag: typeof parsed.etag === 'string' ? parsed.etag : null,
      dataRevision: typeof parsed.dataRevision === 'string' ? parsed.dataRevision : null,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0,
    };
  } catch (error) {
    console.warn('Failed to load cached JD templates:', error);
    return null;
  }
}

function readTemplateCache(): UserJDTemplate[] {
  return readTemplateCacheEnvelope()?.templates ?? [];
}

function normalizeTemplate(raw: unknown): UserJDTemplate {
  const template = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    id: String(template.id || ''),
    uid: String(template.uid || ''),
    name: String(template.name || ''),
    category: String(template.category || ''),
    jobPosition: String(template.jobPosition || ''),
    jdText: String(template.jdText || ''),
    hardFilters: template.hardFilters || {},
    createdAt: template.createdAt || Date.now(),
    updatedAt: template.updatedAt || Date.now(),
  };
}

function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (typeof record.seconds === 'number') {
      return Number(record.seconds) * 1000;
    }

    if (typeof record.toMillis === 'function') {
      try {
        return Number((record.toMillis as () => number)());
      } catch {
        return 0;
      }
    }
  }

  return 0;
}

export class JDTemplatesService {
  static getCachedUserTemplates(): UserJDTemplate[] {
    return readTemplateCache();
  }

  static async getUserTemplatesFromFirestore(): Promise<UserJDTemplate[]> {
    const uid = auth.currentUser?.uid?.trim();
    if (!uid) return [];

    const snapshot = await getDocs(
      query(
        firestoreCollection(db, 'userJDTemplates'),
        where('uid', '==', uid)
      )
    );

    const templates = snapshot.docs
      .map((doc) => normalizeTemplate({ id: doc.id, ...doc.data() }))
      .sort((left, right) => toMillis(right.updatedAt) - toMillis(left.updatedAt));

    writeTemplateCache(templates);
    return templates;
  }

  static async getUserTemplates(): Promise<UserJDTemplate[]> {
    const cached = readTemplateCacheEnvelope();
    try {
      const response = await apiGetWithMeta<unknown>('/api/account/jd-templates', {
        authRequired: true,
        allowNotModified: true,
        headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
      });
      if (response.notModified) {
        return cached?.templates ?? [];
      }

      const templates = pickArray<unknown>(response.data, ['items', 'templates', 'entries', 'data']).map(normalizeTemplate);
      writeTemplateCache(templates, { etag: response.etag, dataRevision: response.dataRevision });
      return templates;
    } catch (error) {
      console.warn('Backend jd-templates failed, trying Firestore fallback.', error);
      const fallbackTemplates = await this.getUserTemplatesFromFirestore();
      if (fallbackTemplates.length > 0) {
        return fallbackTemplates;
      }
      throw error;
    }
  }

  static async createTemplate(input: CreateJDTemplateInput): Promise<UserJDTemplate | null> {
    const response = await apiPost<unknown>('/api/account/jd-templates', input, { authRequired: true });
    const [created] = pickArray<unknown>(response, ['items', 'templates', 'entries', 'data']);

    if (created) {
      const template = normalizeTemplate(created);
      writeTemplateCache([template, ...readTemplateCache().filter((item) => item.id !== template.id)]);
      return template;
    }

    if (response && typeof response === 'object') {
      const template = normalizeTemplate(response);
      writeTemplateCache([template, ...readTemplateCache().filter((item) => item.id !== template.id)]);
      return template;
    }
    return null;
  }

  static async updateTemplate(
    templateId: string,
    updates: Partial<CreateJDTemplateInput>
  ): Promise<boolean> {
    await apiPatch(`/api/account/jd-templates/${encodeURIComponent(templateId)}`, updates, { authRequired: true });
    writeTemplateCache(
      readTemplateCache().map((template) =>
        template.id === templateId
          ? {
              ...template,
              ...updates,
              hardFilters: updates.hardFilters ?? template.hardFilters,
              updatedAt: Date.now(),
            }
          : template
      )
    );
    return true;
  }

  static async deleteTemplate(templateId: string): Promise<boolean> {
    await apiDelete(`/api/account/jd-templates/${encodeURIComponent(templateId)}`, { authRequired: true });
    writeTemplateCache(readTemplateCache().filter((template) => template.id !== templateId));
    return true;
  }

  static async seedDefaultTemplatesIfEmpty(): Promise<void> {
    await apiPost('/api/account/jd-templates/seed-defaults', undefined, { authRequired: true });
  }
}
