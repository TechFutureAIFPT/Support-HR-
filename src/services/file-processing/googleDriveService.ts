import { apiGet, apiPost } from '@/services/api/renderClient';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
  iconLink?: string | null;
  parents: string[];
  owners: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  isGoogleWorkspaceFile: boolean;
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
}

type ImportedDriveFile = File & {
  __preExtractedText?: string;
  __driveFileId?: string;
  __driveSource?: 'backend';
};

interface PendingGoogleDriveImportRequest {
  mimeTypes?: string;
  multiSelect?: boolean;
  fileType: 'cv' | 'jd';
  redirectUri: string;
}

interface DrivePageResult {
  files: DriveFile[];
  nextPageToken: string | null;
}

interface DrivePageCacheEntry {
  expiresAt: number;
  page?: DrivePageResult;
  promise?: Promise<DrivePageResult>;
}

interface DriveBrowserBreadcrumb {
  id: string;
  name: string;
}

interface DriveBrowserLoadRequest {
  folderId?: string;
  search?: string;
  pageToken?: string | null;
}

const ROOT_FOLDER_ID = 'root';
const GOOGLE_DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const DRIVE_PAGE_SIZE = 100;
const DRIVE_PAGE_CACHE_TTL_MS = 60_000;
const DRIVE_IMPORT_CONCURRENCY = 3;
const DRIVE_NAME_COLLATOR = new Intl.Collator(['vi', 'en'], {
  numeric: true,
  sensitivity: 'base',
});

const GOOGLE_OAUTH_QUERY_KEYS = ['code', 'state', 'scope', 'prompt', 'authuser', 'error'];
const GOOGLE_DRIVE_PENDING_IMPORT_KEY = 'supporthr.google-drive.pending-import';
const GOOGLE_REDIRECT_IN_PROGRESS_MESSAGE = 'Đang chuyển tới Google để kết nối Google Drive.';

function normalizeDriveFile(raw: Record<string, unknown>): DriveFile {
  const rawSize = Number(raw.size);
  const rawOwners = Array.isArray(raw.owners) ? raw.owners : [];

  return {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    mimeType: String(raw.mimeType || ''),
    size: Number.isFinite(rawSize) ? rawSize : null,
    modifiedTime: typeof raw.modifiedTime === 'string' ? raw.modifiedTime : null,
    webViewLink: typeof raw.webViewLink === 'string' ? raw.webViewLink : null,
    iconLink: typeof raw.iconLink === 'string' ? raw.iconLink : null,
    parents: Array.isArray(raw.parents) ? raw.parents.map((parent) => String(parent)) : [],
    owners: rawOwners.map((owner) => {
      const normalizedOwner = owner as Record<string, unknown>;
      return {
        displayName: String(normalizedOwner.displayName || ''),
        emailAddress: String(normalizedOwner.emailAddress || ''),
      };
    }),
    isGoogleWorkspaceFile: Boolean(raw.isGoogleWorkspaceFile),
  };
}

function parseMimeTypes(mimeTypes?: string): Set<string> | null {
  if (!mimeTypes) return null;
  const allowed = new Set(
    mimeTypes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
  return allowed.size > 0 ? allowed : null;
}

function normalizeMimeTypeKey(mimeTypes?: string): string {
  return Array.from(parseMimeTypes(mimeTypes) || [])
    .sort()
    .join(',');
}

function isDriveFolder(file: DriveFile): boolean {
  return file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE;
}

function isSelectableDriveFile(file: DriveFile, allowedMimeTypes: Set<string> | null): boolean {
  if (isDriveFolder(file)) return false;
  return !allowedMimeTypes || allowedMimeTypes.has(file.mimeType);
}

function sortDriveFiles(files: DriveFile[]): DriveFile[] {
  return [...files].sort((first, second) => {
    const firstFolder = isDriveFolder(first);
    const secondFolder = isDriveFolder(second);
    if (firstFolder !== secondFolder) return firstFolder ? -1 : 1;
    return DRIVE_NAME_COLLATOR.compare(first.name, second.name);
  });
}

function formatFileSize(size: number | null): string {
  if (!size) return 'Không rõ dung lượng';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDriveModifiedTime(modifiedTime?: string | null): string {
  if (!modifiedTime) return '';
  const parsed = new Date(modifiedTime);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildRedirectUri(): string {
  const configuredRedirectUri = import.meta.env.VITE_GOOGLE_DRIVE_REDIRECT_URI?.trim();
  if (configuredRedirectUri) return configuredRedirectUri;
  return window.location.origin;
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
      redirectUri:
        typeof parsed.redirectUri === 'string' && parsed.redirectUri.trim()
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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  });

  await Promise.all(workers);
  return results;
}

function createDriveSelectionModal(options: {
  multiSelect: boolean;
  mimeTypes?: string;
  loadPage: (request: DriveBrowserLoadRequest) => Promise<DrivePageResult>;
}): Promise<DriveFile[]> {
  return new Promise((resolve) => {
    const allowedMimeTypes = parseMimeTypes(options.mimeTypes);
    const selectedFiles = new Map<string, DriveFile>();
    const breadcrumbs: DriveBrowserBreadcrumb[] = [{ id: ROOT_FOLDER_ID, name: 'Drive của tôi' }];

    let currentFolderId = ROOT_FOLDER_ID;
    let currentSearch = '';
    let entries: DriveFile[] = [];
    let nextPageToken: string | null = null;
    let isLoading = false;
    let errorMessage = '';
    let requestVersion = 0;
    let searchDebounceId: number | null = null;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.background = 'rgba(15, 23, 42, 0.28)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';

    const isDark = document.documentElement.classList.contains('dark');
    const dk = isDark ? {
      bg: '#1e2a3d', bg2: '#141b2d', bg3: '#0f1523',
      border: 'rgba(255,255,255,0.07)', text: '#e2e8f4', muted: '#64748b',
      input: '#243044', btnBorder: 'rgba(255,255,255,0.09)',
    } : {
      bg: '#ffffff', bg2: '#f8fbff', bg3: '#f8fbff',
      border: 'rgba(191,219,254,0.95)', text: '#0f172a', muted: '#475569',
      input: '#f8fbff', btnBorder: '#bfdbfe',
    };

    const panel = document.createElement('div');
    panel.style.width = 'min(980px, 100%)';
    panel.style.maxHeight = '84vh';
    panel.style.background = dk.bg;
    panel.style.border = `1px solid ${dk.border}`;
    panel.style.borderRadius = '18px';
    panel.style.overflow = 'hidden';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.boxShadow = isDark ? '0 24px 80px rgba(0,0,0,0.6)' : '0 24px 80px rgba(35,136,255,0.16)';

    const header = document.createElement('div');
    header.style.padding = '18px 20px';
    header.style.borderBottom = `1px solid ${dk.border}`;
    header.style.background = isDark ? dk.bg : 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)';
    header.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div style="min-width:0;">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#2388ff;font-weight:800;">Google Drive</div>
          <div style="margin-top:6px;font-size:20px;line-height:1.2;color:${dk.text};font-weight:800;">Chọn tệp từ Drive</div>
        </div>
        <button data-role="cancel" style="height:36px;padding:0 14px;border-radius:10px;border:1px solid ${dk.btnBorder};background:${dk.bg2};color:${isDark ? dk.text : '#1e3a8a'};cursor:pointer;font:inherit;font-weight:700;">Đóng</button>
      </div>
    `;

    const toolbar = document.createElement('div');
    toolbar.style.padding = '14px 20px';
    toolbar.style.borderBottom = `1px solid ${dk.border}`;
    toolbar.style.background = dk.bg;
    toolbar.innerHTML = `
      <div style="display:grid;gap:12px;">
        <div data-role="breadcrumbs" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;"></div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <input data-role="search" placeholder="Tìm tệp hoặc thư mục..." style="flex:1;min-width:240px;height:42px;padding:0 12px;border-radius:12px;border:1px solid ${dk.btnBorder};background:${dk.input};color:${dk.text};outline:none;font:inherit;" />
          <div data-role="stats" style="font-size:12px;color:${dk.muted};white-space:nowrap;"></div>
        </div>
      </div>
    `;

    const list = document.createElement('div');
    list.style.padding = '12px 20px';
    list.style.overflow = 'auto';
    list.style.display = 'grid';
    list.style.gap = '8px';
    list.style.background = dk.bg3;

    const footer = document.createElement('div');
    footer.style.padding = '14px 20px';
    footer.style.borderTop = `1px solid ${dk.border}`;
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.gap = '14px';
    footer.style.flexWrap = 'wrap';
    footer.style.background = dk.bg;
    footer.innerHTML = `
      <div data-role="summary" style="font-size:12px;color:${dk.muted};">Chưa chọn tệp nào</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button data-role="load-more" style="height:40px;padding:0 16px;border-radius:10px;border:1px solid ${dk.btnBorder};background:${dk.bg2};color:${isDark ? dk.text : '#1e3a8a'};cursor:pointer;font:inherit;display:none;">Tải thêm</button>
        <button data-role="cancel" style="height:40px;padding:0 16px;border-radius:10px;border:1px solid ${dk.btnBorder};background:${dk.bg2};color:${dk.muted};cursor:pointer;font:inherit;">Hủy</button>
        <button data-role="confirm" style="height:40px;padding:0 18px;border-radius:10px;border:1px solid #2388ff;background:#2388ff;color:#ffffff;cursor:pointer;font-weight:800;font-family:inherit;">Sử dụng tệp đã chọn</button>
      </div>
    `;

    panel.appendChild(header);
    panel.appendChild(toolbar);
    panel.appendChild(list);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const searchInput = toolbar.querySelector('[data-role="search"]') as HTMLInputElement;
    const breadcrumbsContainer = toolbar.querySelector('[data-role="breadcrumbs"]') as HTMLDivElement;
    const stats = toolbar.querySelector('[data-role="stats"]') as HTMLDivElement;
    const summary = footer.querySelector('[data-role="summary"]') as HTMLDivElement;
    const loadMoreButton = footer.querySelector('[data-role="load-more"]') as HTMLButtonElement;
    const confirmButton = footer.querySelector('[data-role="confirm"]') as HTMLButtonElement;
    const cancelButtons = overlay.querySelectorAll('[data-role="cancel"]');

    const close = (selected: DriveFile[]) => {
      if (searchDebounceId !== null) {
        window.clearTimeout(searchDebounceId);
      }
      overlay.remove();
      resolve(selected);
    };

    const updateSummary = () => {
      summary.textContent =
        selectedFiles.size > 0 ? `Đã chọn ${selectedFiles.size} tệp` : 'Chưa chọn tệp nào';
      confirmButton.disabled = selectedFiles.size === 0;
      confirmButton.style.opacity = selectedFiles.size === 0 ? '0.48' : '1';
      confirmButton.style.cursor = selectedFiles.size === 0 ? 'not-allowed' : 'pointer';
    };

    const renderBreadcrumbs = () => {
      breadcrumbsContainer.innerHTML = '';

      breadcrumbs.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = item.name;
        button.style.height = '30px';
        button.style.padding = '0 10px';
        button.style.border = '1px solid #bfdbfe';
        button.style.borderRadius = '999px';
        button.style.background = index === breadcrumbs.length - 1 ? '#e8f3ff' : '#ffffff';
        button.style.color = index === breadcrumbs.length - 1 ? '#2388ff' : '#475569';
        button.style.cursor = index === breadcrumbs.length - 1 ? 'default' : 'pointer';
        button.style.font = 'inherit';
        button.style.whiteSpace = 'nowrap';

        if (index !== breadcrumbs.length - 1) {
          button.onclick = () => {
            currentFolderId = item.id;
            currentSearch = '';
            searchInput.value = '';
            breadcrumbs.splice(index + 1);
            void loadEntries();
          };
        }

        breadcrumbsContainer.appendChild(button);

        if (index < breadcrumbs.length - 1) {
          const separator = document.createElement('span');
          separator.textContent = '/';
          separator.style.color = '#94a3b8';
          breadcrumbsContainer.appendChild(separator);
        }
      });
    };

    const renderList = () => {
      renderBreadcrumbs();
      updateSummary();

      const visibleEntries = sortDriveFiles(entries);
      const selectableCount = visibleEntries.filter((file) => isSelectableDriveFile(file, allowedMimeTypes)).length;
      stats.textContent = `${visibleEntries.length} mục | ${selectableCount} tệp`;
      loadMoreButton.style.display = nextPageToken ? 'inline-flex' : 'none';
      loadMoreButton.disabled = isLoading;
      loadMoreButton.style.opacity = isLoading ? '0.48' : '1';
      loadMoreButton.style.cursor = isLoading ? 'not-allowed' : 'pointer';

      list.innerHTML = '';

      if (errorMessage) {
        const errorPanel = document.createElement('div');
        errorPanel.style.padding = '22px';
        errorPanel.style.border = '1px solid rgba(248, 113, 113, 0.35)';
        errorPanel.style.borderRadius = '12px';
        errorPanel.style.background = '#fff1f2';
        errorPanel.style.color = '#be123c';
        errorPanel.textContent = errorMessage;
        list.appendChild(errorPanel);
      }

      if (isLoading && visibleEntries.length === 0) {
        const loadingPanel = document.createElement('div');
        loadingPanel.style.padding = '28px';
        loadingPanel.style.border = '1px dashed rgba(147, 197, 253, 0.9)';
        loadingPanel.style.borderRadius = '14px';
        loadingPanel.style.background = '#ffffff';
        loadingPanel.style.textAlign = 'center';
        loadingPanel.style.color = '#475569';
        loadingPanel.textContent = 'Đang tải dữ liệu Google Drive...';
        list.appendChild(loadingPanel);
        return;
      }

      if (!isLoading && visibleEntries.length === 0 && !errorMessage) {
        const empty = document.createElement('div');
        empty.style.padding = '28px';
        empty.style.border = '1px dashed rgba(147, 197, 253, 0.9)';
        empty.style.borderRadius = '14px';
        empty.style.background = '#ffffff';
        empty.style.textAlign = 'center';
        empty.style.color = '#475569';
        empty.textContent = currentSearch ? 'Không tìm thấy tệp phù hợp.' : 'Thư mục này chưa có tệp phù hợp.';
        list.appendChild(empty);
        return;
      }

      for (const file of visibleEntries) {
        const folder = isDriveFolder(file);
        const selectable = isSelectableDriveFile(file, allowedMimeTypes);
        const selected = selectedFiles.has(file.id);
        const row = document.createElement('button');
        row.type = 'button';
        row.style.width = '100%';
        row.style.textAlign = 'left';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '12px';
        row.style.padding = '12px 14px';
        row.style.borderRadius = '12px';
        row.style.border = selected ? '1px solid rgba(35,136,255,.7)' : `1px solid ${dk.border}`;
        row.style.background = selected ? (isDark ? 'rgba(35,136,255,0.15)' : '#e8f3ff') : dk.bg;
        row.style.cursor = selectable || folder ? 'pointer' : 'default';
        row.style.opacity = selectable || folder ? '1' : '0.58';
        row.style.font = 'inherit';

        const modifiedTime = formatDriveModifiedTime(file.modifiedTime);
        const meta = folder
          ? 'Thư mục'
          : [file.mimeType, formatFileSize(file.size), modifiedTime ? `Sửa ${modifiedTime}` : '']
              .filter(Boolean)
              .join(' | ');

        row.innerHTML = `
          <div style="min-width:0;display:flex;align-items:center;gap:10px;">
            <span style="width:42px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:1px solid ${dk.btnBorder};border-radius:8px;background:${folder ? (isDark ? 'rgba(52,211,153,0.12)' : '#ecfdf5') : (isDark ? 'rgba(59,158,255,0.1)' : '#eff6ff')};color:${folder ? (isDark ? '#34d399' : '#047857') : '#2388ff'};font-size:10px;font-weight:800;letter-spacing:.08em;flex:0 0 auto;">${folder ? 'MỤC' : 'TỆP'}</span>
            <div style="min-width:0;">
              <div style="font-size:14px;font-weight:750;color:${dk.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(file.name)}</div>
              <div style="margin-top:4px;font-size:11px;color:${dk.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(meta)}</div>
            </div>
          </div>
          <div style="flex-shrink:0;font-size:11px;font-weight:800;color:${selected ? '#2388ff' : '#64748b'};">
            ${folder ? 'Mở' : selected ? 'Đã chọn' : selectable ? 'Chọn' : ''}
          </div>
        `;

        row.onclick = () => {
          if (folder) {
            const navigatingFromSearch = Boolean(currentSearch);
            currentFolderId = file.id;
            currentSearch = '';
            searchInput.value = '';

            if (breadcrumbs[breadcrumbs.length - 1]?.id !== file.id) {
              if (breadcrumbs.some((item) => item.id === file.id)) {
                const existingIndex = breadcrumbs.findIndex((item) => item.id === file.id);
                breadcrumbs.splice(existingIndex + 1);
              } else if (navigatingFromSearch) {
                breadcrumbs.splice(1, breadcrumbs.length - 1, { id: file.id, name: file.name || 'Thư mục' });
              } else {
                breadcrumbs.push({ id: file.id, name: file.name || 'Thư mục' });
              }
            }

            void loadEntries();
            return;
          }

          if (!selectable) return;

          if (!options.multiSelect) {
            selectedFiles.clear();
          }

          if (selectedFiles.has(file.id)) {
            selectedFiles.delete(file.id);
          } else {
            selectedFiles.set(file.id, file);
          }

          renderList();
        };

        list.appendChild(row);
      }

      if (isLoading && visibleEntries.length > 0) {
        const loadingMore = document.createElement('div');
        loadingMore.style.padding = '8px 4px 0';
        loadingMore.style.fontSize = '12px';
        loadingMore.style.color = '#475569';
        loadingMore.textContent = 'Đang tải thêm...';
        list.appendChild(loadingMore);
      }
    };

    const mergeEntries = (baseEntries: DriveFile[], incomingEntries: DriveFile[]) => {
      const merged = new Map<string, DriveFile>();
      baseEntries.forEach((file) => merged.set(file.id, file));
      incomingEntries.forEach((file) => merged.set(file.id, file));
      return [...merged.values()];
    };

    const loadEntries = async (config: { append?: boolean; pageToken?: string | null } = {}) => {
      const append = Boolean(config.append);
      const version = ++requestVersion;

      isLoading = true;
      if (!append) {
        errorMessage = '';
      }
      renderList();

      try {
        const response = await options.loadPage({
          folderId: currentSearch ? undefined : currentFolderId,
          search: currentSearch || undefined,
          pageToken: append ? config.pageToken ?? nextPageToken : null,
        });

        if (version !== requestVersion) return;

        entries = append ? mergeEntries(entries, response.files) : response.files;
        nextPageToken = response.nextPageToken;
        errorMessage = '';
      } catch (error) {
        if (version !== requestVersion) return;
        errorMessage = error instanceof Error ? error.message : 'Không thể mở Google Drive lúc này.';
        if (!append) {
          entries = [];
          nextPageToken = null;
        }
      } finally {
        if (version === requestVersion) {
          isLoading = false;
          renderList();
        }
      }
    };

    confirmButton.onclick = () => close([...selectedFiles.values()]);
    loadMoreButton.onclick = () => {
      if (!nextPageToken || isLoading) return;
      void loadEntries({ append: true, pageToken: nextPageToken });
    };

    cancelButtons.forEach((button) => {
      button.addEventListener('click', () => close([]));
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close([]);
    });

    searchInput.addEventListener('input', () => {
      if (searchDebounceId !== null) {
        window.clearTimeout(searchDebounceId);
      }

      searchDebounceId = window.setTimeout(() => {
        currentSearch = searchInput.value.trim();
        void loadEntries();
      }, 250);
    });

    renderList();
    void loadEntries();
    searchInput.focus();
  });
}

class GoogleDriveService {
  private pendingExchangePromise: Promise<void> | null = null;
  private pageCache = new Map<string, DrivePageCacheEntry>();

  private isGoogleRedirectInProgress(error: unknown): boolean {
    return error instanceof Error && error.message === GOOGLE_REDIRECT_IN_PROGRESS_MESSAGE;
  }

  private clearPageCache() {
    this.pageCache.clear();
  }

  private async performPickAndImport(options: {
    mimeTypes?: string;
    multiSelect?: boolean;
    fileType: 'cv' | 'jd';
    redirectUri?: string;
  }): Promise<ImportedDriveFile[]> {
    const selectedFiles = await this.openPicker(options);
    if (selectedFiles.length === 0) return [];

    return mapWithConcurrency(
      selectedFiles,
      DRIVE_IMPORT_CONCURRENCY,
      (file) => this.importFile(file.id, options.fileType)
    );
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
          this.clearPageCache();
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

  public async connectWithGoogleSession(
    accessToken: string,
    options: { expiresInSeconds?: number; scopes?: string[] } = {}
  ): Promise<GoogleDriveConnectionStatus | null> {
    const normalizedToken = accessToken.trim();
    if (!normalizedToken) return null;

    await this.completeOAuthCallbackIfNeeded();
    const response = await apiPost<GoogleDriveConnectionStatus>(
      '/api/account/google-drive/session-auth',
      {
        accessToken: normalizedToken,
        expiresInSeconds: options.expiresInSeconds,
        scopes: options.scopes || [],
      },
      { authRequired: true }
    );
    this.clearPageCache();
    return response;
  }

  public async authenticate(redirectUri: string = buildRedirectUri()): Promise<'connected'> {
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
  }

  private async listPage(options: {
    mimeTypes?: string;
    pageSize?: number;
    redirectUri?: string;
    folderId?: string;
    search?: string;
    pageToken?: string | null;
  }): Promise<DrivePageResult> {
    await this.completeOAuthCallbackIfNeeded();
    await this.authenticate(options.redirectUri);

    const pageSize = options.pageSize || DRIVE_PAGE_SIZE;
    const mimeTypeKey = normalizeMimeTypeKey(options.mimeTypes);
    const folderId = options.search ? '' : options.folderId || ROOT_FOLDER_ID;
    const search = options.search?.trim() || '';
    const pageToken = options.pageToken || '';
    const cacheKey = JSON.stringify({ folderId, search, mimeTypeKey, pageSize, pageToken });
    const cached = this.pageCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      if (cached.page) return cached.page;
      if (cached.promise) return cached.promise;
    }

    const promise = (async () => {
      const query = new URLSearchParams();
      query.set('page_size', String(pageSize));
      if (mimeTypeKey) query.set('mime_types', mimeTypeKey);
      if (folderId) query.set('folder_id', folderId);
      if (search) query.set('search', search);
      if (pageToken) query.set('page_token', pageToken);

      const response = await apiGet<GoogleDriveFilesResponse>(
        `/api/account/google-drive/files?${query.toString()}`,
        { authRequired: true }
      );

      const page: DrivePageResult = {
        files: Array.isArray(response.files) ? response.files.map((file) => normalizeDriveFile(file)) : [],
        nextPageToken: response.nextPageToken || null,
      };

      this.pageCache.set(cacheKey, {
        expiresAt: Date.now() + DRIVE_PAGE_CACHE_TTL_MS,
        page,
      });
      return page;
    })();

    this.pageCache.set(cacheKey, {
      expiresAt: Date.now() + DRIVE_PAGE_CACHE_TTL_MS,
      promise,
    });

    try {
      return await promise;
    } catch (error) {
      this.pageCache.delete(cacheKey);
      throw error;
    }
  }

  public async openPicker(options: {
    mimeTypes?: string;
    multiSelect?: boolean;
    redirectUri?: string;
  }): Promise<DriveFile[]> {
    await this.completeOAuthCallbackIfNeeded();
    await this.authenticate(options.redirectUri);

    return createDriveSelectionModal({
      multiSelect: Boolean(options.multiSelect),
      mimeTypes: options.mimeTypes,
      loadPage: (request) =>
        this.listPage({
          mimeTypes: options.mimeTypes,
          redirectUri: options.redirectUri,
          folderId: request.folderId,
          search: request.search,
          pageToken: request.pageToken,
        }),
    });
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

    const importedFile = new File([response.extractedText || ''], response.fileName, {
      type: response.mimeType || 'text/plain',
    }) as ImportedDriveFile;

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
