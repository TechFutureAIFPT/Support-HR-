/**
 * DesktopLayout — light-only responsive shell
 */
import React, { useState } from 'react';
import Navbar from '@/layout/Navbar';
import Sidebar from '@/layout/Sidebar';
import type { AppStep } from '@/types';

interface DesktopLayoutProps {
  children?: React.ReactNode;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const [activeStep, setActiveStep] = useState<AppStep>('home');
  const [completedSteps, setCompletedSteps] = useState<AppStep[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');

  const handleReset = () => { setActiveStep('home'); setCompletedSteps([]); };
  const handleLogout = () => { setUserEmail(''); setActiveStep('home'); setCompletedSteps([]); };
  const handleLoginRequest = () => {};
  const handleBrandClick = () => setActiveStep('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Desktop Sidebar */}
      <div className="fixed bottom-0 left-0 top-0 z-50 w-64">
        <Sidebar
          activeStep={activeStep} setActiveStep={setActiveStep}
          completedSteps={completedSteps} onReset={handleReset}
          onLogout={handleLogout} userEmail={userEmail}
          onLoginRequest={handleLoginRequest} isOpen={true}
        />
      </div>

      {/* Desktop Navbar */}
      <div className="fixed left-64 right-0 top-0 z-40">
        <Navbar
          userEmail={userEmail} onLogout={handleLogout}
          onLoginRequest={handleLoginRequest} onBrandClick={handleBrandClick}
          sidebarOpen={true} sidebarCollapsed={false}
        />
      </div>

      {/* Desktop Main Content */}
      <div className="ml-64 h-[calc(100vh-3.5rem)] pt-14">
        <main className="h-full p-6">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;
