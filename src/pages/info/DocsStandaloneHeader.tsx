import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { productDocsMenus, type DocsHeaderTab } from "./docs-header-tabs";

interface DocsStandaloneHeaderProps {
  brandContext: string;
  auxiliaryLink: { label: string; to: string };
  search: React.ReactNode;
  compactSearch: React.ReactNode;
}

export default function DocsStandaloneHeader({ brandContext, auxiliaryLink, search, compactSearch }: DocsStandaloneHeaderProps) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isActive = (item: DocsHeaderTab) => (item.matchPaths ?? [item.to]).includes(location.pathname);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 shadow-[0_12px_36px_rgba(30,64,175,0.07)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.45rem] w-full max-w-[86rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/app-docs" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-85">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
              <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-sm font-bold uppercase tracking-[0.08em] text-slate-950">Support HR</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">{brandContext}</span>
            </span>
          </Link>

          <div ref={navigationRef} className="hidden items-center gap-1 lg:flex">
            {productDocsMenus.map((group) => {
              const groupActive = group.items.some(isActive);
              return (
                <div key={group.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu((current) => current === group.label ? null : group.label)}
                    className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                      groupActive || openMenu === group.label
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                    aria-expanded={openMenu === group.label}
                  >
                    {group.label}
                    <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${openMenu === group.label ? "rotate-180" : ""}`} />
                  </button>

                  {openMenu === group.label ? (
                    <div className="absolute left-0 top-12 w-72 rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_20px_50px_rgba(30,64,175,0.14)]">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                            isActive(item)
                              ? "bg-blue-50 font-semibold text-blue-700"
                              : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="hidden min-w-0 flex-1 justify-center xl:flex">{search}</div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={auxiliaryLink.to}
              className="hidden h-10 items-center rounded-xl border border-blue-100 bg-white px-4 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700 sm:inline-flex"
            >
              {auxiliaryLink.label}
            </Link>
            <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
              Vào ứng dụng
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-700 lg:hidden"
              aria-label={mobileOpen ? "Đóng menu tài liệu" : "Mở menu tài liệu"}
              aria-expanded={mobileOpen}
            >
              <i className={`fa-solid ${mobileOpen ? "fa-xmark" : "fa-bars"} text-sm`} />
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-blue-100 bg-white px-4 py-4 lg:hidden">
            <div className="mx-auto max-w-[86rem] space-y-5">
              {productDocsMenus.map((group) => (
                <section key={group.label}>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{group.label}</p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`rounded-xl px-3 py-2.5 text-sm ${isActive(item) ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600"}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="border-b border-blue-100 bg-white px-4 py-3 xl:hidden">
        <div className="mx-auto w-full max-w-[86rem]">{compactSearch}</div>
      </div>
    </>
  );
}
