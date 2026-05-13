import { apiGet, apiPost } from '@/lib/services/api/renderClient';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime?: string | null;
  webViewLink?: string | null;
  iconLink?: string | null;
}

interface GoogleDriveConnectionStatus {
  connected: boolean;
  email?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  scopes?: string[];
}

interface GoogleDriveOAuthUrlResponse {
  authUrl: string;
  state: string;
  redirectUri: string;
}

interface GoogleDriveFilesResponse {
  files?: Array<Record<string, unknown>>;
  nextPageToken?: string | null;
}

interface GoogleDriveImportResponse {
  fileId: string;
  fileName: string;
  mimeType: string;
  extractedText: string;
  fileSize: number;
  driveFile?: Record<string, unknown> | null;
}

type ImportedDriveFile = File & {
  __preExtractedText?: string;
  __driveFileId?: string;
  __driveSource?: 'backend';
};

const GOOGLE_OAUTH_QUERY_KEYS = ['code', 'state', 'scope', 'prompt', 'authuser', 'error'];
const GOOGLE_DRIVE_PENDING_IMPORT_KEY = 'supporthr.google-drive.pending-import';
const GOOGLE_REDIRECT_IN_PROGRESS_MESSAGE = 'Đang chuyển tới Google để kết nối Google Drive.';

interface PendingGoogleDriveImportRequest {
  mimeTypes?: string;
  multiSelect?: boolean;
  fileType: 'cv' | 'jd';
  redirectUri: string;
}

function normalizeDriveFile(raw: Record<string, unknown>): DriveFile {
  return {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    mimeType: String(raw.mimeType || ''),
    size: Number(raw.size || 0),
    modifiedTime: typeof raw.modifiedTime === 'string' ? raw.modifiedTime : null,
    webViewLink: typeof raw.webViewLink === 'string' ? raw.webViewLink : null,
    iconLink: typeof raw.iconLink === 'string' ? raw.iconLink : null,
  };
}

function filterByMimeTypes(files: DriveFile[], mimeTypes?: string): DriveFile[] {
  if (!mimeTypes) return files;
  const allowed = new Set(
    mimeTypes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
  if (allowed.size === 0) return files;
  return files.filter((file) => allowed.has(file.mimeType));
}

function formatFileSize(size: number): string {
  if (!size) return 'Không rõ dung lượng';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildRedirectUri(): string {
  const configuredRedirectUri = import.meta.env.VITE_GOOGLE_DRIVE_REDIRECT_URI?.trim();
  if (configuredRedirectUri) return configuredRedirectUri;
  return `${window.location.origin}/jd`;
}

function getPendingGoogleDriveImport(): PendingGoogleDriveImportRequest | null {
  try {
    const raw = window.sessionStorage.getItem(GOOGLE_DRIVE_PENDING_IMPORT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingGoogleDriveImportRequest>;
    if (parsed.fileType !== 'cv' && parsed.fileType !== 'jd') return null;

    return {
      mimeTypes: typeof parsed.mimeTypes === 'string' ? parsed.mimeTypes : undefined,
      multiSelect: Boolean(parsed.multiSelect),
      fileType: parsed.fileType,
      redirectUri: typeof parsed.redirectUri === 'string' && parsed.redirectUri.trim()
        ? parsed.redirectUri
        : buildRedirectUri(),
    };
  } catch {
    return null;
  }
}

function setPendingGoogleDriveImport(payload: PendingGoogleDriveImportRequest) {
  try {
    window.sessionStorage.setItem(GOOGLE_DRIVE_PENDING_IMPORT_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and let the normal OAuth flow continue.
  }
}

function clearPendingGoogleDriveImport() {
  try {
    window.sessionStorage.removeItem(GOOGLE_DRIVE_PENDING_IMPORT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function cleanupOAuthParams() {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of GOOGLE_OAUTH_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}

function createDriveSelectionModal(files: DriveFile[], multiSelect: boolean): Promise<DriveFile[]> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.background = 'rgba(2, 6, 23, 0.82)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';

    const panel = document.createElement('div');
    panel.style.width = 'min(860px, 100%)';
    panel.style.maxHeight = '80vh';
    panel.style.background = '#000000';
    panel.style.border = '1px solid rgba(148, 163, 184, 0.16)';
    panel.style.borderRadius = '20px';
    panel.style.overflow = 'hidden';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';

    const header = document.createElement('div');
    header.style.padding = '18px 20px';
    header.style.borderBottom = '1px solid rgba(148, 163, 184, 0.12)';
    header.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div>
          <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#64748b;font-weight:700;">Google Drive</div>
          <div style="margin-top:6px;font-size:18px;color:#f8fafc;font-weight:700;">Chọn tệp để nhập</div>
        </div>
        <button data-role="cancel" style="height:34px;padding:0 14px;border-radius:10px;border:1px solid rgba(148,163,184,.16);background:#111827;color:#cbd5e1;cursor:pointer;">Đóng</button>
      </div>
    `;

    const toolbar = document.createElement('div');
    toolbar.style.padding = '16px 20px';
    toolbar.style.borderBottom = '1px solid rgba(148, 163, 184, 0.08)';
    toolbar.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <input data-role="search" placeholder="Tìm theo tên file..." style="flex:1;min-width:220px;padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.16);background:#111827;color:#f8fafc;outline:none;" />
        <div style="font-size:12px;color:#94a3b8;">${multiSelect ? 'Có thể chọn nhiều tệp' : 'Chọn một tệp'}</div>
      </div>
    `;

    const list = document.createElement('div');
    list.style.padding = '16px 20px';
    list.style.overflow = 'auto';
    list.style.display = 'grid';
    list.style.gap = '10px';

    const footer = document.createElement('div');
    footer.style.padding = '16px 20px';
    footer.style.borderTop = '1px solid rgba(148, 163, 184, 0.08)';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.innerHTML = `
      <div data-role="summary" style="font-size:12px;color:#94a3b8;">Chưa chọn tệp nào</div>
      <div style="display:flex;gap:10px;">
        <button data-role="cancel" style="height:40px;padding:0 16px;border-radius:12px;border:1px solid rgba(148,163,184,.16);background:#111827;color:#cbd5e1;cursor:pointer;">Hủy</button>
        <button data-role="confirm" style="height:40px;padding:0 18px;border-radius:12px;border:1px solid rgba(99,102,241,.35);background:#4f46e5;color:white;cursor:pointer;font-weight:700;">Sử dụng tệp đã chọn</button>
      </div>
    `;

    panel.appendChild(header);
    panel.appendChild(toolbar);
    panel.appendChild(list);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const searchInput = toolbar.querySelector('[data-role="search"]') as HTMLInputElement;
    const summary = footer.querySelector('[data-role="summary"]') as HTMLDivElement;
    const confirmButton = footer.querySelector('[data-role="confirm"]') as HTMLButtonElement;
    const cancelButtons = overlay.querySelectorAll('[data-role="cancel"]');
    const selectedIds = new Set<string>();

    const close = (selected: DriveFile[]) => {
      overlay.remove();
      resolve(selected);
    };

    const render = () => {
      const query = searchInput.value.trim().toLowerCase();
      const visibleFiles = files.filter((file) => file.name.toLowerCase().includes(query));

      list.innerHTML = '';

      if (visibleFiles.length === 0) {
        const empty = document.createElement('div');
        empty.style.padding = '28px';
        empty.style.border = '1px dashed rgba(148, 163, 184, 0.18)';
        empty.style.borderRadius = '16px';
        empty.style.textAlign = 'center';
        empty.style.color = '#94a3b8';
        empty.textContent = 'Không tìm thấy tệp phù hợp.';
        list.appendChild(empty);
      }

      for (const file of visibleFiles) {
        const row = document.createElement('button');
        row.type = 'button';
        row.style.width = '100%';
        row.style.textAlign = 'left';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '12px';
        row.style.padding = '14px 16px';
        row.style.borderRadius = '14px';
        row.style.border = selectedIds.has(file.id)
          ? '1px solid rgba(52,211,153,.4)'
          : '1px solid rgba(148,163,184,.12)';
        row.style.background = selectedIds.has(file.id) ? 'rgba(16,185,129,.08)' : '#0f172a';
        row.style.cursor = 'pointer';
        row.innerHTML = `
          <div style="min-width:0;">
            <div style="font-size:14px;font-weight:600;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${file.name}</div>
            <div style="margin-top:4px;font-size:11px;color:#94a3b8;display:flex;gap:10px;flex-wrap:wrap;">
              <span>${file.mimeType}</span>
              <span>${formatFileSize(file.size)}</span>
            </div>
          </div>
          <div style="flex-shrink:0;font-size:11px;font-weight:700;color:${selectedIds.has(file.id) ? '#34d399' : '#64748b'};">
            ${selectedIds.has(file.id) ? 'Đã chọn' : 'Chọn'}
          </div>
        `;

        row.onclick = () => {
          if (!multiSelect) selectedIds.clear();
          if (selectedIds.has(file.id)) {
            selectedIds.delete(file.id);
          } else {
            selectedIds.add(file.id);
          }
          summary.textContent =
            selectedIds.size > 0
              ? `Đã chọn ${selectedIds.size} tệp`
              : 'Chưa chọn tệp nào';
          render();
        };

        list.appendChild(row);
      }
    };

    confirmButton.onclick = () => {
      const selected = files.filter((file) => selectedIds.has(file.id));
      close(selected);
    };

    cancelButtons.forEach((button) => {
      button.addEventListener('click', () => close([]));
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close([]);
    });

    searchInput.addEventListener('input', render);
    render();
  });
}

class GoogleDriveService {
  private pendingExchangePromise: Promise<void> | null = null;

  private isGoogleRedirectInProgress(error: unknown): boolean {
    return error instanceof Error && error.message === GOOGLE_REDIRECT_IN_PROGRESS_MESSAGE;
  }

  private async performPickAndImport(options: {
    mimeTypes?: string;
    multiSelect?: boolean;
    fileType: 'cv' | 'jd';
    redirectUri?: string;
  }): Promise<ImportedDriveFile[]> {
    const selectedFiles = await this.openPicker(options);
    if (selectedFiles.length === 0) return [];

    const imported: ImportedDriveFile[] = [];
    for (const file of selectedFiles) {
      imported.push(await this.importFile(file.id, options.fileType));
    }

    return imported;
  }

  private async completeOAuthCallbackIfNeeded(): Promise<void> {
    if (this.pendingExchangePromise) return this.pendingExchangePromise;

    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const state = currentUrl.searchParams.get('state');
    const error = currentUrl.searchParams.get('error');

    if (!code && !state && !error) return;

    this.pendingExchangePromise = (async () => {
      try {
        if (error) {
          cleanupOAuthParams();
          throw new Error('Bạn đã hủy kết nối Google Drive hoặc Google từ chối quyền truy cập.');
        }

        if (code && state) {
          const pendingImport = getPendingGoogleDriveImport();
          await apiPost(
            '/api/account/google-drive/exchange-code',
            {
              code,
              state,
              redirectUri: pendingImport?.redirectUri || buildRedirectUri(),
            },
            { authRequired: true }
          );
          cleanupOAuthParams();
        }
      } finally {
        this.pendingExchangePromise = null;
      }
    })();

    return this.pendingExchangePromise;
  }

  public async getStatus(): Promise<GoogleDriveConnectionStatus> {
    await this.completeOAuthCallbackIfNeeded();
    return apiGet<GoogleDriveConnectionStatus>('/api/account/google-drive/status', { authRequired: true });
  }

  public async authenticate(redirectUri: string = buildRedirectUri()): Promise<string> {
    await this.completeOAuthCallbackIfNeeded();
    const status = await this.getStatus();

    if (status.connected) {
      return 'connected';
    }

    const response = await apiPost<GoogleDriveOAuthUrlResponse>(
      '/api/account/google-drive/oauth-url',
      { redirectUri },
      { authRequired: true }
    );

    window.location.href = response.authUrl;
    throw new Error(GOOGLE_REDIRECT_IN_PROGRESS_MESSAGE);
    throw new Error('Đang chuyển tới Google để kết nối Google Drive.');
  }

  public async listFiles(options: { mimeTypes?: string; pageSize?: number; redirectUri?: string } = {}): Promise<DriveFile[]> {
    await this.completeOAuthCallbackIfNeeded();
    await this.authenticate(options.redirectUri);

    let pageToken: string | null | undefined;
    const files: DriveFile[] = [];

    do {
      const query = new URLSearchParams();
      query.set('page_size', String(options.pageSize || 100));
      if (pageToken) query.set('page_token', pageToken);

      const response = await apiGet<GoogleDriveFilesResponse>(
        `/api/account/google-drive/files?${query.toString()}`,
        { authRequired: true }
      );

      const currentFiles = Array.isArray(response.files)
        ? response.files.map((file) => normalizeDriveFile(file))
        : [];

      files.push(...currentFiles);
      pageToken = response.nextPageToken;
    } while (pageToken);

    return filterByMimeTypes(files, options.mimeTypes);
  }

  public async openPicker(options: { mimeTypes?: string; multiSelect?: boolean; redirectUri?: string }): Promise<DriveFile[]> {
    const files = await this.listFiles({ mimeTypes: options.mimeTypes, redirectUri: options.redirectUri });
    return createDriveSelectionModal(files, Boolean(options.multiSelect));
  }

  public async importFile(fileId: string, fileType: 'cv' | 'jd' = 'cv'): Promise<ImportedDriveFile> {
    const response = await apiPost<GoogleDriveImportResponse>(
      '/api/account/google-drive/import',
      {
        fileId,
        fileType,
        persistUploadedFile: true,
      },
      { authRequired: true }
    );

    const importedFile = new File(
      [response.extractedText || ''],
      response.fileName,
      { type: response.mimeType || 'text/plain' }
    ) as ImportedDriveFile;

    importedFile.__preExtractedText = response.extractedText || '';
    importedFile.__driveFileId = response.fileId;
    importedFile.__driveSource = 'backend';

    return importedFile;
  }

  public async pickAndImportFiles(options: {
    mimeTypes?: string;
    multiSelect?: boolean;
    fileType: 'cv' | 'jd';
  }): Promise<ImportedDriveFile[]> {
    const pendingRequest: PendingGoogleDriveImportRequest = {
      ...options,
      redirectUri: buildRedirectUri(),
    };
    setPendingGoogleDriveImport(pendingRequest);

    try {
      const imported = await this.performPickAndImport(pendingRequest);
      clearPendingGoogleDriveImport();
      return imported;
    } catch (error) {
      if (!this.isGoogleRedirectInProgress(error)) {
        clearPendingGoogleDriveImport();
      }
      throw error;
    }
  }

  public async resumePendingPickAndImportIfNeeded(): Promise<ImportedDriveFile[] | null> {
    const pendingRequest = getPendingGoogleDriveImport();
    const currentUrl = new URL(window.location.href);
    const hasOAuthParams = GOOGLE_OAUTH_QUERY_KEYS.some((key) => currentUrl.searchParams.has(key));

    if (!pendingRequest && !hasOAuthParams) {
      return null;
    }

    try {
      await this.completeOAuthCallbackIfNeeded();

      if (!pendingRequest) {
        return [];
      }

      const imported = await this.performPickAndImport(pendingRequest);
      clearPendingGoogleDriveImport();
      return imported;
    } catch (error) {
      if (!this.isGoogleRedirectInProgress(error)) {
        clearPendingGoogleDriveImport();
      }
      throw error;
    }
  }

  public getPendingImportFileType(): 'cv' | 'jd' | null {
    return getPendingGoogleDriveImport()?.fileType || null;
  }

  public clearToken() {
    cleanupOAuthParams();
  }
}

export const googleDriveService = new GoogleDriveService();
