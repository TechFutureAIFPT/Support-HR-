import { apiDelete, apiGet, apiPatch, apiPost, pickArray } from '@/lib/services/api/renderClient';

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

export class JDTemplatesService {
  static async getUserTemplates(): Promise<UserJDTemplate[]> {
    const response = await apiGet<unknown>('/api/account/jd-templates', { authRequired: true });
    return pickArray<unknown>(response, ['items', 'templates', 'entries', 'data']).map(normalizeTemplate);
  }

  static async createTemplate(input: CreateJDTemplateInput): Promise<UserJDTemplate | null> {
    const response = await apiPost<unknown>('/api/account/jd-templates', input, { authRequired: true });
    const [created] = pickArray<unknown>(response, ['items', 'templates', 'entries', 'data']);

    if (created) return normalizeTemplate(created);
    if (response && typeof response === 'object') return normalizeTemplate(response);
    return null;
  }

  static async updateTemplate(
    templateId: string,
    updates: Partial<CreateJDTemplateInput>
  ): Promise<boolean> {
    await apiPatch(`/api/account/jd-templates/${encodeURIComponent(templateId)}`, updates, { authRequired: true });
    return true;
  }

  static async deleteTemplate(templateId: string): Promise<boolean> {
    await apiDelete(`/api/account/jd-templates/${encodeURIComponent(templateId)}`, { authRequired: true });
    return true;
  }

  static async seedDefaultTemplatesIfEmpty(): Promise<void> {
    await apiPost('/api/account/jd-templates/seed-defaults', undefined, { authRequired: true });
  }
}
