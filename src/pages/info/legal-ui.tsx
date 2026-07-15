import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import DmcaBadge from "@/components/common/DmcaBadge";
import { productDocsSearchEntries, type DocsHeaderTab, type DocsSearchEntry } from "./docs-header-tabs";
import DocsStandaloneHeader from "./DocsStandaloneHeader";

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
    accent: "text-[#1d4e89]",
    label: "text-[#1d4e89]",
    border: "border-[#1d4e89]/20",
    surface: "bg-[#1d4e89]/[0.06]",
    dot: "bg-[#1d4e89]",
    rule: "via-[#1d4e89]/35",
  },
  emerald: {
    accent: "text-[#17915f]",
    label: "text-[#13754e]",
    border: "border-[#17915f]/20",
    surface: "bg-[#17915f]/[0.06]",
    dot: "bg-[#17915f]",
    rule: "via-[#17915f]/35",
  },
  sky: {
    accent: "text-[#2a62a6]",
    label: "text-[#1d4e89]",
    border: "border-[#2a62a6]/20",
    surface: "bg-[#2a62a6]/[0.06]",
    dot: "bg-[#2a62a6]",
    rule: "via-[#2a62a6]/35",
  },
  violet: {
    accent: "text-[#4e5ba6]",
    label: "text-[#404b8d]",
    border: "border-[#4e5ba6]/20",
    surface: "bg-[#4e5ba6]/[0.06]",
    dot: "bg-[#4e5ba6]",
    rule: "via-[#4e5ba6]/30",
  },
  amber: {
    accent: "text-[#b54708]",
    label: "text-[#93370d]",
    border: "border-[#b54708]/20",
    surface: "bg-[#b54708]/[0.06]",
    dot: "bg-[#b54708]",
    rule: "via-[#b54708]/30",
  },
  rose: {
    accent: "text-[#d92d20]",
    label: "text-[#b42318]",
    border: "border-[#d92d20]/20",
    surface: "bg-[#d92d20]/[0.05]",
    dot: "bg-[#d92d20]",
    rule: "via-[#d92d20]/30",
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
    : "relative w-full";

  return (
    <div className={wrapperClassName}>
      <form onSubmit={handleSubmit} className="relative">
        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#667085]" />
        <input
          ref={inputRef}
          type="search"
          aria-label="Tìm kiếm trong tài liệu SupportHR"
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
          placeholder="Tìm kiếm tài liệu..."
          className="h-12 w-full rounded-[10px] border border-[#d0d5dd] bg-white pl-11 pr-20 text-sm text-[#172033] shadow-sm outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#1d4e89] focus:ring-2 focus:ring-[#1d4e89]/15"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3] sm:block">
          Ctrl K
        </span>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.7rem)] z-50 overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-[0_16px_36px_rgba(16,24,40,0.12)]">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((entry) => (
                <button
                  key={entry.to}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateTo(entry.to)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[#f2f4f7] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#172033]">{entry.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#667085]">{entry.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-[#667085]">Chưa có mục nào khớp với từ khóa này.</div>
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
    <DocsStandaloneHeader
      brandContext={brandContext}
      auxiliaryLink={auxiliaryLink}
      search={<DocsSearchBar />}
      compactSearch={<DocsSearchBar compact />}
    />
  );
}

export function DocsHeaderTabs({ tabs }: { tabs: DocsHeaderTab[] }) {
  void tabs;
  return null;
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
      className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc] hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2"
    >
      <i className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"} text-xs text-[#1d4e89]`} />
      {copied ? "Đã sao chép" : "Sao chép trang"}
    </button>
  );
}

export function DocsPageLoading() {
  const sidebarRows = ["w-24", "w-36", "w-28", "w-32", "w-20"];
  const articleRows = ["w-11/12", "w-10/12", "w-full", "w-9/12"];

  return (
    <div className="legal-page-shell min-h-[58vh] overflow-hidden bg-[#f6f8fb] px-4 py-8 text-[#172033] sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
        <aside className="hidden xl:block">
          <div className="space-y-3 border-r border-[#e4e7ec] pr-6">
            <div className="h-4 w-24 animate-pulse rounded bg-[#e4e7ec]" />
            {sidebarRows.map((width, index) => (
              <div key={index} className={`h-9 ${width} animate-pulse rounded bg-[#eef2f6]`} />
            ))}
          </div>
        </aside>

        <article className="min-w-0">
          <div className="h-4 w-32 animate-pulse rounded bg-[#e4e7ec]" />
          <div className="mt-5 h-10 w-8/12 animate-pulse rounded bg-[#eef2f6]" />
          <div className="mt-4 space-y-3">
            {articleRows.map((width, index) => (
              <div key={index} className={`h-4 ${width} animate-pulse rounded bg-slate-100`} />
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl border border-[#e4e7ec] bg-white" />
            ))}
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="space-y-3 border-l border-[#e4e7ec] pl-6">
            <div className="h-4 w-24 animate-pulse rounded bg-[#e4e7ec]" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-4 w-32 animate-pulse rounded bg-[#eef2f6]" />
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
        { label: "Hướng dẫn sử dụng", to: "/guide" },
        { label: "Phương pháp AI", to: "/ai-methodology" },
        { label: "Câu hỏi thường gặp", to: "/faq" },
        { label: "Đặt lịch demo", to: "/book-demo" },
      ],
    },
    {
      title: "Sản phẩm",
      links: [
        { label: "Quy trình", to: "/process" },
        { label: "Kho lưu trữ CV", to: "/docs/cv-library" },
        { label: "Mẫu JD", to: "/docs/jd-templates" },
        { label: "Bảng giá", to: "/pricing" },
      ],
    },
    {
      title: "Pháp lý & bảo mật",
      links: [
        { label: "Bảo mật", to: "/security" },
        { label: "Chính sách quyền riêng tư", to: "/privacy-policy" },
        { label: "Điều khoản dịch vụ", to: "/terms" },
        { label: "Liên hệ", to: "/contact-ready" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#e4e7ec] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4e89] focus:ring-offset-2"
            >
              <span className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-lg border border-[#e4e7ec] bg-white">
                <img src="/images/logos/logo.jpg" alt="" className="h-full w-full object-cover" />
              </span>
              <span className="text-[16px] font-semibold text-[#172033]">SupportHR</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-6 text-[#667085]">
              Nền tảng tuyển dụng thông minh: phân tích CV bằng AI, đánh giá minh bạch và hỗ trợ nhà tuyển dụng ra quyết định có căn cứ.
            </p>
            <div className="mt-4 space-y-1 text-[13px] text-[#667085]">
              <a href="mailto:support@supporthr.vn" className="block hover:text-[#172033]">support@supporthr.vn</a>
              <a href="tel:0899280108" className="block hover:text-[#172033]">0899 280 108</a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <section key={column.title}>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">{column.title}</h2>
              <ul className="mt-3 space-y-2 text-[13px] text-[#475467]">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="rounded-sm transition-colors hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#eaecf0] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-5 text-[#98a2b3]">
            © {new Date().getFullYear()} SupportHR. Phân tích AI chỉ mang tính hỗ trợ — quyết định tuyển dụng cuối cùng thuộc về nhà tuyển dụng.
          </p>
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
  const activeMeta = sections.find((s) => s.id === activeSection) ?? sections[0];
  const activeIndex = sections.findIndex((s) => s.id === activeSection);
  const activeTone = LEGAL_TONE_STYLES[activeMeta.tone];

  return (
    <div className="legal-page-shell min-h-screen overflow-x-hidden bg-[#f6f8fb] text-[#172033]">
      <DocsTopBar brandContext={brandContext} auxiliaryLink={auxiliaryLink} />
      <DocsHeaderTabs tabs={headerTabs} />

      <section className="border-b border-[#e4e7ec] bg-white">
        <div
          className={`mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 transition-all duration-500 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:py-14 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1d4e89]/20 bg-[#1d4e89]/[0.06] px-3 py-1 text-[12px] font-medium text-[#1d4e89]">
              <i className="fa-solid fa-file-shield text-[11px]" />
              {pageLabel} của SupportHR
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.12] tracking-[-0.025em] text-[#172033] sm:text-[46px]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#475467] sm:text-[17px]">{subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <DocsCopyPageButton />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#98a2b3]">{meta}</span>
            </div>
          </div>

          <aside className="rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-5" aria-label="Tóm tắt tài liệu">
            <div className="flex items-center justify-between border-b border-[#e4e7ec] pb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Tài liệu này</span>
              <span className="rounded-lg bg-[#1d4e89]/[0.08] px-2.5 py-1 text-xs font-semibold text-[#1d4e89]">{sections.length} mục</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activeTone.surface} ${activeTone.accent}`}>
                <i className={`fa-solid ${activeMeta.icon} text-sm`} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[#667085]">Đang xem</p>
                <p className="mt-1 text-sm font-semibold text-[#172033]">{activeMeta.title}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid items-start gap-8 xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
          <aside className="hidden xl:block">
            <nav className="sticky top-24" aria-label={`Mục lục ${pageLabel}`}>
              <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Nội dung</p>
              <div className="space-y-1">
                {sections.map((section, idx) => {
                  const selected = section.id === activeSection;
                  const tone = LEGAL_TONE_STYLES[section.tone];
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => onSectionChange(section.id)}
                      aria-current={selected ? "true" : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d4e89] ${
                        selected ? `${tone.surface} ${tone.label} font-semibold` : "text-[#667085] hover:bg-white hover:text-[#172033]"
                      }`}
                    >
                      <i className={`fa-solid ${section.icon} w-4 shrink-0 text-center text-[11px] ${selected ? tone.accent : "text-[#98a2b3]"}`} />
                      <span className="min-w-0 flex-1">{section.title}</span>
                      <span className="text-[10px] tabular-nums text-[#98a2b3]">{String(idx + 1).padStart(2, "0")}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          <article className="min-w-0">
            <section className="mb-6 overflow-hidden rounded-xl border border-[#e4e7ec] bg-white xl:hidden">
              <div className="border-b border-[#e4e7ec] px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
                  <i className="fa-solid fa-list text-xs text-[#1d4e89]" /> Mục lục
                </h2>
              </div>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {sections.map((section, idx) => {
                  const tone = LEGAL_TONE_STYLES[section.tone];
                  const selected = section.id === activeSection;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => onSectionChange(section.id)}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d4e89] ${
                        selected
                          ? `${tone.border} ${tone.surface} ${tone.label} font-semibold`
                          : "border-[#e4e7ec] bg-white text-[#667085] hover:bg-[#f8fafc] hover:text-[#172033]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <i className={`fa-solid ${section.icon} shrink-0 text-[11px] ${selected ? tone.accent : "text-[#98a2b3]"}`} />
                        <span>{section.title}</span>
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-[#98a2b3]">{String(idx + 1).padStart(2, "0")}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#e4e7ec] pb-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activeTone.surface} ${activeTone.accent}`}>
                  <i className={`fa-solid ${activeMeta.icon} text-sm`} />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#98a2b3]">Đang xem</p>
                  <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-[#172033]">{activeMeta.title}</h2>
                </div>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-[#98a2b3]">{activeIndex + 1} / {sections.length}</span>
            </div>

            <div>{children}</div>

            <nav className="mt-8 grid grid-cols-2 gap-3 border-t border-[#e4e7ec] pt-6" aria-label="Chuyển mục tài liệu">
              {activeIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => onSectionChange(sections[activeIndex - 1].id)}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-[#e4e7ec] bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#c8d1dc] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <i className="fa-solid fa-arrow-left shrink-0 text-xs text-[#1d4e89]" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-[#98a2b3]">Trước</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-[#344054]">{sections[activeIndex - 1].title}</span>
                  </span>
                </button>
              ) : <div />}

              {activeIndex < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() => onSectionChange(sections[activeIndex + 1].id)}
                  className="flex min-h-14 items-center justify-end gap-3 rounded-xl border border-[#e4e7ec] bg-white px-4 py-3 text-right transition-all hover:-translate-y-0.5 hover:border-[#c8d1dc] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-[#98a2b3]">Tiếp theo</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-[#344054]">{sections[activeIndex + 1].title}</span>
                  </span>
                  <i className="fa-solid fa-arrow-right shrink-0 text-xs text-[#1d4e89]" />
                </button>
              ) : <div />}
            </nav>
          </article>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border border-[#e4e7ec] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Liên quan</p>
                <Link
                  to={auxiliaryLink.to}
                  className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-lg bg-[#1d4e89]/[0.06] px-3 py-2.5 text-sm font-semibold text-[#1d4e89] transition-colors hover:bg-[#1d4e89]/[0.1] focus:outline-none focus:ring-2 focus:ring-[#1d4e89]"
                >
                  <span>{auxiliaryLink.label}</span>
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </Link>
                <p className="mt-4 text-[11px] leading-5 text-[#98a2b3]">{meta}</p>
              </div>

              <div className="rounded-xl border border-[#e4e7ec] bg-[#f8fafc] p-4 text-sm leading-6 text-[#667085]">
                <i className="fa-solid fa-circle-info mr-2 text-[#1d4e89]" />
                Chọn từng mục ở bên trái để đọc nội dung và dùng nút trước/sau để rà soát tuần tự.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <DocsFooter />
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
    <section className="relative overflow-hidden rounded-xl border border-[#e4e7ec] bg-white p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(16,24,40,0.06)] sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.surface} ${style.accent}`}>
          <i className={`fa-solid ${icon} text-xs`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#172033] sm:text-base">{title}</h3>
            {badge ? (
              <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${style.surface} ${style.label}`}>
                {badge}
              </span>
            ) : null}
          </div>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[#475467]">{children}</div>
        </div>
      </div>
    </section>
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
    <aside className={`relative overflow-hidden rounded-xl border ${style.border} ${style.surface} px-4 py-4 sm:px-5`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ${style.accent}`}>
          <i className={`fa-solid ${icon} text-xs`} />
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${style.label}`}>{title}</h3>
          <div className="mt-2 text-sm leading-7 text-[#475467]">{children}</div>
        </div>
      </div>
    </aside>
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
        <div key={item} className="flex items-start gap-2 text-sm text-[#475467]">
          <span className={`mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
