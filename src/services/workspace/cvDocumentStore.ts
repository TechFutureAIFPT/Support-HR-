import type { CvDocumentLink, StoredCvDocument } from '@/types/workspace';

const DB_NAME = 'supporthr-workspace';
const DB_VERSION = 1;
const DOCUMENTS_STORE = 'documents';
const LINKS_STORE = 'document_links';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ lưu tài liệu cục bộ.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        const documents = db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
        documents.createIndex('ownerKey', 'ownerKey', { unique: false });
        documents.createIndex('ownerFileName', ['ownerKey', 'normalizedFileName'], { unique: false });
      }
      if (!db.objectStoreNames.contains(LINKS_STORE)) {
        const links = db.createObjectStore(LINKS_STORE, { keyPath: 'id' });
        links.createIndex('ownerSessionCandidate', ['ownerKey', 'sessionId', 'candidateId'], { unique: true });
        links.createIndex('documentId', 'documentId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Không thể mở kho tài liệu cục bộ.'));
  });
}

export function normalizeCvFileName(fileName: string): string {
  return (fileName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function createFingerprint(file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return `${normalizeCvFileName(file.name)}::${file.size}::${file.lastModified}`;
}

function ownerId(ownerKey: string): string {
  return (ownerKey || 'local').trim().toLowerCase();
}

export async function storeCvFiles(ownerKey: string, files: File[]): Promise<StoredCvDocument[]> {
  if (!files.length) return [];
  const db = await openDatabase();
  const transaction = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = transaction.objectStore(DOCUMENTS_STORE);
  const owner = ownerId(ownerKey);
  const now = Date.now();
  const records = files.map((file) => {
    const fingerprint = createFingerprint(file);
    const record: StoredCvDocument = {
      id: `${owner}::${fingerprint}`,
      ownerKey: owner,
      fingerprint,
      fileName: file.name,
      normalizedFileName: normalizeCvFileName(file.name),
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      lastModified: file.lastModified,
      blob: file,
      createdAt: now,
      updatedAt: now,
    };
    store.put(record);
    return record;
  });

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Không thể lưu CV trên thiết bị.'));
    transaction.onabort = () => reject(transaction.error || new Error('Lưu CV đã bị hủy.'));
  });
  db.close();
  return records;
}

export async function findCvDocument(ownerKey: string, fileName: string): Promise<StoredCvDocument | null> {
  const db = await openDatabase();
  const transaction = db.transaction(DOCUMENTS_STORE, 'readonly');
  const index = transaction.objectStore(DOCUMENTS_STORE).index('ownerFileName');
  const records = await requestToPromise(index.getAll([ownerId(ownerKey), normalizeCvFileName(fileName)]));
  db.close();
  const sorted = (records as StoredCvDocument[]).sort((a, b) => b.updatedAt - a.updatedAt);
  return sorted[0] || null;
}

export async function linkCvDocument(
  ownerKey: string,
  sessionId: string,
  candidateId: string,
  document: StoredCvDocument,
): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(LINKS_STORE, 'readwrite');
  const owner = ownerId(ownerKey);
  const link: CvDocumentLink = {
    id: `${owner}::${sessionId}::${candidateId}`,
    ownerKey: owner,
    sessionId,
    candidateId,
    documentId: document.id,
    fileName: document.fileName,
    createdAt: Date.now(),
  };
  transaction.objectStore(LINKS_STORE).put(link);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Không thể liên kết CV với ứng viên.'));
  });
  db.close();
}

export async function clearOwnerCvDocuments(ownerKey: string): Promise<void> {
  const db = await openDatabase();
  const owner = ownerId(ownerKey);
  const transaction = db.transaction([DOCUMENTS_STORE, LINKS_STORE], 'readwrite');
  const documentStore = transaction.objectStore(DOCUMENTS_STORE);
  const linkStore = transaction.objectStore(LINKS_STORE);
  const documents = await requestToPromise(documentStore.index('ownerKey').getAll(owner));
  (documents as StoredCvDocument[]).forEach((document) => documentStore.delete(document.id));
  const links = await requestToPromise(linkStore.getAll());
  (links as CvDocumentLink[]).filter((link) => link.ownerKey === owner).forEach((link) => linkStore.delete(link.id));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Không thể xóa dữ liệu CV cục bộ.'));
  });
  db.close();
}
