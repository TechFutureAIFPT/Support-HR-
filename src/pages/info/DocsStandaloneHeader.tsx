import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { productDocsMenus, type DocsHeaderTab } from "./docs-header-tabs";

interface DocsStandaloneHeaderProps {
  brandContext: string;
  auxiliaryLink: { label: string; to: string };
  search: React.ReactNode;
  compactSearch: React.ReactNode;
}

const primaryNavigation: DocsHeaderTab[] = [
  { label: "Tổng quan", description: "Khả năng và phạm vi sản phẩm", icon: "fa-compass", to: "/app-docs" },
  { label: "Quy trình", description: "Từ JD đến danh sách đề xuất", icon: "fa-route", to: "/process" },
  {
    label: "Hướng dẫn",
    description: "Các bước trên Website và App mobile",
    icon: "fa-book-open",
    to: "/guide",
    matchPaths: ["/guide", "/demo"],
  },
  { label: "Bảo mật", description: "Cách dữ liệu tuyển dụng được bảo vệ", icon: "fa-shield-halved", to: "/security" },
  { label: "Bảng giá", description: "Các gói sử dụng SupportHR", icon: "fa-tag", to: "/pricing" },
];

export default function DocsStandaloneHeader({
  brandContext,
  auxiliaryLink,
  search,
  compactSearch,
}: DocsStandaloneHeaderProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setMobileOpen(false);
        window.setTimeout(() => {
          document.querySelector<HTMLInputElement>('[aria-label="Tìm kiếm trong tài liệu SupportHR"]')?.focus();
        }, 0);
        return;
      }

      if (event.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (item: DocsHeaderTab) => (item.matchPaths ?? [item.to]).includes(location.pathname);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-[#1d4e89] px-4 py-2 text-sm font-semibold text-[#ffffff] shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2"
      >
        Bỏ qua điều hướng
      </a>

      <header className="sticky top-0 z-50 border-b border-[#e4e7ec] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2"
            aria-label="Về trang chủ SupportHR"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e4e7ec] bg-white">
              <img src="/images/logos/logo.jpg" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="truncate text-[17px] font-semibold tracking-tight text-[#172033]">SupportHR</span>
            <span className="hidden border-l border-[#e4e7ec] pl-2.5 text-[11px] font-medium text-[#667085] sm:inline">
              {brandContext}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Điều hướng tài liệu công khai">
            {primaryNavigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item) ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2 ${
                  isActive(item)
                    ? "bg-[#1d4e89]/[0.08] text-[#1d4e89]"
                    : "text-[#475467] hover:bg-[#f2f4f7] hover:text-[#172033]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#d0d5dd] bg-white text-[#475467] transition-colors hover:bg-[#f8fafc] hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2"
              aria-label={searchOpen ? "Đóng tìm kiếm tài liệu" : "Tìm kiếm tài liệu"}
              aria-expanded={searchOpen}
            >
              <i className={`fa-solid ${searchOpen ? "fa-xmark" : "fa-magnifying-glass"} text-sm`} />
            </button>

            <Link
              to={auxiliaryLink.to}
              className="hidden h-11 items-center rounded-[10px] border border-[#d0d5dd] bg-white px-4 text-[13px] font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2 xl:inline-flex"
            >
              {auxiliaryLink.label}
            </Link>

            <Link
              to="/"
              className="hidden h-11 items-center gap-1.5 rounded-[10px] bg-[#1d4e89] px-4 text-[13px] font-semibold text-[#ffffff] transition-colors hover:bg-[#163a5f] focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2 sm:inline-flex"
            >
              Dùng thử SupportHR
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#d0d5dd] bg-white text-[#344054] transition-colors hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2 lg:hidden"
              aria-label={mobileOpen ? "Đóng menu tài liệu" : "Mở menu tài liệu"}
              aria-expanded={mobileOpen}
            >
              <i className={`fa-solid ${mobileOpen ? "fa-xmark" : "fa-bars"} text-sm`} />
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-[#eaecf0] bg-[#f8fafc] px-4 py-4 sm:px-6">
            <div className="mx-auto w-full max-w-2xl">{search}</div>
          </div>
        ) : null}

        {mobileOpen ? (
          <div className="border-t border-[#eaecf0] bg-white px-4 py-5 sm:px-6 lg:hidden">
            <div className="mx-auto max-w-7xl">
              <div className="mb-4">{compactSearch}</div>
              <nav className="grid gap-2 sm:grid-cols-2" aria-label="Điều hướng tài liệu trên thiết bị di động">
                {primaryNavigation.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive(item) ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d4e89] ${
                      isActive(item)
                        ? "border-[#1d4e89]/20 bg-[#1d4e89]/[0.06] font-semibold text-[#1d4e89]"
                        : "border-[#e4e7ec] text-[#475467] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
                      <i className={`fa-solid ${item.icon} text-[11px]`} />
                    </span>
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-5 border-t border-[#eaecf0] pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Tài liệu chuyên sâu</p>
                <div className="flex flex-wrap gap-2">
                  {productDocsMenus.flatMap((group) => group.items).map((item) => (
                    <Link
                      key={`mobile-${item.to}`}
                      to={item.to}
                      className="rounded-lg bg-[#f2f4f7] px-3 py-2 text-xs font-medium text-[#475467] hover:text-[#172033]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
