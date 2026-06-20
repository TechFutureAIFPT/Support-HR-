import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface StepInfo {
  message: string;
  icon: string;
  label: string;
  tone: 'cyan' | 'violet' | 'emerald' | 'sky';
}

const toneMap = {
  cyan: {
    accent: 'text-cyan-600',
    border: 'border-cyan-200',
    surface: 'bg-cyan-50',
    rule: 'via-cyan-300/70',
    progress: 'bg-cyan-500',
  },
  violet: {
    accent: 'text-blue-600',
    border: 'border-blue-200',
    surface: 'bg-blue-50',
    rule: 'via-blue-300/70',
    progress: 'bg-blue-500',
  },
  emerald: {
    accent: 'text-emerald-600',
    border: 'border-emerald-200',
    surface: 'bg-emerald-50',
    rule: 'via-emerald-300/70',
    progress: 'bg-emerald-500',
  },
  sky: {
    accent: 'text-sky-600',
    border: 'border-sky-200',
    surface: 'bg-sky-50',
    rule: 'via-sky-300/70',
    progress: 'bg-sky-500',
  },
} as const;

const instantRoutes = new Set(['/', '/process', '/contact-ready', '/privacy-policy', '/terms']);
const docsRoutes = new Set(['/app-docs', '/process', '/team', '/security', '/faq', '/pricing', '/guide', '/demo', '/ai-methodology', '/use-cases', '/integrations', '/docs/cv-library', '/docs/jd-templates', '/docs/jd-standardizer', '/book-demo']);

const PageTransition: React.FC = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasMountedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());

  const getStepInfo = (path: string): StepInfo => {
    if (docsRoutes.has(path)) {
      return { message: 'Đang mở tài liệu Support HR...', icon: 'fa-book-open', label: 'Support HR // Tài liệu', tone: 'sky' };
    }

    switch (path) {
      case '/jd':
        return { message: 'Khởi tạo trình lọc CV thông minh...', icon: 'fa-wand-magic-sparkles', label: 'Support HR // JD', tone: 'violet' };
      case '/weights':
        return { message: 'Đã lưu mô tả. Chuyển sang thiết lập tiêu chí đánh giá...', icon: 'fa-sliders', label: 'Support HR // Weights', tone: 'sky' };
      case '/upload':
        return { message: 'Sẵn sàng. Chuyển sang bước nạp hồ sơ...', icon: 'fa-cloud-arrow-up', label: 'Support HR // Upload', tone: 'cyan' };
      case '/analysis':
        return { message: 'Khởi động AI và bắt đầu phân tích CV...', icon: 'fa-chart-line', label: 'Support HR // Analysis', tone: 'emerald' };
      case '/detailed-analytics':
        return { message: 'Tổng hợp báo cáo chi tiết...', icon: 'fa-chart-bar', label: 'Support HR // Analytics', tone: 'sky' };
      case '/chatbot':
        return { message: 'Kết nối với trợ lý AI...', icon: 'fa-robot', label: 'Support HR // Chat', tone: 'violet' };
      case '/':
        return { message: 'Chuẩn bị trang chủ...', icon: 'fa-home', label: 'Support HR // Home', tone: 'cyan' };
      default:
        return { message: 'Đang tối ưu trải nghiệm...', icon: 'fa-sparkles', label: 'Support HR // Route', tone: 'sky' };
    }
  };

  const stepInfo = getStepInfo(location.pathname);
  const tone = toneMap[stepInfo.tone];

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (Date.now() - mountedAtRef.current < 2600) {
      setIsTransitioning(false);
      setShouldRender(false);
      setProgress(100);
      return;
    }

    if (instantRoutes.has(location.pathname)) {
      setIsTransitioning(false);
      setShouldRender(false);
      setProgress(100);
      return;
    }

    setProgress(0);
    setIsTransitioning(true);
    setShouldRender(true);

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          window.clearInterval(progressTimer);
          return 92;
        }

        return prev + Math.random() * 18;
      });
    }, 70);

    let hideTimer: number | undefined;
    const transitionTimer = window.setTimeout(() => {
      setIsTransitioning(false);
      setProgress(100);
      hideTimer = window.setTimeout(() => setShouldRender(false), 180);
    }, 380);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(transitionTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-white/76 backdrop-blur-md transition-all duration-300
        ${isTransitioning ? 'opacity-100' : 'pointer-events-none opacity-0'}
      `}
    >
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-40" />
      <div className="pointer-events-none absolute left-[10%] top-[12%] h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[16%] right-[12%] h-48 w-48 rounded-full bg-emerald-100/80 blur-3xl" />

      <div className={`relative w-[min(92vw,34rem)] overflow-hidden rounded-2xl border ${tone.border} bg-white px-6 py-7 shadow-[0_28px_90px_rgba(30,64,175,0.16)]`}>
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tone.rule} to-transparent`} />

        <div className="supporthr-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
          {stepInfo.label}
        </div>

        <div className="mt-5 flex items-center gap-5">
          <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${tone.border} ${tone.surface}`}>
            <div
              className={`absolute inset-[-1px] rounded-2xl border-[3px] border-transparent border-r-current border-t-current ${tone.accent} animate-spin opacity-90`}
              style={{ animationDuration: '1.05s' }}
            />
            <div className="absolute inset-[10px] rounded-xl border border-white" />
            <div
              className={`absolute inset-[11px] rounded-xl border-[3px] border-transparent border-b-current border-l-current ${tone.accent} animate-spin opacity-35`}
              style={{ animationDuration: '1.45s', animationDirection: 'reverse' }}
            />
            <i className={`fa-solid ${stepInfo.icon} relative text-lg ${tone.accent}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-wide text-slate-800">
              {stepInfo.message}
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${tone.progress} transition-all duration-150 ease-out`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between supporthr-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <span>Đang chuyển trang</span>
              <span>{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= Math.floor(progress / 34) ? tone.progress : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageTransition;
