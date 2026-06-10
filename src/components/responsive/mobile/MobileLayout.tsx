/**
 * MobileLayout — light-only responsive shell
 */
import React, { useState } from 'react';
import Navbar from '@/layout/Navbar';
import Sidebar from '@/layout/Sidebar';
import type { AppStep } from '@/types';

interface MobileLayoutProps {
  children?: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<AppStep>('home');
  const [completedSteps, setCompletedSteps] = useState<AppStep[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');

  const handleReset = () => { setActiveStep('home'); setCompletedSteps([]); };
  const handleLogout = () => { setUserEmail(''); setActiveStep('home'); setCompletedSteps([]); };
  const handleLoginRequest = () => {};
  const handleBrandClick = () => { setActiveStep('home'); setSidebarOpen(false); };
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen relative bg-[#f6f9ff]">
      {/* Sidebar overlay */}
      <div className={`
        fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <div className="flex h-full">
          <div className="w-64 bg-white border-r border-blue-100">
            <Sidebar
              activeStep={activeStep} setActiveStep={setActiveStep}
              completedSteps={completedSteps} onReset={handleReset}
              onLogout={handleLogout} userEmail={userEmail}
              onLoginRequest={handleLoginRequest}
              isOpen={sidebarOpen} onClose={closeSidebar}
            />
          </div>
          <div className="flex-1 bg-slate-900/20 backdrop-blur-sm" onClick={closeSidebar} />
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="sticky top-0 z-30 border-b bg-white/95 border-blue-100 backdrop-blur-lg mobile-nav">
        <Navbar
          userEmail={userEmail} onLogout={handleLogout}
          onLoginRequest={handleLoginRequest} onBrandClick={handleBrandClick}
          sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar}
          sidebarCollapsed={false}
        />
      </div>

      {/* Mobile Main Content */}
      <div className="mobile-main">
        <main className="min-h-screen p-4 pb-20">
          <div className="max-w-full">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 border-blue-100 backdrop-blur-lg mobile-bottom-nav">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { step: 'home' as AppStep, icon: 'fa-home', label: 'Trang chủ' },
            { step: 'jd' as AppStep, icon: 'fa-file-text', label: 'JD' },
            { step: 'upload' as AppStep, icon: 'fa-upload', label: 'Hồ sơ' },
            { step: 'weights' as AppStep, icon: 'fa-sliders', label: 'Mặc định' },
            { step: 'analysis' as AppStep, icon: 'fa-chart-line', label: 'Phân tích' },
          ].map(({ step, icon, label }) => (
            <button
              key={step}
              onClick={() => setActiveStep(step)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full rounded-lg
                transition-colors
                ${activeStep === step
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
                }
              `}
            >
              <i className={`fas ${icon} text-lg mb-1`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}

          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center flex-1 h-full rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <i className="fas fa-bars text-lg mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileLayout;
