import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, FileText, FolderOpen, LogOut, Settings, SlidersHorizontal } from 'lucide-react';
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
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium transition ${location.pathname === '/workspace' || location.pathname === '/analysis' ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <SlidersHorizontal size={17} strokeWidth={1.8} />
            <span className="flex-1">Phiên lọc</span>
            <ChevronDown size={14} className={`transition-transform ${sessionsOpen ? '' : '-rotate-90'}`} />
          </button>

          {sessionsOpen ? (
            <div className="mt-1 space-y-0.5 pl-5">
              <button
                type="button"
                onClick={() => go('/workspace')}
                className={`flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-[13px] ${location.pathname === '/workspace' ? 'bg-[#dceaff] font-medium text-[#005fbd]' : 'text-[#6e6e73] hover:bg-black/[0.04]'}`}
              >
                <span className="h-2 w-2 rounded-full bg-[#007aff]" />
                Tổng quan tuyển dụng
              </button>
              {sessions.map((session, index) => (
                <button
                  key={`${session.timestamp}-${index}`}
                  type="button"
                  onClick={() => go(`/workspace?session=${session.timestamp}`)}
                  className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-[13px] text-[#515154] hover:bg-black/[0.04]"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-[#7c5cff]' : 'bg-[#26a7a2]'}`} />
                  <span className="truncate">{session.jobPosition || 'Phiên tuyển dụng'}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="my-3 h-px bg-[#d2d2d7]/80" />

          <button
            type="button"
            onClick={() => go('/records')}
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition ${location.pathname === '/records' ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <FolderOpen size={17} strokeWidth={1.8} />
            Thư viện CV
          </button>
          <button
            type="button"
            onClick={() => go('/jd-standardizer')}
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition ${location.pathname === '/jd-standardizer' || location.pathname === '/jd-templates' ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <FileText size={17} strokeWidth={1.8} />
            Cài đặt JD
          </button>
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
