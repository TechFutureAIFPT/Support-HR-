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
    accent: "text-blue-600",
    border: "border-blue-200",
    surface: "bg-blue-50",
    beam: "via-blue-300/50",
    dot: "bg-blue-500",
  },
  violet: {
    accent: "text-cyan-700",
    border: "border-cyan-200",
    surface: "bg-cyan-50",
    beam: "via-cyan-300/50",
    dot: "bg-cyan-500",
  },
  emerald: {
    accent: "text-emerald-700",
    border: "border-emerald-200",
    surface: "bg-emerald-50",
    beam: "via-emerald-300/50",
    dot: "bg-emerald-500",
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
      className={`${mode === "screen" ? "fixed inset-0 z-[100000]" : "relative"} isolate overflow-hidden bg-[#f6f9ff] text-slate-900 ${rootHeight} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(35,136,255,0.13),transparent_34%),linear-gradient(180deg,#f6f9ff_0%,#eef5ff_56%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-30" />
      <div className="pointer-events-none absolute inset-y-0 left-[-16%] w-[28%] bg-gradient-to-r from-transparent via-blue-300/20 to-transparent blur-3xl" style={{ animation: "home-hero-scan 7.4s linear infinite" }} />
      <div className="pointer-events-none absolute inset-y-0 right-[-16%] w-[28%] bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent blur-3xl" style={{ animation: "home-hero-scan 9.2s linear infinite", animationDelay: "1.2s" }} />
      <div className="pointer-events-none absolute bottom-[-10%] left-[10%] h-48 w-48 bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[14%] h-56 w-56 bg-blue-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className={`flex w-full flex-col items-center text-center ${isCompact ? "gap-5" : "gap-8"}`}>
          <div className="relative">
            <div className={`${isCompact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"} relative rounded-[1.35rem] border border-blue-100 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.12)]`}>
              <div className="absolute inset-0 rounded-[1.35rem] border border-blue-100" />
              <div className="absolute inset-[-1px] rounded-[1.35rem] border-[3px] border-transparent border-r-blue-300 border-t-blue-500 animate-spin" style={{ animationDuration: "1.05s" }} />
              <div className="absolute inset-[11px] rounded-[1rem] border border-blue-100" />
              <div className="absolute inset-[13px] rounded-[1rem] border-[3px] border-transparent border-b-emerald-400 border-l-blue-200 animate-spin" style={{ animationDuration: "1.55s", animationDirection: "reverse" }} />
              <div className="absolute inset-[26px] rounded-xl bg-blue-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.26em] text-blue-600">
                  AI
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className={`h-1.5 w-1.5 transition-all duration-500 ${
                        resolvedActiveIndex === dot
                          ? "bg-blue-500 shadow-[0_0_14px_rgba(35,136,255,0.45)]"
                          : dot === 1
                            ? "bg-emerald-400/70"
                            : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`${isCompact ? "max-w-md" : "max-w-3xl"}`}>
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.28em] text-blue-600">{label}</p>
            <h2
              className={`supporthr-display mt-3 font-bold tracking-[-0.06em] text-slate-900 ${
                isCompact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"
              }`}
            >
              {resolvedTitle}
            </h2>
            <p className={`mx-auto mt-4 max-w-2xl text-slate-500 ${isCompact ? "text-sm leading-7" : "text-base leading-8 sm:text-lg"}`}>
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
                      ? `${tone.border} ${tone.surface} shadow-[0_18px_44px_rgba(30,64,175,0.08)]`
                      : "border-blue-100 bg-white"
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isActive ? tone.beam : "via-blue-100"} to-transparent`} />
                  <div className="flex items-center justify-between gap-3">
                    <span className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${isActive ? tone.accent : "text-slate-400"}`}>
                      /{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${isActive ? tone.dot : "bg-slate-300"}`} />
                  </div>
                  <p className={`mt-4 text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-700"}`}>{stage.label}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">{stage.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
