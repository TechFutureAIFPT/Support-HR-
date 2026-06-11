import React, { useState } from 'react';
import { CheckCircle2, MonitorDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface WindowsAppInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const APP_WELCOME_PATH = '/welcome?source=pwa';

const WindowsAppInstallButton: React.FC<WindowsAppInstallButtonProps> = ({
  variant = 'full',
  className = '',
}) => {
  const navigate = useNavigate();
  const { install, status } = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);

  const isCompact = variant === 'compact';
  const isInstalled = status === 'installed';

  const openAppWorkspace = () => {
    navigate(APP_WELCOME_PATH);
  };

  const handleInstall = async () => {
    if (isInstalled) {
      openAppWorkspace();
      return;
    }

    setIsPrompting(true);
    try {
      const installed = await install();
      if (!installed) {
        openAppWorkspace();
      }
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={`${isCompact
        ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50'
        : 'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-xs font-black text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50'
      } ${className}`}
      aria-label={isInstalled ? 'Mở ứng dụng Support HR' : 'Tải ứng dụng Windows Support HR'}
      title={isInstalled ? 'Mở Support HR Desktop' : 'Tải ứng dụng Windows'}
    >
      {isInstalled ? <CheckCircle2 className="h-4 w-4" /> : <MonitorDown className="h-4 w-4" />}
      {!isCompact && (
        <span>{isPrompting ? 'Đang mở...' : isInstalled ? 'Ứng dụng' : 'Tải app Windows'}</span>
      )}
    </button>
  );
};

export default WindowsAppInstallButton;
