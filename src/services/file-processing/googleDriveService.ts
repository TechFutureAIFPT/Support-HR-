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

const GOOGLE_DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const DRIVE_LIST_CACHE_TTL_MS = 60_000;
const DRIVE_LIST_PAGE_SIZE = 100;
const DRIVE_IMPORT_CONCURRENCY = 3;
const DRIVE_NAME_COLLATOR = new Intl.Collator(['vi', 'en'], {
  numeric: true,
  sensitivity: 'base',
});

interface DriveTreeRow {
  file: DriveFile;
  depth: number;
  hasChildren: boolean;
  selectable: boolean;
}

interface DriveListCacheEntry {
  expiresAt: number;
  files?: DriveFile[];
  promise?: Promise<DriveFile[]>;
}

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

function filterByMimeTypes(files: DriveFile[], mimeTypes?: string): DriveFile[] {
  const allowed = parseMimeTypes(mimeTypes);
  if (!allowed) return files;
  return files.filter((file) => isDriveFolder(file) || allowed.has(file.mimeType));
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

function buildDriveTreeRows(
  files: DriveFile[],
  mimeTypes: string | undefined,
  expandedFolderIds: Set<string>,
  searchQuery: string
): DriveTreeRow[] {
  const allowedMimeTypes = parseMimeTypes(mimeTypes);
  const byId = new Map(files.map((file) => [file.id, file]));
  const folderIds = new Set(files.filter(isDriveFolder).map((file) => file.id));
  const childrenByParent = new Map<string, DriveFile[]>();
  const roots: DriveFile[] = [];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchedIds = new Set<string>();

  const findVisibleParentId = (file: DriveFile): string | null =>
    file.parents.find((parentId) => folderIds.has(parentId)) || null;

  for (const file of files) {
    const parentId = findVisibleParentId(file);
    if (!parentId) {
      roots.push(file);
      continue;
    }

    const siblings = childrenByParent.get(parentId) || [];
    siblings.push(file);
    childrenByParent.set(parentId, siblings);
  }

  const sortFiles = (items: DriveFile[]) =>
    [...items].sort((first, second) => {
      const firstFolder = isDriveFolder(first);
      const secondFolder = isDriveFolder(second);
      if (firstFolder !== secondFolder) return firstFolder ? -1 : 1;
      return DRIVE_NAME_COLLATOR.compare(first.name, second.name);
    });

  if (normalizedQuery) {
    const addWithAncestors = (file: DriveFile) => {
      matchedIds.add(file.id);
      let current: DriveFile | undefined = file;
      const visited = new Set<string>();

      while (current) {
        const parentId = findVisibleParentId(current);
        if (!parentId || visited.has(parentId)) break;
        matchedIds.add(parentId);
        visited.add(parentId);
        current = byId.get(parentId);
      }
    };

    for (const file of files) {
      if (file.name.toLowerCase().includes(normalizedQuery)) {
        addWithAncestors(file);
      }
    }
  }

  const rows: DriveTreeRow[] = [];
  const walk = (items: DriveFile[], depth: number) => {
    for (const file of sortFiles(items)) {
      if (normalizedQuery && !matchedIds.has(file.id)) continue;

      const isFolder = isDriveFolder(file);
      const children = childrenByParent.get(file.id) || [];
      rows.push({
        file,
        depth,
        hasChildren: children.length > 0,
        selectable: isSelectableDriveFile(file, allowedMimeTypes),
      });

      if (isFolder && children.length > 0 && (normalizedQuery || expandedFolderIds.has(file.id))) {
        walk(children, depth + 1);
      }
    }
  };

  walk(roots, 0);
  return rows;
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

function createFlatDriveSelectionModal(
  files: DriveFile[],
  multiSelect: boolean,
  mimeTypes?: string
): Promise<DriveFile[]> {
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

function createDriveSelectionModal(
  files: DriveFile[],
  multiSelect: boolean,
  mimeTypes?: string
): Promise<DriveFile[]> {
  return new Promise((resolve) => {
    const expandedFolderIds = new Set(files.filter(isDriveFolder).map((file) => file.id));
    const selectedIds = new Set<string>();

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.background = 'rgba(0, 0, 0, 0.82)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';

    const panel = document.createElement('div');
    panel.style.width = 'min(980px, 100%)';
    panel.style.maxHeight = '84vh';
    panel.style.background = '#030303';
    panel.style.border = '1px solid rgba(245, 214, 187, 0.22)';
    panel.style.borderRadius = '0';
    panel.style.overflow = 'hidden';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.boxShadow = '0 24px 80px rgba(0, 0, 0, 0.55)';

    const header = document.createElement('div');
    header.style.padding = '18px 20px';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    header.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div style="min-width:0;">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#f5d6bb;font-weight:800;">Google Drive</div>
          <div style="margin-top:6px;font-size:20px;line-height:1.2;color:#f8fafc;font-weight:800;">Chọn tệp từ Drive</div>
        </div>
        <button data-role="cancel" style="height:36px;padding:0 14px;border-radius:0;border:1px solid rgba(255,255,255,.16);background:#0a0a0a;color:#e5e7eb;cursor:pointer;font:inherit;">Đóng</button>
      </div>
    `;

    const toolbar = document.createElement('div');
    toolbar.style.padding = '14px 20px';
    toolbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    toolbar.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <input data-role="search" placeholder="Tìm theo tên file hoặc thư mục..." style="flex:1;min-width:240px;height:42px;padding:0 12px;border-radius:0;border:1px solid rgba(255,255,255,.14);background:#080808;color:#f8fafc;outline:none;font:inherit;" />
        <div data-role="stats" style="font-size:12px;color:#9ca3af;white-space:nowrap;"></div>
      </div>
    `;

    const list = document.createElement('div');
    list.style.padding = '12px 20px';
    list.style.overflow = 'auto';
    list.style.display = 'grid';
    list.style.gap = '8px';

    const footer = document.createElement('div');
    footer.style.padding = '14px 20px';
    footer.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.gap = '14px';
    footer.style.flexWrap = 'wrap';
    footer.innerHTML = `
      <div data-role="summary" style="font-size:12px;color:#9ca3af;">Chưa chọn tệp nào</div>
      <div style="display:flex;gap:10px;">
        <button data-role="cancel" style="height:40px;padding:0 16px;border-radius:0;border:1px solid rgba(255,255,255,.16);background:#0a0a0a;color:#e5e7eb;cursor:pointer;font:inherit;">Hủy</button>
        <button data-role="confirm" style="height:40px;padding:0 18px;border-radius:0;border:1px solid rgba(245,214,187,.42);background:#f5d6bb;color:#050505;cursor:pointer;font-weight:800;font-family:inherit;">Sử dụng tệp đã chọn</button>
      </div>
    `;

    panel.appendChild(header);
    panel.appendChild(toolbar);
    panel.appendChild(list);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const searchInput = toolbar.querySelector('[data-role="search"]') as HTMLInputElement;
    const stats = toolbar.querySelector('[data-role="stats"]') as HTMLDivElement;
    const summary = footer.querySelector('[data-role="summary"]') as HTMLDivElement;
    const confirmButton = footer.querySelector('[data-role="confirm"]') as HTMLButtonElement;
    const cancelButtons = overlay.querySelectorAll('[data-role="cancel"]');

    const updateSummary = () => {
      summary.textContent = selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} tệp` : 'Chưa chọn tệp nào';
      confirmButton.disabled = selectedIds.size === 0;
      confirmButton.style.opacity = selectedIds.size === 0 ? '0.48' : '1';
      confirmButton.style.cursor = selectedIds.size === 0 ? 'not-allowed' : 'pointer';
    };

    const close = (selected: DriveFile[]) => {
      overlay.remove();
      resolve(selected);
    };

    const render = () => {
      const query = searchInput.value.trim();
      const rows = buildDriveTreeRows(files, mimeTypes, expandedFolderIds, query);
      const selectableCount = rows.filter((row) => row.selectable).length;
      stats.textContent = `${rows.length} mục · ${selectableCount} tệp`;
      list.innerHTML = '';

      if (rows.length === 0) {
        const empty = document.createElement('div');
        empty.style.padding = '28px';
        empty.style.border = '1px dashed rgba(255, 255, 255, 0.18)';
        empty.style.textAlign = 'center';
        empty.style.color = '#9ca3af';
        empty.textContent = 'Không tìm thấy tệp phù hợp.';
        list.appendChild(empty);
        updateSummary();
        return;
      }

      for (const rowInfo of rows) {
        const { file, depth, hasChildren, selectable } = rowInfo;
        const folder = isDriveFolder(file);
        const selected = selectedIds.has(file.id);
        const row = document.createElement('button');
        row.type = 'button';
        row.style.width = '100%';
        row.style.textAlign = 'left';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '12px';
        row.style.padding = '12px 14px';
        row.style.borderRadius = '0';
        row.style.border = selected ? '1px solid rgba(245,214,187,.78)' : '1px solid rgba(255,255,255,.1)';
        row.style.background = selected ? 'rgba(245,214,187,.12)' : '#080808';
        row.style.cursor = selectable || folder ? 'pointer' : 'default';
        row.style.opacity = selectable || folder ? '1' : '0.58';
        row.style.font = 'inherit';

        const modifiedTime = formatDriveModifiedTime(file.modifiedTime);
        const meta = folder
          ? 'Thư mục'
          : [file.mimeType, formatFileSize(file.size), modifiedTime ? `Sửa ${modifiedTime}` : '']
              .filter(Boolean)
              .join(' · ');
        const branchMarker = folder && hasChildren ? (expandedFolderIds.has(file.id) ? '-' : '+') : '';
        const leftPadding = Math.min(depth * 24, 144);

        row.innerHTML = `
          <div style="min-width:0;display:flex;align-items:center;gap:10px;padding-left:${leftPadding}px;">
            <span style="width:18px;color:#f5d6bb;font-size:13px;text-align:center;flex:0 0 auto;">${branchMarker}</span>
            <span style="width:42px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.14);color:${folder ? '#f5d6bb' : '#e5e7eb'};font-size:10px;font-weight:800;letter-spacing:.08em;flex:0 0 auto;">${folder ? 'DIR' : 'FILE'}</span>
            <div style="min-width:0;">
              <div style="font-size:14px;font-weight:750;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(file.name)}</div>
              <div style="margin-top:4px;font-size:11px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(meta)}</div>
            </div>
          </div>
          <div style="flex-shrink:0;font-size:11px;font-weight:800;color:${selected ? '#f5d6bb' : '#6b7280'};">
            ${selected ? 'Đã chọn' : selectable ? 'Chọn' : ''}
          </div>
        `;

        row.onclick = () => {
          if (folder) {
            if (hasChildren) {
              if (expandedFolderIds.has(file.id)) {
                expandedFolderIds.delete(file.id);
              } else {
                expandedFolderIds.add(file.id);
              }
              render();
            }
            return;
          }

          if (!selectable) return;

          if (!multiSelect) selectedIds.clear();
          if (selectedIds.has(file.id)) {
            selectedIds.delete(file.id);
          } else {
            selectedIds.add(file.id);
          }
          render();
        };

        list.appendChild(row);
      }

      updateSummary();
    };

    confirmButton.onclick = () => {
      if (selectedIds.size === 0) return;
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
    searchInput.focus();
  });
}

class GoogleDriveService {
  private pendingExchangePromise: Promise<void> | null = null;
  private listCache = new Map<string, DriveListCacheEntry>();

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

    const pageSize = options.pageSize || DRIVE_LIST_PAGE_SIZE;
    const mimeTypeKey = normalizeMimeTypeKey(options.mimeTypes);
    const cacheKey = JSON.stringify({ mimeTypeKey, pageSize });
    const cached = this.listCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      if (cached.files) return cached.files;
      if (cached.promise) return cached.promise;
    }

    const promise = (async () => {
      let pageToken: string | null | undefined;
      const files: DriveFile[] = [];

      do {
        const query = new URLSearchParams();
        query.set('page_size', String(pageSize));
        if (mimeTypeKey) query.set('mime_types', mimeTypeKey);
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

      const filteredFiles = filterByMimeTypes(files, options.mimeTypes);
      this.listCache.set(cacheKey, {
        expiresAt: Date.now() + DRIVE_LIST_CACHE_TTL_MS,
        files: filteredFiles,
      });
      return filteredFiles;
    })();

    this.listCache.set(cacheKey, {
      expiresAt: Date.now() + DRIVE_LIST_CACHE_TTL_MS,
      promise,
    });

    try {
      return await promise;
    } catch (error) {
      this.listCache.delete(cacheKey);
      throw error;
    }
  }

  public async openPicker(options: { mimeTypes?: string; multiSelect?: boolean; redirectUri?: string }): Promise<DriveFile[]> {
    const files = await this.listFiles({ mimeTypes: options.mimeTypes, redirectUri: options.redirectUri });
    return createDriveSelectionModal(files, Boolean(options.multiSelect), options.mimeTypes);
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
