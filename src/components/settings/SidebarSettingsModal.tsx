import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
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
  Waves,
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
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="pr-4">
        <span className="block text-[13px] font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</span>
      </span>
      <span
        className={`flex h-8 w-14 items-center rounded-full border px-1 transition ${
          checked ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-100'
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </section>
  );
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
      ? 'bg-emerald-50 text-emerald-700'
      : syncStatus === 'error'
        ? 'bg-rose-50 text-rose-700'
        : syncStatus === 'pending'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-600';

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

      setNotice({ tone: 'success', message: 'Đã lưu cài đặt người dùng.' });
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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div className="flex h-[min(92vh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-slate-950">
              <Settings size={18} className="text-slate-500" />
              <h2 className="text-[18px] font-semibold">Settings</h2>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              Quản lý giao diện, tài khoản, quy trình sàng lọc, thông báo và đồng bộ dữ liệu.
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

        <div className="custom-scrollbar grid min-h-0 flex-1 gap-5 overflow-y-auto px-6 py-5 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-5">
            <Section icon={UserCircle2} title="Tài khoản">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle2 size={34} />
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarInput}
                    className="hidden"
                  />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-start">
                      <label className="block">
                        <span className="mb-1 block text-[12px] font-medium text-slate-600">Display name</span>
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
                          placeholder="Tên hiển thị"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <Upload size={14} />
                        Đổi avatar
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Email</p>
                      <p className="mt-1 text-[13px] font-medium text-slate-900">
                        {draft.account.email || 'Chưa đăng nhập'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${syncTone}`}>{syncLabel}</span>
                      <span className="text-[11px] text-slate-500">
                        {draft.sync.lastSyncedAt
                          ? `Lần gần nhất: ${new Date(draft.sync.lastSyncedAt).toLocaleString('vi-VN')}`
                          : 'Chưa có thời gian đồng bộ'}
                      </span>
                    </div>
                    {syncError ? <p className="text-[11px] text-rose-600">{syncError}</p> : null}
                  </div>
                </div>
              </div>
            </Section>

            <Section icon={MonitorCog} title="Giao diện">
              <div className="grid grid-cols-2 gap-2">
                {(['compact', 'cozy'] as SidebarDensity[]).map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        ui: { ...prev.ui, sidebarDensity: density },
                      }))
                    }
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      draft.ui.sidebarDensity === density
                        ? 'border-blue-200 bg-blue-50 text-slate-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[13px] font-semibold">{density === 'compact' ? 'Compact' : 'Cozy'}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                      {density === 'compact'
                        ? 'Chữ nhỏ hơn, khoảng cách gọn hơn.'
                        : 'Rộng rãi hơn để dễ đọc và thao tác.'}
                    </span>
                  </button>
                ))}
              </div>

              <ToggleRow
                title="Accessible mode"
                description="Tăng độ tương phản và độ dễ đọc của giao diện."
                checked={draft.ui.accessibleMode}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    ui: { ...prev.ui, accessibleMode: next },
                  }))
                }
              />

              <ToggleRow
                title="Reduced motion"
                description="Giảm chuyển động để thao tác ổn định hơn và bớt phân tán."
                checked={draft.ui.reducedMotion}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    ui: { ...prev.ui, reducedMotion: next },
                  }))
                }
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                    <Languages size={14} />
                    Ngôn ngữ
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-slate-900">vi-VN</p>
                  <p className="mt-1 text-[11px] text-slate-500">Khóa cố định ở v1.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                    <Waves size={14} />
                    Theme
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-slate-900">Light mode</p>
                  <p className="mt-1 text-[11px] text-slate-500">Dark mode chưa mở ở phiên bản này.</p>
                </div>
              </div>
            </Section>

            <Section icon={Sparkles} title="Quy trình sàng lọc">
              <ToggleRow
                title="Auto-save workflow draft"
                description="Tự lưu JD, bộ lọc và trạng thái làm việc hiện tại."
                checked={draft.workflow.autoSaveDraft}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    workflow: { ...prev.workflow, autoSaveDraft: next },
                  }))
                }
              />

              <ToggleRow
                title="Restore unfinished workflow"
                description="Khôi phục phiên dang dở khi mở lại ứng dụng."
                checked={draft.workflow.restoreDraft}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    workflow: { ...prev.workflow, restoreDraft: next },
                  }))
                }
              />

              <ToggleRow
                title="Remember weights & hard filters"
                description="Giữ cấu hình chấm điểm và hard filters cho phiên mới."
                checked={draft.workflow.rememberScoringConfig}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    workflow: {
                      ...prev.workflow,
                      rememberScoringConfig: next,
                      newSessionMode: next ? prev.workflow.newSessionMode : 'reset',
                    },
                  }))
                }
              />

              <ToggleRow
                title="Auto-save analysis history"
                description="Tự lưu history sau khi hoàn tất một phiên phân tích."
                checked={draft.workflow.autoSaveHistory}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    workflow: { ...prev.workflow, autoSaveHistory: next },
                  }))
                }
              />

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[12px] font-semibold text-slate-700">Hành vi khi bấm "Phiên mới"</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {([
                    ['reset', 'Reset trắng', 'Xóa JD và cấu hình sàng lọc.'],
                    ['keep-config', 'Giữ cấu hình', 'Chỉ xóa dữ liệu phiên, giữ weights và hard filters.'],
                  ] as Array<[NewSessionMode, string, string]>).map(([mode, label, desc]) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={mode === 'keep-config' && !draft.workflow.rememberScoringConfig}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          workflow: { ...prev.workflow, newSessionMode: mode },
                        }))
                      }
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        draft.workflow.newSessionMode === mode
                          ? 'border-blue-200 bg-blue-50 text-slate-950 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                      } ${mode === 'keep-config' && !draft.workflow.rememberScoringConfig ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span className="block text-[13px] font-semibold">{label}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-slate-500">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          <div className="space-y-5">
            <Section icon={Bell} title="Thông báo">
              <ToggleRow
                title="Thông báo khi phân tích hoàn tất"
                description="Hiển thị thông báo trong app khi phiên phân tích xong."
                checked={draft.notifications.analysisComplete}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, analysisComplete: next },
                  }))
                }
              />

              <ToggleRow
                title="Thông báo khi sync lỗi"
                description="Báo lỗi đồng bộ dữ liệu hoặc cài đặt trong ứng dụng."
                checked={draft.notifications.syncErrors}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, syncErrors: next },
                  }))
                }
              />

              <ToggleRow
                title="Thông báo khi lưu history thành công"
                description="Hiển thị xác nhận sau khi lưu phiên phân tích vào history."
                checked={draft.notifications.historySaved}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, historySaved: next },
                  }))
                }
              />

              <ToggleRow
                title="Sidebar badge notifications"
                description="Bật hoặc tắt badge thông báo ở sidebar."
                checked={draft.notifications.sidebarBadge}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, sidebarBadge: next },
                  }))
                }
              />
            </Section>

            <Section icon={ShieldCheck} title="Dữ liệu & đồng bộ">
              <ToggleRow
                title="Auto sync khi đã đăng nhập"
                description="Tự đồng bộ cache và dữ liệu phân tích giữa các thiết bị."
                checked={draft.sync.autoSync}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    sync: { ...prev.sync, autoSync: next },
                  }))
                }
              />

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[12px] font-semibold text-slate-700">Số lượng history giữ lại</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {([50, 100, 200] as HistoryRetention[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          sync: { ...prev.sync, historyRetention: value },
                        }))
                      }
                      className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${
                        draft.sync.historyRetention === value
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Xóa workflow draft cục bộ?')) return;
                    onClearWorkflowDraft();
                    setNotice({ tone: 'success', message: 'Đã xóa workflow draft cục bộ.' });
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Trash2 size={14} />
                  Xóa workflow draft cục bộ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Xóa toàn bộ cache cục bộ?')) return;
                    onClearLocalCache();
                    setNotice({ tone: 'success', message: 'Đã xóa cache cục bộ.' });
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Trash2 size={14} />
                  Xóa cache cục bộ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Xóa history cục bộ?')) return;
                    onClearLocalHistory();
                    setNotice({ tone: 'success', message: 'Đã xóa history cục bộ.' });
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <History size={14} />
                  Xóa history cục bộ
                </button>

                <button
                  type="button"
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
                  className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <Trash2 size={14} />
                  Xóa dữ liệu đã sync trên server
                </button>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-6 items-center text-[12px]">
            {notice ? (
              <span className={notice.tone === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{notice.message}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetSettings}
              disabled={isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw size={14} />
              Reset settings
            </button>

            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Đóng
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
