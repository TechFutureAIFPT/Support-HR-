import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface StepInfo {
  message: string;
  icon: string;
  label: string;
  tone: 'cyan' | 'violet' | 'emerald' | 'sky';
}

const toneMap = {
  cyan: {
    accent: 'text-[#f5d6bb]',
    border: 'border-[#f5d6bb]/22',
    surface: 'bg-[#f5d6bb]/[0.08]',
    rule: 'via-[#f5d6bb]/32',
    progress: 'bg-[#f5d6bb]',
  },
  violet: {
    accent: 'text-[#f5d6bb]',
    border: 'border-[#f5d6bb]/22',
    surface: 'bg-[#f5d6bb]/[0.08]',
    rule: 'via-[#f5d6bb]/32',
    progress: 'bg-[#f5d6bb]',
  },
  emerald: {
    accent: 'text-[#f5d6bb]',
    border: 'border-[#f5d6bb]/22',
    surface: 'bg-[#f5d6bb]/[0.08]',
    rule: 'via-[#f5d6bb]/32',
    progress: 'bg-[#f5d6bb]',
  },
  sky: {
    accent: 'text-[#f5d6bb]',
    border: 'border-[#f5d6bb]/22',
    surface: 'bg-[#f5d6bb]/[0.08]',
    rule: 'via-[#f5d6bb]/32',
    progress: 'bg-[#f5d6bb]',
  },
} as const;

const instantRoutes = new Set(['/', '/process', '/contact-ready', '/privacy-policy', '/terms']);
const docsRoutes = new Set(['/team', '/security', '/faq', '/pricing', '/guide', '/demo', '/ai-methodology', '/use-cases', '/integrations', '/book-demo']);

const PageTransition: React.FC = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);

  const getStepInfo = (path: string): StepInfo => {
    if (docsRoutes.has(path)) {
      return { message: 'Đang mở tài liệu Support HR...', icon: 'fa-book-open', label: 'Support HR // Docs', tone: 'sky' };
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
    if (!hasMounted) {
      setHasMounted(true);
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

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          clearInterval(progressTimer);
          return 92;
        }

        return prev + Math.random() * 13;
      });
    }, 100);

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
      setProgress(100);
      setTimeout(() => setShouldRender(false), 320);
    }, 520);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(transitionTimer);
    };
  }, [hasMounted, location.pathname]);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-black/96 backdrop-blur-md transition-all duration-300
        ${isTransitioning ? 'opacity-100' : 'pointer-events-none opacity-0'}
      `}
    >
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-35" />
      <div
        className="pointer-events-none absolute inset-y-0 left-[-16%] w-[28%] bg-gradient-to-r from-transparent via-[#f5d6bb]/[0.08] to-transparent blur-3xl"
        style={{ animation: 'home-hero-scan 7.8s linear infinite' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-[-18%] w-[28%] bg-gradient-to-r from-transparent via-[#f5d6bb]/[0.07] to-transparent blur-3xl"
        style={{ animation: 'home-hero-scan 9.1s linear infinite', animationDelay: '0.8s' }}
      />

      <div className={`relative w-[min(92vw,34rem)] overflow-hidden border ${tone.border} bg-black/88 px-6 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.45)]`}>
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tone.rule} to-transparent`} />

        <div className="supporthr-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
          {stepInfo.label}
        </div>

        <div className="mt-5 flex items-center gap-5">
          <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center border ${tone.border} ${tone.surface}`}>
            <div
              className={`absolute inset-[-1px] border-[3px] border-transparent border-r-current border-t-current ${tone.accent} animate-spin opacity-90`}
              style={{ animationDuration: '1.05s' }}
            />
            <div className="absolute inset-[10px] border border-white/8" />
            <div
              className={`absolute inset-[11px] border-[3px] border-transparent border-b-current border-l-current ${tone.accent} animate-spin opacity-35`}
              style={{ animationDuration: '1.45s', animationDirection: 'reverse' }}
            />
            <i className={`fa-solid ${stepInfo.icon} relative text-lg ${tone.accent}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium tracking-wide text-zinc-300">
              {stepInfo.message}
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden bg-white/[0.06]">
              <div
                className={`h-full ${tone.progress} transition-all duration-150 ease-out`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              <span>Đang chuyển trang</span>
              <span>{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 transition-all duration-300 ${
                index <= Math.floor(progress / 34) ? tone.progress : 'bg-white/[0.08]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageTransition;
