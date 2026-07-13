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
  label = "SupportHR",
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
    const t = window.setInterval(() => {
      setCycleIndex((v) => (v + 1) % stages.length);
    }, 1100);
    return () => window.clearInterval(t);
  }, [activeIndex, stages.length]);

  useEffect(() => {
    if (rotatingTitles.length <= 1) return;
    const t = window.setInterval(() => {
      setHeadlineIndex((v) => (v + 1) % rotatingTitles.length);
    }, 2400);
    return () => window.clearInterval(t);
  }, [rotatingTitles]);

  const resolvedActiveIndex = typeof activeIndex === "number" ? activeIndex : cycleIndex;

  const resolvedTitle = useMemo(() => {
    if (mode === "screen" && rotatingTitles.length > 0) return rotatingTitles[headlineIndex];
    return title;
  }, [headlineIndex, mode, rotatingTitles, title]);

  const isCompact = mode === "inline";
  const rootHeight =
    mode === "screen"
      ? "min-h-screen"
      : minHeightClass ?? (isCompact ? "min-h-[12rem]" : "min-h-[44vh]");

  // Theme tokens
  const bg = isDarkMode ? "#0f1523" : "#f6f8fb";
  const gradientBg = isDarkMode
    ? "radial-gradient(ellipse at 50% 0%,rgba(110,168,220,0.06),transparent 60%)"
    : "linear-gradient(180deg,#ffffff 0%,#f6f8fb 100%)";
  const cardBg = isDarkMode ? "#1e2a3d" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.09)" : "#e4e7ec";
  const textPrimary = isDarkMode ? "#e2e8f4" : "#172033";
  const textMuted = isDarkMode ? "#94a3b8" : "#667085";
  const stepperLine = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(148,163,184,0.3)";
  const stepperDotIdle = isDarkMode ? "#334155" : "#cbd5e1";

  return (
    <div
      className={`${mode === "screen" ? "fixed inset-0 z-[100000]" : "relative"} isolate overflow-hidden ${rootHeight} ${className}`}
      style={{ background: bg, color: textPrimary }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: gradientBg }} />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-[0.15]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md items-center justify-center px-6 py-10">
        <div className={`flex flex-col items-center text-center ${isCompact ? "gap-5" : "gap-7"}`}>

          {/* ── Icon ── */}
          <div
            className="relative flex items-center justify-center rounded-2xl"
            style={{
              width: isCompact ? 52 : 64,
              height: isCompact ? 52 : 64,
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
            }}
          >
            {/* Single clean spinning ring */}
            <div
              className="absolute inset-0 rounded-2xl border-[2px] border-transparent animate-spin"
              style={{
                borderTopColor: "#1d4e89",
                borderRightColor: "rgba(29,78,137,0.25)",
                animationDuration: "1.1s",
                animationTimingFunction: "linear",
              }}
            />
            {/* AI label + staggered dots */}
            <div className="relative flex flex-col items-center gap-1.5">
              <span className="supporthr-mono text-[9px] font-bold uppercase tracking-[0.28em] text-[#1d4e89]">
                AI
              </span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1 w-1 rounded-full bg-[#1d4e89] animate-pulse"
                    style={{ animationDelay: `${i * 0.22}s`, animationDuration: "1.3s" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Text ── */}
          <div>
            <p className="supporthr-mono mb-2 text-[10px] uppercase tracking-[0.28em] text-[#1d4e89]">
              {label}
            </p>
            <h2
              className={`font-bold tracking-[-0.02em] ${isCompact ? "text-[20px]" : "text-[23px]"}`}
              style={{ color: textPrimary }}
            >
              {resolvedTitle}
            </h2>
            {description && (
              <p
                className="mx-auto mt-3 max-w-[260px] text-[13px] leading-relaxed"
                style={{ color: textMuted }}
              >
                {description}
              </p>
            )}
          </div>

          {/* ── Step indicator — horizontal dots + lines ── */}
          {stages.length > 0 && (
            <div className="flex items-start">
              {stages.map((stage, i) => {
                const isActive = resolvedActiveIndex === i;
                const isDone = resolvedActiveIndex > i;
                return (
                  <React.Fragment key={stage.label}>
                    <div
                      className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${
                        isActive ? "opacity-100" : "opacity-35"
                      }`}
                    >
                      <div
                        className={`rounded-full transition-all duration-500 ${isActive ? "h-2.5 w-2.5" : "h-2 w-2"}`}
                        style={{
                          background: isActive
                            ? "#1d4e89"
                            : isDone
                              ? "#17915f"
                              : stepperDotIdle,
                          boxShadow: "none",
                        }}
                      />
                      <p
                        className="text-[11px] font-semibold"
                        style={{ color: isActive ? textPrimary : textMuted }}
                      >
                        {stage.label}
                      </p>
                    </div>
                    {i < stages.length - 1 && (
                      <div
                        className="mx-4 mt-[5px] h-px w-10 flex-shrink-0"
                        style={{ background: stepperLine }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
