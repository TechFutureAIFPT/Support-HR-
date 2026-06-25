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
  HardDrive,
  History,
  Loader2,
  LogOut,
  Moon,
  Monitor,
  Plus,
  RefreshCcw,
  Settings,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
  UserCircle2,
  X,
} from 'lucide-react';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import type { HardFilters, HistoryRetention, NewSessionMode, UserSettingsLanguage, UserSettingsTheme, WeightCriteria } from '@/types';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';
import { useTheme } from '@/context/theme/ThemeProvider';
import { JDTemplatesService } from '@/services/data-sync/jdTemplatesService';
import type { UserJDTemplate } from '@/services/data-sync/jdTemplatesService';
import FilteredCvLibraryPage from '@/pages/tools/FilteredCvLibraryPage';
import { readWorkflowDraft } from '@/services/history-cache/workflowDraft';
import { initialWeights } from '@/config/constants';
import WeightTile from '@/components/config/WeightTile';
import HardFilterPanel from '@/components/config/HardFilterPanel';
import { useTranslation } from '@/i18n/useTranslation';

const DEFAULT_HARD_FILTERS: HardFilters = {
  location: '', minExp: '', seniority: '', education: '', industry: '',
  language: '', languageLevel: '', certificates: '', workFormat: '', contractType: '',
  salaryMin: '', salaryMax: '',
  locationMandatory: false, minExpMandatory: false, seniorityMandatory: false,
  educationMandatory: false, contactMandatory: false, industryMandatory: false,
  languageMandatory: false, certificatesMandatory: false, workFormatMandatory: false,
  contractTypeMandatory: false, salaryMandatory: false,
};

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
  onGoToScoring?: () => void;
}

type SettingsTab = 'account' | 'library' | 'setup' | 'notifications';

const TAB_DEFS: Array<{ id: SettingsTab; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'account',       icon: UserCircle2 },
  { id: 'library',       icon: Database },
  { id: 'setup',         icon: SlidersHorizontal },
  { id: 'notifications', icon: Bell },
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

function SubNav<T extends string>({
  pages, labels, current, onChange,
}: {
  pages: T[];
  labels: Partial<Record<T, string>>;
  current: T;
  onChange: (p: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {pages.map((page) => (
        <button key={page} type="button" onClick={() => onChange(page)}
          className={`flex-1 rounded-lg py-2 px-3 text-[12px] font-semibold transition-all duration-150 ${
            current === page ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}>
          {labels[page] ?? page}
        </button>
      ))}
    </div>
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
  onGoToScoring,
}) => {
  const { settings, saveSettings, resetSettings, syncStatus, syncError } = useUserSettings();
  const { themeMode } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [librarySubPage, setLibrarySubPage] = useState<'data' | 'history' | 'cv'>('data');
  const [setupSubPage, setSetupSubPage] = useState<'workflow' | 'jd' | 'filters' | 'weights'>('workflow');

  const TAB_LABELS: Record<SettingsTab, string> = {
    account:       'Tài khoản',
    library:       'Dữ liệu & Thư viện',
    setup:         'Bộ lọc & Quy trình',
    notifications: t('settings_tab_notif'),
  };

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
  const [localWeights, setLocalWeights] = useState<WeightCriteria>(() => {
    const w = settings.workflow.fixedJD?.weights;
    return (w && typeof w === 'object' && !Array.isArray(w)) ? w as WeightCriteria : { ...initialWeights };
  });
  const [localHardFilters, setLocalHardFilters] = useState<HardFilters>(() => {
    const hf = settings.workflow.fixedJD?.hardFilters;
    return (hf && typeof hf === 'object') ? hf as HardFilters : { ...DEFAULT_HARD_FILTERS };
  });
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);
  const [fixedJDSaving, setFixedJDSaving] = useState(false);
  const [fixedJDSaved, setFixedJDSaved] = useState(false);
  const [driveImporting, setDriveImporting] = useState(false);

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
  const [tplDropdownOpen, setTplDropdownOpen] = useState(false);
  const contentRef = useRef<HTMLElement | null>(null);
  const tplDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(userName || settings.account.displayName || '');
    setAvatarPreview(userAvatar || settings.account.avatar || null);
    setFixedJDName(settings.workflow.fixedJD?.name || '');
    setFixedJDText(settings.workflow.fixedJD?.jdText || '');
    const w = settings.workflow.fixedJD?.weights;
    setLocalWeights((w && typeof w === 'object' && !Array.isArray(w)) ? w as WeightCriteria : { ...initialWeights });
    const hf = settings.workflow.fixedJD?.hardFilters;
    setLocalHardFilters((hf && typeof hf === 'object') ? hf as HardFilters : { ...DEFAULT_HARD_FILTERS });
    setExpandedCriterion(null);
    setActiveTab('account');
    setLibrarySubPage('data');
    setSetupSubPage('workflow');
    setDangerOpen(false);
    setAddTplOpen(false);
    setTplDropdownOpen(false);
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
    if (activeTab !== 'setup' && !tplDropdownOpen) return;
    setTemplatesLoading(true);
    setTemplates(JDTemplatesService.getCachedUserTemplates());
    void JDTemplatesService.getUserTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, [activeTab, tplDropdownOpen]);

  useEffect(() => {
    if (!tplDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (tplDropdownRef.current && !tplDropdownRef.current.contains(e.target as Node)) {
        setTplDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tplDropdownOpen]);

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
    if (syncStatus === 'synced') return { icon: <CheckCircle2 size={12} />, label: t('settings_synced'), cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    if (syncStatus === 'pending') return { icon: <Loader2 size={12} className="animate-spin" />, label: t('settings_saving'), cls: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (syncStatus === 'error') return { icon: <AlertTriangle size={12} />, label: t('settings_sync_error'), cls: 'border-rose-200 bg-rose-50 text-rose-700' };
    return { icon: <CloudOff size={12} />, label: t('settings_not_authed'), cls: 'border-slate-200 bg-slate-100 text-slate-500' };
  })();

  // ── Tab: Tài khoản (merged: Chung + Hồ sơ) ──
  const accountTab = (
    <div className="space-y-5">
      {/* Gradient profile card */}
      <div className="rounded-2xl border border-blue-100/60 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-slate-50 p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md transition hover:shadow-lg"
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              : <UserCircle2 size={30} className="absolute inset-0 m-auto text-slate-300" />
            }
            <span className="absolute inset-0 flex items-end justify-center bg-black/0 pb-1.5 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
              <Upload size={13} className="text-white" />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarInput} className="hidden" />

          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-400/80">Tên hiển thị</label>
              <div className="relative">
                <input
                  value={displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="h-10 w-full rounded-xl border border-blue-100 bg-white/70 px-3 pr-9 text-[13px] font-medium text-slate-900 outline-none backdrop-blur-sm transition focus:border-blue-400 focus:bg-white"
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
            <div className="rounded-xl border border-blue-100/60 bg-white/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-400/70">Email</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-800">{userEmail || 'Chưa đăng nhập'}</p>
            </div>
          </div>
        </div>

        {onLogout && (
          <div className="mt-4 flex items-center justify-between border-t border-blue-100/60 pt-4">
            <p className="text-[12px] text-slate-500">Đăng xuất khỏi thiết bị này. Dữ liệu giữ nguyên trên server.</p>
            <button
              type="button"
              onClick={onLogout}
              className="ml-4 inline-flex shrink-0 h-8 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut size={12} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Theme */}
      <Section title={t('settings_section_ui')}>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-4">
          <div>
            <p className="mb-3 text-[12px] font-semibold text-slate-700">{t('settings_theme_label')}</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light' as UserSettingsTheme, label: t('settings_theme_light'), icon: Sun },
                { value: 'dark'  as UserSettingsTheme, label: t('settings_theme_dark'),  icon: Moon },
                { value: 'system' as UserSettingsTheme, label: t('settings_theme_system'), icon: Monitor },
              ] as const).map(({ value, label, icon: Icon }) => {
                const active = settings.ui.theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void autoSave('theme', { ui: { ...settings.ui, theme: value } })}
                    className={`flex flex-col items-center gap-2 rounded-2xl border py-4 text-[12px] font-semibold transition ${
                      active
                        ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      active ? 'border-blue-200 bg-blue-100' : 'border-slate-200 bg-white'
                    }`}>
                      <Icon size={16} className={active ? 'text-blue-500' : 'text-slate-400'} />
                    </span>
                    {label}
                    {active && <Check size={10} className="text-blue-500" />}
                  </button>
                );
              })}
            </div>
            {themeMode === 'system' && settings.ui.theme === 'system' && (
              <p className="mt-2 text-[11px] text-slate-400">Đang dùng chủ đề của hệ điều hành.</p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t('settings_section_language')}>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="mb-3 text-[12px] leading-5 text-slate-500">{t('settings_language_desc')}</p>
          <ChipGroup<UserSettingsLanguage>
            value={settings.ui.language}
            onChange={(v) => void autoSave('language', { ui: { ...settings.ui, language: v } })}
            options={[
              { value: 'vi-VN', label: t('settings_language_vi') },
              { value: 'en-US', label: t('settings_language_en') },
            ]}
          />
        </div>
      </Section>

      <Section title={t('settings_section_accessibility')}>
        <ToggleRow
          title={t('settings_reduced_motion')}
          description={t('settings_reduced_motion_desc')}
          checked={settings.ui.reducedMotion}
          saving={savingKey === 'reducedMotion'}
          onChange={(v) => void autoSave('reducedMotion', { ui: { ...settings.ui, reducedMotion: v } })}
        />
      </Section>
    </div>
  );

  // ── Tab: Thông báo ──
  const notificationsTab = (
    <div className="space-y-5">
      <Section title="Thông báo trong app">
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white overflow-hidden">
          {([
            { key: 'analysisComplete', title: 'Phân tích hoàn tất', description: 'Hiển thị thông báo khi AI xử lý xong toàn bộ CV trong phiên.', value: settings.notifications.analysisComplete, onChange: (v: boolean) => void autoSave('analysisComplete', { notifications: { ...settings.notifications, analysisComplete: v } }) },
            { key: 'syncErrors',       title: 'Lỗi đồng bộ',        description: 'Nhắc khi lưu cài đặt hoặc dữ liệu lên server thất bại.',        value: settings.notifications.syncErrors,        onChange: (v: boolean) => void autoSave('syncErrors',       { notifications: { ...settings.notifications, syncErrors: v } }) },
            { key: 'historySaved',     title: 'Lưu history thành công', description: 'Hiển thị xác nhận sau khi lưu phiên phân tích vào lịch sử.', value: settings.notifications.historySaved,     onChange: (v: boolean) => void autoSave('historySaved',     { notifications: { ...settings.notifications, historySaved: v } }) },
            { key: 'sidebarBadge',     title: 'Badge ở sidebar',     description: 'Bật hoặc tắt chấm đỏ nhắc việc trong menu bên trái.',           value: settings.notifications.sidebarBadge,     onChange: (v: boolean) => void autoSave('sidebarBadge',     { notifications: { ...settings.notifications, sidebarBadge: v } }) },
          ]).map(({ key, title, description, value, onChange }) => (
            <div key={key} className="flex items-center gap-4 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block text-[13px] font-semibold text-slate-900">{title}</span>
                  {savingKey === key && <Loader2 size={12} className="animate-spin text-blue-400" />}
                </span>
                <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{description}</span>
              </span>
              <Toggle checked={value} onChange={onChange} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );

  // ── Tab: Dữ liệu & Thư viện ──
  const libraryTab = (
    <div className="flex flex-col h-full">
      {/* Sticky sub-nav */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3.5">
        <SubNav
          pages={['data', 'history', 'cv'] as unknown as string[]}
          labels={{ data: 'Dữ liệu', history: 'Lịch sử lọc', cv: 'Thư viện CV' }}
          current={librarySubPage}
          onChange={(p) => setLibrarySubPage(p as typeof librarySubPage)}
        />
      </div>

      {/* Content */}
      {librarySubPage === 'cv' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <FilteredCvLibraryPage userEmail={userEmail} />
        </div>
      ) : (
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5 space-y-5">
          {librarySubPage === 'data' && (
            <>
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
                    <InlineConfirmButton label="Xóa workflow draft cục bộ" description="Xóa phiên làm việc đang lưu trên máy này." onConfirm={() => onClearWorkflowDraft()} />
                    <InlineConfirmButton label="Xóa cache phân tích cục bộ" description="Xóa kết quả cache đang lưu trên thiết bị này." onConfirm={() => onClearLocalCache()} />
                    <InlineConfirmButton icon={History} label="Xóa lịch sử cục bộ" description="Xóa history phân tích đang lưu trên máy này." onConfirm={() => onClearLocalHistory()} />
                    <InlineConfirmButton label="Xóa file CV cục bộ" description="Xóa PDF, DOCX và ảnh CV được lưu trên thiết bị." onConfirm={async () => onClearLocalDocuments()} />
                    <InlineConfirmButton tone="danger" label="Xóa dữ liệu đã sync trên server" confirmLabel="Xác nhận — dữ liệu sẽ không thể khôi phục" description="Xóa toàn bộ cache và history đã đồng bộ của tài khoản." onConfirm={async () => onClearSyncedData()} />
                    <InlineConfirmButton icon={RefreshCcw} tone="danger" label="Reset toàn bộ cài đặt về mặc định" confirmLabel="Xác nhận reset — không thể hoàn tác" description="Đưa tất cả cài đặt về mặc định, giữ thông tin tài khoản." onConfirm={async () => { await resetSettings(); }} />
                  </div>
                )}
              </Section>
            </>
          )}

          {librarySubPage === 'history' && (
            <>
              <Section title="Lịch sử bộ lọc">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="mb-3 text-[12px] leading-5 text-slate-500">
                    Lịch sử các bộ lọc cứng và tiêu chí chấm điểm đã sử dụng trong các phiên sàng lọc của tài khoản này.
                  </p>
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
                <InlineConfirmButton icon={History} label="Xóa lịch sử lọc" description="Xóa toàn bộ lịch sử bộ lọc và tiêu chí đã dùng trên máy này." onConfirm={() => onClearLocalHistory()} />
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );

  // ── Tab: Bộ lọc & Quy trình ──
  const criteriaEntries = Object.values(localWeights).filter((c) => c.children);
  const totalWeight = criteriaEntries.reduce((total, c) => {
    return total + (c.children?.reduce((s, ch) => s + ch.weight, 0) ?? 0);
  }, 0);

  const setupTab = (
    <div className="flex flex-col h-full">
      {/* Sticky sub-nav */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3.5">
        <SubNav
          pages={['workflow', 'jd', 'filters', 'weights'] as unknown as string[]}
          labels={{ workflow: 'Quy trình', jd: 'Job Description', filters: 'Bộ lọc cứng', weights: 'Trọng số' }}
          current={setupSubPage}
          onChange={(p) => setSetupSubPage(p as typeof setupSubPage)}
        />
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 space-y-4">

      {setupSubPage === 'workflow' && (
        <div className="space-y-5">

          {/* Toggle: Tự động áp dụng */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-slate-900">Tự động áp dụng khi mở phiên mới</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  Bật để lưu JD và trọng số chấm điểm. Lần sau chỉ cần thả CV vào là phân tích ngay.
                </p>
                {!settings.workflow.fixedJD?.jdText && (
                  <p className="mt-1.5 text-[11px] font-medium text-amber-600">Nhập và lưu JD trước ở tab Job Description để bật tùy chọn này.</p>
                )}
              </div>
              <Toggle
                checked={settings.workflow.fixedJD?.enabled ?? false}
                disabled={!settings.workflow.fixedJD?.jdText}
                onChange={(v) => void autoSave('fixedJD.enabled', {
                  workflow: { ...settings.workflow, fixedJD: { ...(settings.workflow.fixedJD ?? { name: fixedJDName, jdText: fixedJDText, savedAt: Date.now() }), enabled: v } },
                })}
              />
            </div>

            {/* Summary card when enabled */}
            {settings.workflow.fixedJD?.enabled && settings.workflow.fixedJD?.jdText && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 space-y-2.5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900">
                      {settings.workflow.fixedJD.name || 'JD không tên'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Lưu lúc {new Date(settings.workflow.fixedJD.savedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {settings.workflow.fixedJD.hardFilters && Object.values(settings.workflow.fixedJD.hardFilters).some((v) => v && v !== '' && v !== false)
                        ? ' · có bộ lọc cứng'
                        : ''}
                      {settings.workflow.fixedJD.weights
                        ? ` · ${Object.keys(settings.workflow.fixedJD.weights).length} tiêu chí trọng số`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['jd', 'filters', 'weights'] as const).map((page) => {
                    const labels = { jd: 'Job Description', filters: 'Bộ lọc cứng', weights: 'Trọng số' } as const;
                    return (
                      <button key={page} type="button" onClick={() => setSetupSubPage(page)}
                        className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
                        {labels[page]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
      )}

      {setupSubPage === 'jd' && (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
        {/* JD Section */}
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Job Description</p>
          <div className="space-y-3">
            <input
              value={fixedJDName}
              onChange={(e) => setFixedJDName(e.target.value)}
              placeholder="Tên vị trí (VD: Frontend Developer)"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
            />

            {/* Nội dung JD + Mẫu dropdown */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Nội dung JD</span>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={driveImporting}
                  onClick={async () => {
                    setDriveImporting(true);
                    try {
                      const files = await googleDriveService.openPicker({ redirectUri: window.location.href });
                      if (files.length > 0) {
                        const imported = await googleDriveService.importFile(files[0].id, 'jd');
                        if (imported.__preExtractedText) {
                          setFixedJDText(imported.__preExtractedText);
                          if (!fixedJDName.trim()) setFixedJDName(files[0].name.replace(/\.[^.]+$/, ''));
                        }
                      }
                    } catch {
                      // user cancelled or not connected
                    } finally {
                      setDriveImporting(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
                >
                  {driveImporting ? <Loader2 size={11} className="animate-spin" /> : <HardDrive size={11} />}
                  Google Drive
                </button>
                <div className="relative" ref={tplDropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setTplDropdownOpen((v) => !v); setAddTplOpen(false); }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      tplDropdownOpen
                        ? 'border-blue-300 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <BookOpen size={11} />
                    Mẫu JD
                    <ChevronDown size={10} className={`transition-transform duration-150 ${tplDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {tplDropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {templatesLoading && templates.length === 0 ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-[12px] text-slate-400">
                            <Loader2 size={13} className="animate-spin" /> Đang tải...
                          </div>
                        ) : templates.length === 0 ? (
                          <p className="px-4 py-3 text-[12px] text-slate-400">Chưa có mẫu JD nào.</p>
                        ) : (
                          <div className="py-1">
                            {templates.map((tpl) => (
                              <div key={tpl.id} className="group flex items-center gap-2 px-3 py-2 transition hover:bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() => { setFixedJDName(tpl.jobPosition || tpl.name); setFixedJDText(tpl.jdText); setTplDropdownOpen(false); }}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <span className="block text-[12.5px] font-semibold text-slate-800 leading-tight">{tpl.name}</span>
                                  {tpl.jobPosition && <span className="mt-0.5 block text-[11px] text-slate-400">{tpl.jobPosition}</span>}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); void JDTemplatesService.deleteTemplate(tpl.id).finally(() => setTemplates((prev) => prev.filter((t) => t.id !== tpl.id))); }}
                                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-transparent transition group-hover:bg-rose-50 group-hover:text-rose-400"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {addTplOpen ? (
                        <div className="border-t border-slate-100 p-3 space-y-2">
                          <input autoFocus value={newTplName} onChange={(e) => setNewTplName(e.target.value)} placeholder="Tên mẫu" className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12px] font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white" />
                          <input value={newTplPosition} onChange={(e) => setNewTplPosition(e.target.value)} placeholder="Vị trí tuyển dụng" className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12px] font-medium text-slate-900 outline-none focus:border-blue-400 focus:bg-white" />
                          <textarea value={newTplText} onChange={(e) => setNewTplText(e.target.value)} placeholder="Nội dung JD..." rows={4} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[12px] leading-5 text-slate-900 outline-none focus:border-blue-400 focus:bg-white" />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={!newTplName.trim() || !newTplText.trim() || newTplSaving}
                              onClick={async () => {
                                if (!newTplName.trim() || !newTplText.trim()) return;
                                setNewTplSaving(true);
                                try {
                                  const created = await JDTemplatesService.createTemplate({ name: newTplName.trim(), jobPosition: newTplPosition.trim(), jdText: newTplText.trim(), category: '', hardFilters: {} });
                                  if (created) setTemplates((prev) => [created, ...prev]);
                                  setAddTplOpen(false); setNewTplName(''); setNewTplPosition(''); setNewTplText('');
                                } finally { setNewTplSaving(false); }
                              }}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
                            >
                              {newTplSaving ? <Loader2 size={11} className="animate-spin" /> : null} Lưu
                            </button>
                            <button type="button" onClick={() => { setAddTplOpen(false); setNewTplName(''); setNewTplPosition(''); setNewTplText(''); }} className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-slate-100">
                          <button type="button" onClick={() => setAddTplOpen(true)} className="flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-blue-600">
                            <Plus size={12} /> Tạo mẫu mới
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>
              <textarea
                value={fixedJDText}
                onChange={(e) => setFixedJDText(e.target.value)}
                placeholder="Dán nội dung Job Description vào đây..."
                rows={7}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Save row */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            {settings.workflow.fixedJD?.savedAt ? (
              <>
                <p className="text-[11px] text-slate-400">
                  Đã lưu: <span className="font-medium text-slate-600">{settings.workflow.fixedJD.name || 'Set Up'}</span>
                  {' · '}{new Date(settings.workflow.fixedJD.savedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                {settings.workflow.fixedJD.weights && (
                  <p className="mt-0.5 text-[11px] text-emerald-600">
                    + {Object.keys(settings.workflow.fixedJD.weights).length} tiêu chí chấm điểm đã lưu
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-400">Chưa có cấu hình nào được lưu.</p>
            )}
          </div>
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
                    fixedJD: {
                      enabled: settings.workflow.fixedJD?.enabled ?? true,
                      name: fixedJDName.trim(),
                      jdText: fixedJDText.trim(),
                      savedAt: Date.now(),
                      scoringEnabled: criteriaEntries.length > 0,
                      weights: localWeights,
                      hardFilters: localHardFilters,
                    },
                  },
                });
                setFixedJDSaved(true);
                setTimeout(() => setFixedJDSaved(false), 2000);
              } finally {
                setFixedJDSaving(false);
              }
            }}
            className="ml-3 inline-flex shrink-0 h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {fixedJDSaving
              ? <Loader2 size={12} className="animate-spin" />
              : fixedJDSaved
                ? <CheckCircle2 size={12} className="text-emerald-500" />
                : null}
            {fixedJDSaved ? 'Đã lưu' : 'Lưu Set Up'}
          </button>
        </div>
      </div>
      )}

      {/* Filters sub-page */}
      {setupSubPage === 'filters' && (
      <div className="space-y-5">
        {/* Intro card */}
        <div className="rounded-2xl border border-blue-100/70 bg-gradient-to-br from-blue-50/60 to-slate-50 p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white shadow-sm">
              <SlidersHorizontal size={18} className="text-blue-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-slate-900">Bộ lọc cứng</p>
              <p className="mt-1 text-[12px] leading-5 text-slate-600">
                Điều kiện loại ứng viên <span className="font-semibold text-slate-800">trước khi AI chấm điểm</span>. Ứng viên không đáp ứng sẽ bị loại hoàn toàn khỏi kết quả, bất kể năng lực thực tế.
              </p>
              {!settings.workflow.fixedJD?.jdText && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                  <AlertTriangle size={11} />
                  Tính năng tự động điền từ JD yêu cầu lưu JD trước ở tab Job Description.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Panel */}
        <HardFilterPanel
          hardFilters={localHardFilters}
          setHardFilters={setLocalHardFilters}
          jdText={fixedJDText}
        />

        {/* Save row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="min-w-0">
            {settings.workflow.fixedJD?.savedAt ? (
              <p className="text-[11px] text-slate-400">
                Lưu cùng JD: <span className="font-medium text-slate-600">{settings.workflow.fixedJD.name || 'Set Up'}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">Chưa có JD nào được lưu — nhập JD trước để lưu bộ lọc.</p>
            )}
          </div>
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
                    fixedJD: {
                      enabled: settings.workflow.fixedJD?.enabled ?? false,
                      name: fixedJDName.trim(),
                      jdText: fixedJDText.trim(),
                      savedAt: Date.now(),
                      scoringEnabled: criteriaEntries.length > 0,
                      weights: localWeights,
                      hardFilters: localHardFilters,
                    },
                  },
                });
                setFixedJDSaved(true);
                setTimeout(() => setFixedJDSaved(false), 2000);
              } finally {
                setFixedJDSaving(false);
              }
            }}
            className="ml-4 inline-flex shrink-0 h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {fixedJDSaving ? <Loader2 size={12} className="animate-spin" /> : fixedJDSaved ? <CheckCircle2 size={12} className="text-emerald-500" /> : null}
            {fixedJDSaved ? 'Đã lưu' : 'Lưu bộ lọc'}
          </button>
        </div>
      </div>
      )}

      {/* Weights sub-page */}
      {setupSubPage === 'weights' && (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Trọng số tiêu chí chấm điểm</p>
          <button
            type="button"
            onClick={() => {
              try {
                const draft = readWorkflowDraft();
                const w = draft?.weights ?? JSON.parse(localStorage.getItem('analysisWeights') || 'null');
                if (w && typeof w === 'object' && !Array.isArray(w)) {
                  setLocalWeights(w as WeightCriteria);
                }
              } catch {}
            }}
            className="text-[11px] font-semibold text-blue-500 transition hover:text-blue-600"
          >
            Lấy từ phiên hiện tại
          </button>
        </div>

        <div className="space-y-1.5">
          {criteriaEntries.map((criterion) => (
            <WeightTile
              key={criterion.key}
              criterion={criterion}
              setWeights={setLocalWeights}
              isExpanded={expandedCriterion === criterion.key}
              onToggle={() => setExpandedCriterion((prev) => (prev === criterion.key ? null : criterion.key))}
            />
          ))}
          <p className={`text-right text-[11px] font-semibold pt-1 ${
            totalWeight === 100 ? 'text-emerald-600' : totalWeight > 100 ? 'text-rose-500' : 'text-amber-600'
          }`}>
            Tổng: {totalWeight}%{totalWeight === 100 ? ' ✓' : totalWeight > 100 ? ' — quá 100%' : ' — chưa đủ 100%'}
          </p>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex items-center justify-between">
          <div className="min-w-0">
            {settings.workflow.fixedJD?.savedAt ? (
              <p className="text-[11px] text-slate-400">
                Đã lưu: <span className="font-medium text-slate-600">{settings.workflow.fixedJD.name || 'Set Up'}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">Chưa có cấu hình nào được lưu.</p>
            )}
          </div>
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
                    fixedJD: {
                      enabled: settings.workflow.fixedJD?.enabled ?? true,
                      name: fixedJDName.trim(),
                      jdText: fixedJDText.trim(),
                      savedAt: Date.now(),
                      scoringEnabled: criteriaEntries.length > 0,
                      weights: localWeights,
                      hardFilters: localHardFilters,
                    },
                  },
                });
                setFixedJDSaved(true);
                setTimeout(() => setFixedJDSaved(false), 2000);
              } finally {
                setFixedJDSaving(false);
              }
            }}
            className="ml-3 inline-flex shrink-0 h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {fixedJDSaving
              ? <Loader2 size={12} className="animate-spin" />
              : fixedJDSaved
                ? <CheckCircle2 size={12} className="text-emerald-500" />
                : null}
            {fixedJDSaved ? 'Đã lưu' : 'Lưu trọng số'}
          </button>
        </div>
      </div>
      )}

      </div>{/* end overflow-y-auto */}
    </div>
  );

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    account:       accountTab,
    library:       libraryTab,
    setup:         setupTab,
    notifications: notificationsTab,
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="flex h-[min(92vh,840px)] w-full max-w-[960px] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]">

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-6 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Settings size={16} className="text-slate-500" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-slate-900">{t('settings_title')}</h2>
            <p className="text-[11px] font-medium text-slate-400">{TAB_LABELS[activeTab]}</p>
          </div>

          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${syncBadge.cls}`}>
            {syncBadge.icon}
            {syncBadge.label}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
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
          <aside className="w-[215px] shrink-0 border-r border-slate-100 bg-slate-50/40 p-3">
            <nav className="space-y-0.5">
              {TAB_DEFS.map(({ id, icon: Icon }) => {
                const label = TAB_LABELS[id];
                const active = id === activeTab;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      active
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-blue-500" />
                    )}
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                      active ? 'border-blue-200 bg-blue-50 text-blue-500' : 'border-slate-200 bg-white text-slate-400'
                    }`}>
                      <Icon size={14} />
                    </span>
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
          <main ref={contentRef} className={`min-h-0 flex-1 ${
            activeTab === 'library' || activeTab === 'setup'
              ? 'flex flex-col overflow-hidden'
              : 'custom-scrollbar overflow-y-auto p-6'
          }`}>
            {tabContent[activeTab]}
          </main>
        </div>

        {/* Footer - auto-save hint only */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <p className="text-[11px] text-slate-400">
            {t('settings_autosave_hint')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {t('btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarSettingsModal;
