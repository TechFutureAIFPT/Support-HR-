/**
 * Sidebar — Professional HR Platform (Dark + Light Theme)
 * Theme-aware: dùng useTheme() để tự động switch palette
 */
import React, { useState } from 'react';
import {
  SlidersHorizontal, Sparkles, UploadCloud,
  PieChart, MessageSquare, LogOut, FileText, Brain, Settings, Clock3,
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

// ── Theme-aware palette hook ───────────────────────────────────────────
function useColors() {
  return {
    bg:         'linear-gradient(180deg, #eaf4ff 0%, #dfeeff 100%)',
    bg2:        '#e4f1ff',
    bg3:        '#d8eaff',
    bg4:        '#d6eaff',
    border:     'rgba(35,136,255,0.26)',
    border2:    'rgba(35,136,255,0.34)',
    text:       '#102033',
    text2:      '#475569',
    text3:      '#94a3b8',
    accentBlue: '#2388ff',
    accent:     '#2388ff',
    headerGradient: 'linear-gradient(180deg, #f7fbff 0%, #e4f1ff 100%)',
    headerBorderBottom: '1px solid rgba(35,136,255,0.22)',
    logoBg:     'bg-blue-50',
    logoBorder: 'border-blue-100',
    aiBadgeBg:  'rgba(35,136,255,0.1)',
    aiBadgeColor: '#0875ee',
    subTextColor: '#64748b',
    navHover:   'hover:bg-blue-50',
    iconBg:     'rgba(35,136,255,0.06)',
    iconBorder: '1px solid rgba(35,136,255,0.12)',
    sectionDivider: 'to-blue-300/60',
    progressTrack: 'rgba(35,136,255,0.1)',
    accountBg: 'rgba(247,251,255,0.92)',
    accountBorder: 'rgba(55,125,255,0.14)',
    onlineDot: 'bg-emerald-500',
    proBadgeBg: 'rgba(35,136,255,0.1)',
    proBadgeColor: '#0875ee',
    loginGrad:  'linear-gradient(135deg, #2388ff, #4aa3ff)',
    loginShadow: '0 14px 34px rgba(35,136,255,0.18)',
  };
}

// ── Step definitions ───────────────────────────────────────────────────────
const PROCESS_STEPS: Array<{
  key: AppStep; label: string; sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string; bgActive: string;
}> = [
  { key: 'jd',       label: 'Nạp JD & CV', sub: 'Tải JD/CV · Bước 1-2',
    icon: UploadCloud,       color: '#2388ff', bgActive: 'rgba(35,136,255,0.1)' },
  { key: 'weights',  label: 'Thiết lập mặc định', sub: 'Tiêu chí & bộ lọc · Bước 3',
    icon: SlidersHorizontal, color: '#2388ff', bgActive: 'rgba(35,136,255,0.1)' },
  { key: 'analysis', label: 'Phân tích AI', sub: 'Xử lý · Bước 4',
    icon: Sparkles,          color: '#2388ff', bgActive: 'rgba(35,136,255,0.1)' },
];

const TOOL_ITEMS: Array<{
  key: AppStep; label: string; sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string; bgActive: string;
}> = [
  { key: 'dashboard', label: 'Thống kê chi tiết', sub: 'Bảng điều khiển phân tích',
    icon: PieChart,      color: '#2388ff', bgActive: 'rgba(35,136,255,0.1)' },
  { key: 'chatbot',    label: 'Gợi ý ứng viên AI',  sub: 'Trợ lý tuyển dụng AI',
    icon: MessageSquare, color: '#2388ff', bgActive: 'rgba(35,136,255,0.1)' },
  { key: 'feedback',   label: 'Phản hồi AI', sub: 'Hiệu chỉnh đánh giá',
    icon: Brain,        color: '#2388ff', bgActive: 'rgba(35,136,255,0.1)' }
];

// ── Helpers ────────────────────────────────────────────────────────────────
const isStepEnabled = (step: AppStep, completedSteps: AppStep[]): boolean => {
  if (step === 'jd') return true;
  if (step === 'upload') return completedSteps.includes('jd');
  if (step === 'weights') return completedSteps.includes('jd') && completedSteps.includes('upload');
  if (step === 'analysis') return completedSteps.includes('jd') && completedSteps.includes('upload') && completedSteps.includes('weights');
  if (step === 'records' || step === 'jd-standardizer') return true;
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
  const isCombinedUploadStep = item.key === 'jd';
  const isActive  = activeStep === item.key || (isCombinedUploadStep && activeStep === 'upload');
  const isDone    = isCombinedUploadStep
    ? completedSteps.includes('jd') && completedSteps.includes('upload')
    : completedSteps.includes(item.key);
  const isEnabled = isStepEnabled(item.key, completedSteps);
  const Icon      = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      className={`
        group relative w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200
        ${isActive
          ? 'border-blue-300 bg-blue-100 shadow-[0_10px_24px_rgba(35,136,255,0.12)]'
          : isEnabled
            ? 'border-blue-100 bg-blue-50 hover:border-blue-200 hover:bg-blue-100'
            : 'cursor-not-allowed border-blue-50 bg-blue-50/70 opacity-75'
        }
      `}
    >
      {isActive && (
        <div
          className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r-full"
          style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}60)` }}
        />
      )}

      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200"
        style={{
          background: isActive ? '#dcebff' : isEnabled ? '#e8f3ff' : '#f0f7ff',
          borderColor: isActive ? `${item.color}38` : 'rgba(55,125,255,0.18)',
        }}
      >
        <span style={{ color: isActive ? item.color : isEnabled ? C.text2 : C.text3 }}>
          <Icon size={17} />
        </span>
      </div>

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

      {isDone && !isActive && (
        <div
          className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${item.color}12` }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke={item.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {isActive && (
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${item.color}14` }}>
          <div className="h-1.5 w-1.5 rounded-sm" style={{ background: item.color }} />
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
              : 'linear-gradient(90deg, #2388ff, #22c7c8)',
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
  const [menuOpen, setMenuOpen]       = useState(false);

  const effectiveAvatar = (avatar !== undefined && avatar !== null) ? avatar : localAvatar;
  const effectiveName   = (name !== undefined && name !== '') ? name : localName;

  React.useEffect(() => {
    // Load từ Firebase nếu: có email, và avatar chưa được cung cấp (undefined hoặc null) HOẶC name chưa có
    const needsAvatarLoad = avatar === undefined || avatar === null;
    const needsNameLoad   = name === undefined || name === '';
    if (!userEmail || (!needsAvatarLoad && !needsNameLoad)) return;
    (async () => {
      try {
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
      'from-blue-500 to-cyan-500', 'from-sky-500 to-blue-600',
      'from-cyan-500 to-emerald-500', 'from-blue-600 to-indigo-500',
      'from-teal-500 to-sky-500',
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
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-black text-white transition-all hover:brightness-105 active:scale-[0.99]"
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
      className="relative w-full px-3 py-2.5 text-left transition-all"
      style={{ background: C.accountBg }}
    >
      {menuOpen && (
        <div
          className="absolute bottom-[calc(100%+0.5rem)] left-3 right-3 z-30 overflow-hidden border shadow-[0_24px_70px_rgba(0,0,0,0.62)]"
          style={{
            background: 'linear-gradient(180deg, #ffffff, #f7fbff)',
            borderColor: 'rgba(55,125,255,0.16)',
          }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onShowSettings?.();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[11px] font-bold transition-all hover:bg-blue-50"
            style={{ color: C.text }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border bg-blue-50" style={{ borderColor: 'rgba(55,125,255,0.16)', color: C.accentBlue }}>
              <FileText size={14} strokeWidth={2.4} />
            </span>
            Mẫu JD
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onShowHistory?.();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[11px] font-bold transition-all hover:bg-blue-50"
            style={{ color: C.text }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border bg-blue-50" style={{ borderColor: 'rgba(55,125,255,0.16)', color: C.accentBlue }}>
              <Clock3 size={14} strokeWidth={2.4} />
            </span>
            Lịch sử hoạt động
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onLogout?.();
            }}
            className="flex w-full items-center gap-2.5 border-t px-3 py-2.5 text-left text-[11px] font-bold transition-all hover:bg-red-500/10"
            style={{ color: '#f04468', borderColor: 'rgba(55,125,255,0.12)' }}
          >
            <span className="flex h-7 w-7 items-center justify-center border border-red-400/25 text-red-300">
              <LogOut size={14} strokeWidth={2.4} />
            </span>
            Đăng xuất
          </button>
        </div>
      )}

      <div className="flex w-full items-center gap-2.5">
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border"
          style={{ borderColor: C.accountBorder }}
        >
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
          <p className="truncate text-[13px] font-bold leading-tight" style={{ color: C.text }}>
            {effectiveName || userEmail.split('@')[0]}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${C.onlineDot}`} />
              <span className="text-[10px] font-medium" style={{ color: C.text3 }}>Trực tuyến</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          title="Cài đặt tài khoản"
          aria-label="Mở cài đặt tài khoản"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center border transition-all hover:bg-blue-50"
          style={{
            color: menuOpen ? C.accentBlue : C.text2,
            borderColor: menuOpen ? 'rgba(35,136,255,0.35)' : 'transparent',
          }}
        >
          <Settings size={17} strokeWidth={2.35} />
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
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        id="cv-sidebar"
        className={`
          supporthr-sidebar fixed top-0 left-0 z-50 flex h-screen flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        {/* ── Nav ────────────────────────────────────────────── */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 pt-4 custom-scrollbar">
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
      </aside>
    </>
  );
};

export default Sidebar;
