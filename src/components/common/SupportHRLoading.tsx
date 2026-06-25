import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/context/theme/ThemeProvider";

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
  { accent: string; border: string; surface: string; surfaceDark: string; beam: string; dot: string }
> = {
  cyan: {
    accent: "text-blue-400",
    border: "border-blue-200",
    surface: "bg-blue-50",
    surfaceDark: "bg-blue-950/40",
    beam: "via-blue-300/50",
    dot: "bg-blue-500",
  },
  violet: {
    accent: "text-cyan-400",
    border: "border-cyan-200",
    surface: "bg-cyan-50",
    surfaceDark: "bg-cyan-950/40",
    beam: "via-cyan-300/50",
    dot: "bg-cyan-500",
  },
  emerald: {
    accent: "text-emerald-400",
    border: "border-emerald-200",
    surface: "bg-emerald-50",
    surfaceDark: "bg-emerald-950/40",
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
  const { isDarkMode } = useTheme();
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

  const d = {
    rootBg: isDarkMode ? "#0f1523" : "#f6f9ff",
    gradientBg: isDarkMode
      ? "radial-gradient(circle at top,rgba(35,136,255,0.08),transparent 34%),linear-gradient(180deg,#0f1523 0%,#141b2d 56%,#1e2a3d 100%)"
      : "radial-gradient(circle at top,rgba(35,136,255,0.13),transparent 34%),linear-gradient(180deg,#f6f9ff 0%,#eef5ff 56%,#ffffff 100%)",
    cardBorder: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(219,234,254,1)",
    cardBg: isDarkMode ? "#1e2a3d" : "#ffffff",
    innerRingBorder: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(219,234,254,1)",
    innerCircle: isDarkMode ? "#141b2d" : "#eff6ff",
    textPrimary: isDarkMode ? "#e2e8f4" : "#0f172a",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    stageInactiveBg: isDarkMode ? "#1e2a3d" : "#ffffff",
    stageInactiveBorder: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(219,234,254,1)",
    stageTextActive: isDarkMode ? "#e2e8f4" : "#0f172a",
    stageTextInactive: isDarkMode ? "#94a3b8" : "#475569",
    stageHint: isDarkMode ? "#64748b" : "#64748b",
    stageDotInactive: isDarkMode ? "#334155" : "#cbd5e1",
    stageNumberInactive: isDarkMode ? "#475569" : "#94a3b8",
  };

  return (
    <div
      className={`${mode === "screen" ? "fixed inset-0 z-[100000]" : "relative"} isolate overflow-hidden ${rootHeight} ${className}`}
      style={{ background: d.rootBg, color: d.textPrimary }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: d.gradientBg }} />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-30" />
      <div className="pointer-events-none absolute inset-y-0 left-[-16%] w-[28%] bg-gradient-to-r from-transparent via-blue-300/20 to-transparent blur-3xl" style={{ animation: "home-hero-scan 7.4s linear infinite" }} />
      <div className="pointer-events-none absolute inset-y-0 right-[-16%] w-[28%] bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent blur-3xl" style={{ animation: "home-hero-scan 9.2s linear infinite", animationDelay: "1.2s" }} />
      <div className="pointer-events-none absolute bottom-[-10%] left-[10%] h-48 w-48 bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[14%] h-56 w-56 bg-blue-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className={`flex w-full flex-col items-center text-center ${isCompact ? "gap-5" : "gap-8"}`}>
          <div className="relative">
            <div
              className={`${isCompact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"} relative rounded-[1.35rem] shadow-[0_24px_70px_rgba(30,64,175,0.12)]`}
              style={{ border: `1px solid ${d.cardBorder}`, background: d.cardBg }}
            >
              <div className="absolute inset-0 rounded-[1.35rem]" style={{ border: `1px solid ${d.cardBorder}` }} />
              <div className="absolute inset-[-1px] rounded-[1.35rem] border-[3px] border-transparent border-r-blue-300 border-t-blue-500 animate-spin" style={{ animationDuration: "1.05s" }} />
              <div className="absolute inset-[11px] rounded-[1rem]" style={{ border: `1px solid ${d.innerRingBorder}` }} />
              <div className="absolute inset-[13px] rounded-[1rem] border-[3px] border-transparent border-b-emerald-400 border-l-blue-200 animate-spin" style={{ animationDuration: "1.55s", animationDirection: "reverse" }} />
              <div className="absolute inset-[26px] rounded-xl" style={{ background: d.innerCircle }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.26em] text-blue-400">
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
                            : ""
                      }`}
                      style={resolvedActiveIndex !== dot && dot !== 1 ? { background: d.stageDotInactive } : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`${isCompact ? "max-w-md" : "max-w-3xl"}`}>
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.28em] text-blue-400">{label}</p>
            <h2
              className={`supporthr-display mt-3 font-bold tracking-[-0.06em] ${isCompact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"}`}
              style={{ color: d.textPrimary }}
            >
              {resolvedTitle}
            </h2>
            <p
              className={`mx-auto mt-4 max-w-2xl ${isCompact ? "text-sm leading-7" : "text-base leading-8 sm:text-lg"}`}
              style={{ color: d.textMuted }}
            >
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
                      ? `${tone.border} ${isDarkMode ? tone.surfaceDark : tone.surface} shadow-[0_18px_44px_rgba(30,64,175,0.08)]`
                      : ""
                  }`}
                  style={!isActive ? { background: d.stageInactiveBg, borderColor: d.stageInactiveBorder } : undefined}
                >
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isActive ? tone.beam : "via-blue-100/30"} to-transparent`} />
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`supporthr-mono text-[10px] uppercase tracking-[0.22em] ${isActive ? tone.accent : ""}`}
                      style={!isActive ? { color: d.stageNumberInactive } : undefined}
                    >
                      /{String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${isActive ? tone.dot : ""}`}
                      style={!isActive ? { background: d.stageDotInactive } : undefined}
                    />
                  </div>
                  <p
                    className="mt-4 text-sm font-semibold"
                    style={{ color: isActive ? d.stageTextActive : d.stageTextInactive }}
                  >
                    {stage.label}
                  </p>
                  <p className="mt-1 text-xs leading-6" style={{ color: d.stageHint }}>{stage.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
