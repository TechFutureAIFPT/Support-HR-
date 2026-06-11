import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, FileText, HelpCircle, Home, PanelLeftClose, PanelLeftOpen, ShieldCheck, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesktopAppMenuBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const menuGroups = [
  {
    label: 'Sản phẩm',
    items: [
      { label: 'Trang chủ', href: '/', icon: Home },
      { label: 'Quy trình', href: '/process', icon: Workflow },
      { label: 'Demo', href: '/demo', icon: BookOpen },
      { label: 'Tích hợp', href: '/integrations', icon: Workflow },
    ],
  },
  {
    label: 'Tài liệu',
    items: [
      { label: 'Hướng dẫn', href: '/guide', icon: BookOpen },
      { label: 'Bảo mật', href: '/security', icon: ShieldCheck },
      { label: 'Câu hỏi thường gặp', href: '/faq', icon: HelpCircle },
      { label: 'Phương pháp AI', href: '/ai-methodology', icon: FileText },
    ],
  },
  {
    label: 'Chính sách',
    items: [
      { label: 'Chính sách bảo mật', href: '/privacy-policy', icon: ShieldCheck },
      { label: 'Điều khoản sử dụng', href: '/terms', icon: FileText },
      { label: 'Bảng giá', href: '/pricing', icon: FileText },
      { label: 'Đặt lịch tư vấn', href: '/book-demo', icon: BookOpen },
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
      className="fixed left-0 right-0 top-0 z-[70] hidden h-[34px] items-center justify-between border-b border-blue-100 bg-[#f8fbff]/95 px-2 text-slate-700 shadow-[0_8px_24px_rgba(30,64,175,0.08)] backdrop-blur-xl lg:flex"
    >
      <div className="flex h-full items-center gap-1">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          aria-label={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
          title={sidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
          aria-label="Quay lại"
          title="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
          aria-label="Tiến tới"
          title="Tiến tới"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mx-2 h-4 w-px bg-blue-100" />

        {menuGroups.map((group) => (
          <div key={group.label} className="relative h-full">
            <button
              type="button"
              onClick={() => setOpenMenu((current) => (current === group.label ? null : group.label))}
              className={`flex h-full items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold transition ${
                openMenu === group.label ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {group.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {openMenu === group.label && (
              <div className="absolute left-0 top-[32px] w-64 overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_24px_70px_rgba(30,64,175,0.18)]">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => goTo(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
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
        <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
          Support HR Desktop
        </span>
      </div>
    </div>
  );
};

export default DesktopAppMenuBar;
