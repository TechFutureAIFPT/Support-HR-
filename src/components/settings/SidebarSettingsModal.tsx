import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudOff,
  Database,
  History,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Settings,
  Trash2,
  Upload,
  UserCircle2,
  Workflow,
  X,
} from 'lucide-react';
import type { HistoryRetention, NewSessionMode } from '@/types';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';
import { JDTemplatesService } from '@/services/data-sync/jdTemplatesService';
import type { UserJDTemplate } from '@/services/data-sync/jdTemplatesService';

interface SidebarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  userAvatar?: string | null;
  onLogout?: () => void;
  onSaveAccountProfile: (payload: { displayName: string; avatar: string | null }) => Promise<void>;
  onClearWorkflowDraft: () => void;
  onClearLocalCache: () => void;
  onClearLocalHistory: () => void;
  onClearLocalDocuments: () => Promise<void>;
  onClearSyncedData: () => Promise<void>;
}

type SettingsTab = 'profile' | 'workspace' | 'notifications' | 'data' | 'jd';

const TABS: Array<{ id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'profile',       label: 'Hồ sơ',      icon: UserCircle2 },
  { id: 'workspace',     label: 'Quy trình',   icon: Workflow },
  { id: 'notifications', label: 'Thông báo',   icon: Bell },
  { id: 'data',          label: 'Dữ liệu',     icon: Database },
  { id: 'jd',            label: 'JD',          icon: BookOpen },
];

// ── Primitives ────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${
        checked ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-slate-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
      />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  saving,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  saving?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block text-[13px] font-semibold text-slate-900">{title}</span>
          {saving && <Loader2 size={12} className="animate-spin text-blue-400" />}
        </span>
        {description && <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{description}</span>}
      </span>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition ${
            value === opt.value
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {opt.label}
          {opt.hint && <span className="ml-1.5 text-[11px] font-normal text-slate-400">{opt.hint}</span>}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      {title && (
        <h4 className="px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{title}</h4>
      )}
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function InlineConfirmButton({
  icon: Icon = Trash2,
  label,
  confirmLabel,
  description,
  tone = 'neutral',
  onConfirm,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  confirmLabel?: string;
  description: string;
  tone?: 'neutral' | 'danger';
  onConfirm: () => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfirming(false);
    await onConfirm();
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  const isDanger = tone === 'danger';

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        confirming
          ? 'border-rose-400 bg-rose-50'
          : isDanger
            ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
          confirming
            ? 'border-rose-300 bg-white text-rose-600'
            : isDanger
              ? 'border-rose-200 bg-white text-rose-500'
              : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        {done ? <Check size={14} /> : <Icon size={14} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-semibold ${confirming ? 'text-rose-700' : isDanger ? 'text-rose-800' : 'text-slate-800'}`}>
          {done ? 'Đã xong' : confirming ? (confirmLabel || 'Bấm lần nữa để xác nhận') : label}
        </span>
        <span className={`mt-0.5 block text-[11px] leading-4 ${confirming ? 'text-rose-500' : 'text-slate-400'}`}>
          {description}
        </span>
      </span>
      {confirming && (
        <span className="shrink-0 text-[11px] font-semibold text-rose-500">3s</span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const SidebarSettingsModal: React.FC<SidebarSettingsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  userAvatar,
  onLogout,
  onSaveAccountProfile,
  onClearWorkflowDraft,
  onClearLocalCache,
  onClearLocalHistory,
  onClearLocalDocuments,
  onClearSyncedData,
}) => {
  const { settings, saveSettings, resetSettings, syncStatus, syncError } = useUserSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile fields with local state + debounced save
  const [displayName, setDisplayName] = useState(userName || settings.account.displayName || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userAvatar || settings.account.avatar || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Per-toggle saving indicator
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Fixed JD local state
  const [fixedJDName, setFixedJDName] = useState(settings.workflow.fixedJD?.name || '');
  const [fixedJDText, setFixedJDText] = useState(settings.workflow.fixedJD?.jdText || '');
  const [fixedJDSaving, setFixedJDSaving] = useState(false);
  const [fixedJDSaved, setFixedJDSaved] = useState(false);

  // Danger zone
  const [dangerOpen, setDangerOpen] = useState(false);

  // JD templates
  const [templates, setTemplates] = useState<UserJDTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [addTplOpen, setAddTplOpen] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplPosition, setNewTplPosition] = useState('');
  const [newTplText, setNewTplText] = useState('');
  const [newTplSaving, setNewTplSaving] = useState(false);
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(userName || settings.account.displayName || '');
    setAvatarPreview(userAvatar || settings.account.avatar || null);
    setFixedJDName(settings.workflow.fixedJD?.name || '');
    setFixedJDText(settings.workflow.fixedJD?.jdText || '');
    setActiveTab('profile');
    setDangerOpen(false);
    setAddTplOpen(false);
    setNewTplName('');
    setNewTplPosition('');
    setNewTplText('');
  }, [isOpen, settings.account.avatar, settings.account.displayName, settings.workflow.fixedJD, userAvatar, userName]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (activeTab !== 'jd') return;
    setTemplatesLoading(true);
    setTemplates(JDTemplatesService.getCachedUserTemplates());
    void JDTemplatesService.getUserTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, [activeTab]);

  // Auto-save toggle helper
  const autoSave = useCallback(async (key: string, patch: Parameters<typeof saveSettings>[0]) => {
    setSavingKey(key);
    try {
      await saveSettings(patch);
    } finally {
      setSavingKey(null);
    }
  }, [saveSettings]);

  // Debounced profile save
  const scheduleProfileSave = useCallback((name: string, avatar: string | null) => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    profileTimerRef.current = setTimeout(async () => {
      setProfileSaving(true);
      try {
        await onSaveAccountProfile({ displayName: name.trim(), avatar });
        await saveSettings({ account: { displayName: name.trim(), avatar, email: userEmail || settings.account.email } });
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2000);
      } finally {
        setProfileSaving(false);
      }
    }, 1200);
  }, [onSaveAccountProfile, saveSettings, settings.account.email, userEmail]);

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    scheduleProfileSave(value, avatarPreview);
  };

  const handleAvatarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setAvatarPreview(result);
      scheduleProfileSave(displayName, result);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const syncBadge = (() => {
    if (syncStatus === 'synced') return { icon: <CheckCircle2 size={12} />, label: 'Đã đồng bộ', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    if (syncStatus === 'pending') return { icon: <Loader2 size={12} className="animate-spin" />, label: 'Đang lưu', cls: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (syncStatus === 'error') return { icon: <AlertTriangle size={12} />, label: 'Lỗi đồng bộ', cls: 'border-rose-200 bg-rose-50 text-rose-700' };
    return { icon: <CloudOff size={12} />, label: 'Chưa đăng nhập', cls: 'border-slate-200 bg-slate-100 text-slate-500' };
  })();

  // ── Tab: Profile ──
  const profileTab = (
    <div className="space-y-5">
      <Section title="Thông tin cá nhân">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 transition hover:border-blue-300"
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                : <UserCircle2 size={28} className="absolute inset-0 m-auto text-slate-400" />
              }
              <span className="absolute inset-0 flex items-end justify-center bg-black/0 pb-1 opacity-0 transition hover:bg-black/20 hover:opacity-100">
                <Upload size={13} className="text-white" />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarInput} className="hidden" />

            <div className="min-w-0 flex-1 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Tên hiển thị</label>
                <div className="relative">
                  <input
                    value={displayName}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {profileSaving
                      ? <Loader2 size={13} className="animate-spin text-blue-400" />
                      : profileSaved
                        ? <CheckCircle2 size={13} className="text-emerald-500" />
                        : null}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Email</p>
                <p className="mt-0.5 text-[13px] font-medium text-slate-800">{userEmail || 'Chưa đăng nhập'}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Phiên đăng nhập">
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
          <p className="text-[12px] leading-5 text-slate-500">
            Đăng xuất khỏi tài khoản hiện tại trên thiết bị này. Dữ liệu đã đồng bộ được giữ nguyên trên server.
          </p>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut size={13} />
              Đăng xuất
            </button>
          )}
        </div>
      </Section>
    </div>
  );

  // ── Tab: Workspace ──
  const workspaceTab = (
    <div className="space-y-5">
      <Section title="Tự lưu và khôi phục">
        <ToggleRow
          title="Tự lưu phiên làm việc"
          description="Lưu JD, bộ lọc và trạng thái hiện tại để tiếp tục sau."
          checked={settings.workflow.autoSaveDraft}
          saving={savingKey === 'autoSaveDraft'}
          onChange={(v) => void autoSave('autoSaveDraft', { workflow: { ...settings.workflow, autoSaveDraft: v } })}
        />
        <ToggleRow
          title="Khôi phục phiên dang dở"
          description="Tự mở lại phiên chưa hoàn tất khi quay lại app."
          checked={settings.workflow.restoreDraft}
          saving={savingKey === 'restoreDraft'}
          onChange={(v) => void autoSave('restoreDraft', { workflow: { ...settings.workflow, restoreDraft: v } })}
        />
        <ToggleRow
          title="Tự lưu lịch sử phân tích"
          description="Lưu kết quả vào history sau khi phân tích hoàn tất."
          checked={settings.workflow.autoSaveHistory}
          saving={savingKey === 'autoSaveHistory'}
          onChange={(v) => void autoSave('autoSaveHistory', { workflow: { ...settings.workflow, autoSaveHistory: v } })}
        />
        <ToggleRow
          title="Ghi nhớ tiêu chí chấm điểm"
          description="Giữ weights và bộ lọc cứng cho phiên sàng lọc tiếp theo."
          checked={settings.workflow.rememberScoringConfig}
          saving={savingKey === 'rememberScoringConfig'}
          onChange={(v) => void autoSave('rememberScoringConfig', {
            workflow: {
              ...settings.workflow,
              rememberScoringConfig: v,
              newSessionMode: v ? settings.workflow.newSessionMode : 'reset',
            },
          })}
        />
      </Section>

      <Section title="Khi bắt đầu phiên mới">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="mb-3 text-[12px] leading-5 text-slate-500">
            Chọn app nên reset toàn bộ hay giữ lại cấu hình sàng lọc khi bạn bắt đầu phiên mới.
          </p>
          <ChipGroup<NewSessionMode>
            value={settings.workflow.newSessionMode}
            onChange={(v) => void autoSave('newSessionMode', { workflow: { ...settings.workflow, newSessionMode: v } })}
            options={[
              { value: 'reset', label: 'Reset trắng', hint: '— xóa JD và cấu hình' },
              { value: 'keep-config', label: 'Giữ cấu hình', hint: '— chỉ xóa dữ liệu phiên' },
            ]}
          />
        </div>
      </Section>

    </div>
  );

  // ── Tab: Notifications ──
  const notificationsTab = (
    <div className="space-y-5">
      <Section title="Thông báo trong app">
        <ToggleRow
          title="Phân tích hoàn tất"
          description="Hiển thị thông báo khi AI xử lý xong toàn bộ CV trong phiên."
          checked={settings.notifications.analysisComplete}
          saving={savingKey === 'analysisComplete'}
          onChange={(v) => void autoSave('analysisComplete', { notifications: { ...settings.notifications, analysisComplete: v } })}
        />
        <ToggleRow
          title="Lỗi đồng bộ"
          description="Nhắc khi lưu cài đặt hoặc dữ liệu lên server thất bại."
          checked={settings.notifications.syncErrors}
          saving={savingKey === 'syncErrors'}
          onChange={(v) => void autoSave('syncErrors', { notifications: { ...settings.notifications, syncErrors: v } })}
        />
        <ToggleRow
          title="Lưu history thành công"
          description="Hiển thị xác nhận sau khi lưu phiên phân tích vào lịch sử."
          checked={settings.notifications.historySaved}
          saving={savingKey === 'historySaved'}
          onChange={(v) => void autoSave('historySaved', { notifications: { ...settings.notifications, historySaved: v } })}
        />
        <ToggleRow
          title="Badge ở sidebar"
          description="Bật hoặc tắt chấm đỏ nhắc việc trong menu bên trái."
          checked={settings.notifications.sidebarBadge}
          saving={savingKey === 'sidebarBadge'}
          onChange={(v) => void autoSave('sidebarBadge', { notifications: { ...settings.notifications, sidebarBadge: v } })}
        />
      </Section>
    </div>
  );

  // ── Tab: Data ──
  const dataTab = (
    <div className="space-y-5">
      <Section title="Đồng bộ dữ liệu">
        <ToggleRow
          title="Tự đồng bộ khi đã đăng nhập"
          description="Tự đồng bộ cache và dữ liệu phân tích giữa các thiết bị."
          checked={settings.sync.autoSync}
          saving={savingKey === 'autoSync'}
          onChange={(v) => void autoSave('autoSync', { sync: { ...settings.sync, autoSync: v } })}
        />
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="mb-2 text-[12px] font-semibold text-slate-700">Số phiên lịch sử giữ lại</p>
          <p className="mb-3 text-[12px] leading-5 text-slate-500">Số phiên phân tích được lưu trên server. Phiên cũ hơn sẽ tự xóa.</p>
          <ChipGroup<HistoryRetention>
            value={settings.sync.historyRetention}
            onChange={(v) => void autoSave('historyRetention', { sync: { ...settings.sync, historyRetention: v } })}
            options={[
              { value: 50,  label: '50 phiên' },
              { value: 100, label: '100 phiên' },
              { value: 200, label: '200 phiên' },
            ]}
          />
        </div>
      </Section>

      <Section>
        <button
          type="button"
          onClick={() => setDangerOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <AlertTriangle size={14} className="text-rose-400" />
          <span className="flex-1">Khu vực nguy hiểm</span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dangerOpen ? 'rotate-180' : ''}`} />
        </button>

        {dangerOpen && (
          <div className="space-y-1.5 pt-1">
            <InlineConfirmButton
              label="Xóa workflow draft cục bộ"
              description="Xóa phiên làm việc đang lưu trên máy này."
              onConfirm={() => onClearWorkflowDraft()}
            />
            <InlineConfirmButton
              label="Xóa cache phân tích cục bộ"
              description="Xóa kết quả cache đang lưu trên thiết bị này."
              onConfirm={() => onClearLocalCache()}
            />
            <InlineConfirmButton
              icon={History}
              label="Xóa lịch sử cục bộ"
              description="Xóa history phân tích đang lưu trên máy này."
              onConfirm={() => onClearLocalHistory()}
            />
            <InlineConfirmButton
              label="Xóa file CV cục bộ"
              description="Xóa PDF, DOCX và ảnh CV được lưu trên thiết bị."
              onConfirm={async () => onClearLocalDocuments()}
            />
            <InlineConfirmButton
              tone="danger"
              label="Xóa dữ liệu đã sync trên server"
              confirmLabel="Xác nhận — dữ liệu sẽ không thể khôi phục"
              description="Xóa toàn bộ cache và history đã đồng bộ của tài khoản."
              onConfirm={async () => onClearSyncedData()}
            />
            <InlineConfirmButton
              icon={RefreshCcw}
              tone="danger"
              label="Reset toàn bộ cài đặt về mặc định"
              confirmLabel="Xác nhận reset — không thể hoàn tác"
              description="Đưa tất cả cài đặt về mặc định, giữ thông tin tài khoản."
              onConfirm={async () => { await resetSettings(); }}
            />
          </div>
        )}
      </Section>
    </div>
  );

  // ── Tab: JD ──
  const jdTab = (
    <div className="space-y-5">
      <Section title="JD mặc định">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900">Tự động điền JD khi mở phiên mới</p>
              <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                Lưu một JD cố định để tự điền vào bước nhập JD, bạn vẫn có thể chỉnh sửa sau.
              </p>
            </div>
            <Toggle
              checked={settings.workflow.fixedJD?.enabled ?? false}
              disabled={!settings.workflow.fixedJD?.jdText}
              onChange={(v) => void autoSave('fixedJD.enabled', {
                workflow: { ...settings.workflow, fixedJD: { ...(settings.workflow.fixedJD ?? { name: fixedJDName, jdText: fixedJDText, savedAt: Date.now() }), enabled: v } },
              })}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Tên vị trí</label>
            <input
              value={fixedJDName}
              onChange={(e) => setFixedJDName(e.target.value)}
              placeholder="VD: Frontend Developer"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Nội dung JD</label>
            <textarea
              value={fixedJDText}
              onChange={(e) => setFixedJDText(e.target.value)}
              placeholder="Dán nội dung Job Description vào đây..."
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            {settings.workflow.fixedJD?.savedAt ? (
              <p className="text-[11px] text-slate-400">
                Đã lưu: <span className="font-medium text-slate-600">{settings.workflow.fixedJD.name || 'JD mặc định'}</span>
                {' · '}
                {new Date(settings.workflow.fixedJD.savedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">Chưa có JD nào được lưu.</p>
            )}
            <button
              type="button"
              disabled={!fixedJDText.trim() || fixedJDSaving}
              onClick={async () => {
                if (!fixedJDText.trim()) return;
                setFixedJDSaving(true);
                try {
                  await saveSettings({
                    workflow: {
                      ...settings.workflow,
                      fixedJD: { enabled: settings.workflow.fixedJD?.enabled ?? true, name: fixedJDName.trim(), jdText: fixedJDText.trim(), savedAt: Date.now() },
                    },
                  });
                  setFixedJDSaved(true);
                  setTimeout(() => setFixedJDSaved(false), 2000);
                } finally {
                  setFixedJDSaving(false);
                }
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {fixedJDSaving
                ? <Loader2 size={12} className="animate-spin" />
                : fixedJDSaved
                  ? <CheckCircle2 size={12} className="text-emerald-500" />
                  : null}
              {fixedJDSaved ? 'Đã lưu' : 'Lưu JD'}
            </button>
          </div>
        </div>
      </Section>

      <Section title="Mẫu JD">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2.5">
          {templatesLoading && templates.length === 0 ? (
            <div className="flex items-center gap-2 py-1 text-[12px] text-slate-400">
              <Loader2 size={13} className="animate-spin" />
              Đang tải mẫu...
            </div>
          ) : templates.length === 0 && !addTplOpen ? (
            <p className="py-1 text-[12px] text-slate-400">Chưa có mẫu JD nào. Nhấn bên dưới để thêm.</p>
          ) : (
            <div className="space-y-1.5">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition hover:border-blue-100 hover:bg-blue-50/40"
                >
                  <button
                    type="button"
                    title="Áp dụng làm JD mặc định"
                    onClick={() => {
                      setFixedJDName(tpl.jobPosition || tpl.name);
                      setFixedJDText(tpl.jdText);
                      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-[13px] font-semibold text-slate-800 leading-tight">{tpl.name}</span>
                    {tpl.jobPosition && (
                      <span className="mt-0.5 block text-[11px] text-slate-400">{tpl.jobPosition}</span>
                    )}
                  </button>
                  {tpl.category && (
                    <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {tpl.category}
                    </span>
                  )}
                  <button
                    type="button"
                    title="Xóa mẫu"
                    onClick={async () => {
                      try {
                        await JDTemplatesService.deleteTemplate(tpl.id);
                      } finally {
                        setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
                      }
                    }}
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-300 opacity-0 transition group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-500 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {addTplOpen ? (
            <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <input
                autoFocus
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="Tên mẫu (VD: Senior Frontend)"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-400"
              />
              <input
                value={newTplPosition}
                onChange={(e) => setNewTplPosition(e.target.value)}
                placeholder="Vị trí tuyển dụng"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-400"
              />
              <textarea
                value={newTplText}
                onChange={(e) => setNewTplText(e.target.value)}
                placeholder="Dán nội dung JD vào đây..."
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] leading-6 text-slate-900 outline-none transition focus:border-blue-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!newTplName.trim() || !newTplText.trim() || newTplSaving}
                  onClick={async () => {
                    if (!newTplName.trim() || !newTplText.trim()) return;
                    setNewTplSaving(true);
                    try {
                      const created = await JDTemplatesService.createTemplate({
                        name: newTplName.trim(),
                        jobPosition: newTplPosition.trim(),
                        jdText: newTplText.trim(),
                        category: '',
                        hardFilters: {},
                      });
                      if (created) setTemplates((prev) => [created, ...prev]);
                      setAddTplOpen(false);
                      setNewTplName('');
                      setNewTplPosition('');
                      setNewTplText('');
                    } finally {
                      setNewTplSaving(false);
                    }
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {newTplSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                  Lưu mẫu
                </button>
                <button
                  type="button"
                  onClick={() => { setAddTplOpen(false); setNewTplName(''); setNewTplPosition(''); setNewTplText(''); }}
                  className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddTplOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-400 transition hover:border-blue-300 hover:text-blue-500"
            >
              <Plus size={13} />
              Thêm mẫu JD
            </button>
          )}
        </div>
      </Section>
    </div>
  );

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    profile: profileTab,
    workspace: workspaceTab,
    notifications: notificationsTab,
    data: dataTab,
    jd: jdTab,
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="flex h-[min(92vh,820px)] w-full max-w-[900px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-[#f7f7f5] shadow-[0_28px_72px_rgba(15,23,42,0.16)]">

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <Settings size={17} className="shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold text-slate-900">Cài đặt</h2>
          </div>

          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${syncBadge.cls}`}>
            {syncBadge.icon}
            {syncBadge.label}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={14} />
          </button>
        </div>

        {syncError && (
          <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-[12px] font-medium text-rose-700">
            {syncError}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* Sidebar nav */}
          <aside className="w-[200px] shrink-0 border-r border-slate-200 bg-white p-3">
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = id === activeTab;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={15} className={active ? 'text-blue-500' : 'text-slate-400'} />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Sync time */}
            {settings.sync.lastSyncedAt ? (
              <div className="mt-4 border-t border-slate-100 pt-3 px-1">
                <p className="text-[10px] leading-4 text-slate-400">
                  Đồng bộ lần cuối
                  <br />
                  {new Date(settings.sync.lastSyncedAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ) : null}
          </aside>

          {/* Content */}
          <main ref={contentRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
            {tabContent[activeTab]}
          </main>
        </div>

        {/* Footer - auto-save hint only */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <p className="text-[11px] text-slate-400">
            Thay đổi được lưu tự động vào cơ sở dữ liệu.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarSettingsModal;
