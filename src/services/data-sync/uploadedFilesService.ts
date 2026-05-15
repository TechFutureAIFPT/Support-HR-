import { apiDelete, apiGet, apiPatch, apiPost, pickArray } from '@/services/api/renderClient';
import type { UploadedFileRecord } from '@/types';

function normalizeUploadedFile(raw: unknown): UploadedFileRecord {
  const file = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    id: file.id ? String(file.id) : undefined,
    uid: String(file.uid || ''),
    email: String(file.email || ''),
    fileName: String(file.fileName || ''),
    fileType: file.fileType === 'jd' ? 'jd' : 'cv',
    fileSize: Number(file.fileSize || 0),
    mimeType: String(file.mimeType || ''),
    fileExtension: String(file.fileExtension || ''),
    ocrMethod: String(file.ocrMethod || ''),
    extractedText: String(file.extractedText || ''),
    extractedTextLength: Number(file.extractedTextLength || 0),
    processingTimeMs: Number(file.processingTimeMs || 0),
    analysisSessionId: file.analysisSessionId ? String(file.analysisSessionId) : undefined,
    candidateName: file.candidateName ? String(file.candidateName) : undefined,
    jobPosition: file.jobPosition ? String(file.jobPosition) : undefined,
    uploadedAt: file.uploadedAt || Date.now(),
    lastAccessedAt: file.lastAccessedAt || undefined,
  };
}

export class UploadedFilesService {
  static async saveUploadedFile(params: {
    fileName: string;
    fileType: 'cv' | 'jd';
    fileSize: number;
    mimeType: string;
    ocrMethod: string;
    extractedText: string;
    processingTimeMs: number;
    analysisSessionId?: string;
    candidateName?: string;
    jobPosition?: string;
  }): Promise<string | null> {
    const response = await apiPost<Record<string, unknown>>(
      '/api/account/uploaded-files',
      params,
      { authRequired: true }
    );

    return String(response.id || response.fileId || response.savedUploadedFileId || '');
  }

  static async saveUploadedFiles(files: Array<{
    fileName: string;
    fileType: 'cv' | 'jd';
    fileSize: number;
    mimeType: string;
    ocrMethod: string;
    extractedText: string;
    processingTimeMs: number;
    analysisSessionId?: string;
    candidateName?: string;
    jobPosition?: string;
  }>): Promise<string[]> {
    const response = await apiPost<unknown>(
      '/api/account/uploaded-files/batch',
      { files },
      { authRequired: true }
    );

    const ids = pickArray<unknown>(response, ['ids', 'fileIds', 'savedIds', 'data']);
    return ids.map((id) => String(id));
  }

  static async getUserFiles(limitCount: number = 50): Promise<UploadedFileRecord[]> {
    const response = await apiGet<unknown>(
      `/api/account/uploaded-files?limit_count=${limitCount}`,
      { authRequired: true }
    );

    return pickArray<unknown>(response, ['items', 'files', 'entries', 'data']).map(normalizeUploadedFile);
  }

  static async getUserFilesByType(
    fileType: 'cv' | 'jd',
    limitCount: number = 50
  ): Promise<UploadedFileRecord[]> {
    const response = await apiGet<unknown>(
      `/api/account/uploaded-files/by-type/${fileType}?limit_count=${limitCount}`,
      { authRequired: true }
    );

    return pickArray<unknown>(response, ['items', 'files', 'entries', 'data']).map(normalizeUploadedFile);
  }

  static async getFilesBySession(sessionId: string): Promise<UploadedFileRecord[]> {
    const response = await apiGet<unknown>(
      `/api/account/uploaded-files/by-session/${encodeURIComponent(sessionId)}`,
      { authRequired: true }
    );

    return pickArray<unknown>(response, ['items', 'files', 'entries', 'data']).map(normalizeUploadedFile);
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    await apiDelete(`/api/account/uploaded-files/${encodeURIComponent(fileId)}`, {
      authRequired: true,
    });
    return true;
  }

  static async touchFile(fileId: string): Promise<void> {
    await apiPatch(`/api/account/uploaded-files/${encodeURIComponent(fileId)}/touch`, undefined, {
      authRequired: true,
    });
  }

  static async getFileStats(): Promise<{
    totalFiles: number;
    totalCVs: number;
    totalJDs: number;
    totalSizeBytes: number;
    recentFiles: UploadedFileRecord[];
  }> {
    const response = await apiGet<Record<string, unknown>>('/api/account/uploaded-files/stats', {
      authRequired: true,
    });

    return {
      totalFiles: Number(response.totalFiles || response.total_files || 0),
      totalCVs: Number(response.totalCVs || response.total_cvs || 0),
      totalJDs: Number(response.totalJDs || response.total_jds || 0),
      totalSizeBytes: Number(response.totalSizeBytes || response.total_size_bytes || 0),
      recentFiles: pickArray<unknown>(response, ['recentFiles', 'recent_files', 'files']).map(normalizeUploadedFile),
    };
  }
}
