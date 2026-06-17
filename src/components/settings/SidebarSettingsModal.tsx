import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  History,
  Languages,
  LogOut,
  MonitorCog,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCircle2,
  X,
} from 'lucide-react';
import type { HistoryRetention, NewSessionMode, SidebarDensity, UserSettings } from '@/types';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';

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
  onClearSyncedData: () => Promise<void>;
}

type NoticeTone = 'success' | 'error';
type SettingsTab = 'overview' | 'account' | 'appearance' | 'workflow' | 'notifications' | 'data';

const TABS: Array<{
  id: SettingsTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}> = [
  { id: 'overview', label: 'Tổng quan', description: 'Cài đặt hay dùng', icon: Settings },
  { id: 'account', label: 'Tài khoản', description: 'Tên, avatar, đăng xuất', icon: UserCircle2 },
  { id: 'appearance', label: 'Giao diện', description: 'Sidebar, chuyển động', icon: MonitorCog },
  { id: 'workflow', label: 'Quy trình', description: 'Tự lưu và khôi phục', icon: Sparkles },
  { id: 'notifications', label: 'Thông báo', description: 'Nhắc việc trong app', icon: Bell },
  { id: 'data', label: 'Dữ liệu', description: 'Đồng bộ và dọn dẹp', icon: Database },
];

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</span>
      </span>
      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full border px-1 transition ${
          checked ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-100'
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      {title || description ? (
        <div className="mb-4">
          {title ? <h3 className="text-[14px] font-semibold text-slate-950">{title}</h3> : null}
          {description ? <p className="mt-1 text-[12px] leading-5 text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function ChoiceButton<T extends string | number>({
  active,
  disabled,
  title,
  description,
  value,
  onSelect,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  description?: string;
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-slate-950 shadow-sm'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className="block text-[13px] font-semibold">{title}</span>
      {description ? <span className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</span> : null}
    </button>
  );
}

function DangerButton({
  icon: Icon = Trash2,
  title,
  description,
  tone = 'neutral',
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
  tone?: 'neutral' | 'danger';
  onClick: () => void | Promise<void>;
}) {
  const danger = tone === 'danger';

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        danger
          ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
          danger ? 'border-rose-200 bg-white text-rose-600' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}
      >
        <Icon size={15} />
      </span>
      <span>
        <span className="block text-[13px] font-semibold">{title}</span>
        <span className={`mt-1 block text-[11px] leading-5 ${danger ? 'text-rose-600' : 'text-slate-500'}`}>
          {description}
        </span>
      </span>
    </button>
  );
}

function buildComparableSettings(settings: UserSettings, avatar: string | null): unknown {
  return {
    account: {
      displayName: settings.account.displayName.trim(),
      avatar,
      email: settings.account.email,
    },
    ui: settings.ui,
    workflow: settings.workflow,
    notifications: settings.notifications,
    sync: {
      autoSync: settings.sync.autoSync,
      historyRetention: settings.sync.historyRetention,
    },
  };
}

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
  onClearSyncedData,
}) => {
  const { settings, saveSettings, resetSettings, syncError, syncStatus } = useUserSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview');
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userAvatar || settings.account.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setDraft({
      ...settings,
      account: {
        ...settings.account,
        displayName: userName || settings.account.displayName,
        email: userEmail || settings.account.email,
        avatar: userAvatar || settings.account.avatar,
      },
    });
    setAvatarPreview(userAvatar || settings.account.avatar || null);
    setActiveTab('overview');
    setNotice(null);
  }, [isOpen, settings, userAvatar, userEmail, userName]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const syncLabel = useMemo(() => {
    switch (syncStatus) {
      case 'synced':
        return 'Đã đồng bộ';
      case 'pending':
        return 'Chờ đồng bộ';
      case 'error':
        return 'Lỗi đồng bộ';
      default:
        return 'Lưu cục bộ';
    }
  }, [syncStatus]);

  const syncTone =
    syncStatus === 'synced'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : syncStatus === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : syncStatus === 'pending'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-100 text-slate-600';

  const hasUnsavedChanges = useMemo(() => {
    const saved = {
      ...settings,
      account: {
        ...settings.account,
        displayName: userName || settings.account.displayName,
        email: userEmail || settings.account.email,
        avatar: userAvatar || settings.account.avatar,
      },
    };

    return (
      JSON.stringify(buildComparableSettings(draft, avatarPreview)) !==
      JSON.stringify(buildComparableSettings(saved, userAvatar || settings.account.avatar || null))
    );
  }, [avatarPreview, draft, settings, userAvatar, userEmail, userName]);

  const updateDraft = (patch: Partial<UserSettings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleAvatarInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice({ tone: 'error', message: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setAvatarPreview(result);
      setDraft((prev) => ({
        ...prev,
        account: {
          ...prev.account,
          avatar: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotice(null);

    try {
      const displayName = draft.account.displayName.trim();

      await onSaveAccountProfile({
        displayName,
        avatar: avatarPreview,
      });

      await saveSettings({
        account: {
          displayName,
          avatar: avatarPreview,
          email: draft.account.email,
        },
        ui: draft.ui,
        workflow: draft.workflow,
        notifications: draft.notifications,
        sync: {
          autoSync: draft.sync.autoSync,
          historyRetention: draft.sync.historyRetention,
        },
      });

      setNotice({ tone: 'success', message: 'Đã lưu cài đặt.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu cài đặt.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Đặt lại toàn bộ cài đặt về mặc định?')) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const reset = await resetSettings();
      setDraft(reset);
      setAvatarPreview(reset.account.avatar);
      setNotice({ tone: 'success', message: 'Đã đặt lại cài đặt mặc định.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Không thể đặt lại cài đặt.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const accountCard = (
    <SettingsCard title="Thông tin tài khoản" description="Tên và avatar dùng trong không gian làm việc của bạn.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm"
        >
          {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : <UserCircle2 size={34} />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleAvatarInput}
          className="hidden"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-slate-600">Tên hiển thị</span>
            <input
              value={draft.account.displayName}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  account: {
                    ...prev.account,
                    displayName: event.target.value,
                  },
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none transition focus:border-blue-300"
              placeholder="Nhập tên hiển thị"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Email</p>
              <p className="mt-1 truncate text-[13px] font-medium text-slate-900">
                {draft.account.email || 'Chưa đăng nhập'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <Upload size={14} />
              Đổi avatar
            </button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );

  const syncCard = (
    <SettingsCard title="Trạng thái đồng bộ" description="Theo dõi việc lưu cài đặt và dữ liệu giữa các thiết bị.">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${syncTone}`}>
          {syncStatus === 'synced' ? <CheckCircle2 size={13} /> : <ShieldCheck size={13} />}
          {syncLabel}
        </span>
        <span className="text-[11px] text-slate-500">
          {draft.sync.lastSyncedAt
            ? `Lần gần nhất: ${new Date(draft.sync.lastSyncedAt).toLocaleString('vi-VN')}`
            : 'Chưa có thời gian đồng bộ'}
        </span>
      </div>
      {syncError ? <p className="mt-3 text-[12px] leading-5 text-rose-600">{syncError}</p> : null}
    </SettingsCard>
  );

  const appearanceContent = (
    <div className="space-y-4">
      <SettingsCard title="Mật độ sidebar" description="Chọn cách hiển thị menu bên trái.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(['compact', 'cozy'] as SidebarDensity[]).map((density) => (
            <ChoiceButton
              key={density}
              value={density}
              active={draft.ui.sidebarDensity === density}
              title={density === 'compact' ? 'Gọn' : 'Rộng rãi'}
              description={density === 'compact' ? 'Chữ và khoảng cách gọn hơn.' : 'Dễ đọc hơn, nhiều khoảng thở hơn.'}
              onSelect={(value) => updateDraft({ ui: { ...draft.ui, sidebarDensity: value } })}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Khả năng đọc" description="Các tùy chọn giúp thao tác thoải mái hơn.">
        <div className="space-y-2">
          <ToggleRow
            title="Chế độ dễ nhìn"
            description="Tăng độ tương phản và độ dễ đọc của giao diện."
            checked={draft.ui.accessibleMode}
            onChange={(next) => updateDraft({ ui: { ...draft.ui, accessibleMode: next } })}
          />
          <ToggleRow
            title="Giảm chuyển động"
            description="Giảm animation để thao tác ổn định hơn."
            checked={draft.ui.reducedMotion}
            onChange={(next) => updateDraft({ ui: { ...draft.ui, reducedMotion: next } })}
          />
        </div>
      </SettingsCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsCard>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
            <Languages size={14} />
            Ngôn ngữ
          </div>
          <p className="mt-2 text-[13px] font-medium text-slate-950">Tiếng Việt (vi-VN)</p>
          <p className="mt-1 text-[11px] text-slate-500">Khóa cố định trong v1.</p>
        </SettingsCard>

        <SettingsCard>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
            <MonitorCog size={14} />
            Giao diện
          </div>
          <p className="mt-2 text-[13px] font-medium text-slate-950">Light mode</p>
          <p className="mt-1 text-[11px] text-slate-500">Dark mode chưa mở ở phiên bản này.</p>
        </SettingsCard>
      </div>
    </div>
  );

  const workflowContent = (
    <div className="space-y-4">
      <SettingsCard title="Tự lưu và khôi phục" description="Kiểm soát cách app ghi nhớ phiên làm việc.">
        <div className="space-y-2">
          <ToggleRow
            title="Tự lưu phiên làm việc"
            description="Tự lưu JD, bộ lọc và trạng thái làm việc hiện tại."
            checked={draft.workflow.autoSaveDraft}
            onChange={(next) => updateDraft({ workflow: { ...draft.workflow, autoSaveDraft: next } })}
          />
          <ToggleRow
            title="Khôi phục phiên dang dở"
            description="Tự mở lại phiên chưa hoàn tất khi quay lại app."
            checked={draft.workflow.restoreDraft}
            onChange={(next) => updateDraft({ workflow: { ...draft.workflow, restoreDraft: next } })}
          />
          <ToggleRow
            title="Ghi nhớ weights và hard filters"
            description="Giữ cấu hình chấm điểm và bộ lọc cho phiên mới."
            checked={draft.workflow.rememberScoringConfig}
            onChange={(next) =>
              updateDraft({
                workflow: {
                  ...draft.workflow,
                  rememberScoringConfig: next,
                  newSessionMode: next ? draft.workflow.newSessionMode : 'reset',
                },
              })
            }
          />
          <ToggleRow
            title="Tự lưu lịch sử phân tích"
            description="Lưu kết quả vào history sau khi phân tích hoàn tất."
            checked={draft.workflow.autoSaveHistory}
            onChange={(next) => updateDraft({ workflow: { ...draft.workflow, autoSaveHistory: next } })}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Khi bấm Phiên mới" description="Chọn app nên reset toàn bộ hay giữ lại cấu hình sàng lọc.">
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            ['reset', 'Reset trắng', 'Xóa JD và cấu hình sàng lọc.'],
            ['keep-config', 'Giữ cấu hình', 'Chỉ xóa dữ liệu phiên, giữ weights và hard filters.'],
          ] as Array<[NewSessionMode, string, string]>).map(([mode, label, desc]) => (
            <ChoiceButton
              key={mode}
              value={mode}
              active={draft.workflow.newSessionMode === mode}
              disabled={mode === 'keep-config' && !draft.workflow.rememberScoringConfig}
              title={label}
              description={desc}
              onSelect={(value) => updateDraft({ workflow: { ...draft.workflow, newSessionMode: value } })}
            />
          ))}
        </div>
      </SettingsCard>
    </div>
  );

  const notificationsContent = (
    <SettingsCard title="Thông báo trong app" description="V1 chỉ dùng in-app notifications, không gửi email hoặc push.">
      <div className="space-y-2">
        <ToggleRow
          title="Báo khi phân tích hoàn tất"
          description="Hiển thị thông báo khi một phiên phân tích CV kết thúc."
          checked={draft.notifications.analysisComplete}
          onChange={(next) => updateDraft({ notifications: { ...draft.notifications, analysisComplete: next } })}
        />
        <ToggleRow
          title="Báo khi đồng bộ lỗi"
          description="Nhắc bạn khi lưu cài đặt hoặc dữ liệu lên server thất bại."
          checked={draft.notifications.syncErrors}
          onChange={(next) => updateDraft({ notifications: { ...draft.notifications, syncErrors: next } })}
        />
        <ToggleRow
          title="Báo khi lưu history thành công"
          description="Hiển thị xác nhận sau khi lưu phiên phân tích vào history."
          checked={draft.notifications.historySaved}
          onChange={(next) => updateDraft({ notifications: { ...draft.notifications, historySaved: next } })}
        />
        <ToggleRow
          title="Badge thông báo ở sidebar"
          description="Bật hoặc tắt badge nhắc việc trong sidebar."
          checked={draft.notifications.sidebarBadge}
          onChange={(next) => updateDraft({ notifications: { ...draft.notifications, sidebarBadge: next } })}
        />
      </div>
    </SettingsCard>
  );

  const dataContent = (
    <div className="space-y-4">
      <SettingsCard title="Đồng bộ dữ liệu" description="Kiểm soát cache và history khi đã đăng nhập.">
        <div className="space-y-3">
          <ToggleRow
            title="Tự đồng bộ khi đã đăng nhập"
            description="Tự đồng bộ cache và dữ liệu phân tích giữa các thiết bị."
            checked={draft.sync.autoSync}
            onChange={(next) => updateDraft({ sync: { ...draft.sync, autoSync: next } })}
          />

          <div>
            <p className="text-[12px] font-semibold text-slate-700">Số lượng history giữ lại</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([50, 100, 200] as HistoryRetention[]).map((value) => (
                <ChoiceButton
                  key={value}
                  value={value}
                  active={draft.sync.historyRetention === value}
                  title={`${value}`}
                  onSelect={(next) => updateDraft({ sync: { ...draft.sync, historyRetention: next } })}
                />
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Khu vực nguy hiểm" description="Các thao tác này xóa dữ liệu. Hãy kiểm tra kỹ trước khi xác nhận.">
        <div className="space-y-2">
          <DangerButton
            title="Xóa workflow draft cục bộ"
            description="Xóa phiên làm việc đang lưu trên máy này."
            onClick={() => {
              if (!window.confirm('Xóa workflow draft cục bộ?')) return;
              onClearWorkflowDraft();
              setNotice({ tone: 'success', message: 'Đã xóa workflow draft cục bộ.' });
            }}
          />
          <DangerButton
            title="Xóa cache cục bộ"
            description="Xóa cache phân tích đang lưu trên máy này."
            onClick={() => {
              if (!window.confirm('Xóa toàn bộ cache cục bộ?')) return;
              onClearLocalCache();
              setNotice({ tone: 'success', message: 'Đã xóa cache cục bộ.' });
            }}
          />
          <DangerButton
            icon={History}
            title="Xóa history cục bộ"
            description="Xóa lịch sử phân tích đang lưu trên máy này."
            onClick={() => {
              if (!window.confirm('Xóa history cục bộ?')) return;
              onClearLocalHistory();
              setNotice({ tone: 'success', message: 'Đã xóa history cục bộ.' });
            }}
          />
          <DangerButton
            tone="danger"
            title="Xóa dữ liệu đã sync trên server"
            description="Xóa cache/history đã đồng bộ của tài khoản trên server."
            onClick={async () => {
              if (!window.confirm('Xóa dữ liệu đã sync của tài khoản trên server?')) return;
              try {
                await onClearSyncedData();
                setNotice({ tone: 'success', message: 'Đã xóa dữ liệu synced trên server.' });
              } catch (error) {
                setNotice({
                  tone: 'error',
                  message: error instanceof Error ? error.message : 'Không thể xóa dữ liệu synced.',
                });
              }
            }}
          />
          <DangerButton
            icon={RefreshCcw}
            tone="danger"
            title="Reset toàn bộ cài đặt"
            description="Đưa settings về mặc định, giữ thông tin tài khoản hiện tại."
            onClick={handleResetSettings}
          />
        </div>
      </SettingsCard>
    </div>
  );

  const overviewContent = (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        {accountCard}
        {syncCard}
      </div>
      <SettingsCard title="Thiết lập nhanh" description="Ba tùy chọn thường dùng nhất trong quá trình sàng lọc.">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[12px] font-semibold text-slate-700">Mật độ sidebar</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['compact', 'cozy'] as SidebarDensity[]).map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => updateDraft({ ui: { ...draft.ui, sidebarDensity: density } })}
                  className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${
                    draft.ui.sidebarDensity === density
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {density === 'compact' ? 'Gọn' : 'Rộng'}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            title="Tự lưu lịch sử"
            description="Lưu kết quả sau khi phân tích xong."
            checked={draft.workflow.autoSaveHistory}
            onChange={(next) => updateDraft({ workflow: { ...draft.workflow, autoSaveHistory: next } })}
          />

          <ToggleRow
            title="Tự đồng bộ"
            description="Đồng bộ dữ liệu khi đã đăng nhập."
            checked={draft.sync.autoSync}
            onChange={(next) => updateDraft({ sync: { ...draft.sync, autoSync: next } })}
          />
        </div>
      </SettingsCard>
    </div>
  );

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    overview: overviewContent,
    account: (
      <div className="space-y-4">
        {accountCard}
        {syncCard}
        {onLogout ? (
          <SettingsCard title="Phiên đăng nhập" description="Đăng xuất khỏi tài khoản hiện tại trên thiết bị này.">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </SettingsCard>
        ) : null}
      </div>
    ),
    appearance: appearanceContent,
    workflow: workflowContent,
    notifications: notificationsContent,
    data: dataContent,
  };

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="flex h-[min(94vh,860px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[#f7f7f5] shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-slate-950">
              <Settings size={18} className="text-slate-500" />
              <h2 className="text-[18px] font-semibold">Cài đặt</h2>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              Quản lý tài khoản, giao diện, quy trình, thông báo và dữ liệu đồng bộ.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 lg:flex">
          <aside className="border-b border-slate-200 bg-white p-3 lg:w-[280px] lg:shrink-0 lg:border-b-0 lg:border-r lg:bg-[#fbfbfa] lg:p-4">
            <div className="mb-3 hidden px-2 lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Danh mục</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex min-w-[140px] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition lg:min-w-0 lg:w-full lg:rounded-lg ${
                      active
                        ? 'bg-blue-50 text-slate-950'
                        : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950'
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-2 hidden h-[calc(100%-16px)] w-1 rounded-full bg-blue-500 transition lg:block ${
                        active ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        active ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-[13px] ${active ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
                      <span className={`mt-0.5 hidden truncate text-[11px] lg:block ${active ? 'text-slate-500' : 'text-slate-400'}`}>
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            <div className="mb-5 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ActiveIcon size={19} />
              </span>
              <div>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">{activeTabMeta.label}</h3>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">{activeTabMeta.description}</p>
              </div>
            </div>

            {tabContent[activeTab]}
          </main>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-6 text-[12px] leading-5">
            {notice ? (
              <span className={notice.tone === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{notice.message}</span>
            ) : hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <AlertTriangle size={13} />
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="text-slate-400">Không có thay đổi mới</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <Save size={14} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarSettingsModal;
