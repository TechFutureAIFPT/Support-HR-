import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Lock,
  LogOut,
  MessageCircleQuestion,
  PanelLeftClose,
  ScrollText,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppStep } from '@/types';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/translations';
import { workspaceNavigationSections } from '@/config/workspaceNavigation';

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
  onCollapsedChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    screening: true,
    candidates: true,
    tools: true,
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userCardRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const activeSection = workspaceNavigationSections.find((section) =>
      section.items.some((item) => item.path === location.pathname),
    );
    if (!activeSection) return;
    setOpenSections((current) =>
      current[activeSection.id] ? current : { ...current, [activeSection.id]: true },
    );
  }, [location.pathname]);

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

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const collapseSidebar = () => {
    if (onClose) {
      onClose();
      return;
    }
    onCollapsedChange?.(true);
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
        className={`supporthr-sidebar supporthr-codex-sidebar apple-workspace-sidebar fixed left-0 top-0 z-50 flex h-[100dvh] w-[17rem] flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-4">
          <button
            type="button"
            ref={userCardRef}
            onClick={() => setUserMenuOpen((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {userAvatar ? <img src={userAvatar} alt="" className="size-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="mt-0.5 text-xs text-slate-500">Admin</p>
            </div>
          </button>
          <button
            type="button"
            onClick={collapseSidebar}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Thu gọn thanh điều hướng"
            title="Thu gọn sidebar"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </button>

          {userMenuOpen && (
            <div ref={userMenuRef} className="absolute left-3 right-3 top-[calc(100%+8px)] z-10">
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
        </div>

        {/* Nav */}
        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng HR Portal">
          <p className="mb-3 px-3 text-xs font-semibold uppercase text-slate-400">Support HR</p>
          <div className="flex flex-col gap-2">
            {workspaceNavigationSections.map((section) => {
              const sectionActive = section.items.some((item) => item.path === location.pathname);
              const expanded = openSections[section.id];
              const SectionIcon = section.icon;
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${sectionActive ? 'text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                    aria-expanded={expanded}
                  >
                    <SectionIcon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
                    <span className="flex-1">{t(section.labelKey)}</span>
                    <ChevronDown className={`size-4 shrink-0 transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`} aria-hidden="true" />
                  </button>
                  {expanded && (
                    <div className="mt-1 flex flex-col gap-1 pl-4">
                      {section.items.filter((item) => item.showInSidebar !== false).map((item) => {
                        const ItemIcon = item.icon;
                        const active = item.path === location.pathname;
                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => go(item.path)}
                            aria-current={active ? 'page' : undefined}
                            className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? 'bg-blue-100 font-semibold text-blue-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            <ItemIcon className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="my-3 h-px bg-slate-200" />
          <button
            type="button"
            onClick={() => onOpenSettingsPanel?.()}
            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Settings className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            <span>{t('nav_settings')}</span>
          </button>
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;
