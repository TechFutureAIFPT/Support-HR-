import React, { useEffect, useMemo, useState } from "react";

type LoaderTone = "cyan" | "violet" | "emerald";

interface LoaderStage {
  label: string;
  hint?: string;
  tone?: LoaderTone;
}

interface SupportHRLoadingProps {
  mode?: "screen" | "panel" | "inline";
  label?: string;
  title?: string;
  description?: string;
  minHeightClass?: string;
  className?: string;
  stages?: LoaderStage[];
  activeIndex?: number;
  rotatingTitles?: string[];
}

const STAGE_STYLES: Record<
  LoaderTone,
  { accent: string; border: string; surface: string; beam: string; dot: string }
> = {
  cyan: {
    accent: "text-cyan-300",
    border: "border-cyan-400/20",
    surface: "bg-cyan-400/[0.06]",
    beam: "via-cyan-300/[0.16]",
    dot: "bg-cyan-300",
  },
  violet: {
    accent: "text-violet-300",
    border: "border-violet-400/20",
    surface: "bg-violet-400/[0.06]",
    beam: "via-violet-300/[0.16]",
    dot: "bg-violet-300",
  },
  emerald: {
    accent: "text-emerald-300",
    border: "border-emerald-400/20",
    surface: "bg-emerald-400/[0.06]",
    beam: "via-emerald-300/[0.16]",
    dot: "bg-emerald-300",
  },
};

const DEFAULT_STAGES: LoaderStage[] = [
  { label: "Khởi tạo", hint: "Chuẩn bị dữ liệu", tone: "cyan" },
  { label: "Phân tích", hint: "Đọc và đối sánh", tone: "violet" },
  { label: "Hoàn tất", hint: "Xuất giao diện", tone: "emerald" },
];

const DEFAULT_TITLES = [
  "Đang khởi tạo hệ thống",
  "Đang tải giao diện và dữ liệu",
  "Đang đồng bộ trạng thái làm việc",
];

export default function SupportHRLoading({
  mode = "panel",
  label = "Support HR // Loading",
  title = "Đang tải dữ liệu",
  description = "Hệ thống đang đồng bộ giao diện và chuẩn bị trạng thái làm việc cho bạn.",
  minHeightClass,
  className = "",
  stages = DEFAULT_STAGES,
  activeIndex,
  rotatingTitles = DEFAULT_TITLES,
}: SupportHRLoadingProps) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    if (typeof activeIndex === "number") return;

    const stageTimer = window.setInterval(() => {
      setCycleIndex((value) => (value + 1) % stages.length);
    }, 1100);

    return () => window.clearInterval(stageTimer);
  }, [activeIndex, stages.length]);

  useEffect(() => {
    if (rotatingTitles.length <= 1) return;

    const headlineTimer = window.setInterval(() => {
      setHeadlineIndex((value) => (value + 1) % rotatingTitles.length);
    }, 2400);

    return () => window.clearInterval(headlineTimer);
  }, [rotatingTitles]);

  const resolvedActiveIndex = typeof activeIndex === "number" ? activeIndex : cycleIndex;
  const resolvedTitle = useMemo(() => {
    if (mode === "screen" && rotatingTitles.length > 0) {
      return rotatingTitles[headlineIndex];
    }

    return title;
  }, [headlineIndex, mode, rotatingTitles, title]);

  const isCompact = mode === "inline";
  const rootHeight =
    mode === "screen"
      ? "min-h-screen"
      : minHeightClass ?? (isCompact ? "min-h-[12rem]" : "min-h-[44vh]");

  return (
    <div
      className={`${mode === "screen" ? "fixed inset-0 z-[100000]" : "relative"} isolate overflow-hidden bg-black text-zinc-100 ${rootHeight} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_34%),linear-gradient(180deg,#000000_0%,#020202_56%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-40" />
      <div className="pointer-events-none absolute inset-y-0 left-[-16%] w-[28%] bg-gradient-to-r from-transparent via-cyan-300/[0.12] to-transparent blur-3xl" style={{ animation: "home-hero-scan 7.4s linear infinite" }} />
      <div className="pointer-events-none absolute inset-y-0 right-[-16%] w-[28%] bg-gradient-to-r from-transparent via-violet-300/[0.1] to-transparent blur-3xl" style={{ animation: "home-hero-scan 9.2s linear infinite", animationDelay: "1.2s" }} />
      <div className="pointer-events-none absolute bottom-[-10%] left-[10%] h-48 w-48 bg-cyan-400/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[14%] h-56 w-56 bg-violet-400/[0.08] blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className={`flex w-full flex-col items-center text-center ${isCompact ? "gap-5" : "gap-8"}`}>
          <div className="relative">
            <div className={`${isCompact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"} relative border border-white/10 bg-black/70 shadow-[0_0_80px_rgba(34,211,238,0.08)]`}>
              <div className="absolute inset-0 border border-cyan-400/10" />
              <div className="absolute inset-[-1px] border-[3px] border-transparent border-r-cyan-300/35 border-t-cyan-300/90 animate-spin" style={{ animationDuration: "1.05s" }} />
              <div className="absolute inset-[11px] border border-white/8" />
              <div className="absolute inset-[13px] border-[3px] border-transparent border-b-violet-300/80 border-l-violet-300/30 animate-spin" style={{ animationDuration: "1.55s", animationDirection: "reverse" }} />
              <div className="absolute inset-[26px] bg-white/[0.02]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-200/85">
                  AI
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className={`h-1.5 w-1.5 transition-all duration-500 ${
                        resolvedActiveIndex === dot
                          ? "bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.75)]"
                          : dot === 1
                            ? "bg-violet-300/60"
                            : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`${isCompact ? "max-w-md" : "max-w-3xl"}`}>
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
            <h2
              className={`supporthr-display mt-3 font-bold tracking-[-0.06em] text-white ${
                isCompact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"
              }`}
            >
              {resolvedTitle}
            </h2>
            <p className={`mx-auto mt-4 max-w-2xl text-zinc-400 ${isCompact ? "text-sm leading-7" : "text-base leading-8 sm:text-lg"}`}>
              {description}
            </p>
          </div>

          <div className={`grid w-full gap-3 ${isCompact ? "max-w-2xl grid-cols-1 sm:grid-cols-3" : "max-w-3xl grid-cols-1 md:grid-cols-3"}`}>
            {stages.map((stage, index) => {
              const tone = STAGE_STYLES[stage.tone ?? "cyan"];
              const isActive = resolvedActiveIndex === index;

              return (
                <div
                  key={stage.label}
                  className={`relative overflow-hidden border px-4 py-4 text-left transition-all duration-500 ${
                    isActive
                      ? `${tone.border} ${tone.surface} shadow-[0_0_28px_rgba(15,23,42,0.38)]`
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isActive ? tone.beam : "via-white/10"} to-transparent`} />
                  <div className="flex items-center justify-between gap-3">
                    <span className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${isActive ? tone.accent : "text-zinc-600"}`}>
                      /{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`h-2 w-2 ${isActive ? tone.dot : "bg-white/25"}`} />
                  </div>
                  <p className={`mt-4 text-sm font-semibold ${isActive ? "text-white" : "text-zinc-300"}`}>{stage.label}</p>
                  <p className="mt-1 text-xs leading-6 text-zinc-500">{stage.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
