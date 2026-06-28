import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bot,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MessageSquareText,
  MessageCircleQuestion,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Upload,
  User,
  Wrench,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppStep } from '@/types';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';
import { TrafficLights } from '@/components/workspace/WorkspacePrimitives';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/translations';

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
  { path: '/', labelKey: 'nav_overview' as TranslationKey, icon: LayoutDashboard },
  { path: '/upload', labelKey: 'nav_upload' as TranslationKey, icon: Upload },
  { path: '/analysis', labelKey: 'nav_results' as TranslationKey, icon: ClipboardCheck },
  { path: '/detailed-analytics', labelKey: 'nav_analytics' as TranslationKey, icon: BarChart3 },
];

const supportToolPages = [
  { path: '/chatbot', labelKey: 'nav_chatbot' as TranslationKey, icon: Bot },
  { path: '/contact-candidates', labelKey: 'nav_contact' as TranslationKey, icon: Mail },
  { path: '/jd-standardizer', labelKey: 'nav_jd_standardizer' as TranslationKey, icon: FileText },
];

// ── User menu dropdown ────────────────────────────────────────────────────────

interface UserMenuProps {
  displayName: string;
  userEmail?: string;
  userAvatar?: string | null;
  onOpenSettings: () => void;
  onLogout?: () => void;
  navigate: (path: string) => void;
  onClose: () => void;
}

const helpItems = [
  { icon: BookOpen,             labelKey: 'user_docs' as TranslationKey,     path: '/app-docs' },
  { icon: MessageCircleQuestion,labelKey: 'user_faq' as TranslationKey,      path: '/faq' },
  { icon: ShieldCheck,          labelKey: 'user_security' as TranslationKey, path: '/security' },
  { icon: Lock,                 labelKey: 'user_privacy' as TranslationKey,  path: '/privacy-policy' },
  { icon: ScrollText,           labelKey: 'user_terms' as TranslationKey,    path: '/terms' },
];

function UserMenu({ displayName, userEmail, userAvatar, onOpenSettings, onLogout, navigate, onClose }: UserMenuProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const { t } = useTranslation();
  const initials = displayName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const go = (path: string) => { navigate(path); onClose(); };

  return (
    <div className="overflow-hidden rounded-xl border border-[#d2d2d7] bg-white shadow-[0_8px_32px_rgba(15,23,42,0.14)]">
      {/* User header */}
      <div className="flex items-center gap-3 border-b border-[#f0f0f0] px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8e8ed] text-[13px] font-semibold text-[#515154]">
          {userAvatar
            ? <img src={userAvatar} alt="" className="h-full w-full object-cover" />
            : initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#1d1d1f]">{displayName}</p>
          <p className="truncate text-[11px] text-[#86868b]">{userEmail || 'Recruiter'}</p>
        </div>
        <ChevronRight size={14} className="shrink-0 text-[#c7c7cc]" />
      </div>

      {/* Menu items */}
      <div className="border-t border-[#f0f0f0] px-1 py-1">
        <MenuItem icon={Settings} label={t('nav_settings')} onClick={() => { onOpenSettings(); onClose(); }} />
      </div>

      <div className="border-t border-[#f0f0f0] px-1 py-1">
        {/* Help — expandable sub-menu */}
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-black/[0.04]"
        >
          <HelpCircle size={15} strokeWidth={1.7} className="shrink-0 text-[#6e6e73]" />
          <span className="flex-1 text-[13px] font-medium text-[#1d1d1f]">{t('nav_help')}</span>
          <ChevronDown
            size={13}
            className={`shrink-0 text-[#c7c7cc] transition-transform duration-200 ${helpOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {helpOpen && (
          <div className="mb-1 ml-3 mt-0.5 overflow-hidden rounded-lg border border-[#f0f0f0] bg-[#fafafa]">
            {helpItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-[12px] text-[#3c3c43] transition hover:bg-black/[0.04]"
              >
                <item.icon size={13} strokeWidth={1.7} className="shrink-0 text-[#6e6e73]" />
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        )}

        {onLogout && (
          <MenuItem icon={LogOut} label={t('nav_logout')} onClick={() => { onLogout(); onClose(); }} iconCls="text-[#86868b]" labelCls="text-[#d70015]" />
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  iconCls = 'text-[#6e6e73]',
  labelCls = 'text-[#1d1d1f]',
  suffix,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick: () => void;
  iconCls?: string;
  labelCls?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-black/[0.04]"
    >
      <Icon size={15} strokeWidth={1.7} className={`shrink-0 ${iconCls}`} />
      <span className={`flex-1 text-[13px] font-medium ${labelCls}`}>{label}</span>
      {suffix}
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

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
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [openSection, setOpenSection] = useState<'sessions' | 'tools'>('sessions');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userCardRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const sessionsOpen = openSection === 'sessions';
  const toolsOpen = openSection === 'tools';

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

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current?.contains(target) || userCardRef.current?.contains(target)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setUserMenuOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [userMenuOpen]);

  const displayName = useMemo(
    () => userName?.trim() || userEmail?.split('@')[0] || 'Support HR',
    [userEmail, userName],
  );

  const initials = displayName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

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
        {/* Header */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#d2d2d7]/80 px-5">
          <TrafficLights />
          <button
            type="button"
            onClick={() => go('/')}
            className="flex h-8 w-9 items-center justify-center rounded-lg border border-[#d2d2d7] bg-white/80 text-[#6e6e73] hover:bg-white"
            aria-label="Mở tổng quan Workspace"
          >
            <SlidersHorizontal size={15} strokeWidth={1.7} />
          </button>
        </div>

        {/* Nav */}
        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-4" aria-label="Điều hướng Workspace">
          {/* Phiên lọc */}
          <button
            type="button"
            onClick={() => setOpenSection('sessions')}
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium transition ${screeningActive ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <SlidersHorizontal size={17} strokeWidth={1.8} />
            <span className="flex-1">Phiên lọc</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${sessionsOpen ? '' : '-rotate-90'}`} />
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${sessionsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="mt-1 pl-5">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98989d]">Trang làm việc</p>
                <div className="space-y-0.5">
                  {screeningPages.map(({ path, labelKey, icon: Icon }) => {
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
                        <span className="truncate">{t(labelKey)}</span>
                      </button>
                    );
                  })}
                </div>

                {sessions.length ? (
                  <>
                    <div className="mx-3 my-2 h-px bg-[#d2d2d7]/70" />
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98989d]">Phiên gần đây</p>
                    <div className="space-y-0.5">
                      {sessions.map((session, index) => (
                        <button
                          key={`${session.timestamp}-${index}`}
                          type="button"
                          onClick={() => go(`/?session=${session.timestamp}`)}
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
            </div>
          </div>

          <div className="my-3 h-px bg-[#d2d2d7]/80" />

          {/* Công cụ hỗ trợ */}
          <button
            type="button"
            onClick={() => setOpenSection('tools')}
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium transition ${toolsActive ? 'bg-[#e8f1ff] text-[#0066d6]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`}
          >
            <Wrench size={17} strokeWidth={1.8} />
            <span className="flex-1">Công cụ hỗ trợ</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${toolsOpen ? '' : '-rotate-90'}`} />
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${toolsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="mt-1 space-y-0.5 pl-5">
                {supportToolPages.map(({ path, labelKey, icon: Icon }) => {
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
                      <span className="truncate">{t(labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom bar */}
        <div className="relative border-t border-[#d2d2d7]/80 p-2">
          {/* User menu popup — opens above */}
          {userMenuOpen && (
            <div
              ref={userMenuRef}
              className="absolute bottom-[calc(100%+4px)] left-2 right-2 z-10"
            >
              <UserMenu
                displayName={displayName}
                userEmail={userEmail}
                userAvatar={userAvatar}
                onOpenSettings={() => onOpenSettingsPanel?.()}
                onLogout={onLogout}
                navigate={navigate}
                onClose={() => setUserMenuOpen(false)}
              />
            </div>
          )}

          {/* User card row */}
          <div className="flex items-center gap-1">
            <button
              ref={userCardRef}
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${userMenuOpen ? 'bg-black/[0.06]' : 'hover:bg-black/[0.04]'}`}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#e8e8ed] text-[12px] font-semibold text-[#515154]">
                  {userAvatar
                    ? <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                    : initials}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#f6f6f8] bg-[#34c759]" />
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#1d1d1f]">{displayName}</p>
              </div>
            </button>

            {/* Download app icon */}
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#86868b] transition hover:bg-black/[0.04] hover:text-[#1d1d1f]"
              aria-label="Tải ứng dụng"
              title="Tải ứng dụng Support HR"
            >
              <Smartphone size={16} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
