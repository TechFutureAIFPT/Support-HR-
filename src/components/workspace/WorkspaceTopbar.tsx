import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  Clock3,
  HelpCircle,
  LogOut,
  LibraryBig,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Target,
  UploadCloud,
  Users,
  WandSparkles,
  X,
  Zap,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from 'lucide-react';
import type { AppStep } from '@/types';
import type { AccountNotification } from '@/services/data-sync/notificationService';
import { NotificationService } from '@/services/data-sync/notificationService';


interface WorkspaceTopbarProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
  jobPosition?: string;
  onNewSession?: () => void;
  onOpenHistory?: () => void;
  onOpenAnalysis?: () => void;
  onOpenDetailedAnalytics?: () => void;
  onOpenCandidateSuggestions?: () => void;
  userName?: string;
  userAvatar?: string | null;
  userEmail?: string;
  onLogout?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
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
  'app-docs': {
    module: 'Hướng dẫn',
    title: 'Tài liệu ứng dụng',
    subtitle: 'Hướng dẫn sử dụng và tài liệu kỹ thuật',
  },
  history: {
    module: 'Hệ thống',
    title: 'Lịch sử hoạt động',
    subtitle: 'Các phiên phân tích CV đã lưu trong hệ thống',
  },
  'jd-templates': {
    module: 'Thư viện',
    title: 'Mẫu JD chuẩn',
    subtitle: 'Danh sách các mẫu mô tả công việc sẵn có',
  },
};

const menuGroups = [
  {
    label: 'Sản phẩm',
    items: [
      { label: 'Nạp JD & CV', href: '/jd', icon: UploadCloud },
      { label: 'Thiết lập mặc định', href: '/weights', icon: SlidersHorizontal },
      { label: 'Phân tích AI', href: '/analysis', icon: Sparkles },
      { label: 'Thống kê chi tiết', href: '/detailed-analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Tài liệu',
    items: [
      { label: 'Tài liệu ứng dụng', href: '/app-docs', icon: BookOpen },
      { label: 'Kho lưu trữ CV', href: '/records', icon: LibraryBig },
      { label: 'Mẫu JD', href: '/jd-templates', icon: FileText },
      { label: 'Chuẩn hóa JD', href: '/jd-standardizer', icon: Workflow },
    ],
  },
];

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
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({
  activeStep,
  completedSteps,
  jobPosition,
  onNewSession,
  onOpenHistory,
  onOpenAnalysis,
  onOpenDetailedAnalytics,
  onOpenCandidateSuggestions,
  userName,
  userAvatar,
  userEmail,
  onLogout,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const topbarRef = useRef<HTMLDivElement | null>(null);
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
      if (openMenu && topbarRef.current && !topbarRef.current.contains(target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsAccountOpen(false);
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountOpen, isOpen, openMenu]);

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

  const goTo = (href: string) => {
    setOpenMenu(null);
    navigate(href);
  };

  const topbarButtonClass =
    'hidden h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950';
  const topbarPrimaryButtonClass =
    'hidden h-8 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800';
  const topbarIconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950';
  const dropdownIconButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-950';

  return (
    <header 
      ref={topbarRef}
      className="relative shrink-0 border-b border-slate-200 bg-[#f4f4f2]/98 shadow-none backdrop-blur-xl h-[54px] z-[60]"
    >
      <div className="flex h-full items-center justify-between gap-3 px-3 lg:px-4">
        
        {/* Left Side: Desktop Navigation & Menu Groups */}
        <div className="flex items-center gap-1.5 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 lg:flex shrink-0"
              aria-label={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
              title={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white hover:text-slate-950 sm:flex shrink-0"
            aria-label="Quay lại"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white hover:text-slate-950 sm:flex shrink-0"
            aria-label="Tiến tới"
            title="Tiến tới"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="hidden h-4 w-px bg-slate-300 mx-1 sm:block shrink-0" />

          {/* Product Dropdowns */}
          <div className="hidden items-center gap-1 lg:flex shrink-0">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu((current) => (current === group.label ? null : group.label))}
                  className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-bold transition ${
                    openMenu === group.label ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-700 hover:bg-white/80 hover:text-slate-950'
                  }`}
                >
                  {group.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {openMenu === group.label && (
                  <div className="absolute left-0 top-[36px] z-50 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => goTo(item.href)}
                          className="flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Step Info */}
          <div className="min-w-0 pl-1 lg:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[14px] font-bold leading-tight text-slate-950">{meta.title}</span>
              <span className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:inline-flex">
                {meta.module}
              </span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] font-medium text-slate-500">
              <span className="truncate">{jobPosition || meta.subtitle}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span className="hidden shrink-0 text-slate-500 sm:inline">{progressLabel}</span>
            </div>
          </div>
        </div>

        {/* Center: Desktop-only Page Title (macOS style) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:flex items-center gap-2 pointer-events-none select-none">
          <span className="text-sm font-bold text-slate-800">{meta.title}</span>
          <span className="rounded-md border border-slate-250 bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-500">
            {meta.module}
          </span>
          <span className="text-[11px] text-slate-400">•</span>
          <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[200px]">
            {jobPosition || meta.subtitle}
          </span>
        </div>

        {/* Right Side: Action Buttons, Notifications & Account */}
        <div className="flex shrink-0 items-center gap-2">
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
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 md:flex">
              <button
                type="button"
                onClick={() => handleChatbotAction('history')}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                aria-label="Mở lịch sử hội thoại"
              >
                <Clock3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleChatbotAction('chatbot')}
                className="flex h-7 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <MessageSquare size={14} />
                Chatbot AI
              </button>
              <button
                type="button"
                onClick={() => handleChatbotAction('selected')}
                className="flex h-7 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
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
              className={`${topbarButtonClass} md:inline-flex`}
            >
              <ArrowLeft size={15} />
              Kết quả phân tích
            </button>
          )}


          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={handleOpenNotifications}
              className={`relative ${topbarIconButtonClass}`}
              aria-label="Mở thông báo"
              aria-expanded={isOpen}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 top-[calc(100%+0.55rem)] z-[70] w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#f4f4f2] px-4 py-3">
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
                    <div className="m-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                      {loadError}
                    </div>
                  ) : visibleNotifications.length === 0 ? (
                    <div className="flex min-h-[10rem] flex-col items-center justify-center px-6 py-8 text-center">
                      <Megaphone className="text-slate-300" size={34} />
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
                          className={`w-full rounded-lg border p-3 text-left transition hover:shadow-sm ${notificationTone(notification.type)} ${notification.read ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-slate-300' : 'bg-slate-900'}`} />
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

          {/* Account Settings */}
          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setIsAccountOpen((open) => !open);
                setIsOpen(false);
              }}
              className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
              aria-label="Tài khoản"
              aria-expanded={isAccountOpen}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-950 text-[10px] font-semibold text-white">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <ChevronDown size={14} className={`transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-[calc(100%+0.55rem)] z-[70] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[#f4f4f2] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-xs font-semibold text-white">
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
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
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
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
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
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
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
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
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
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
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
