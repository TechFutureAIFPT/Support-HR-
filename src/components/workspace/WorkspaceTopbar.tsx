import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CheckCheck,
  ChevronDown,
  Clock3,
  HelpCircle,
  LogOut,
  LibraryBig,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Target,
  UploadCloud,
  Users,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import type { AppStep } from '@/types';
import type { AccountNotification } from '@/services/data-sync/notificationService';
import { NotificationService } from '@/services/data-sync/notificationService';
import WindowsAppInstallButton from '@/components/pwa/WindowsAppInstallButton';

interface WorkspaceTopbarProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
  jobPosition?: string;
  onNewSession?: () => void;
  onOpenTemplates?: () => void;
  onOpenHistory?: () => void;
  onOpenAnalysis?: () => void;
  onOpenDetailedAnalytics?: () => void;
  onOpenCandidateSuggestions?: () => void;
  userName?: string;
  userAvatar?: string | null;
  userEmail?: string;
  onLogout?: () => void;
}

const stepMeta: Partial<Record<AppStep, { module: string; title: string; subtitle: string }>> = {
  jd: {
    module: 'Tuyển dụng',
    title: 'Nạp JD & CV',
    subtitle: 'Chuẩn hóa tài liệu đầu vào cho phiên sàng lọc',
  },
  upload: {
    module: 'Tuyển dụng',
    title: 'Nạp hồ sơ ứng viên',
    subtitle: 'Kiểm tra danh sách CV trước khi thiết lập',
  },
  weights: {
    module: 'Thiết lập',
    title: 'Thiết lập mặc định',
    subtitle: 'Bộ lọc cứng và trọng số đánh giá',
  },
  analysis: {
    module: 'Phân tích',
    title: 'Kết quả sàng lọc',
    subtitle: 'Danh sách ứng viên và giải thích điểm số',
  },
  dashboard: {
    module: 'Báo cáo',
    title: 'Thống kê chi tiết',
    subtitle: 'Tổng quan hiệu quả phiên phân tích',
  },
  chatbot: {
    module: 'Trợ lý',
    title: 'Gợi ý ứng viên AI',
    subtitle: 'Hỏi đáp và so sánh ứng viên',
  },
  feedback: {
    module: 'Phản hồi',
    title: 'Hiệu chỉnh đánh giá',
    subtitle: 'Ghi nhận quyết định sau phân tích',
  },
  records: {
    module: 'Công cụ',
    title: 'Thư viện CV',
    subtitle: 'Tổng hợp hồ sơ đã lọc từ các phiên tuyển dụng',
  },
  'jd-standardizer': {
    module: 'Công cụ',
    title: 'Chuẩn hóa JD',
    subtitle: 'Tạo bản mô tả công việc rõ ràng hơn bằng AI',
  },
};

function formatNotificationTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Vừa xong';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} phút trước`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} giờ trước`;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

function notificationTone(type: AccountNotification['type']) {
  if (type === 'success') return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (type === 'warning') return 'border-amber-100 bg-amber-50 text-amber-700';
  if (type === 'error') return 'border-rose-100 bg-rose-50 text-rose-700';
  return 'border-blue-100 bg-blue-50 text-blue-700';
}

const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({
  activeStep,
  completedSteps,
  jobPosition,
  onNewSession,
  onOpenTemplates,
  onOpenHistory,
  onOpenAnalysis,
  onOpenDetailedAnalytics,
  onOpenCandidateSuggestions,
  userName,
  userAvatar,
  userEmail,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const meta = stepMeta[activeStep] || stepMeta.jd!;
  const unreadCount = notifications.filter((item) => !item.read).length;
  const accountLabel = userName || userEmail || 'Tài khoản';
  const initials = accountLabel
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'HR';
  const progressLabel = `${completedSteps.length}/4 bước`;

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const items = await NotificationService.list(20);
      setNotifications(items);
    } catch (error) {
      console.warn('Không thể tải thông báo:', error);
      setLoadError('Chưa tải được thông báo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 60_000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, 6),
    [notifications],
  );

  const handleOpenNotifications = () => {
    setIsOpen((open) => !open);
    setIsAccountOpen(false);
    if (!isOpen && notifications.length === 0) {
      void loadNotifications();
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isOpen && notificationRef.current && !notificationRef.current.contains(target)) {
        setIsOpen(false);
      }
      if (isAccountOpen && accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountOpen, isOpen]);

  const handleMarkRead = async (notification: AccountNotification) => {
    setNotifications((items) =>
      items.map((item) => item.id === notification.id ? { ...item, read: true } : item),
    );

    if (notification.id.startsWith('history-')) return;

    try {
      await NotificationService.markRead(notification.id);
    } catch (error) {
      console.warn('Không thể đánh dấu đã đọc:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));

    try {
      await NotificationService.markAllRead();
    } catch (error) {
      console.warn('Không thể đánh dấu tất cả đã đọc:', error);
    }
  };

  const handleChatbotAction = (action: 'history' | 'chatbot' | 'selected') => {
    window.dispatchEvent(new CustomEvent('supporthr:chatbot-action', { detail: { action } }));
  };

  const topbarButtonClass =
    'hidden h-9 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700';
  const topbarPrimaryButtonClass =
    'hidden h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-3 text-xs font-black text-white shadow-[0_12px_24px_rgba(35,136,255,0.18)] transition hover:brightness-105';
  const topbarIconButtonClass =
    'flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600';
  const dropdownIconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-blue-600';

  return (
    <header className="shrink-0 border-b border-blue-100 bg-white/95 shadow-[0_10px_30px_rgba(30,64,175,0.06)] backdrop-blur-xl">
      <div className="flex min-h-[68px] items-center gap-3 px-4 lg:px-5">
        <div className="min-w-0 border-l-4 border-blue-500 pl-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-lg font-black leading-tight text-slate-950">{meta.title}</span>
            <span className="hidden rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-600 sm:inline-flex">
              {meta.module}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="truncate">{jobPosition || meta.subtitle}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
            <span className="hidden shrink-0 text-blue-600 sm:inline">{progressLabel}</span>
          </div>
        </div>

        <div className="mx-2 hidden h-9 w-px bg-blue-100 xl:block" />

        <div className="hidden min-w-[18rem] max-w-[34rem] flex-1 items-center rounded-xl border border-blue-100 bg-[#f8fbff] px-3 py-2 text-slate-500 shadow-inner lg:flex">
          <Search size={16} className="mr-2 shrink-0 text-slate-400" />
          <input
            type="search"
            placeholder="Tìm JD, CV, ứng viên, phiên phân tích..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
          <span className="ml-2 rounded-md border border-blue-100 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400">Ctrl K</span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {activeStep === 'analysis' && (
            <>
              <button
                type="button"
                onClick={onOpenDetailedAnalytics}
                className={`${topbarButtonClass} md:inline-flex`}
              >
                <BarChart3 size={15} />
                Thống kê
              </button>
              <button
                type="button"
                onClick={onOpenCandidateSuggestions}
                className={`${topbarPrimaryButtonClass} md:inline-flex`}
              >
                <Target size={15} />
                Gợi ý AI
              </button>
            </>
          )}

          {activeStep === 'dashboard' && (
            <button
              type="button"
              onClick={onOpenCandidateSuggestions}
              className={`${topbarPrimaryButtonClass} md:inline-flex`}
            >
              <Zap size={15} />
              Gợi ý ứng viên
            </button>
          )}

          {activeStep === 'chatbot' && (
            <div className="hidden items-center gap-1.5 rounded-xl border border-blue-100 bg-[#f8fbff] p-1 md:flex">
              <button
                type="button"
                onClick={() => handleChatbotAction('history')}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50"
                aria-label="Mở lịch sử hội thoại"
              >
                <Clock3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleChatbotAction('chatbot')}
                className="flex h-8 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <MessageSquare size={14} />
                Chatbot AI
              </button>
              <button
                type="button"
                onClick={() => handleChatbotAction('selected')}
                className="flex h-8 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Users size={14} />
                Đã chọn
              </button>
            </div>
          )}

          {activeStep === 'feedback' && (
            <button
              type="button"
              onClick={onOpenAnalysis}
              className={`${topbarButtonClass} text-blue-700 md:inline-flex`}
            >
              <ArrowLeft size={15} />
              Kết quả phân tích
            </button>
          )}

          <button
            type="button"
            onClick={onOpenTemplates}
            className="hidden"
          >
            <UploadCloud size={15} />
            Mẫu JD
          </button>

          <button
            type="button"
            onClick={onNewSession}
            className={`${topbarPrimaryButtonClass} md:inline-flex`}
          >
            <Plus size={16} strokeWidth={2.6} />
            Phiên mới
          </button>

          <WindowsAppInstallButton variant="compact" className="hidden md:inline-flex" />

          {false && (
          <>
          <button
            type="button"
            onClick={onOpenHistory}
            className={`${topbarIconButtonClass} hidden md:inline-flex`}
            aria-label="Mở lịch sử hoạt động"
          >
            <Clock3 size={16} />
          </button>

          <button
            type="button"
            className={`${topbarIconButtonClass} hidden sm:inline-flex`}
            aria-label="Trợ giúp"
          >
            <HelpCircle size={16} />
          </button>
          </>
          )}

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={handleOpenNotifications}
              className={`relative ${topbarIconButtonClass}`}
              aria-label="Mở thông báo"
              aria-expanded={isOpen}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 top-[calc(100%+0.65rem)] z-[70] w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_26px_70px_rgba(30,64,175,0.18)]">
                <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-[#f8fbff] px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">Thông báo</p>
                    <p className="mt-0.5 text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Đã đọc tất cả'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      className={dropdownIconButtonClass}
                      aria-label="Tải lại thông báo"
                    >
                      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className={dropdownIconButtonClass}
                      aria-label="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className={`${dropdownIconButtonClass} hover:bg-rose-50 hover:text-rose-600`}
                      aria-label="Đóng thông báo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="custom-scrollbar max-h-[22rem] overflow-y-auto p-2">
                  {loadError ? (
                    <div className="m-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                      {loadError}
                    </div>
                  ) : visibleNotifications.length === 0 ? (
                    <div className="flex min-h-[10rem] flex-col items-center justify-center px-6 py-8 text-center">
                      <Megaphone className="text-blue-300" size={34} />
                      <p className="mt-3 text-sm font-bold text-slate-950">Chưa có thông báo</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Các cập nhật từ backend sẽ hiển thị tại đây.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {visibleNotifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => void handleMarkRead(notification)}
                          className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${notificationTone(notification.type)} ${notification.read ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-slate-300' : 'bg-blue-500'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black">{notification.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{notification.message}</p>
                              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setIsAccountOpen((open) => !open);
                setIsOpen(false);
              }}
              className="flex h-9 items-center gap-2 rounded-xl border border-blue-100 bg-white px-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              aria-label="Tài khoản"
              aria-expanded={isAccountOpen}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-blue-50 text-[10px] font-black text-blue-700">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <ChevronDown size={14} className={`transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-[calc(100%+0.65rem)] z-[70] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_26px_70px_rgba(30,64,175,0.18)]">
                <div className="flex items-start justify-between gap-3 border-b border-blue-100 bg-[#f8fbff] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-blue-50 text-xs font-black text-blue-700">
                      {userAvatar ? (
                        <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{accountLabel}</p>
                      {userEmail && <p className="mt-0.5 truncate text-xs text-slate-500">{userEmail}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen(false)}
                    className={`${dropdownIconButtonClass} shrink-0 hover:bg-rose-50 hover:text-rose-600`}
                    aria-label="Đóng tài khoản"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid gap-1 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate('/jd-templates', { state: { from: location.pathname } });
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <UploadCloud size={15} />
                    Mẫu JD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate('/history', { state: { from: location.pathname } });
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Clock3 size={15} />
                    Lịch sử hoạt động
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate('/records', { state: { from: location.pathname } });
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <LibraryBig size={15} />
                    Thư viện CV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate('/jd-standardizer', { state: { from: location.pathname } });
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <WandSparkles size={15} />
                    Chuẩn hóa JD
                  </button>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceTopbar;
