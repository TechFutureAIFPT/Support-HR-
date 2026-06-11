import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { detectIndustryFromJD } from '@/services/jd/industryDetector';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import WebVitalsReporter from '@/components/charts/WebVitalsReporter';
import { ThemeProvider } from '@/context/theme/ThemeProvider';

import { UserProfileService } from '@/services/data-sync/userProfileService';
import type { AuthUser } from '@/services/auth/authTypes';
import type { AppStep, Candidate, HardFilters, WeightCriteria, AnalysisRunData, ActiveAnalysisContext } from '@/types';
import { initialWeights } from '@/config/constants';
import Sidebar from '@/layout/Sidebar';
import WorkspaceTopbar from '@/components/workspace/WorkspaceTopbar';
import DesktopAppMenuBar from '@/components/workspace/DesktopAppMenuBar';
import JDTemplatesModal, { JDTemplate } from '@/components/history/JDTemplatesModal';
import HistoryModal from '@/components/history/HistoryModal';
import PageTransition from '@/components/PageTransition';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import SeoManager from '@/components/common/SeoManager';
import { DocsPageLoading } from '@/pages/info/legal-ui';

// Lazy load pages for code-splitting
const ScreenerPage = lazy(() => import('@/pages/main/ScreenerPage'));
const ProcessPage = lazy(() => import('@/pages/main/ProcessPage'));
const HomePage = lazy(() => import('@/pages/main/HomePage'));
const WelcomeAppPage = lazy(() => import('@/pages/main/WelcomeAppPage'));
const AchievementsContactPage = lazy(() => import('@/pages/info/AchievementsContactPage'));
const DeploymentReadyPage = lazy(() => import('@/pages/deployment/DeploymentReadyPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DetailedAnalyticsPage = lazy(() => import('@/pages/analytics/DetailedAnalyticsPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/info/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const SecurityCompliancePage = lazy(() => import('@/pages/info/SecurityCompliancePage'));
const FAQPage = lazy(() => import('@/pages/info/FAQPage'));
const PricingPage = lazy(() => import('@/pages/info/PricingPage'));
const DemoPage = lazy(() => import('@/pages/info/DemoPage'));
const AIMethodologyPage = lazy(() => import('@/pages/info/AIMethodologyPage'));
const UseCasesPage = lazy(() => import('@/pages/info/UseCasesPage'));
const IntegrationsPage = lazy(() => import('@/pages/info/IntegrationsPage'));
const BookDemoPage = lazy(() => import('@/pages/info/BookDemoPage'));
const AIFeedbackPage = lazy(() => import('@/pages/main/AIFeedbackPage'));
const FilteredCvLibraryPage = lazy(() => import('@/pages/tools/FilteredCvLibraryPage'));
const JDStandardizerPage = lazy(() => import('@/pages/tools/JDStandardizerPage'));
import CandidateSuggestions from '@/pages/analytics/CandidateSuggestions';
// HistoryPage removed from UI (still saving to Firestore silently)
import { saveHistorySession } from '@/services/history-cache/historyService';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';
import {
  buildAnalysisSessionId,
  buildJdHash,
  clearActiveAnalysisContext,
  getActiveAnalysisContext,
  saveActiveAnalysisContext,
} from '@/services/history-cache/activeAnalysisContext';
import {
  clearLatestAnalysisRun,
  readLatestAnalysisRun,
  writeLatestAnalysisRun,
} from '@/services/history-cache/latestAnalysisRun';
import {
  clearWorkflowActivity,
  clearWorkflowDraft,
  isWorkflowSessionExpired,
  readWorkflowDraft,
  touchWorkflowActivity,
  writeWorkflowDraft,
} from '@/services/history-cache/workflowDraft';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function createDefaultHardFilters(): HardFilters {
  return {
    location: '',
    minExp: '',
    seniority: '',
    education: '',
    industry: '',
    language: '',
    languageLevel: '',
    certificates: '',
    salaryMin: '',
    salaryMax: '',
    workFormat: '',
    contractType: '',
    locationMandatory: true,
    minExpMandatory: true,
    seniorityMandatory: true,
    educationMandatory: false,
    contactMandatory: false,
    industryMandatory: true,
    languageMandatory: false,
    certificatesMandatory: false,
    salaryMandatory: false,
    workFormatMandatory: false,
    contractTypeMandatory: false,
  };
}

function readStoredJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function normalizeCompletedSteps(steps: AppStep[]): AppStep[] {
  const normalized = [...steps];
  const shouldBackfillUpload = (normalized.includes('weights') || normalized.includes('analysis')) && !normalized.includes('upload');

  if (shouldBackfillUpload) {
    const weightIndex = normalized.indexOf('weights');
    if (weightIndex >= 0) {
      normalized.splice(weightIndex, 0, 'upload');
    } else {
      normalized.push('upload');
    }
  }

  return [...new Set(normalized)];
}

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </ThemeProvider>
  );
};

const publicMarketingPaths = new Set([
  '/',
  '/process',
  '/contact-ready',
  '/privacy-policy',
  '/terms',
  '/team',
  '/security',
  '/faq',
  '/pricing',
  '/guide',
  '/demo',
  '/ai-methodology',
  '/use-cases',
  '/integrations',
  '/book-demo',
]);

function clearExpiredWorkflowSession(): void {
  if (typeof window === 'undefined' || !isWorkflowSessionExpired()) return;

  clearActiveAnalysisContext();
  clearLatestAnalysisRun();
  clearWorkflowDraft();
  clearWorkflowActivity();
  window.localStorage.removeItem('currentJD');
  window.localStorage.removeItem('currentRawJD');
  window.localStorage.removeItem('currentLocation');
  window.localStorage.removeItem('analysisWeights');
  window.localStorage.removeItem('hardFilters');
}

function isRunningAsInstalledApp(): boolean {
  if (typeof window === 'undefined') return false;

  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const windowControlsMedia = window.matchMedia?.('(display-mode: window-controls-overlay)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(standaloneMedia || windowControlsMedia || iosStandalone);
}

const MainApp = () => {
  clearExpiredWorkflowSession();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const shouldBlockInitialRender = !publicMarketingPaths.has(initialPath) && initialPath !== '/welcome';

  // Initialize state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [resetKey, setResetKey] = useState(Date.now());
  const [isInitializing, setIsInitializing] = useState(true);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleFullReset = () => {
    setResetKey(Date.now());
  };

  const handleLoginRequest = () => {
    setShowLoginModal(true);
  };

  useEffect(() => {
    if (location.pathname === '/' && isRunningAsInstalledApp()) {
      navigate('/welcome?source=pwa', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const protectedPaths = ['/jd', '/upload', '/weights', '/analysis', '/dashboard', '/detailed-analytics', '/chatbot', '/feedback', '/records', '/jd-standardizer', '/history', '/jd-templates'];

    if (!isInitializing && !isLoggedIn && protectedPaths.includes(location.pathname)) {
      setShowLoginModal(true);
    }
  }, [isInitializing, isLoggedIn, location.pathname]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          photoURL: user.photoURL,
          provider: user.providerData[0]?.providerId.includes('google') ? 'google' : 'email',
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
        };
        setCurrentUser(authUser);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        localStorage.setItem('authEmail', user.email || '');
        setIsInitializing(false);

        void (async () => {
          try {
            await UserProfileService.saveUserProfile(
              user.uid,
              user.email!,
              user.displayName || undefined
            );

            await UserProfileService.migrateLocalDataToFirebase(user.uid, user.email!);
          } catch (error) {
            console.error('Error syncing user profile:', error);
          }
        })();
        return;
      } else {
        const storedAuthEmail = localStorage.getItem('authEmail') || '';
        setCurrentUser(null);
        setIsLoggedIn(Boolean(storedAuthEmail));
      }

      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Fallback to localStorage for compatibility — event-driven only, no polling
  useEffect(() => {
    if (!isInitializing && !currentUser) {
      const syncLoginState = () => {
        try {
          const authEmail = localStorage.getItem('authEmail') || '';
          const wasLoggedIn = !!(authEmail && authEmail.length > 0);
          if (wasLoggedIn && !isLoggedIn) {
            setIsLoggedIn(wasLoggedIn);
          }
        } catch { }
      };

      syncLoginState();
      window.addEventListener('storage', syncLoginState);

      return () => {
        window.removeEventListener('storage', syncLoginState);
      };
    }
  }, [isInitializing, currentUser, isLoggedIn]);

  if (isInitializing && shouldBlockInitialRender) {
    return (
      <SupportHRLoading
        mode="screen"
        label="Support HR // Khởi tạo"
        title="Đang đồng bộ phiên làm việc"
        description="Hệ thống đang tải giao diện, kiểm tra trạng thái đăng nhập và chuẩn bị không gian làm việc cho bạn."
        rotatingTitles={[
          'Đang đồng bộ phiên làm việc',
          'Đang tải nền tảng tuyển dụng AI',
          'Đang chuẩn bị giao diện phân tích',
        ]}
        stages={[
          { label: 'Xác thực', hint: 'Kiểm tra phiên hiện tại', tone: 'cyan' },
          { label: 'Đồng bộ', hint: 'Tải dữ liệu người dùng', tone: 'violet' },
          { label: 'Hoàn tất', hint: 'Hiển thị giao diện', tone: 'emerald' },
        ]}
      />
    );
  }

  return (
    <>
      <SeoManager />
      <PageTransition />
      <MainLayout
        onResetRequest={handleFullReset}
        isLoggedIn={isLoggedIn}
        onLoginRequest={handleLoginRequest}
        currentUser={currentUser}
      />
      {showLoginModal && (
        <div className="fixed inset-0 z-50">
          <LoginPage onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        </div>
      )}
    </>
  );
};


interface MainLayoutProps {
  onResetRequest: () => void;
  className?: string;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  currentUser: AuthUser | null;
}

const MainLayout = ({ onResetRequest, className, isLoggedIn, onLoginRequest, currentUser }: MainLayoutProps) => {
  const initialStoredRun = useMemo(() => readLatestAnalysisRun(), []);
  const initialWorkflowDraft = useMemo(() => readWorkflowDraft(), []);
  const initialStoredWeights = useMemo(() => readStoredJson<WeightCriteria>('analysisWeights'), []);
  const initialStoredHardFilters = useMemo(() => readStoredJson<HardFilters>('hardFilters'), []);
  const initialStoredJdText = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('currentJD') || '';
  }, []);
  const initialStoredRawJdText = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('currentRawJD') || '';
  }, []);
  const [userEmail, setUserEmail] = useState<string>(() => {
    // attempt to get from auth current user if available
    return (typeof window !== 'undefined' && (window as any).localStorage?.getItem('authEmail')) || '';
  });
  const [completedSteps, setCompletedSteps] = useState<AppStep[]>(
    () => {
      if (initialWorkflowDraft?.completedSteps?.length) return normalizeCompletedSteps(initialWorkflowDraft.completedSteps);
      return initialStoredRun ? ['jd', 'upload', 'weights', 'analysis'] : [];
    }
  );
  const [jdTemplatesModalOpen, setJdTemplatesModalOpen] = useState<boolean>(false);
  const [jdTemplateSelectionMode, setJdTemplateSelectionMode] = useState<'analysis' | 'welcome'>('analysis');
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Load avatar and user name for mobile navbar
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        if (currentUser.displayName) {
          setUserName(currentUser.displayName);
        } else if (currentUser.email) {
          setUserName(currentUser.email.split('@')[0]);
        }

        if (currentUser.photoURL) {
          setUserAvatar(currentUser.photoURL);
        } else {
          try {
            const profile = await UserProfileService.getUserProfile(currentUser.uid);
            if (profile?.avatar) {
              setUserAvatar(profile.avatar);
            } else if (currentUser.email) {
              setUserAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
            }
          } catch {
            if (currentUser.email) setUserAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
          }
        }
      } else if (userEmail) {
        setUserName(userEmail.split('@')[0]);
        setUserAvatar(localStorage.getItem(`avatar_${userEmail}`));
      }
    };
    loadUserData();
  }, [currentUser, userEmail]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsSidebarDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('authEmail');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authEmail');
      window.location.href = '/';
    }
  }, [navigate]);

  const [jdText, setJdText] = useState<string>(() => initialWorkflowDraft?.jdText || initialStoredJdText);
  const [rawJdText, setRawJdText] = useState<string>(() => initialWorkflowDraft?.rawJdText || initialStoredRawJdText);
  const [jobPosition, setJobPosition] = useState<string>(() =>
    initialWorkflowDraft?.jobPosition || initialStoredRun?.job.position || ''
  );
  const [weights, setWeights] = useState<WeightCriteria>(() =>
    initialWorkflowDraft?.weights || initialStoredWeights || initialWeights
  );
  const [hardFilters, setHardFilters] = useState<HardFilters>(() =>
    initialWorkflowDraft?.hardFilters || initialStoredHardFilters || createDefaultHardFilters()
  );
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Candidate[]>(
    () => initialWorkflowDraft?.analysisResults || initialStoredRun?.candidates || []
  );
  const [activeAnalysisContext, setActiveAnalysisContext] = useState<ActiveAnalysisContext | null>(
    () => initialWorkflowDraft?.activeAnalysisContext || getActiveAnalysisContext()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Đồng bộ lại email nếu ban đầu rỗng hoặc thay đổi ở tab khác — event-driven only, no polling
  useEffect(() => {
    const syncEmail = () => {
      try {
        const stored = localStorage.getItem('authEmail') || '';
        setUserEmail(prev => (prev && prev.length > 0) ? prev : stored);
      } catch { }
    };
    syncEmail();
    window.addEventListener('storage', syncEmail);
    return () => {
      window.removeEventListener('storage', syncEmail);
    };
  }, []);

  const handleRestore = useCallback((payload: any) => {
    if (!payload) return;
    try {
      setJdText(payload.jdText || '');
      setJobPosition(payload.jobPosition || '');
      if (payload.weights) setWeights(payload.weights);
      if (payload.hardFilters) setHardFilters(payload.hardFilters);
      if (payload.candidates) setAnalysisResults(payload.candidates);
      setCompletedSteps(['jd', 'upload', 'weights', 'analysis']);
      if (payload.candidates) {
        writeLatestAnalysisRun({
          timestamp: Number(payload.timestamp || Date.now()),
          job: {
            position: payload.jobPosition || '',
            locationRequirement: payload.hardFilters?.location || '',
          },
          candidates: payload.candidates,
        });
      }
      navigate('/analysis');
    } catch (e) {
      console.warn('Restore failed', e);
    }
  }, [navigate]);

  const prevIsLoading = usePrevious(isLoading);

  // Auto-detect industry from JD whenever jdText changes significantly (throttle by length change)
  useEffect(() => {
    if (!jdText || jdText.length < 80) return; // avoid too-early detection
    setHardFilters(prev => {
      // If user already typed a custom industry different from last detected one, don't overwrite
      if (prev.industry && prev.industryManual) return prev; // industryManual is now in interface
      const detected = detectIndustryFromJD(jdText);
      if (detected && detected !== prev.industry) {
        return { ...prev, industry: detected };
      }
      return prev;
    });
  }, [jdText]);

  // Mark manual edits to industry (listener could be added where HardFilterPanel handles changes)
  // Quick patch: wrap original setHardFilters to flag manual change when id==='industry'
  const originalSetHardFilters = setHardFilters;
  const setHardFiltersWithFlag: typeof setHardFilters = (update) => {
    if (typeof update === 'function') {
      originalSetHardFilters(prev => {
        const next = (update as any)(prev);
        if (next.industry !== prev.industry && next._lastIndustryAuto !== true) {
          (next as any).industryManual = true;
        }
        return next;
      });
    } else {
      if (update.industry !== (hardFilters as any).industry) (update as any).industryManual = true;
      originalSetHardFilters(update);
    }
  };

  useEffect(() => {
    if (prevIsLoading && !isLoading && analysisResults.length > 0) {
      const successfulCandidates = analysisResults.filter(c => c.status === 'SUCCESS');
      if (successfulCandidates.length > 0) {
        // Add unique IDs to candidates before saving
        const candidatesWithIds = successfulCandidates.map(c => ({
          ...c,
          id: c.id || `${c.fileName}-${c.candidateName}-${Math.random()}`
        }));

        const analysisRun: AnalysisRunData = {
          timestamp: Date.now(),
          job: {
            position: jobPosition,
            locationRequirement: hardFilters.location || 'Không có',
          },
          candidates: candidatesWithIds,
        };
        writeLatestAnalysisRun(analysisRun);
        localStorage.setItem('currentJD', jdText);
        localStorage.setItem('currentLocation', hardFilters.location || '');
        localStorage.setItem('analysisWeights', JSON.stringify(weights));
        localStorage.setItem('hardFilters', JSON.stringify(hardFilters));

        const baseContext: ActiveAnalysisContext = {
          sessionId: buildAnalysisSessionId(analysisRun.timestamp),
          timestamp: analysisRun.timestamp,
          jobPosition: jobPosition || analysisRun.job.position,
          jdHash: buildJdHash(jdText),
        };
        saveActiveAnalysisContext(baseContext);
        setActiveAnalysisContext(baseContext);

        // Save to CV filter history (always enabled)
        try {
          cvFilterHistoryService.addFilterSession(
            jobPosition || 'Không rõ vị trí',
            hardFilters.industry || 'Khác'
          );
        } catch (error) {
          console.warn('Failed to save filter history:', error);
        }

        // Firestore persistence (best-effort)
        saveHistorySession({
          jdText,
          jobPosition,
          locationRequirement: hardFilters.location || 'Không có',
          candidates: candidatesWithIds,
          userEmail: userEmail || 'anonymous',
          weights,
          hardFilters,
        })
          .then((historyId) => {
            if (!historyId) return;
            const nextContext: ActiveAnalysisContext = {
              ...baseContext,
              historyId,
            };
            saveActiveAnalysisContext(nextContext);
            setActiveAnalysisContext(nextContext);
          })
          .catch(err => console.warn('Save history failed', err));
      }
    }
  }, [isLoading, prevIsLoading, analysisResults, jobPosition, hardFilters.location, jdText, userEmail, weights, hardFilters]);

  useEffect(() => {
    writeWorkflowDraft({
      completedSteps,
      jdText,
      rawJdText,
      jobPosition,
      weights,
      hardFilters,
      analysisResults,
      activeAnalysisContext,
    });
  }, [
    completedSteps,
    jdText,
    rawJdText,
    jobPosition,
    weights,
    hardFilters,
    analysisResults,
    activeAnalysisContext,
  ]);

  useEffect(() => {
    localStorage.setItem('currentJD', jdText);
    localStorage.setItem('currentRawJD', rawJdText);
    localStorage.setItem('analysisWeights', JSON.stringify(weights));
    localStorage.setItem('hardFilters', JSON.stringify(hardFilters));
  }, [jdText, rawJdText, weights, hardFilters]);

  useEffect(() => {
    touchWorkflowActivity(Date.now(), 0);

    let lastTouchedAt = Date.now();
    const markActive = () => {
      const now = Date.now();
      if (now - lastTouchedAt < 30_000) return;
      lastTouchedAt = now;
      touchWorkflowActivity(now);
    };

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        touchWorkflowActivity(Date.now(), 0);
        lastTouchedAt = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const activeStep = useMemo((): AppStep => {
    switch (location.pathname) {
      case '/process': return 'process';
      case '/jd': return 'jd';
      case '/upload': return 'upload';
      case '/weights': return 'weights';
      case '/analysis': return 'analysis';
      case '/dashboard': return 'dashboard';
      case '/detailed-analytics': return 'dashboard'; // Show dashboard as active for detailed analytics page
      case '/chatbot': return 'chatbot';
      case '/feedback': return 'feedback';
      case '/records': return 'records';
      case '/jd-standardizer': return 'jd-standardizer';
      case '/':
      default:
        return 'home';
    }
  }, [location.pathname]);

  const handleNewSession = useCallback(() => {
    setJdText('');
    setRawJdText('');
    setJobPosition('');
    setWeights(initialWeights);
    setHardFilters(createDefaultHardFilters());
    setCvFiles([]);
    setAnalysisResults([]);
    setActiveAnalysisContext(null);
    clearActiveAnalysisContext();
    clearLatestAnalysisRun();
    clearWorkflowDraft();
    clearWorkflowActivity();
    localStorage.removeItem('currentJD');
    localStorage.removeItem('currentRawJD');
    localStorage.removeItem('currentLocation');
    localStorage.removeItem('analysisWeights');
    localStorage.removeItem('hardFilters');
    setCompletedSteps([]);
    navigate('/jd');
  }, [navigate]);

  const setActiveStep = useCallback((step: AppStep) => {
    const pathMap: Partial<Record<AppStep, string>> = {
      home: '/',
      jd: '/jd',
      upload: '/upload',
      weights: '/weights',
      analysis: '/analysis',
      dashboard: '/detailed-analytics',
      chatbot: '/chatbot',
      feedback: '/feedback',
      records: '/records',
      'jd-standardizer': '/jd-standardizer',
      process: '/process'
    };
    if (pathMap[step]) navigate(pathMap[step]!);
  }, [navigate]);

  const markStepAsCompleted = useCallback((step: AppStep) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
  }, []);

  const handleSelectJDTemplate = useCallback((template: JDTemplate, mode = jdTemplateSelectionMode) => {
    setJdText(template.jdText);
    setJobPosition(template.jobPosition);
    setHardFilters((prev) => ({
      ...prev,
      ...template.hardFilters
    }));

    if (mode === 'welcome') {
      setActiveStep('jd');
      return;
    }

    markStepAsCompleted('jd');
    markStepAsCompleted('upload');
    markStepAsCompleted('weights');
    setActiveStep('analysis');
  }, [jdTemplateSelectionMode, markStepAsCompleted, setActiveStep]);

  useEffect(() => {
    const hasUsableAnalysis = analysisResults.some((candidate) => candidate.status === 'SUCCESS' && candidate.analysis);
    if (!isLoading && hasUsableAnalysis) {
      setCompletedSteps(prev => [...new Set<AppStep>([...prev, 'jd', 'upload', 'weights', 'analysis'])]);
    }
  }, [analysisResults, isLoading]);

  const isHomeView = activeStep === 'home';
  const isLandingFallbackView =
    !isLoggedIn &&
    ['/jd', '/upload', '/weights', '/analysis', '/dashboard', '/detailed-analytics', '/chatbot', '/feedback', '/records', '/jd-standardizer', '/history', '/jd-templates'].includes(location.pathname);
  const isMarketingRoute = publicMarketingPaths.has(location.pathname);
  const isWelcomeRoute = location.pathname === '/welcome';
  const isStandaloneToolRoute = isWelcomeRoute || (isLoggedIn && ['/records', '/jd-standardizer', '/history', '/jd-templates'].includes(location.pathname));
  const isLandingView = isHomeView || isLandingFallbackView || isMarketingRoute;
  const isWorkflowView =
    !isLandingView &&
    !isStandaloneToolRoute &&
    (activeStep === 'jd' ||
      activeStep === 'upload' ||
      activeStep === 'weights' ||
      activeStep === 'analysis' ||
      activeStep === 'dashboard' ||
      activeStep === 'chatbot' ||
      activeStep === 'feedback');

  useEffect(() => {
    const path = location.pathname;
    const requiresJD = ['/upload', '/weights', '/analysis'];
    if (requiresJD.includes(path) && !completedSteps.includes('jd')) {
      navigate('/jd', { replace: true });
      return;
    }
    const requiresUpload = ['/weights', '/analysis'];
    if (requiresUpload.includes(path) && !completedSteps.includes('upload')) {
      navigate('/upload', { replace: true });
      return;
    }
    if (path === '/analysis' && (!completedSteps.includes('weights'))) {
      navigate('/weights', { replace: true });
    }
  }, [location.pathname, completedSteps, navigate]);

  const handleUseStandardizedJD = useCallback((payload: {
    jdText: string;
    rawJdText: string;
    jobPosition: string;
    supplementalFields?: { location?: string; salary?: string };
  }) => {
    const nextJd = payload.jdText || '';
    const nextRawJd = payload.rawJdText || nextJd;
    setJdText(nextJd);
    setRawJdText(nextRawJd);
    setJobPosition(payload.jobPosition || '');
    setHardFilters((prev) => ({
      ...prev,
      location: payload.supplementalFields?.location || prev.location,
      salaryMax: payload.supplementalFields?.salary || prev.salaryMax,
    }));
    localStorage.setItem('currentJD', nextJd);
    localStorage.setItem('currentRawJD', nextRawJd);
    markStepAsCompleted('jd');
    setActiveStep('jd');
  }, [markStepAsCompleted, setActiveStep]);

  const handleCloseStandalonePage = useCallback(() => {
    const routeState = location.state as { from?: string } | null;
    const from = routeState?.from;
    navigate(from && from !== location.pathname ? from : '/');
  }, [location.pathname, location.state, navigate]);

  const screenerPageProps = {
    jdText, setJdText,
    rawJdText, setRawJdText,
    jobPosition, setJobPosition,
    weights, setWeights,
    hardFilters, setHardFilters,
    cvFiles, setCvFiles,
    analysisResults, setAnalysisResults,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
    activeStep, setActiveStep,
    completedSteps, markStepAsCompleted,
    onOpenJdTemplates: () => {
      setJdTemplateSelectionMode('welcome');
      setJdTemplatesModalOpen(true);
    },
  };

  const shouldUseWorkspaceShell = !isLandingView && !isStandaloneToolRoute;

  return (
    <div className={`h-[100dvh] bg-white text-slate-900 flex flex-col overflow-hidden ${shouldUseWorkspaceShell ? 'supporthr-shell--with-app-menu' : ''} ${className || ''}`}>
      {shouldUseWorkspaceShell && (
        <DesktopAppMenuBar
          sidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleSidebar={() => setIsDesktopSidebarCollapsed((value) => !value)}
        />
      )}

      {shouldUseWorkspaceShell && !isDesktopSidebarCollapsed && (
        <div className="hidden lg:block">
          <Sidebar
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            completedSteps={completedSteps}
            onReset={onResetRequest}
            onLogout={handleLogout}
            userEmail={userEmail}
            userAvatar={userAvatar}
            userName={userName}
            onLoginRequest={onLoginRequest}
            isOpen={true}
            onShowSettings={() => {
              setJdTemplateSelectionMode('analysis');
              setJdTemplatesModalOpen(true);
            }}
            onShowHistory={() => setHistoryModalOpen(true)}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      {shouldUseWorkspaceShell && (
        <div className="lg:hidden">
          <Sidebar
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            completedSteps={completedSteps}
            onReset={onResetRequest}
            onLogout={handleLogout}
            userEmail={userEmail}
            userAvatar={userAvatar}
            userName={userName}
            onLoginRequest={onLoginRequest}
            isOpen={isSidebarDrawerOpen}
            onClose={() => setIsSidebarDrawerOpen(false)}
            onShowSettings={() => {
              setJdTemplateSelectionMode('analysis');
              setJdTemplatesModalOpen(true);
            }}
            onShowHistory={() => setHistoryModalOpen(true)}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      {/* Mobile Fixed Header — full width, NOT offset by sidebar */}
      {shouldUseWorkspaceShell && (
        <header
          className="fixed top-0 left-0 right-0 z-[45] flex min-h-14 items-center justify-between gap-3 px-3 py-2 lg:hidden"
          style={{ background: 'rgba(255,255,255,0.94)', borderBottom: '1px solid rgba(55,125,255,0.12)', boxShadow: '0 12px 32px rgba(30,64,175,0.08)' }}
        >
          <button
            type="button"
            onClick={() => setIsSidebarDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            aria-label="Mở menu điều hướng"
          >
            <i className="fa-solid fa-bars text-sm" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img src="/images/logos/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-black leading-tight" style={{ color: '#102033' }}>SupportHR</span>
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">Trí tuệ tuyển dụng</span>
            </div>
          </div>
          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <img
                src={userAvatar || '/images/logos/logo.jpg'}
                alt=""
                className="h-9 w-9 rounded-full object-cover border border-blue-100 shadow-sm"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginRequest}
              className="shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-blue-700 shadow-sm"
            >
              Đăng nhập
            </button>
          )}
        </header>
      )}

      <main
        className={`main-content supporthr-main pb-0 ${shouldUseWorkspaceShell ? `supporthr-main--with-sidebar supporthr-main--with-app-menu ${isDesktopSidebarCollapsed ? 'supporthr-main--sidebar-collapsed' : ''} mt-14 lg:mt-0` : ''} flex-1 flex flex-col min-h-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
          !isLandingView
            ? 'min-w-0'
            : 'ml-0 w-full'
        }`}
      >
        {isWorkflowView && (
          <WorkspaceTopbar
            activeStep={activeStep}
            completedSteps={completedSteps}
            jobPosition={jobPosition}
            userName={userName}
            userAvatar={userAvatar}
            userEmail={userEmail}
            onLogout={handleLogout}
            onNewSession={handleNewSession}
            onOpenTemplates={() => {
              setJdTemplateSelectionMode('analysis');
              setJdTemplatesModalOpen(true);
            }}
            onOpenHistory={() => setHistoryModalOpen(true)}
            onOpenAnalysis={() => {
              setActiveStep('analysis');
              navigate('/analysis');
            }}
            onOpenDetailedAnalytics={() => {
              markStepAsCompleted('analysis');
              setActiveStep('dashboard');
              navigate('/detailed-analytics');
            }}
            onOpenCandidateSuggestions={() => {
              markStepAsCompleted('analysis');
              setActiveStep('chatbot');
              navigate('/chatbot');
            }}
          />
        )}
        <div className={`flex h-full min-h-0 w-full flex-1 flex-col ${isWorkflowView ? 'overflow-hidden' : isLandingView || isStandaloneToolRoute ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto py-4 overflow-y-auto custom-scrollbar'}`}>
          <Suspense fallback={
            isMarketingRoute ? (
              <DocsPageLoading />
            ) : (
              <SupportHRLoading
                mode="panel"
                minHeightClass="min-h-[52vh]"
                label="Support HR // Route Loading"
                title="Đang tải giao diện"
                description="Hệ thống đang nạp module cần thiết để hiển thị trang tiếp theo."
                stages={[
                  { label: 'Module', hint: 'Nạp thành phần giao diện', tone: 'cyan' },
                  { label: 'Dữ liệu', hint: 'Khôi phục trạng thái trang', tone: 'violet' },
                  { label: 'Hiển thị', hint: 'Sẵn sàng tương tác', tone: 'emerald' },
                ]}
              />
            )
          }>
            <Routes>
              <Route path="/welcome" element={<WelcomeAppPage isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} />} />
              <Route path="/" element={<HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/jd" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/upload" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/weights" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/analysis" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />

              <Route path="/dashboard" element={isLoggedIn ? <DetailedAnalyticsPage candidates={analysisResults} jobPosition={jobPosition} onReset={onResetRequest} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/detailed-analytics" element={isLoggedIn ? <DetailedAnalyticsPage candidates={analysisResults} jobPosition={jobPosition} onReset={onResetRequest} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/chatbot" element={isLoggedIn ? <CandidateSuggestions candidates={analysisResults} jobPosition={jobPosition} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/feedback" element={isLoggedIn ? <AIFeedbackPage candidates={analysisResults} jobPosition={jobPosition} weights={weights} hardFilters={hardFilters} analysisContext={activeAnalysisContext} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/records" element={isLoggedIn ? <FilteredCvLibraryPage userEmail={userEmail} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/jd-standardizer" element={isLoggedIn ? <JDStandardizerPage onUseJD={handleUseStandardizedJD} /> : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/history" element={isLoggedIn ? (
                <div className="min-h-screen bg-white">
                  <HistoryModal isOpen onClose={handleCloseStandalonePage} />
                </div>
              ) : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/jd-templates" element={isLoggedIn ? (
                <div className="min-h-screen bg-white">
                  <JDTemplatesModal
                    isOpen
                    onClose={handleCloseStandalonePage}
                    onSelectTemplate={(template: JDTemplate) => handleSelectJDTemplate(template, 'analysis')}
                  />
                </div>
              ) : <HomePage setActiveStep={setActiveStep} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} completedSteps={completedSteps} userName={userName} userEmail={userEmail} />} />
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/contact-ready" element={<DeploymentReadyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/team" element={<AchievementsContactPage />} />
              <Route path="/security" element={<SecurityCompliancePage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/guide" element={<DemoPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/ai-methodology" element={<AIMethodologyPage />} />
              <Route path="/use-cases" element={<UseCasesPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/book-demo" element={<BookDemoPage />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* JD Templates Modal */}
      <JDTemplatesModal
        isOpen={jdTemplatesModalOpen}
        onClose={() => setJdTemplatesModalOpen(false)}
        onSelectTemplate={(template: JDTemplate) => handleSelectJDTemplate(template)}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      {/* Vercel Analytics & Speed Insights for performance monitoring */}
      <Analytics />
      <SpeedInsights />
      <WebVitalsReporter />
    </div>
  );
};

export default App;
