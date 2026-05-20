/**
 * ProgressBar (Step Indicator) — Chỉ hỗ trợ Dark Mode
 */
import React from 'react';
import type { AppStep } from '@/types';

interface ProgressBarProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ activeStep, completedSteps }) => {
  const steps = [
    { key: 'jd' as AppStep, label: 'JD', icon: 'fa-clipboard-list' },
    { key: 'weights' as AppStep, label: 'Trọng số', icon: 'fa-sliders' },
    { key: 'analysis' as AppStep, label: 'AI', icon: 'fa-rocket' },
  ];

  const getStepIndex = (step: AppStep): number => steps.findIndex(s => s.key === step);
  const activeIndex = getStepIndex(activeStep);
  const progress = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="md:hidden w-full mb-4 px-2 mt-2">
      <div className="border border-white/10 bg-black/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 -z-10 bg-slate-700" />

          {/* Active progress line */}
          <div
            className="absolute top-4 left-0 h-0.5 transition-all duration-500 ease-out -z-10 bg-gradient-to-r from-[#f5d6bb] to-[#ffd8a8]"
            style={{ width: `${progress}%` }}
          />

          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            const isActive = activeStep === step.key;

            const circleClass = isActive
              ? 'bg-black border-2 border-[#f5d6bb] text-[#f5d6bb] shadow-[0_0_10px_rgba(245,214,187,0.24)] scale-110'
              : isCompleted
                ? 'bg-black border-2 border-[#f5d6bb]/50 text-[#f5d6bb]'
                : 'bg-slate-800 border-2 border-slate-700 text-slate-500';

            const textClass = isActive
              ? 'text-[#f5d6bb] font-bold'
              : isCompleted
                ? 'text-[#f5d6bb]/80 font-medium'
                : 'text-slate-500';

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10 group cursor-default">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs
                  transition-all duration-300
                  ${circleClass}
                  ${isActive ? 'animate-pulse' : ''}
                `}>
                  <i className={`fa-solid ${step.icon}`} />
                </div>
                <span className={`text-[10px] mt-1.5 transition-colors duration-300 ${textClass}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
