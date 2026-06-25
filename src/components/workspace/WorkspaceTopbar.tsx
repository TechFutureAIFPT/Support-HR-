import React, { useRef, useState } from 'react';
import { Bell, CheckCircle2, ChevronRight, Menu, PanelLeft, Search, Settings, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AppStep } from '@/types';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';

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

// Popup tóm tắt cấu hình JD — chỉ hiện ở trang nạp CV
const JDConfigSummary: React.FC<{ onOpenSettings?: () => void; onClose: () => void }> = ({ onOpenSettings, onClose }) => {
  const { settings } = useUserSettings();
  const fixedJD = settings.workflow.fixedJD;

  const hardFilterCount = fixedJD?.hardFilters
    ? Object.entries(fixedJD.hardFilters).filter(([key, v]) => {
        if (key.endsWith('Mandatory')) return false;
        return v !== '' && v !== null && v !== undefined && v !== false;
      }).length
    : 0;

  const mandatoryCount = fixedJD?.hardFilters
    ? Object.entries(fixedJD.hardFilters).filter(([key, v]) => key.endsWith('Mandatory') && Boolean(v)).length
    : 0;

  const weightEntries = fixedJD?.weights
    ? Object.values(fixedJD.weights).filter((c) => c && typeof c === 'object' && 'children' in c)
    : [];

  const totalWeight = weightEntries.reduce((sum, c) => {
    return sum + (c.children?.reduce((s, ch) => s + ch.weight, 0) ?? 0);
  }, 0);

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-[13px] font-bold text-slate-900">Cấu hình phiên</p>
        <button type="button" onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X size={12} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {!fixedJD?.jdText ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
            <p className="text-[12px] font-semibold text-amber-700">Chưa có cấu hình nào được lưu</p>
            <p className="mt-0.5 text-[11px] text-amber-600">Vào Cài đặt → Cài đặt bộ lọc để thiết lập JD, bộ lọc và trọng số.</p>
          </div>
        ) : (
          <>
            {/* JD name + status */}
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${fixedJD.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <CheckCircle2 size={11} className="text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900 truncate">{fixedJD.name || 'JD không tên'}</p>
                <p className="text-[11px] text-slate-400">
                  {fixedJD.enabled ? 'Đang áp dụng tự động' : 'Chưa bật tự động áp dụng'}
                  {fixedJD.savedAt ? ` · ${new Date(fixedJD.savedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={11} className="text-blue-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Bộ lọc cứng</p>
                </div>
                <p className="mt-1 text-[18px] font-black leading-none text-slate-900">{hardFilterCount}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  điều kiện{mandatoryCount > 0 ? ` · ${mandatoryCount} bắt buộc` : ''}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-blue-500 font-bold">%</span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Trọng số</p>
                </div>
                <p className={`mt-1 text-[18px] font-black leading-none ${totalWeight === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {totalWeight}%
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {weightEntries.length} tiêu chí{totalWeight === 100 ? ' · đủ 100%' : ''}
                </p>
              </div>
            </div>

            {/* JD snippet */}
            {fixedJD.jdText && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Job Description</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">{fixedJD.jdText}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() => { onOpenSettings?.(); onClose(); }}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <span className="flex items-center gap-2">
            <Settings size={12} />
            Thay đổi cài đặt bộ lọc
          </span>
          <ChevronRight size={12} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
};

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

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

        {/* Cấu hình phiên — chỉ hiện ở trang nạp CV */}
        {activeStep === 'upload' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setConfigOpen((v) => !v)}
              className={`apple-toolbar-button apple-toolbar-button--primary ${configOpen ? 'opacity-80' : ''}`}
            >
              <SlidersHorizontal size={15} strokeWidth={2} />
              <span className="hidden sm:inline">Cấu hình phiên</span>
            </button>
            {configOpen && (
              <JDConfigSummary
                onOpenSettings={onOpenSettings}
                onClose={() => setConfigOpen(false)}
              />
            )}
          </div>
        )}
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

        {/* Bell with dropdown */}
        <div className="relative">
          <button
            ref={bellRef}
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className={`apple-toolbar-icon transition ${notifOpen ? 'bg-[#e8e8ed] text-[#1d1d1f]' : ''}`}
            aria-label="Thông báo"
            aria-expanded={notifOpen}
          >
            <Bell size={17} strokeWidth={1.7} />
          </button>
          <NotificationDropdown
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            anchorRef={bellRef}
          />
        </div>

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
