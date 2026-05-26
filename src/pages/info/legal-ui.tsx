import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    accent: "text-[#f5d6bb]",
    label: "text-[#f5d6bb]/90",
    border: "border-[#f5d6bb]/24",
    surface: "bg-[#f5d6bb]/[0.07]",
    dot: "bg-[#f5d6bb]",
    rule: "via-[#f5d6bb]/45",
  },
  emerald: {
    accent: "text-[#ffd8a8]",
    label: "text-[#ffd8a8]/90",
    border: "border-[#f5d6bb]/22",
    surface: "bg-[#f5d6bb]/[0.055]",
    dot: "bg-[#ffd8a8]",
    rule: "via-[#ffd8a8]/36",
  },
  sky: {
    accent: "text-[#f5d6bb]",
    label: "text-[#f5d6bb]/85",
    border: "border-[#f5d6bb]/20",
    surface: "bg-[#f5d6bb]/[0.05]",
    dot: "bg-[#f5d6bb]",
    rule: "via-[#f5d6bb]/34",
  },
  violet: {
    accent: "text-[#f5d6bb]",
    label: "text-[#f5d6bb]/85",
    border: "border-[#f5d6bb]/18",
    surface: "bg-[#f5d6bb]/[0.045]",
    dot: "bg-[#f5d6bb]",
    rule: "via-[#f5d6bb]/30",
  },
  amber: {
    accent: "text-amber-300",
    label: "text-amber-200/85",
    border: "border-amber-400/20",
    surface: "bg-amber-400/[0.06]",
    dot: "bg-amber-300",
    rule: "via-amber-300/30",
  },
  rose: {
    accent: "text-[#f5d6bb]",
    label: "text-[#f5d6bb]/85",
    border: "border-[#f5d6bb]/18",
    surface: "bg-[#f5d6bb]/[0.045]",
    dot: "bg-[#f5d6bb]",
    rule: "via-[#f5d6bb]/30",
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
        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
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
          className="h-12 w-full rounded-[1.25rem] border border-white/10 bg-white/[0.03] pl-11 pr-20 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-white/22 focus:bg-white/[0.05]"
        />
        <span className="supporthr-mono pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:block">
          Ctrl K
        </span>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.7rem)] z-50 overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/96 shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((entry) => (
                <button
                  key={entry.to}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateTo(entry.to)}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{entry.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-zinc-500">{entry.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-zinc-500">Chưa có mục nào khớp với từ khóa này.</div>
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
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.45rem] w-full max-w-[96rem] items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden border border-white/14 bg-black">
              <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-white">
                Support HR
              </span>
              <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#f5d6bb]">
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
              className="hidden h-10 items-center justify-center rounded-full border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-200 transition-colors duration-200 hover:border-white/24 hover:text-white sm:inline-flex"
            >
              {auxiliaryLink.label}
            </Link>
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-200 hover:bg-zinc-100"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </nav>

      <div className="border-b border-white/[0.08] bg-black/96 px-4 py-3 md:hidden">
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
    <div className="border-b border-white/[0.08] bg-black/96">
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
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-200"
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
    <div className="legal-page-shell min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_48%)]" />
        <div className="absolute left-0 top-24 h-[22rem] w-[34rem] bg-[radial-gradient(circle_at_left_top,rgba(245,214,187,0.08),transparent_72%)]" />
        <div className="absolute bottom-0 right-0 h-[26rem] w-[36rem] bg-[radial-gradient(circle_at_right_bottom,rgba(245,214,187,0.06),transparent_74%)]" />
      </div>

      <div className="relative z-10">
        <DocsTopBar brandContext={brandContext} auxiliaryLink={auxiliaryLink} />

        <DocsHeaderTabs tabs={headerTabs} />

        <header
          className={`mx-auto max-w-[96rem] px-4 pb-8 pt-12 transition-all duration-700 sm:px-6 lg:px-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div>
            <p className="supporthr-mono text-[11px] uppercase tracking-[0.26em] text-[#f5d6bb]/70">
              {pageLabel} // {meta}
            </p>
            <h1 className="supporthr-display mt-4 max-w-4xl text-[clamp(2.7rem,5.5vw,4.9rem)] font-bold leading-[0.92] tracking-[-0.075em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              {subtitle}
            </p>
          </div>
        </header>

        <main
          className={`mx-auto max-w-[96rem] px-4 pb-14 transition-all duration-700 delay-100 sm:px-6 lg:px-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
            <aside className="hidden lg:block">
              <div className="sticky top-28 border border-white/8 bg-black/78 p-4 backdrop-blur-xl">
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]/70">
                  Mục lục
                </p>
                <div className="mt-4 space-y-1">
                  {sections.map((section, index) => {
                    const isActive = section.id === activeSection;
                    const tone = LEGAL_TONE_STYLES[section.tone];

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => onSectionChange(section.id)}
                        className={`flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors duration-200 ${
                          isActive
                            ? `${tone.border} ${tone.surface} text-white`
                            : "border-transparent text-zinc-500 hover:border-white/8 hover:bg-white/[0.03] hover:text-zinc-200"
                        }`}
                      >
                        <span
                          className={`supporthr-mono min-w-[1.5rem] text-[10px] uppercase tracking-[0.18em] ${
                            isActive ? tone.label : "text-zinc-600"
                          }`}
                        >
                          /{String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`flex h-8 w-8 items-center justify-center border text-[11px] ${
                            isActive ? `${tone.border} ${tone.surface} ${tone.accent}` : "border-white/8 bg-white/[0.02] text-zinc-500"
                          }`}
                        >
                          <i className={`fa-solid ${section.icon}`} />
                        </span>
                        <span className="text-sm font-medium leading-tight">{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="space-y-4">
              <div className="border border-white/8 bg-black/78 p-3 backdrop-blur-xl lg:hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {sections.map((section, index) => {
                    const isActive = section.id === activeSection;
                    const tone = LEGAL_TONE_STYLES[section.tone];

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => onSectionChange(section.id)}
                        className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? `${tone.border} ${tone.surface} ${tone.accent}`
                            : "border-white/8 bg-white/[0.02] text-zinc-500"
                        }`}
                      >
                        <span className="supporthr-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                          /{String(index + 1).padStart(2, "0")}
                        </span>
                        <i className={`fa-solid ${section.icon} text-[10px]`} />
                        {section.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(8,8,10,0.94),rgba(0,0,0,0.92))] p-5 backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-4 border-b border-white/6 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center border ${activeTone.border} ${activeTone.surface} ${activeTone.accent}`}
                    >
                      <i className={`fa-solid ${activeMeta.icon} text-sm`} />
                    </div>
                    <div>
                      <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]/70">
                        Đang xem
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-white">{activeMeta.title}</h2>
                    </div>
                  </div>
                  <div className="supporthr-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    /{String(activeIndex + 1).padStart(2, "0")} of /{String(sections.length).padStart(2, "0")}
                  </div>
                </div>
                <div className="pt-6">{children}</div>
              </section>
            </div>
          </div>
        </main>
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
    <div className={`relative overflow-hidden border ${style.border} bg-white/[0.02] p-4 sm:p-5`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center border ${style.border} ${style.surface} ${style.accent}`}>
          <i className={`fa-solid ${icon} text-xs`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white sm:text-base">{title}</h3>
            {badge ? (
              <span className={`supporthr-mono border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${style.border} ${style.label}`}>
                {badge}
              </span>
            ) : null}
          </div>
          <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-400">{children}</div>
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
    <div className={`relative overflow-hidden border ${style.border} ${style.surface} px-4 py-4 sm:px-5`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${style.rule} to-transparent`} />
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center border ${style.border} bg-black/30 ${style.accent}`}>
          <i className={`fa-solid ${icon} text-xs`} />
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${style.label}`}>{title}</h3>
          <div className="mt-2 text-sm leading-7 text-zinc-300">{children}</div>
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
        <div key={item} className="flex items-start gap-2 text-sm text-zinc-400">
          <span className={`mt-[0.55rem] h-1.5 w-1.5 shrink-0 ${style.dot}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

