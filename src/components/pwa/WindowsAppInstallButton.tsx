import React, { useState } from 'react';
import { CheckCircle2, MonitorDown, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface WindowsAppInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const WindowsAppInstallButton: React.FC<WindowsAppInstallButtonProps> = ({
  variant = 'full',
  className = '',
}) => {
  const { canInstall, install, status } = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideMode, setGuideMode] = useState<'manual' | 'installed'>('manual');

  const isCompact = variant === 'compact';
  const isInstalled = status === 'installed';

  const handleInstall = async () => {
    if (isInstalled) {
      setGuideMode('installed');
      setIsGuideOpen(true);
      return;
    }

    if (!canInstall) {
      setGuideMode('manual');
      setIsGuideOpen(true);
      return;
    }

    setIsPrompting(true);
    try {
      const accepted = await install();
      if (!accepted) {
        setGuideMode('manual');
        setIsGuideOpen(true);
      }
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className={`${isCompact
          ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50'
          : 'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-xs font-black text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50'
        } ${className}`}
        aria-label={isInstalled ? 'Ứng dụng Support HR đã được cài' : 'Tải ứng dụng Windows Support HR'}
        title={isInstalled ? 'Ứng dụng đã được cài' : 'Tải ứng dụng Windows'}
      >
        {isInstalled ? <CheckCircle2 className="h-4 w-4" /> : <MonitorDown className="h-4 w-4" />}
        {!isCompact && (
          <span>{isPrompting ? 'Đang mở...' : isInstalled ? 'Đã cài' : 'Tải app Windows'}</span>
        )}
      </button>

      {isGuideOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_28px_80px_rgba(30,64,175,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-blue-100 bg-[#f8fbff] px-5 py-4">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {guideMode === 'installed' ? 'Support HR đã sẵn sàng trên Windows' : 'Cài Support HR thành ứng dụng Windows'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {guideMode === 'installed'
                    ? 'Hãy mở ứng dụng từ Start Menu hoặc biểu tượng đã ghim để chạy bằng cửa sổ riêng.'
                    : 'Trình duyệt hiện chưa gửi hộp thoại cài đặt tự động. Bạn vẫn có thể cài bằng nút cài đặt của Chrome hoặc Edge.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Đóng hướng dẫn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {[
                ['01', 'Dùng Chrome hoặc Edge trên Windows.'],
                ['02', 'Bấm biểu tượng cài đặt ở thanh địa chỉ, hoặc mở menu ba chấm.'],
                ['03', 'Chọn “Cài đặt Support HR”, sau đó mở app từ Start Menu.'],
              ].map(([step, text]) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-blue-100 bg-white p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                    {step}
                  </span>
                  <p className="pt-1 text-sm font-semibold leading-6 text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WindowsAppInstallButton;
