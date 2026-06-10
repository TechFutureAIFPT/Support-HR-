import React from "react";
import type { AppStep } from '@/types';

interface MobileBottomNavProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
  onNavigate: (step: AppStep) => void;
}

type NavItem = {
  step: AppStep;
  label: string;
  iconClass: string;
};

const items: NavItem[] = [
  { step: "jd", label: "JD", iconClass: "fa-solid fa-file-lines" },
  { step: "upload", label: "Hồ sơ", iconClass: "fa-solid fa-upload" },
  { step: "weights", label: "Mặc định", iconClass: "fa-solid fa-sliders" },
  { step: "analysis", label: "Phân tích", iconClass: "fa-solid fa-chart-line" },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeStep,
  completedSteps,
  onNavigate,
}) => {
  const isEnabled = (step: AppStep) => {
    if (step === "jd") return true;
    if (step === "upload") return completedSteps.includes("jd");
    if (step === "weights") return completedSteps.includes("jd") && completedSteps.includes("upload");
    if (step === "analysis")
      return (
        completedSteps.includes("jd") &&
        completedSteps.includes("upload") &&
        completedSteps.includes("weights")
      );
    return true;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-35 opacity-100">
      <div
        className="mx-2 mb-2 rounded-2xl border border-blue-100 bg-white/95 shadow-[0_18px_48px_rgba(37,99,235,0.14)] backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-between h-16 px-2">
          {items.map((item) => {
            const enabled = isEnabled(item.step);
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => enabled && onNavigate(item.step)}
                disabled={!enabled}
                className={`flex flex-col items-center justify-center flex-1 border transition-all duration-200 ${
                  isActive
                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-[0_8px_22px_rgba(37,99,235,0.12)]"
                    : "text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-transparent"
                } ${!enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={item.label}
              >
                <i className={`${item.iconClass} text-lg`} />
                <span className="text-[10px] font-semibold mt-1 leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
