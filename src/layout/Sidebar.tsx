import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpenText,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  History,
  LogOut,
  MessageSquare,
  PanelLeft,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import type { AppStep } from '@/types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { UserProfileService } from '@/services/data-sync/userProfileService';

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
  onShowHistory?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewSession?: () => void;
}

type NavConfig = {
  key: AppStep;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
};

const PROCESS_STEPS: NavConfig[] = [
  { key: 'jd', label: 'Nạp JD & CV', sub: 'Tài liệu đầu vào', icon: UploadCloud },
  { key: 'weights', label: 'Thiết lập tiêu chí', sub: 'Trọng số và bộ lọc', icon: SlidersHorizontal },
  { key: 'analysis', label: 'Phân tích AI', sub: 'Kết quả sàng lọc', icon: Sparkles },
];

const TOOL_ITEMS: NavConfig[] = [
  { key: 'dashboard', label: 'Thống kê', sub: 'Dashboard phân tích', icon: BarChart3 },
  { key: 'chatbot', label: 'Gợi ý ứng viên', sub: 'Trợ lý tuyển dụng', icon: MessageSquare },
  { key: 'feedback', label: 'Phản hồi AI', sub: 'Hiệu chỉnh đánh giá', icon: Brain },
];

const SUPPORT_ITEMS: NavConfig[] = [
  { key: 'records', label: 'Thư viện CV', sub: 'Hồ sơ đã lọc', icon: BookOpenText },
  { key: 'jd-standardizer', label: 'Chuẩn hóa JD', sub: 'Công cụ soạn JD', icon: FileText },
];

function isStepEnabled(step: AppStep, completedSteps: AppStep[]): boolean {
  if (step === 'jd') return true;
  if (step === 'upload') return completedSteps.includes('jd');
  if (step === 'weights') return completedSteps.includes('jd') && completedSteps.includes('upload');
  if (step === 'analysis') return completedSteps.includes('jd') && completedSteps.includes('upload') && completedSteps.includes('weights');
  if (step === 'records' || step === 'jd-standardizer') return true;
  if (step === 'dashboard' || step === 'chatbot' || step === 'feedback') return completedSteps.includes('analysis');
  return false;
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'HR';
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </div>
  );
}

function NavItem({
  item,
  activeStep,
  completedSteps,
  onClick,
}: {
  item: NavConfig;
  activeStep: AppStep;
  completedSteps: AppStep[];
  onClick: () => void;
}) {
  const isCombinedUploadStep = item.key === 'jd';
  const isActive = activeStep === item.key || (isCombinedUploadStep && activeStep === 'upload');
  const isDone = isCombinedUploadStep
    ? completedSteps.includes('jd') && completedSteps.includes('upload')
    : completedSteps.includes(item.key);
  const isEnabled = isStepEnabled(item.key, completedSteps);
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      className={`group flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
        isActive
          ? 'border-slate-300 bg-white text-slate-950 shadow-sm'
          : isEnabled
            ? 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950'
            : 'cursor-not-allowed border-transparent text-slate-300'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
          isActive
            ? 'border-slate-300 bg-slate-950 text-white'
            : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-900'
        }`}
      >
        <Icon size={15} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-5">{item.label}</span>
        <span className="block truncate text-[11px] leading-4 text-slate-400">{item.sub}</span>
      </span>
      {isDone ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
          <Check size={12} strokeWidth={2.7} />
        </span>
      ) : (
        <ChevronRight size={14} className={isActive ? 'text-slate-500' : 'text-slate-300'} />
      )}
    </button>
  );
}

function AccountPanel({
  userEmail,
  userAvatar,
  userName,
  onLoginRequest,
  onLogout,
  onShowSettings,
  onShowHistory,
}: {
  userEmail?: string;
  userAvatar?: string | null;
  userName?: string;
  onLoginRequest?: () => void;
  onLogout?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
}) {
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localName, setLocalName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const needsAvatarLoad = userAvatar === undefined || userAvatar === null;
    const needsNameLoad = !userName;
    if (!userEmail || (!needsAvatarLoad && !needsNameLoad)) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== userEmail) return;

      if (needsNameLoad) {
        setLocalName(user.displayName || userEmail.split('@')[0]);
      }

      if (!needsAvatarLoad) return;
      if (user.photoURL) {
        setLocalAvatar(user.photoURL);
        return;
      }

      try {
        const profile = await UserProfileService.getUserProfile(user.uid);
        setLocalAvatar(profile?.avatar || localStorage.getItem(`avatar_${userEmail}`));
      } catch {
        setLocalAvatar(localStorage.getItem(`avatar_${userEmail}`));
      }
    });

    return () => unsubscribe();
  }, [userAvatar, userEmail, userName]);

  if (!userEmail) {
    return (
      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onLoginRequest}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  const label = userName || localName || userEmail.split('@')[0];
  const avatar = userAvatar || localAvatar;

  return (
    <div className="relative border-t border-slate-200 p-3">
      {menuOpen && (
        <div className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-30 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onShowSettings?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-100"
          >
            <Settings size={14} />
            Mẫu JD
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onShowHistory?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-100"
          >
            <History size={14} />
            Lịch sử
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onLogout?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-slate-300"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 text-[11px] font-bold text-white">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(label)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-slate-950">{label}</span>
          <span className="block truncate text-[11px] text-slate-400">{userEmail}</span>
        </span>
        <Settings size={15} className="text-slate-400" />
      </button>
    </div>
  );
}

const Sidebar: React.FC<SidebarProps> = ({
  activeStep,
  setActiveStep,
  completedSteps,
  onReset,
  onLogout,
  userEmail,
  userAvatar,
  userName,
  onLoginRequest,
  isOpen = true,
  onClose,
  onShowSettings,
  onShowHistory,
  onNewSession,
}) => {
  const handleClick = (step: AppStep) => {
    if (isStepEnabled(step, completedSteps)) setActiveStep(step);
    if (window.innerWidth < 1024) onClose?.();
  };

  const handleNewSession = () => {
    if (onNewSession) {
      onNewSession();
    } else {
      onReset();
    }
    if (window.innerWidth < 1024) onClose?.();
  };

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="cv-sidebar"
        className={`supporthr-sidebar supporthr-codex-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-[#f4f4f2] text-slate-900 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-[54px] shrink-0 items-center gap-2 border-b border-slate-200 px-3">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-5 text-slate-950">Support HR</p>
            <p className="truncate text-[11px] text-slate-500">Recruiting workspace</p>
          </div>
          <button
            type="button"
            onClick={handleNewSession}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            aria-label="Tạo phiên mới"
            title="Tạo phiên mới"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-white">
            <PanelLeft size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-800">Workspace</p>
            <p className="truncate text-[11px] text-slate-500">{completedSteps.length}/4 bước đã hoàn tất</p>
          </div>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <SectionLabel>Quy trình</SectionLabel>
          <div className="space-y-1">
            {PROCESS_STEPS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
              />
            ))}
          </div>

          <SectionLabel>Công cụ</SectionLabel>
          <div className="space-y-1">
            {TOOL_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
              />
            ))}
          </div>

          <SectionLabel>Thư viện</SectionLabel>
          <div className="space-y-1">
            {SUPPORT_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-3 py-2">
          <button
            type="button"
            onClick={onShowHistory}
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-[12px] font-medium text-slate-600 hover:bg-white hover:text-slate-950"
          >
            <Clock3 size={15} />
            Lịch sử hoạt động
          </button>
        </div>

        <AccountPanel
          userEmail={userEmail}
          userAvatar={userAvatar}
          userName={userName}
          onLoginRequest={onLoginRequest}
          onLogout={onLogout}
          onShowSettings={onShowSettings}
          onShowHistory={onShowHistory}
        />
      </aside>
    </>
  );
};

export default Sidebar;
