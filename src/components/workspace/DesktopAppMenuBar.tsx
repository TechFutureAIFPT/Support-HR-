import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Workflow,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesktopAppMenuBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

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
  {
    label: 'Chính sách',
    items: [
      { label: 'Bảo mật & dữ liệu', href: '/app-docs#bao-mat', icon: ShieldCheck },
      { label: 'Điều khoản sử dụng', href: '/app-docs#dieu-khoan', icon: FileText },
      { label: 'Triển khai & bảng giá', href: '/app-docs#trien-khai', icon: FileText },
      { label: 'Câu hỏi thường gặp', href: '/app-docs#faq', icon: HelpCircle },
    ],
  },
];

const DesktopAppMenuBar: React.FC<DesktopAppMenuBarProps> = ({ sidebarCollapsed, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const goTo = (href: string) => {
    setOpenMenu(null);
    navigate(href);
  };

  return (
    <div
      ref={barRef}
      className="fixed left-0 right-0 top-0 z-[70] hidden h-[34px] items-center justify-between border-b border-slate-200 bg-[#f4f4f2]/98 px-2 text-slate-800 shadow-none backdrop-blur-xl lg:flex"
    >
      <div className="flex h-full items-center gap-1">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
          aria-label={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
          title={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white hover:text-slate-950"
          aria-label="Quay lại"
          title="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white hover:text-slate-950"
          aria-label="Tiến tới"
          title="Tiến tới"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mx-2 h-4 w-px bg-slate-300" />

        {menuGroups.map((group) => (
          <div key={group.label} className="relative h-full">
            <button
              type="button"
              onClick={() => setOpenMenu((current) => (current === group.label ? null : group.label))}
              className={`flex h-full items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold transition ${
                openMenu === group.label ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-700 hover:bg-white/85 hover:text-slate-950'
              }`}
            >
              {group.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {openMenu === group.label && (
              <div className="absolute left-0 top-[32px] w-64 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => goTo(item.href)}
                      className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                        <Icon className="h-4 w-4" />
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

      <div className="flex items-center gap-2 pr-2">
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm">
          Support HR Desktop
        </span>
      </div>
    </div>
  );
};

export default DesktopAppMenuBar;
