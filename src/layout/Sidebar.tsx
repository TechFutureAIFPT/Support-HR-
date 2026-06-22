import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  ChevronDown,
  ClipboardCheck,
  FileInput,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  SlidersHorizontal,
  Upload,
  Wrench,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppStep } from '@/types';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';
import { TrafficLights } from '@/components/workspace/WorkspacePrimitives';

interface SidebarProps {
  activeStep: AppStep;
  setActiveStep: (step: AppStep) => void;
  completedSteps: AppStep[];
  onReset: () => void;
  onLogout?: () => void;
  userEmail?: string;
  userAvatar?: string | null;
  userName?: string;
  onLoginRequest?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onShowSettings?: () => void;
  onOpenSettingsPanel?: () => void;
  onShowHistory?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewSession?: () => void;
}

type HistorySession = { timestamp: number; jobPosition?: string };

const screeningPages = [
  { path: '/workspace', label: 'Tổng quan tuyển dụng', icon: LayoutDashboard },
  { path: '/jd', label: 'Nhập Job Description', icon: FileInput },
  { path: '/upload', label: 'Nạp hồ sơ ứng viên', icon: Upload },
  { path: '/weights', label: 'Tiêu chí chấm điểm', icon: SlidersHorizontal },
  { path: '/analysis', label: 'Kết quả phân tích', icon: ClipboardCheck },
  { path: '/detailed-analytics', label: 'Phân tích chi tiết', icon: BarChart3 },
] as const;

const supportToolPages = [
  { path: '/chatbot', label: 'Trợ lý tuyển dụng AI', icon: Bot },
  { path: '/feedback', label: 'Phản hồi kết quả AI', icon: MessageSquareText },
  { path: '/records', label: 'Thư viện CV', icon: FolderOpen },
  { path: '/jd-standardizer', label: 'Chuẩn hóa JD', icon: FileText },
  { path: '/jd-templates', label: 'Thư viện mẫu JD', icon: FileText },
  { path: '/history', label: 'Lịch sử tuyển dụng', icon: History },
] as const;

const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  userEmail,
  userAvatar,
  userName,
  isOpen = true,
  onClose,
  onOpenSettingsPanel,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);

  useEffect(() => {
    const refresh = () => setSessions(cvFilterHistoryService.getRecentHistory().slice(0, 5));
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('supporthr:workspace-session-state', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('supporthr:workspace-session-state', refresh as EventListener);
    };
  }, []);

  const displayName = useMemo(
    () => userName?.trim() || userEmail?.split('@')[0] || 'Support HR',
    [userEmail, userName],
  );

  const go = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const screeningActive = screeningPages.some(({ path }) => path === location.pathname);
  const toolsActive = supportToolPages.some(({ path }) => path === location.pathname);

  return (
    <>
      {isOpen && onClose ? (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng"
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="cv-sidebar"
        className={`supporthr-sidebar supporthr-codex-sidebar apple-workspace-sidebar fixed left-0 top-0 z-50 flex h-[100dvh] w-[17rem] flex-col border-r border-[#d2d2d7] bg-[rgba(246,246,248,0.88)] text-[#1d1d1f] backdrop-blur-2xl transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#d2d2d7]/80 px-5">
          <TrafficLights />
          <button
            type="button"
            onClick={() => go('/workspace')}
            className="flex h-8 w-9 items-center justify-center rounded-lg border border-[#d2d2d7] bg-white/80 text-[#6e6e73] hover:bg-white"
            aria-label="Mở tổng quan Workspace"
          >
            <SlidersHorizontal size={15} strokeWidth={1.7} />
          </button>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-4" aria-label="Điều hướng Workspace">
          <button
            type="button"
            onClick={() => setSessionsOpen((value) => !value)}
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium transition ${screeningActive ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <SlidersHorizontal size={17} strokeWidth={1.8} />
            <span className="flex-1">Phiên lọc</span>
            <ChevronDown size={14} className={`transition-transform ${sessionsOpen ? '' : '-rotate-90'}`} />
          </button>

          {sessionsOpen ? (
            <div className="mt-1 pl-5">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98989d]">
                Trang làm việc
              </p>
              <div className="space-y-0.5">
                {screeningPages.map(({ path, label, icon: Icon }) => {
                  const active = location.pathname === path;
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => go(path)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] transition-[background-color,color,opacity] duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/30 ${active ? 'bg-[#dceaff] font-medium text-[#005fbd] opacity-100' : 'text-[#6e6e73] opacity-60 hover:bg-black/[0.04] hover:opacity-100'}`}
                    >
                      <Icon size={15} strokeWidth={1.7} className="shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>

              {sessions.length ? (
                <>
                  <div className="mx-3 my-2 h-px bg-[#d2d2d7]/70" />
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98989d]">
                    Phiên gần đây
                  </p>
                  <div className="space-y-0.5">
                    {sessions.map((session, index) => (
                      <button
                        key={`${session.timestamp}-${index}`}
                        type="button"
                        onClick={() => go(`/workspace?session=${session.timestamp}`)}
                        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] text-[#515154] hover:bg-black/[0.04]"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-[#7c5cff]' : 'bg-[#26a7a2]'}`} />
                        <span className="truncate">{session.jobPosition || 'Phiên tuyển dụng'}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="my-3 h-px bg-[#d2d2d7]/80" />

          <button
            type="button"
            onClick={() => setToolsOpen((value) => !value)}
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium transition ${toolsActive ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <Wrench size={17} strokeWidth={1.8} />
            <span className="flex-1">Công cụ hỗ trợ</span>
            <ChevronDown size={14} className={`transition-transform ${toolsOpen ? '' : '-rotate-90'}`} />
          </button>

          {toolsOpen ? (
            <div className="mt-1 space-y-0.5 pl-5">
              {supportToolPages.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => go(path)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] transition-[background-color,color,opacity] duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/30 ${active ? 'bg-[#dceaff] font-medium text-[#005fbd] opacity-100' : 'text-[#6e6e73] opacity-60 hover:bg-black/[0.04] hover:opacity-100'}`}
                  >
                    <Icon size={15} strokeWidth={1.7} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-[#d2d2d7]/80 p-2">
          <button
            type="button"
            onClick={onOpenSettingsPanel}
            className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-[#515154] hover:bg-black/[0.04]"
          >
            <Settings size={16} strokeWidth={1.8} />
            Cài đặt Workspace
          </button>
          <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="relative h-9 w-9 shrink-0">
              <img
                src={userAvatar || '/images/logos/logo.jpg'}
                alt=""
                className="h-9 w-9 rounded-full border border-[#d2d2d7] object-cover"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#f6f6f8] bg-[#34c759]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#1d1d1f]">{displayName}</p>
              <p className="truncate text-[11px] text-[#86868b]">Recruiter</p>
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#86868b] hover:bg-black/[0.05] hover:text-[#d70015]"
                aria-label="Đăng xuất"
              >
                <LogOut size={15} />
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
