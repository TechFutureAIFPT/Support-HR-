import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";

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
    accent: "text-cyan-300",
    label: "text-cyan-200/85",
    border: "border-cyan-400/20",
    surface: "bg-cyan-400/[0.06]",
    dot: "bg-cyan-300",
    rule: "via-cyan-300/32",
  },
  emerald: {
    accent: "text-emerald-300",
    label: "text-emerald-200/85",
    border: "border-emerald-400/20",
    surface: "bg-emerald-400/[0.06]",
    dot: "bg-emerald-300",
    rule: "via-emerald-300/30",
  },
  sky: {
    accent: "text-sky-300",
    label: "text-sky-200/85",
    border: "border-sky-400/20",
    surface: "bg-sky-400/[0.06]",
    dot: "bg-sky-300",
    rule: "via-sky-300/30",
  },
  violet: {
    accent: "text-violet-300",
    label: "text-violet-200/85",
    border: "border-violet-400/20",
    surface: "bg-violet-400/[0.06]",
    dot: "bg-violet-300",
    rule: "via-violet-300/30",
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
    accent: "text-rose-300",
    label: "text-rose-200/85",
    border: "border-rose-400/20",
    surface: "bg-rose-400/[0.06]",
    dot: "bg-rose-300",
    rule: "via-rose-300/30",
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
  children: ReactNode;
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
        <div className="absolute left-0 top-24 h-[22rem] w-[34rem] bg-[radial-gradient(circle_at_left_top,rgba(34,211,238,0.07),transparent_72%)]" />
        <div className="absolute bottom-0 right-0 h-[26rem] w-[36rem] bg-[radial-gradient(circle_at_right_bottom,rgba(168,85,247,0.07),transparent_74%)]" />
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/92 backdrop-blur-xl">
          <div className="mx-auto flex h-[4.45rem] w-full max-w-[96rem] items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden border border-white/14 bg-black">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="supporthr-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-white">
                  Support HR
                </span>
                <span className="mt-0.5 supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                  Tài liệu pháp lý
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to={auxiliaryLink.to}
                className="hidden sm:inline-flex h-8 items-center justify-center border border-white/12 px-5 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-200 hover:border-white/24 hover:text-white"
              >
                {auxiliaryLink.label}
              </Link>
              <Link
                to="/"
                className="inline-flex h-8 items-center justify-center bg-white px-5 supporthr-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-200 hover:bg-zinc-100"
              >
                Trang chủ
              </Link>
            </div>
          </div>
        </nav>

        <header
          className={`mx-auto max-w-[96rem] px-4 pb-8 pt-12 transition-all duration-700 sm:px-6 lg:px-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="supporthr-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                {pageLabel} // {meta}
              </p>
              <h1 className="supporthr-display mt-4 max-w-4xl text-[clamp(2.7rem,5.5vw,4.9rem)] font-bold tracking-[-0.075em] text-white leading-[0.92]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                {subtitle}
              </p>
            </div>

            <div className="border border-white/8 bg-white/[0.02] p-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Trạng thái tài liệu
              </p>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold text-white">{sections.length}</p>
                  <p className="mt-1 text-sm text-zinc-500">mục điều khoản chính</p>
                </div>
                <span className={`mt-2 h-2.5 w-2.5 ${activeTone.dot} shadow-[0_0_16px_rgba(255,255,255,0.14)]`} />
              </div>
              <div className="mt-6 space-y-2 supporthr-mono text-[12px] leading-6 text-zinc-500">
                <p>[LIVE] Theo dõi nội dung đang xem</p>
                <p>[SYNC] Đồng bộ với hệ giao diện trang chủ</p>
                <p>[DOC] Dễ rà soát trên desktop và mobile</p>
              </div>
            </div>
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
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
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
              <div className="lg:hidden border border-white/8 bg-black/78 p-3 backdrop-blur-xl">
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

              <section className="border border-white/8 bg-black/78 p-5 backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-4 border-b border-white/6 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center border ${activeTone.border} ${activeTone.surface} ${activeTone.accent}`}
                    >
                      <i className={`fa-solid ${activeMeta.icon} text-sm`} />
                    </div>
                    <div>
                      <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                        Mục đang xem
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
