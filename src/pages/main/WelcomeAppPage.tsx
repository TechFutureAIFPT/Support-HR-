import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Activity, 
  Loader2
} from 'lucide-react';

interface WelcomeAppPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

interface LogStep {
  text: string;
  minProgress: number;
  maxProgress: number;
  status: 'pending' | 'loading' | 'done';
}

const WelcomeAppPage: React.FC<WelcomeAppPageProps> = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const progressRef = useRef(0);

  // Danh sách các log tải hệ thống phong cách AI
  const [logs, setLogs] = useState<LogStep[]>([
    { text: 'Khởi tạo hạt nhân tuyển dụng AI (SupportHR Kernel)...', minProgress: 0, maxProgress: 20, status: 'pending' },
    { text: 'Xác thực thông tin và kiểm tra phiên làm việc...', minProgress: 20, maxProgress: 45, status: 'pending' },
    { text: 'Đồng bộ hóa tài nguyên cấu hình lọc CV & JD...', minProgress: 45, maxProgress: 75, status: 'pending' },
    { text: 'Tải mô hình chấm điểm và trích xuất thực thể AI...', minProgress: 75, maxProgress: 95, status: 'pending' },
    { text: 'Hoàn tất! Đang khởi dựng không gian workspace...', minProgress: 95, maxProgress: 100, status: 'pending' }
  ]);

  // Bộ tăng tiến trình tự động
  useEffect(() => {
    const duration = 2800; // Tải trong 2.8 giây
    const intervalTime = 30;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + increment, 100);
      const currentProgress = Math.floor(progressRef.current);
      setProgress(currentProgress);

      // Cập nhật trạng thái của các dòng logs dựa trên tiến trình hiện tại
      setLogs(prevLogs => 
        prevLogs.map((log) => {
          if (currentProgress >= log.maxProgress) {
            return { ...log, status: 'done' };
          } else if (currentProgress >= log.minProgress) {
            return { ...log, status: 'loading' };
          }
          return log;
        })
      );

      // Xác định log nào đang hoạt động để hiển thị hiệu ứng
      const activeIdx = logs.findIndex(log => currentProgress >= log.minProgress && currentProgress < log.maxProgress);
      if (activeIdx !== -1) {
        setActiveLogIndex(activeIdx);
      }

      // Xử lý tự động đăng nhập ở mức 30% nếu chưa có thông tin đăng nhập
      if (currentProgress === 30 && !isLoggedIn) {
        const stored = localStorage.getItem('authEmail');
        if (!stored) {
          localStorage.setItem('authEmail', 'demo@supporthr.ai');
          // Phát sự kiện storage để App.tsx cập nhật state isLoggedIn ngay lập tức
          window.dispatchEvent(new Event('storage'));
        }
      }

      // Chuyển hướng khi đạt 100%
      if (currentProgress >= 100) {
        clearInterval(timer);
        // Chờ hiệu ứng mượt mà rồi chuyển trang
        setTimeout(() => {
          navigate('/jd');
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [navigate, isLoggedIn, logs]);

  return (
    <div className="relative flex h-[100vh] w-full flex-col items-center justify-center overflow-hidden bg-[#f6f9ff] text-slate-900">
      {/* Background Gradients & Glow Orbs đồng bộ với SupportHRLoading */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(35,136,255,0.13),transparent_34%),linear-gradient(180deg,#f6f9ff_0%,#eef5ff_56%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-30" />
      <div className="pointer-events-none absolute inset-y-0 left-[-16%] w-[28%] bg-gradient-to-r from-transparent via-blue-300/15 to-transparent blur-3xl" style={{ animation: "home-hero-scan 7.4s linear infinite" }} />
      <div className="pointer-events-none absolute inset-y-0 right-[-16%] w-[28%] bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent blur-3xl" style={{ animation: "home-hero-scan 9.2s linear infinite", animationDelay: "1.2s" }} />
      <div className="pointer-events-none absolute bottom-[-10%] left-[10%] h-48 w-48 bg-orange-100/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[14%] h-56 w-56 bg-blue-100/40 blur-3xl" />

      {/* Main Container */}
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 text-center">
        {/* Glowing Central Logo Core */}
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-blue-500/5 blur-md" />
          <div className="absolute inset-[-4px] rounded-3xl border-2 border-dashed border-blue-400/20 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-[-12px] rounded-full border border-emerald-400/20 animate-[spin_30s_linear_infinite_reverse]" />
          
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.1)]">
            <Sparkles className="h-10 w-10 text-blue-600 animate-pulse" />
          </div>
        </div>

        {/* Brand Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-[0.15em] text-slate-900 uppercase">
            Support <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">HR</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            AI CV FILTER WORKSPACE
          </p>
        </div>

        {/* Glowing Progress Percentage */}
        <div className="my-8 relative select-none">
          <span className="absolute -inset-x-8 top-1/2 -translate-y-1/2 text-[120px] font-black tracking-tighter text-blue-500/5 blur-xl">
            {progress}%
          </span>
          <span className="bg-gradient-to-b from-slate-900 to-blue-700 bg-clip-text text-7xl font-black tracking-tight text-transparent">
            {progress}%
          </span>
        </div>

        {/* Loading Progress Bar Container */}
        <div className="relative mb-8 h-1.5 w-full overflow-hidden rounded-full bg-blue-100/55 border border-blue-200/20">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-400 shadow-[0_0_12px_rgba(35,136,255,0.45)] transition-all duration-70ms"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* System Terminal Console (Light Modern Card) */}
        <div className="w-full rounded-2xl border border-blue-100 bg-white/75 p-5 text-left font-mono shadow-[0_24px_80px_rgba(30,64,175,0.06)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between border-b border-blue-50/50 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-black tracking-wider text-blue-800">CONSOLE LOGS</span>
            </div>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-yellow-400/80" />
              <span className="h-2 w-2 rounded-full bg-green-400/80" />
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 min-h-[140px]">
            {logs.map((log, index) => {
              const isActive = log.status === 'loading';
              const isDone = log.status === 'done';

              let statusIcon = <div className="h-3.5 w-3.5 rounded bg-slate-100 border border-slate-200 shrink-0" />;
              if (isActive) {
                statusIcon = <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />;
              } else if (isDone) {
                statusIcon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />;
              }

              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isActive ? 'text-slate-900 font-bold scale-[1.01]' : isDone ? 'text-slate-400' : 'text-slate-300'
                  }`}
                >
                  {statusIcon}
                  <span className="truncate">{log.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-blue-600" />
            <span>AI CORE v2</span>
          </div>
          <span className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>HYBRID ENGINE</span>
          </div>
          <span className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeAppPage;
