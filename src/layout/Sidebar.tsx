import React from 'react';
import {
  BarChart3,
  BookOpenText,
  Brain,
  FileText,
  MessageSquare,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from 'lucide-react';
import type { AppStep } from '@/types';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';

interface SidebarProps {
  activeStep: AppStep;
  setActiveStep: (step: AppStep) => void;
  completedSteps: AppStep[];
  onReset: () => void;
  onLogout?: () => void;
  userEmail?: string;
  userAvatar?: string | null;
  userName?: string;
  onLoginRequest?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onShowSettings?: () => void;
  onOpenSettingsPanel?: () => void;
  onShowHistory?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewSession?: () => void;
}

type ActionRowProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  compact?: boolean;
};

type StepItem = {
  step: AppStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
};

const PROCESS_ITEMS: StepItem[] = [
  { step: 'jd', title: 'Nạp JD', subtitle: 'Nhập mô tả công việc', icon: FileText },
  { step: 'upload', title: 'Nạp CV', subtitle: 'Tải hồ sơ ứng viên', icon: UploadCloud },
  { step: 'weights', title: 'Thiết lập tiêu chí', subtitle: 'Trọng số và bộ lọc', icon: SlidersHorizontal },
  { step: 'analysis', title: 'Phân tích AI', subtitle: 'Kết quả sàng lọc', icon: Sparkles },
];

const TOOL_ITEMS: StepItem[] = [
  { step: 'dashboard', title: 'Thống kê chi tiết', subtitle: 'Bảng điều khiển phân tích', icon: BarChart3 },
  { step: 'chatbot', title: 'Chatbot tư vấn', subtitle: 'Trợ lý tuyển dụng', icon: MessageSquare },
  { step: 'feedback', title: 'Đánh giá phần mềm', subtitle: 'Hiệu chỉnh đánh giá', icon: Brain },
];

function isStepEnabled(step: AppStep, completedSteps: AppStep[]): boolean {
  if (step === 'home') return true;
  if (step === 'jd' || step === 'records' || step === 'jd-standardizer') return true;
  if (step === 'upload') return completedSteps.includes('jd');
  if (step === 'weights') return completedSteps.includes('jd') && completedSteps.includes('upload');
  if (step === 'analysis') {
    return completedSteps.includes('jd') && completedSteps.includes('upload') && completedSteps.includes('weights');
  }
  if (step === 'dashboard' || step === 'chatbot' || step === 'feedback') {
    return completedSteps.includes('analysis');
  }
  return true;
}

function SectionHeader({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-1.5 ${compact ? 'pb-1 pt-2' : 'pb-1.5 pt-3'}`}>
      <span className={`font-medium uppercase tracking-[0.12em] text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        {title}
      </span>
    </div>
  );
}

function RowButton({
  title,
  subtitle,
  icon: Icon,
  onClick,
  active,
  disabled,
  compact = false,
}: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center text-left transition ${
        compact ? 'gap-2 rounded-lg px-1.5 py-1.5' : 'gap-2.5 rounded-lg px-2 py-2'
      } ${
        active
          ? 'bg-white text-slate-950 shadow-sm ring-1 ring-blue-200'
          : disabled
            ? 'cursor-not-allowed text-slate-300'
            : 'text-slate-800 hover:bg-white hover:text-slate-950'
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg border transition ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        } ${
          active
            ? 'border-blue-100 bg-blue-50 text-blue-600'
            : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-700'
        }`}
      >
        <Icon size={compact ? 13 : 14} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-medium ${compact ? 'text-[12px] leading-4' : 'text-[13px] leading-4'}`}>{title}</span>
        {subtitle ? (
          <span className={`block truncate text-slate-500 ${compact ? 'text-[10px] leading-4' : 'text-[11px] leading-4'}`}>{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

function TemplateSection({
  title,
  items,
  activeStep,
  completedSteps,
  onStepClick,
  compact = false,
}: {
  title: string;
  items: StepItem[];
  activeStep: AppStep;
  completedSteps: AppStep[];
  onStepClick: (step: AppStep) => void;
  compact?: boolean;
}) {
  return (
    <section>
      {title ? <SectionHeader title={title} compact={compact} /> : null}
      <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
        {items.map((item) => (
          <RowButton
            key={item.step}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            active={activeStep === item.step}
            disabled={!isStepEnabled(item.step, completedSteps)}
            compact={compact}
            onClick={() => onStepClick(item.step)}
          />
        ))}
      </div>
    </section>
  );
}

const Sidebar: React.FC<SidebarProps> = ({
  activeStep,
  setActiveStep,
  completedSteps,
  onReset,
  isOpen = true,
  onClose,
  onShowSettings,
  onOpenSettingsPanel,
  onNewSession,
}) => {
  const { settings } = useUserSettings();
  const compact = settings.ui.sidebarDensity === 'compact';

  const handleClick = (step: AppStep) => {
    if (!isStepEnabled(step, completedSteps)) return;
    setActiveStep(step);
    if (window.innerWidth < 1024) onClose?.();
  };

  const handleNewSession = () => {
    if (onNewSession) onNewSession();
    else onReset();
    if (window.innerWidth < 1024) onClose?.();
  };

  const quickActions: ActionRowProps[] = [
    {
      title: 'Phiên mới',
      subtitle: 'Bắt đầu lại',
      icon: Plus,
      onClick: handleNewSession,
      compact,
    },
    {
      title: 'Mẫu JD',
      subtitle: 'Xem template',
      icon: WandSparkles,
      onClick: () => {
        onShowSettings?.();
        if (window.innerWidth < 1024) onClose?.();
      },
      compact,
    },
    {
      title: 'Thư viện CV',
      subtitle: 'Hồ sơ đã lọc',
      icon: BookOpenText,
      onClick: () => handleClick('records'),
      compact,
    },
  ];

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="cv-sidebar"
        className={`supporthr-sidebar supporthr-codex-sidebar fixed left-0 top-0 z-50 flex h-screen w-[320px] flex-col border-r border-slate-200 bg-[#f4f4f2] text-slate-900 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-0 pb-2 pt-3">
          <div className="space-y-1">
            {quickActions.map((item) => (
              <RowButton key={item.title} {...item} />
            ))}
          </div>

          <SectionHeader title="Pinned" compact />
          <TemplateSection
            title=""
            items={PROCESS_ITEMS}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={handleClick}
            compact={compact}
          />

          <SectionHeader title="Tools" compact />
          <TemplateSection
            title=""
            items={TOOL_ITEMS}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={handleClick}
            compact={compact}
          />
        </div>

        <div className="border-t border-slate-200 p-2.5">
          <button
            type="button"
            onClick={() => {
              onOpenSettingsPanel?.();
              if (window.innerWidth < 1024) onClose?.();
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Settings"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                <Settings size={15} />
              </span>
              <span className="min-w-0 truncate text-[14px] font-medium text-slate-950">Settings</span>
            </span>
            <span className="text-[10px] font-medium text-slate-500">Ctrl+,</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
