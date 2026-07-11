import React, { useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, Menu, PanelLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface WorkspaceTopbarProps {
  onOpenMobileSidebar?: () => void;
  onOpenSettings?: () => void;
  userName?: string;
  userAvatar?: string | null;
  userEmail?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const SEARCH_DESTINATIONS = [
  { label: 'Tổng quan tuyển dụng', path: '/' },
  { label: 'Nạp hồ sơ ứng viên', path: '/upload' },
  { label: 'Kết quả phân tích', path: '/analysis' },
  { label: 'Phân tích chi tiết', path: '/detailed-analytics' },
  { label: 'Thư viện CV đã lọc', path: '/records' },
  { label: 'Liên hệ ứng viên', path: '/contact-candidates' },
  { label: 'Trợ lý tuyển dụng AI', path: '/chatbot' },
  { label: 'Chuẩn hóa JD', path: '/jd-standardizer' },
  { label: 'Thư viện mẫu JD', path: '/jd-templates' },
  { label: 'Phản hồi cho AI', path: '/feedback' },
];

const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  const displayName = userName?.trim() || userEmail?.split('@')[0] || 'HR';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    if (!normalized) return SEARCH_DESTINATIONS.slice(0, 5);
    return SEARCH_DESTINATIONS.filter((item) =>
      item.label.toLocaleLowerCase('vi-VN').includes(normalized),
    ).slice(0, 6);
  }, [query]);

  const openDestination = (path: string) => {
    setSearchOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchResults[0]) openDestination(searchResults[0].path);
  };

  return (
    <header className="apple-workspace-topbar relative z-40 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 md:px-5">
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
        <form onSubmit={handleSearch} className="relative hidden lg:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
            placeholder="Tìm kiếm toàn cục"
            aria-label="Tìm kiếm chức năng"
            aria-expanded={searchOpen}
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-4 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15 xl:w-80"
          />
          {searchOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {searchResults.length ? searchResults.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openDestination(item.path)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                >
                  <Search className="size-3.5 text-slate-400" aria-hidden="true" />
                  {item.label}
                </button>
              )) : (
                <p className="px-3 py-3 text-center text-xs text-slate-500">Không tìm thấy chức năng phù hợp</p>
              )}
            </div>
          )}
        </form>

        <div className="relative">
          <button
            ref={notifButtonRef}
            type="button"
            onClick={() => setNotifOpen((current) => !current)}
            className={`relative flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${notifOpen ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            aria-label="Thông báo"
            aria-expanded={notifOpen}
          >
            <Bell className="size-[18px]" aria-hidden="true" />
            <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-rose-500" />
          </button>
          <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={notifButtonRef} />
        </div>

        <button type="button" onClick={onOpenSettings} className="flex items-center gap-1 rounded-lg p-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Mở tài khoản">
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-[12px] font-semibold text-blue-700">
            {userAvatar ? <img src={userAvatar} alt="" className="size-full object-cover" /> : initials}
          </span>
          <ChevronDown className="size-4 text-slate-500" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default WorkspaceTopbar;
