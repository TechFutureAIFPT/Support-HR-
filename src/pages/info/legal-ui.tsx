import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DmcaBadge from "@/components/common/DmcaBadge";
import { productDocsSearchEntries, type DocsHeaderTab, type DocsSearchEntry } from "./docs-header-tabs";

export type LegalTone = "cyan" | "emerald" | "sky" | "violet" | "amber" | "rose";

export interface LegalSectionMeta {
  id: string;
  title: string;
  icon: string;
  tone: LegalTone;
}

export const LEGAL_TONE_STYLES: Record<
  LegalTone,
  {
    accent: string;
    label: string;
    border: string;
    surface: string;
    dot: string;
    rule: string;
  }
> = {
  cyan: {
    accent: "text-blue-600",
    label: "text-blue-700",
    border: "border-blue-200",
    surface: "bg-blue-50",
    dot: "bg-blue-500",
    rule: "via-blue-300/55",
  },
  emerald: {
    accent: "text-teal-600",
    label: "text-teal-700",
    border: "border-teal-200",
    surface: "bg-teal-50",
    dot: "bg-teal-500",
    rule: "via-teal-300/50",
  },
  sky: {
    accent: "text-sky-600",
    label: "text-sky-700",
    border: "border-sky-200",
    surface: "bg-sky-50",
    dot: "bg-sky-500",
    rule: "via-sky-300/50",
  },
  violet: {
    accent: "text-indigo-600",
    label: "text-indigo-700",
    border: "border-indigo-200",
    surface: "bg-indigo-50",
    dot: "bg-indigo-500",
    rule: "via-indigo-300/45",
  },
  amber: {
    accent: "text-amber-600",
    label: "text-amber-700",
    border: "border-amber-200",
    surface: "bg-amber-50",
    dot: "bg-amber-500",
    rule: "via-amber-300/40",
  },
  rose: {
    accent: "text-rose-600",
    label: "text-rose-700",
    border: "border-rose-200",
    surface: "bg-rose-50",
    dot: "bg-rose-500",
    rule: "via-rose-300/40",
  },
};

interface LegalPageLayoutProps {
  pageLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  sections: LegalSectionMeta[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  isVisible: boolean;
  auxiliaryLink: {
    label: string;
    to: string;
  };
  brandContext?: string;
  headerTabs?: DocsHeaderTab[];
  children: ReactNode;
}

function matchDocsSearch(query: string, entries: DocsSearchEntry[]) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return entries;

  return entries.filter((entry) => {
    const haystacks = [entry.label, entry.description, ...entry.keywords].map((value) => value.toLowerCase());
    return haystacks.some((value) => value.includes(normalizedQuery) || normalizedQuery.includes(value));
  });
}

function DocsSearchBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const results = matchDocsSearch(query, productDocsSearchEntries).slice(0, 6);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const navigateTo = (to: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(to);
  };

  const submitSearch = (currentValue: string) => {
    const matchedEntries = matchDocsSearch(currentValue, productDocsSearchEntries);

    if (matchedEntries.length > 0) {
      navigateTo(matchedEntries[0].to);
      return true;
    }

    return false;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentValue = inputRef.current?.value ?? query;
    if (submitSearch(currentValue)) {
      return;
    }
    inputRef.current?.focus();
  };

  const wrapperClassName = compact
    ? "relative w-full"
    : "relative hidden w-full max-w-[35rem] md:block";

  return (
    <div className={wrapperClassName}>
      <form onSubmit={handleSubmit} className="relative">
        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (closeTimerRef.current) {
              window.clearTimeout(closeTimerRef.current);
            }
            setIsOpen(true);
          }}
          onBlur={() => {
            closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!submitSearch(event.currentTarget.value)) {
                inputRef.current?.focus();
              }
            }
          }}
          placeholder="Search tài liệu..."
          className="h-12 w-full rounded-2xl border border-blue-100 bg-white pl-11 pr-20 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
        />
        <span className="supporthr-mono pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:block">
          Ctrl K
        </span>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.7rem)] z-50 overflow-hidden rounded-[1.15rem] border border-blue-100 bg-white shadow-[0_22px_60px_rgba(30,64,175,0.14)] backdrop-blur-xl">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((entry) => (
                <button
                  key={entry.to}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateTo(entry.to)}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-blue-50"
                >
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{entry.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">{entry.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500">Chưa có mục nào khớp với từ khóa này.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DocsTopBar({
  brandContext,
  auxiliaryLink,
}: {
  brandContext: string;
  auxiliaryLink: {
    label: string;
    to: string;
  };
}) {
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-blue-100 bg-white/92 shadow-[0_12px_36px_rgba(30,64,175,0.07)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.45rem] w-full max-w-[96rem] items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
              <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-slate-900">
                Support HR
              </span>
              <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-blue-600">
                {brandContext}
              </span>
            </div>
          </Link>

          <div className="flex flex-1 justify-center">
            <DocsSearchBar />
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:gap-5">
            <Link
              to={auxiliaryLink.to}
              className="hidden h-10 items-center justify-center rounded-xl border border-blue-100 bg-white px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm transition-colors duration-200 hover:border-blue-200 hover:text-blue-700 sm:inline-flex"
            >
              {auxiliaryLink.label}
            </Link>
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-600 px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm transition-colors duration-200 hover:bg-blue-700"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </nav>

      <div className="border-b border-blue-100 bg-white/96 px-4 py-3 md:hidden">
        <div className="mx-auto w-full max-w-[96rem]">
          <DocsSearchBar compact />
        </div>
      </div>
    </>
  );
}

export function DocsHeaderTabs({ tabs }: { tabs: DocsHeaderTab[] }) {
  const location = useLocation();

  if (!tabs.length) return null;

  return (
    <div className="border-b border-blue-100 bg-white/96">
      <div className="mx-auto flex w-full max-w-[96rem] items-center gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => {
          const matches = tab.matchPaths?.length ? tab.matchPaths : [tab.to];
          const isActive = matches.includes(location.pathname);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`supporthr-mono shrink-0 border-b px-1 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-blue-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DocsCopyPageButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const href = typeof window !== "undefined" ? window.location.href : "";
    if (!href) return;

    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
    >
      <i className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"} text-xs text-blue-600`} />
      {copied ? "Đã copy" : "Copy page"}
    </button>
  );
}

export function DocsPageLoading() {
  const sidebarRows = ["w-24", "w-36", "w-28", "w-32", "w-20"];
  const articleRows = ["w-11/12", "w-10/12", "w-full", "w-9/12"];

  return (
    <div className="legal-page-shell min-h-[58vh] overflow-hidden bg-[#f6f9ff] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[96rem] gap-8 xl:grid-cols-[17rem_minmax(0,48rem)_15rem]">
        <aside className="hidden xl:block">
          <div className="space-y-3 border-r border-blue-100 pr-6">
            <div className="h-4 w-24 animate-pulse rounded bg-blue-100" />
            {sidebarRows.map((width, index) => (
              <div key={index} className={`h-9 ${width} animate-pulse rounded bg-blue-50`} />
            ))}
          </div>
        </aside>

        <article className="min-w-0">
          <div className="h-4 w-32 animate-pulse rounded bg-blue-100" />
          <div className="mt-5 h-10 w-8/12 animate-pulse rounded bg-blue-50" />
          <div className="mt-4 space-y-3">
            {articleRows.map((width, index) => (
              <div key={index} className={`h-4 ${width} animate-pulse rounded bg-slate-100`} />
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl border border-blue-100 bg-white" />
            ))}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="space-y-3 border-l border-blue-100 pl-6">
            <div className="h-4 w-24 animate-pulse rounded bg-blue-100" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-4 w-32 animate-pulse rounded bg-blue-50" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function DocsFooter() {
  const footerColumns = [
    {
      title: "Tài liệu",
      links: [
        { label: "Đội ngũ", to: "/team" },
        { label: "Bảo mật dữ liệu", to: "/security" },
        { label: "Cách sử dụng", to: "/guide" },
        { label: "Bảng giá", to: "/pricing" },
      ],
    },
    {
      title: "Sản phẩm",
      links: [
        { label: "Quy trình", to: "/process" },
        { label: "Phương pháp AI", to: "/ai-methodology" },
        { label: "Use cases", to: "/use-cases" },
        { label: "Tích hợp", to: "/integrations" },
      ],
    },
    {
      title: "Pháp lý",
      links: [
        { label: "Chính sách bảo mật", to: "/privacy-policy" },
        { label: "Điều khoản", to: "/terms" },
        { label: "Đặt lịch demo", to: "/book-demo" },
        { label: "Liên hệ triển khai", to: "/contact-ready" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-blue-100 bg-white">
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-10" />
      <div className="relative mx-auto max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </span>
              <span>
                <span className="supporthr-mono block text-lg font-semibold uppercase tracking-[0.08em] text-slate-900">
                  Support HR
                </span>
                <span className="supporthr-mono mt-1 block text-[10px] uppercase tracking-[0.22em] text-blue-600">
                  Tài liệu doanh nghiệp
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
              Trung tâm tài liệu public cho đội ngũ tuyển dụng, bên mua và người đánh giá bảo mật trước khi trải nghiệm sản phẩm.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <section key={column.title}>
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{column.title}</p>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <Link key={link.to} to={link.to} className="block text-sm text-slate-500 transition-colors hover:text-blue-700">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-blue-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">© 2026 Support HR. Mọi quyền được bảo lưu.</p>
            <div className="flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:gap-4">
              <a href="mailto:support@supporthr.vn" className="transition-colors hover:text-blue-700">
                support@supporthr.vn
              </a>
              <a href="tel:0899280108" className="transition-colors hover:text-blue-700">
                0899 280 108
              </a>
            </div>
          </div>
          <DmcaBadge className="border-0 bg-transparent px-0 py-0" centered={false} />
        </div>
      </div>
    </footer>
  );
}

export function LegalPageLayout({
  pageLabel,
  title,
  subtitle,
  meta,
  sections,
  activeSection,
  onSectionChange,
  isVisible,
  auxiliaryLink,
  brandContext = "Tài liệu doanh nghiệp",
  headerTabs = [],
  children,
}: LegalPageLayoutProps) {
  const activeMeta = sections.find((section) => section.id === activeSection) ?? sections[0];
  const activeIndex = sections.findIndex((section) => section.id === activeSection);
  const activeTone = LEGAL_TONE_STYLES[activeMeta.tone];

  return (
    <div className="legal-page-shell min-h-screen overflow-x-hidden bg-[#f6f9ff] text-slate-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-10" />
      </div>

      <div className="relative z-10">
        <DocsTopBar brandContext={brandContext} auxiliaryLink={auxiliaryLink} />

        <DocsHeaderTabs tabs={headerTabs} />

        <main
          className={`mx-auto max-w-[96rem] px-4 pb-16 pt-8 transition-all duration-700 sm:px-6 lg:px-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid gap-8 xl:grid-cols-[17rem_minmax(0,48rem)_15rem] xl:gap-10">
            <aside className="hidden xl:block">
              <div className="sticky top-28 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Features</p>
                <p className="mt-5 text-sm text-slate-500">{pageLabel}</p>
                <div className="mt-3 space-y-1">
                  {sections.map((section) => {
                    const isActive = section.id === activeSection;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => onSectionChange(section.id)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <i className={`fa-solid ${section.icon} text-[11px] ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                        <span>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <article className="min-w-0">
              <header>
                <p className="text-sm font-semibold text-blue-600">{pageLabel}</p>
                <h1 className="mt-3 max-w-3xl text-[clamp(2rem,3.2vw,2.85rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-slate-950">
                  {title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  {subtitle}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <DocsCopyPageButton />
                  <span className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{meta}</span>
                </div>
              </header>

              <section className="mt-8 rounded-2xl border border-blue-100 bg-white px-4 py-4 shadow-[0_18px_48px_rgba(30,64,175,0.08)] sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <i className="fa-solid fa-book-open text-xs" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">Documentation Index</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      Chọn mục bên dưới để đi nhanh tới phần tài liệu cần đọc. Cấu trúc này giúp người xem rà soát theo chủ đề thay vì phải đọc một trang marketing dài.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {sections.map((section, index) => {
                        const tone = LEGAL_TONE_STYLES[section.tone];
                        const isActive = section.id === activeSection;

                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => onSectionChange(section.id)}
                            className={`flex items-center justify-between gap-3 border px-3 py-3 text-left text-sm transition-colors ${
                              isActive
                                ? `${tone.border} ${tone.surface} text-blue-700`
                                : "border-blue-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <i className={`fa-solid ${section.icon} text-[11px] ${isActive ? tone.accent : "text-slate-500"}`} />
                              <span className="truncate">{section.title}</span>
                            </span>
                            <span className="supporthr-mono shrink-0 text-[10px] text-slate-500">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-5 border-t border-blue-100 pt-8">
                <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center border ${activeTone.border} ${activeTone.surface} ${activeTone.accent}`}
                    >
                      <i className={`fa-solid ${activeMeta.icon} text-sm`} />
                    </div>
                    <div>
                      <p className="supporthr-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Section</p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900">{activeMeta.title}</h2>
                    </div>
                  </div>
                  <div className="supporthr-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    /{String(activeIndex + 1).padStart(2, "0")} of /{String(sections.length).padStart(2, "0")}
                  </div>
                </div>
                <div>{children}</div>
              </section>
            </article>

            <aside className="hidden xl:block">
              <div className="sticky top-28 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <i className="fa-solid fa-list-ul text-[11px] text-blue-600" />
                  On this page
                </p>
                <div className="mt-4 space-y-1">
                  {sections.map((section) => {
                    const isActive = section.id === activeSection;
                    const tone = LEGAL_TONE_STYLES[section.tone];

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => onSectionChange(section.id)}
                        className={`flex w-full items-start gap-2 px-2 py-2 text-left text-sm transition-colors ${
                          isActive ? "text-blue-700" : "text-slate-500 hover:text-blue-700"
                        }`}
                      >
                        <span className={`mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? tone.dot : "bg-blue-100"}`} />
                        <span>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </main>
        <DocsFooter />
      </div>
    </div>
  );
}

interface LegalCardProps {
  tone: LegalTone;
  icon: string;
  title: string;
  badge?: string;
  children: ReactNode;
}

export function LegalCard({ tone, icon, title, badge, children }: LegalCardProps) {
  const style = LEGAL_TONE_STYLES[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${style.border} bg-white p-4 shadow-sm sm:p-5`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center border ${style.border} ${style.surface} ${style.accent}`}>
          <i className={`fa-solid ${icon} text-xs`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
            {badge ? (
              <span className={`supporthr-mono border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${style.border} ${style.label}`}>
                {badge}
              </span>
            ) : null}
          </div>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface LegalCalloutProps {
  tone: LegalTone;
  icon: string;
  title: string;
  children: ReactNode;
}

export function LegalCallout({ tone, icon, title, children }: LegalCalloutProps) {
  const style = LEGAL_TONE_STYLES[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.surface} px-4 py-4 sm:px-5`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.border} bg-white ${style.accent}`}>
          <i className={`fa-solid ${icon} text-xs`} />
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${style.label}`}>{title}</h3>
          <div className="mt-2 text-sm leading-7 text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface LegalBulletGridProps {
  tone: LegalTone;
  items: string[];
  columns?: 1 | 2 | 3;
}

export function LegalBulletGrid({ tone, items, columns = 1 }: LegalBulletGridProps) {
  const style = LEGAL_TONE_STYLES[tone];
  const columnsClass =
    columns === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "grid-cols-1";

  return (
    <div className={`grid gap-2 ${columnsClass}`}>
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2 text-sm text-slate-600">
          <span className={`mt-[0.55rem] h-1.5 w-1.5 shrink-0 ${style.dot}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
