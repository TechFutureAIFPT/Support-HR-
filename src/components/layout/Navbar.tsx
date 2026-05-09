/**
 * Navbar — Chỉ hỗ trợ Dark Mode
 * Màu sắc đồng bộ từ tokens.ts
 */
import React, { useState } from 'react';
import { auth } from '@/services/firebase';
import { UserProfileService } from '@/services/data-sync/userProfileService';
import SyncNotification from '@/components/ui/sync/SyncNotification';

interface NavbarProps {
  userEmail?: string;
  onLogout?: () => void;
  onLoginRequest?: () => void;
  onBrandClick?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  userEmail, onLogout, onLoginRequest, onBrandClick,
  sidebarOpen, onToggleSidebar, sidebarCollapsed
}) => {
  const [syncNotification, setSyncNotification] = useState({
    show: false,
    syncType: 'avatar' as 'avatar' | 'history' | 'profile',
    success: false,
    message: ''
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userEmail) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/jpg') {
      setSyncNotification({ show: true, syncType: 'avatar', success: false, message: 'Chỉ hỗ trợ định dạng JPG và PNG.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatarDataUrl = e.target?.result as string;
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await UserProfileService.updateUserAvatar(currentUser.uid, avatarDataUrl);
          setSyncNotification({ show: true, syncType: 'avatar', success: true, message: 'Avatar đã được đồng bộ thành công với tài khoản Gmail!' });
        } else {
          localStorage.setItem(`avatar_${userEmail}`, avatarDataUrl);
          setSyncNotification({ show: true, syncType: 'avatar', success: false, message: 'Vui lòng đăng nhập để đồng bộ avatar với tài khoản Gmail.' });
        }
      } catch {
        localStorage.setItem(`avatar_${userEmail}`, avatarDataUrl);
        setSyncNotification({ show: true, syncType: 'avatar', success: false, message: 'Không thể đồng bộ với Firebase. Avatar đã lưu cục bộ.' });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <nav className={`
        fixed top-3 h-14 flex items-center justify-between px-4
        backdrop-blur-2xl border rounded-xl shadow-[0_18px_48px_rgba(2,8,23,0.28)] z-40
        navbar transition-all duration-300 ease-in-out
        ${sidebarCollapsed
          ? 'left-1/2 -translate-x-1/2 w-[98%] md:w-[calc(98%-4rem)] md:ml-8'
          : 'left-1/2 -translate-x-1/2 w-[98%] md:w-[calc(98%-16rem)] md:ml-32'
        }
        bg-slate-900/72 border-white/[0.08]
      `}>
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button - Mobile */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] border border-slate-600/35 transition-colors duration-200"
            title={sidebarOpen ? "Đóng thanh bên" : "Mở thanh bên"}
          >
            <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-sm transition-transform duration-200`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {!userEmail && onLoginRequest && (
            <button
              onClick={onLoginRequest}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white focus:ring-cyan-400/40 shadow-[0_12px_28px_rgba(14,165,233,0.18)]"
            >
              <i className="fa-solid fa-right-to-bracket mr-2" />
              Đăng nhập
            </button>
          )}
        </div>
      </nav>

      <SyncNotification
        show={syncNotification.show}
        syncType={syncNotification.syncType}
        success={syncNotification.success}
        message={syncNotification.message}
        onClose={() => setSyncNotification(prev => ({ ...prev, show: false }))}
      />
    </>
  );
};

export default Navbar;
