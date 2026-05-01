/**
 * Sidebar — Professional HR Platform (Dark + Light Theme)
 * Theme-aware: dùng useTheme() để tự động switch palette
 */
import React, { useState } from 'react';
import {
  Briefcase, SlidersHorizontal, Upload, Sparkles,
  PieChart, MessageSquare, LogOut, ChevronDown, UserCheck, FileText, Brain
} from 'lucide-react';
import type { AppStep } from '../../assets/types';
import { DarkThemeToggle } from '../ui/theme/dark/ThemeToggle.tsx';
import { useTheme } from '../ui/theme/ThemeProvider.tsx';

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

// ── Theme-aware palette hook ───────────────────────────────────────────
function useColors() {
  const { isDarkMode } = useTheme();
  return isDarkMode ? {
    bg:         '#0B1120',
    bg2:        '#0f172a',
    bg3:        '#1e293b',
    bg4:        '#111827',
    border:     '#1e293b',
    border2:    '#334155',
    text:       '#e2e8f0',
    text2:      '#94a3b8',
    text3:      '#475569',
    accentBlue: '#60a5fa',
    accent:     '#818cf8',
    headerGradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
    headerBorderBottom: '1px solid rgba(255,255,255,0.06)',
    logoBg:     'bg-black/30',
    logoBorder: 'border-white/20',
    aiBadgeBg:  'rgba(255,255,255,0.15)',
    aiBadgeColor: '#bae6fd',
    subTextColor: 'rgba(255,255,255,0.55)',
    navHover:   'hover:bg-white/5',
    iconBg:     'rgba(255,255,255,0.04)',
    iconBorder: '1px solid rgba(255,255,255,0.06)',
    sectionDivider: 'to-slate-800/60',
    progressTrack: 'rgba(255,255,255,0.06)',
    accountBg: 'rgba(255,255,255,0.03)',
    accountBorder: 'rgba(255,255,255,0.08)',
    onlineDot: 'bg-blue-400',
    proBadgeBg: 'rgba(59,130,246,0.15)',
    proBadgeColor: '#60a5fa',
    loginGrad:  'linear-gradient(135deg, #3b82f6, #2563eb)',
    loginShadow: '0 4px 12px rgba(59,130,246,0.3)',
  } : {
    bg:         '#ffffff',
    bg2:        '#f8faff',
    bg3:        '#eef2ff',
    bg4:        '#f0f4ff',
    border:     '#e0e7ff',
    border2:    '#c7d2fe',
    text:       '#1e293b',
    text2:      '#475569',
    text3:      '#94a3b8',
    accentBlue: '#4f46e5',
    accent:     '#6366f1',
    headerGradient: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
    headerBorderBottom: '1px solid rgba(99,102,241,0.12)',
    logoBg:     'bg-indigo-50',
    logoBorder: 'border-indigo-200',
    aiBadgeBg:  'rgba(99,102,241,0.12)',
    aiBadgeColor: '#4338ca',
    subTextColor: '#64748b',
    navHover:   'hover:bg-indigo-50',
    iconBg:     'rgba(99,102,241,0.04)',
    iconBorder: '1px solid rgba(99,102,241,0.1)',
    sectionDivider: 'to-indigo-200/40',
    progressTrack: 'rgba(99,102,241,0.08)',
    accountBg: 'rgba(99,102,241,0.03)',
    accountBorder: 'rgba(99,102,241,0.12)',
    onlineDot: 'bg-indigo-500',
    proBadgeBg: 'rgba(79,70,229,0.1)',
    proBadgeColor: '#4f46e5',
    loginGrad:  'linear-gradient(135deg, #4f46e5, #6366f1)',
    loginShadow: '0 4px 12px rgba(79,70,229,0.3)',
  };
}

// ── Step definitions ───────────────────────────────────────────────────────
const PROCESS_STEPS: Array<{
  key: AppStep; label: string; sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string; bgActive: string;
}> = [
  { key: 'jd',       label: 'Mô tả công việc', sub: 'Nhập JD · Bước 1',
    icon: Briefcase,         color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },
  { key: 'weights',  label: 'Trọng số & Bộ lọc', sub: 'Thiết lập · Bước 2',
    icon: SlidersHorizontal, color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },
  { key: 'analysis', label: 'Phân tích AI', sub: 'Xử lý · Bước 3',
    icon: Sparkles,          color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },
];

const TOOL_ITEMS: Array<{
  key: AppStep; label: string; sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string; bgActive: string;
}> = [
  { key: 'dashboard', label: 'Thống kê chi tiết', sub: 'Analytics Dashboard',
    icon: PieChart,      color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },
  { key: 'chatbot',    label: 'Gợi ý ứng viên AI',  sub: 'AI Recruitment Assistant',
    icon: MessageSquare, color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },
  { key: 'feedback',   label: 'Huấn luyện AI', sub: 'AI Feedback & Training',
    icon: Brain,         color: '#f43f5e', bgActive: 'rgba(244,63,94,0.1)' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const isStepEnabled = (step: AppStep, completedSteps: AppStep[]): boolean => {
  if (step === 'jd') return true;
  if (step === 'weights') return completedSteps.includes('jd');
  if (step === 'analysis') return completedSteps.includes('jd') && completedSteps.includes('weights');
  if (step === 'dashboard' || step === 'chatbot' || step === 'feedback') return completedSteps.includes('analysis');
  return false;
};

// ── Sub-components ─────────────────────────────────────────────────────────
const SectionLabel = ({ label, C }: { label: string; C: ReturnType<typeof useColors> }) => (
  <div className="flex items-center gap-2.5 px-3 pt-4 pb-1.5">
    <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${C.sectionDivider}`} />
    <span className="text-[9px] font-bold uppercase tracking-[0.14em] whitespace-nowrap" style={{ color: C.text3 }}>
      {label}
    </span>
    <div className={`h-px flex-1 bg-gradient-to-l from-transparent ${C.sectionDivider}`} />
  </div>
);

const NavItem = ({
  item, activeStep, completedSteps, onClick, C,
}: {
  item: (typeof PROCESS_STEPS)[number] | (typeof TOOL_ITEMS)[number];
  activeStep: AppStep;
  completedSteps: AppStep[];
  onClick: () => void;
  C: ReturnType<typeof useColors>;
}) => {
  const isActive  = activeStep === item.key;
  const isDone    = completedSteps.includes(item.key);
  const isEnabled = isStepEnabled(item.key, completedSteps);
  const Icon      = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      className={`
        relative w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 text-left
        ${isActive
          ? ''
          : isEnabled
            ? C.navHover
            : 'opacity-35 cursor-not-allowed'
        }
      `}
    >
      {/* Active background card */}
      {isActive && (
        <div
          className="absolute inset-0"
          style={{
            background: item.bgActive,
            border: `1px solid ${item.color}25`,
            boxShadow: `0 0 16px ${item.color}12`,
          }}
        />
      )}

      {/* Left accent bar */}
      {isActive && (
        <div
          className="absolute left-0 top-2.5 bottom-2.5 w-[3px]"
          style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}60)` }}
        />
      )}

      {/* Icon */}
      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center transition-all duration-200"
        style={{
          background: isActive ? `${item.color}15` : C.iconBg,
          border: isActive ? `1px solid ${item.color}30` : C.iconBorder,
        }}
      >
        <span style={{ color: isActive ? item.color : isEnabled ? C.text2 : C.text3 }}>
          <Icon size={17} />
        </span>
      </div>

      {/* Label */}
      <div className="relative min-w-0 flex-1">
        <p className="text-[12px] font-semibold leading-tight" style={{
          color: isActive ? C.text : isEnabled ? C.text2 : C.text3,
        }}>
          {item.label}
        </p>
        <p className="text-[10px] leading-tight mt-0.5" style={{ color: isActive ? item.color : C.text3 }}>
          {item.sub}
        </p>
      </div>

      {/* Done checkmark */}
      {isDone && !isActive && (
        <div
          className="relative flex h-5 w-5 shrink-0 items-center justify-center"
          style={{ background: `${item.color}15` }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke={item.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {isActive && (
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center" style={{ background: `${item.color}20` }}>
          <div className="h-1.5 w-1.5" style={{ background: item.color }} />
        </div>
      )}
    </button>
  );
};

const StepProgress = ({ completedSteps, C }: { completedSteps: AppStep[]; C: ReturnType<typeof useColors> }) => {
  const total = PROCESS_STEPS.length;
  const done  = PROCESS_STEPS.filter(s => completedSteps.includes(s.key)).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold" style={{ color: C.text3 }}>Tiến độ</span>
        <span className="text-[10px] font-bold" style={{ color: pct === 100 ? '#34d399' : C.accentBlue }}>
          {pct === 100 ? 'Hoàn tất!' : `${done}/${total} bước`}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden" style={{ background: C.progressTrack }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #3B82F6, #60a5fa)',
          }}
        />
      </div>
    </div>
  );
};

// ── Account Panel ──────────────────────────────────────────────────────────
const AccountPanel: React.FC<{
  completedSteps: AppStep[];
  userEmail?: string;
  userAvatar?: string | null;
  userName?: string;
  onLogout?: () => void;
  onLoginRequest?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
  C: ReturnType<typeof useColors>;
}> = ({ completedSteps, userEmail, userAvatar: avatar, userName: name, onLogout, onLoginRequest, onShowSettings, onShowHistory, C }) => {
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localName, setLocalName]     = useState<string>('');

  const effectiveAvatar = (avatar !== undefined && avatar !== null) ? avatar : localAvatar;
  const effectiveName   = (name !== undefined && name !== '') ? name : localName;
  const analysisDone    = completedSteps.includes('analysis');

  React.useEffect(() => {
    // Load từ Firebase nếu: có email, và avatar chưa được cung cấp (undefined hoặc null) HOẶC name chưa có
    const needsAvatarLoad = avatar === undefined || avatar === null;
    const needsNameLoad   = name === undefined || name === '';
    if (!userEmail || (!needsAvatarLoad && !needsNameLoad)) return;
    (async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { auth }               = await import('../../services/firebase');
        const { UserProfileService }  = await import('../../services/data-sync/userProfileService');
        const unsub = onAuthStateChanged(auth, async (user) => {
          if (user && user.email === userEmail) {
            if (needsNameLoad) {
              setLocalName(user.displayName || userEmail.split('@')[0]);
            }
            if (needsAvatarLoad) {
              // Ưu tiên: Firebase photoURL → Firestore avatar → localStorage cache
              if (user.photoURL) {
                setLocalAvatar(user.photoURL);
              } else {
                const profile = await UserProfileService.getUserProfile(user.uid);
                if (profile?.avatar) {
                  setLocalAvatar(profile.avatar);
                } else {
                  // fallback localStorage (lưu bởi Navbar với key avatar_${email})
                  const cached = localStorage.getItem(`avatar_${userEmail}`);
                  if (cached) setLocalAvatar(cached);
                }
              }
            }
          }
        });
        return () => unsub();
      } catch { /* ignore */ }
    })();
  }, [userEmail, avatar, name]);

  const getInitials = (n: string) => {
    const p = n.trim().split(' ');
    return p.length >= 2
      ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
      : n.charAt(0).toUpperCase();
  };

  const getAvatarGradient = (email: string) => {
    const grads = [
      'from-blue-600 to-indigo-700', 'from-blue-700 to-indigo-800',
      'from-blue-500 to-indigo-600', 'from-blue-800 to-indigo-900',
      'from-indigo-600 to-blue-700',
    ];
    return grads[email.charCodeAt(0) % grads.length];
  };

  if (!userEmail) {
    return onLoginRequest ? (
      <div className="border p-3" style={{
        background: C.accountBg,
        borderColor: C.accountBorder,
      }}>
        <StepProgress completedSteps={completedSteps} C={C} />
        <button
          type="button"
          onClick={onLoginRequest}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.99]"
          style={{
            background: C.loginGrad,
            boxShadow: C.loginShadow,
          }}
        >
          <i className="fa-solid fa-right-to-bracket text-[11px]" />
          Đăng nhập ngay
        </button>
      </div>
    ) : null;
  }

  return (
    <div
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all"
      style={{ background: C.accountBg }}
    >
      {/* Avatar */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border rounded-md`}
           style={{ borderColor: C.accountBorder }}>
        {effectiveAvatar ? (
          <img src={effectiveAvatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getAvatarGradient(userEmail)} text-white text-xs font-black`}>
            {getInitials(effectiveName || userEmail)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold leading-tight" style={{ color: C.text }}>
          {effectiveName || userEmail.split('@')[0]}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${C.onlineDot}`} />
            <span className="text-[9px] font-medium" style={{ color: C.text3 }}>Online</span>
          </span>
          {analysisDone && (
            <span
              className="px-1.5 py-px text-[8px] font-bold rounded-sm"
              style={{ background: C.proBadgeBg, color: C.proBadgeColor }}
            >
              HR Pro
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onShowSettings && (
          <button
            type="button"
            title="Mẫu JD & Lịch sử"
            onClick={(e) => { e.stopPropagation(); onShowSettings(); }}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-all"
            style={{ color: C.text2 }}
          >
            <FileText size={15} strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          title="Đăng xuất"
          onClick={(e) => { e.stopPropagation(); onLogout?.(); }}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-all hover:text-red-400"
          style={{ color: C.text2 }}
        >
          <LogOut size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// ── Main Sidebar ────────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({
  activeStep, setActiveStep, completedSteps, onReset, onLogout,
  userEmail, userAvatar: externalAvatar, userName: externalUserName,
  onLoginRequest, isOpen = true, onClose, onShowSettings, onShowHistory,
}) => {
  const C = useColors();
  const handleClick = (step: AppStep) => {
    if (isStepEnabled(step, completedSteps)) setActiveStep(step);
    if (window.innerWidth < 768 && onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        id="cv-sidebar"
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-[248px] flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center gap-2.5 px-3 py-3"
          style={{
            background: C.headerGradient,
            borderBottom: C.headerBorderBottom,
          }}
        >
          <button
            onClick={() => handleClick('jd')}
            className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border ${C.logoBorder} ${C.logoBg} shadow-sm transition-transform hover:scale-105`}
          >
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="h-full w-full object-cover" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight leading-none" style={{ color: C.text }}>SupportHR</h1>
              <span
                className="px-1.5 py-px text-[8px] font-black uppercase tracking-wide"
                style={{ background: C.aiBadgeBg, color: C.aiBadgeColor }}
              >
                AI
              </span>
            </div>
            <p className="mt-0.5 text-[9px] font-medium leading-none" style={{ color: C.subTextColor }}>
              Recruitment Intelligence
            </p>
          </div>
          {/* Theme toggle — góc phải header */}
          <div className="ml-auto shrink-0">
            <DarkThemeToggle variant="icon" size="sm" />
          </div>
        </div>

        {/* ── Nav ────────────────────────────────────────────── */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-2 custom-scrollbar">
          <SectionLabel label="Quy trình phân tích" C={C} />
          <div className="space-y-0.5">
            {PROCESS_STEPS.map(item => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
                C={C}
              />
            ))}
          </div>

          <SectionLabel label="Công cụ hỗ trợ" C={C} />
          <div className="space-y-0.5">
            {TOOL_ITEMS.map(item => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
                C={C}
              />
            ))}
          </div>
        </nav>

        {/* ── Account ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t" style={{ borderColor: C.border }}>
          <AccountPanel
            completedSteps={completedSteps}
            userEmail={userEmail}
            userAvatar={externalAvatar}
            userName={externalUserName}
            onLogout={onLogout}
            onLoginRequest={onLoginRequest}
            onShowSettings={onShowSettings}
            onShowHistory={onShowHistory}
            C={C}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
