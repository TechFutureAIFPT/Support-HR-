import React from 'react';
import type { AppStep } from '@/types';

interface ProgressBarProps {
  activeStep: AppStep;
  completedSteps: AppStep[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ activeStep, completedSteps }) => {
  const steps = [
    { key: 'jd' as AppStep, label: 'JD', icon: 'fa-clipboard-list' },
    { key: 'upload' as AppStep, label: 'Hồ sơ', icon: 'fa-upload' },
    { key: 'weights' as AppStep, label: 'Mặc định', icon: 'fa-sliders' },
    { key: 'analysis' as AppStep, label: 'AI', icon: 'fa-rocket' },
  ];

  const getStepIndex = (step: AppStep): number => steps.findIndex((item) => item.key === step);
  const activeIndex = getStepIndex(activeStep);
  const progress = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="mb-4 mt-2 w-full px-2 md:hidden">
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_36px_rgba(30,64,175,0.1)] backdrop-blur-md">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-4 -z-10 h-0.5 bg-blue-100" />
          <div
            className="absolute left-0 top-4 -z-10 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />

          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            const isActive = activeStep === step.key;

            const circleClass = isActive
              ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-[0_8px_20px_rgba(35,136,255,0.18)] scale-110'
              : isCompleted
                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                : 'border-blue-100 bg-white text-slate-400';

            const textClass = isActive
              ? 'text-blue-700 font-bold'
              : isCompleted
                ? 'text-emerald-600 font-medium'
                : 'text-slate-500';

            return (
              <div key={step.key} className="group relative z-10 flex cursor-default flex-col items-center">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs
                    transition-all duration-300
                    ${circleClass}
                    ${isActive ? 'animate-pulse' : ''}
                  `}
                >
                  <i className={`fa-solid ${step.icon}`} />
                </div>
                <span className={`mt-1.5 text-[10px] transition-colors duration-300 ${textClass}`}>
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
