import type { Candidate, HistoryEntry } from '@/types';

export type WorkspaceSessionStatus = 'screening' | 'review' | 'open' | 'closed';

export interface WorkspaceSessionViewModel {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  candidateCount: number;
  needsReview: number;
  status: WorkspaceSessionStatus;
  candidates: Candidate[];
  history?: HistoryEntry;
}

export interface StoredCvDocument {
  id: string;
  ownerKey: string;
  fingerprint: string;
  fileName: string;
  normalizedFileName: string;
  mimeType: string;
  size: number;
  lastModified: number;
  blob: Blob;
  createdAt: number;
  updatedAt: number;
}

export interface CvDocumentLink {
  id: string;
  ownerKey: string;
  sessionId: string;
  candidateId: string;
  documentId: string;
  fileName: string;
  createdAt: number;
}
