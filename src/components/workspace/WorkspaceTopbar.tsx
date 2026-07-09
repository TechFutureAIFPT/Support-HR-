import React, { useState } from 'react';
import { Menu, PanelLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AppStep } from '@/types';

interface WorkspaceTopbarProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
  jobPosition?: string;
  onNewSession?: () => void;
  onOpenHistory?: () => void;
  onOpenAnalysis?: () => void;
  onOpenDetailedAnalytics?: () => void;
  onOpenCandidateSuggestions?: () => void;
  onExportReport?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenSettings?: () => void;
  userName?: string;
  userAvatar?: string | null;
  userEmail?: string;
  onLogout?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}


const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({
  activeStep,
  onOpenMobileSidebar,
  onOpenSettings,
  userName,
  userAvatar,
  userEmail,
  sidebarCollapsed,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const displayName = userName?.trim() || userEmail?.split('@')[0] || 'HR';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/analysis?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="apple-workspace-topbar flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-[#d2d2d7] bg-white/95 px-3 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="apple-toolbar-button apple-mobile-only"
          aria-label="Mở thanh điều hướng"
        >
          <Menu size={17} />
        </button>
        {sidebarCollapsed ? (
          <button type="button" onClick={onToggleSidebar} className="apple-toolbar-button hidden md:flex" aria-label="Hiện thanh điều hướng">
            <PanelLeft size={16} />
          </button>
        ) : null}

      </div>

      <div className="hidden min-w-0 flex-1 lg:flex" />

      <div className="flex shrink-0 items-center gap-2">
        <form onSubmit={handleSearch} className="relative hidden xl:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm"
            className="h-9 w-56 rounded-lg border border-[#d2d2d7] bg-[#f5f5f7] pl-9 pr-12 text-[13px] text-[#1d1d1f] outline-none focus:border-[#007aff] focus:bg-white focus:ring-2 focus:ring-[#007aff]/15"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#d2d2d7] bg-white px-1.5 py-0.5 text-[10px] text-[#86868b]">⌘K</kbd>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#e8e8ed] text-[12px] font-medium text-[#515154]"
          aria-label="Mở tài khoản"
        >
          {userAvatar ? <img src={userAvatar} alt="" className="h-full w-full object-cover" /> : initials}
        </button>
      </div>
    </header>
  );
};

export default WorkspaceTopbar;
