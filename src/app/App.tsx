import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { detectIndustryFromJD } from '@/services/jd/industryDetector';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import WebVitalsReporter from '@/components/charts/WebVitalsReporter';
import { ThemeProvider } from '@/context/theme/ThemeProvider';
import { UserSettingsProvider, useUserSettings } from '@/context/settings/UserSettingsProvider';

import { DataSyncService } from '@/services/data-sync/dataSyncService';
import { UserProfileService } from '@/services/data-sync/userProfileService';
import type { AuthUser } from '@/services/auth/authTypes';
import type { AppStep, Candidate, HardFilters, WeightCriteria, AnalysisRunData, ActiveAnalysisContext, HistoryEntry } from '@/types';
import type { WorkspaceSessionViewModel } from '@/types/workspace';
import { initialWeights } from '@/config/constants';
import Sidebar from '@/layout/Sidebar';
import WorkspaceTopbar from '@/components/workspace/WorkspaceTopbar';
import DesktopAppMenuBar from '@/components/workspace/DesktopAppMenuBar';
import SidebarSettingsModal from '@/components/settings/SidebarSettingsModal';
import JDTemplatesModal, { JDTemplate } from '@/components/history/JDTemplatesModal';
import PageTransition from '@/components/PageTransition';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import SeoManager from '@/components/common/SeoManager';
import { DocsPageLoading } from '@/pages/info/legal-ui';

// Lazy load pages for code-splitting
const ScreenerPage = lazy(() => import('@/pages/main/ScreenerPage'));
const AppDocumentationPage = lazy(() => import('@/pages/info/AppDocumentationPage'));
const ProcessPage = lazy(() => import('@/pages/main/ProcessPage'));
const DemoPage = lazy(() => import('@/pages/info/DemoPage'));
const ProductFeatureDocsPage = lazy(() => import('@/pages/info/ProductFeatureDocsPage'));
const AIMethodologyPage = lazy(() => import('@/pages/info/AIMethodologyPage'));
const UseCasesPage = lazy(() => import('@/pages/info/UseCasesPage'));
const IntegrationsPage = lazy(() => import('@/pages/info/IntegrationsPage'));
const SecurityCompliancePage = lazy(() => import('@/pages/info/SecurityCompliancePage'));
const PricingPage = lazy(() => import('@/pages/info/PricingPage'));
const FAQPage = lazy(() => import('@/pages/info/FAQPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/info/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const AchievementsContactPage = lazy(() => import('@/pages/info/AchievementsContactPage'));
const BookDemoPage = lazy(() => import('@/pages/info/BookDemoPage'));
const DeploymentReadyPage = lazy(() => import('@/pages/deployment/DeploymentReadyPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DetailedAnalyticsPage = lazy(() => import('@/pages/analytics/DetailedAnalyticsPage'));
const WorkspaceDashboardPage = lazy(() => import('@/pages/main/WorkspaceDashboardPage'));
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
import { analysisCacheService } from '@/services/history-cache/analysisCache';
import { clearOwnerCvDocuments } from '@/services/workspace/cvDocumentStore';

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
    age: {},
    majorGroups: [],
    locationMandatory: true,
    minExpMandatory: true,
    seniorityMandatory: true,
    educationMandatory: false,
    ageMandatory: false,
    contactMandatory: false,
    industryMandatory: true,
    majorMandatory: false,
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
  '/app-docs',
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
  '/docs/cv-library',
  '/docs/jd-templates',
  '/docs/jd-standardizer',
  '/book-demo',
]);

const publicDocsPaths = new Set(publicMarketingPaths);

const protectedWorkspacePaths = new Set([
  '/',
  '/workspace',
  '/jd',
  '/upload',
  '/weights',
  '/analysis',
  '/dashboard',
  '/detailed-analytics',
  '/chatbot',
  '/feedback',
  '/records',
  '/jd-standardizer',
  '/history',
  '/jd-templates',
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
    navigate('/');
  };

  const handleFullReset = () => {
    setResetKey(Date.now());
  };

  const handleLoginRequest = () => {
    setShowLoginModal(true);
  };

  useEffect(() => {
    if (!isInitializing && !isLoggedIn && protectedWorkspacePaths.has(location.pathname)) {
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
      <UserSettingsProvider
        currentUser={currentUser}
        fallbackEmail={typeof window !== 'undefined' ? window.localStorage.getItem('authEmail') || '' : ''}
      >
        <MainLayout
          onResetRequest={handleFullReset}
          isLoggedIn={isLoggedIn}
          onLoginRequest={handleLoginRequest}
          currentUser={currentUser}
        />
      </UserSettingsProvider>
      {showLoginModal && (
        <div className="fixed inset-0 z-50">
          <LoginPage
            onLogin={handleLogin}
            onClose={protectedWorkspacePaths.has(location.pathname) ? undefined : () => setShowLoginModal(false)}
          />
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
  const { settings, syncError, syncStatus, updateAccountSnapshot } = useUserSettings();
  const initialStoredRun = useMemo(
    () => settings.workflow.restoreDraft ? readLatestAnalysisRun() : null,
    [settings.workflow.restoreDraft],
  );
  const initialWorkflowDraft = useMemo(
    () => settings.workflow.restoreDraft ? readWorkflowDraft() : null,
    [settings.workflow.restoreDraft],
  );
  const initialStoredWeights = useMemo(
    () => settings.workflow.rememberScoringConfig ? readStoredJson<WeightCriteria>('analysisWeights') : null,
    [settings.workflow.rememberScoringConfig],
  );
  const initialStoredHardFilters = useMemo(
    () => settings.workflow.rememberScoringConfig ? readStoredJson<HardFilters>('hardFilters') : null,
    [settings.workflow.rememberScoringConfig],
  );
  const initialStoredJdText = useMemo(() => {
    if (typeof window === 'undefined' || !settings.workflow.restoreDraft) return '';
    return window.localStorage.getItem('currentJD') || '';
  }, [settings.workflow.restoreDraft]);
  const initialStoredRawJdText = useMemo(() => {
    if (typeof window === 'undefined' || !settings.workflow.restoreDraft) return '';
    return window.localStorage.getItem('currentRawJD') || '';
  }, [settings.workflow.restoreDraft]);
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
  const [sidebarSettingsOpen, setSidebarSettingsOpen] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [appNotice, setAppNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

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
  const prevSyncStatus = usePrevious(syncStatus);

  useEffect(() => {
    setIsSidebarDrawerOpen(false);
  }, [location.pathname]);

  const showAppNotice = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    setAppNotice({ tone, message });
    noticeTimeoutRef.current = window.setTimeout(() => {
      setAppNotice(null);
      noticeTimeoutRef.current = null;
    }, 3600);
  }, []);

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

  useEffect(() => () => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
  }, []);

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
  const prevHadSuccessfulAnalysis = usePrevious(
    analysisResults.some((candidate) => candidate.status === 'SUCCESS')
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

  const handleExportReport = useCallback(() => {
    const successfulCandidates = analysisResults.filter((candidate) => candidate.status === 'SUCCESS');
    if (!successfulCandidates.length) {
      showAppNotice('Chưa có kết quả ứng viên để xuất báo cáo.', 'error');
      return;
    }

    const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = successfulCandidates.map((candidate, index) => [
      index + 1,
      candidate.candidateName,
      candidate.jobTitle || jobPosition,
      candidate.analysis?.['Tổng điểm'] || 0,
      candidate.analysis?.['Hạng'] || '',
      candidate.stageDecision?.label || '',
      candidate.email || '',
      candidate.phone || '',
    ].map(escapeCell).join(','));
    const csv = ['STT,Họ tên,Vị trí,Điểm AI,Hạng,Đề xuất,Email,Điện thoại', ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `supporthr-${(jobPosition || 'bao-cao').replace(/[^a-zA-Z0-9_-]+/g, '-')}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }, [analysisResults, jobPosition, showAppNotice]);

  const currentWorkspaceRun = useMemo<AnalysisRunData | null>(() => {
    if (!analysisResults.length) return readLatestAnalysisRun();
    return {
      timestamp: activeAnalysisContext?.timestamp || initialStoredRun?.timestamp || Date.now(),
      job: {
        position: jobPosition,
        locationRequirement: hardFilters.location || '',
      },
      candidates: analysisResults,
    };
  }, [activeAnalysisContext?.timestamp, analysisResults, hardFilters.location, initialStoredRun?.timestamp, jobPosition]);

  const handleOpenWorkspaceSession = useCallback((history: HistoryEntry | null, session: WorkspaceSessionViewModel) => {
    if (history?.fullPayload) {
      handleRestore({ ...history.fullPayload, timestamp: history.timestamp });
      return;
    }
    if (session.candidates.length) {
      setAnalysisResults(session.candidates);
      setJobPosition(session.title);
      setCompletedSteps(['jd', 'upload', 'weights', 'analysis']);
    }
    navigate(`/analysis?session=${encodeURIComponent(session.id)}`);
  }, [handleRestore, navigate]);

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
    if (syncStatus === 'error' && prevSyncStatus !== 'error' && settings.notifications.syncErrors) {
      showAppNotice(syncError || 'Đồng bộ cài đặt thất bại. Hệ thống đang dùng bản cục bộ.', 'error');
    }
  }, [prevSyncStatus, settings.notifications.syncErrors, showAppNotice, syncError, syncStatus]);

  useEffect(() => {
    if (prevIsLoading && !isLoading && analysisResults.length > 0) {
      const successfulCandidates = analysisResults.filter((candidate) => candidate.status === 'SUCCESS');
      if (successfulCandidates.length > 0) {
        const candidatesWithIds = successfulCandidates.map((candidate) => ({
          ...candidate,
          id: candidate.id || `${candidate.fileName}-${candidate.candidateName}-${Math.random()}`,
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
        const baseContext: ActiveAnalysisContext = {
          sessionId: buildAnalysisSessionId(analysisRun.timestamp),
          timestamp: analysisRun.timestamp,
          jobPosition: jobPosition || analysisRun.job.position,
          jdHash: buildJdHash(jdText),
        };
        saveActiveAnalysisContext(baseContext);
        setActiveAnalysisContext(baseContext);

        if (settings.notifications.analysisComplete && !prevHadSuccessfulAnalysis) {
          showAppNotice('Phan tich AI da hoan tat.', 'success');
        }

        if (settings.workflow.autoSaveHistory) {
          try {
            cvFilterHistoryService.addFilterSession(
            jobPosition || 'Không rõ vị trí',
            hardFilters.industry || 'Khác'
            );
            cvFilterHistoryService.trimHistory(settings.sync.historyRetention);
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
          .then(async (historyId) => {
            if (historyId) {
              const nextContext: ActiveAnalysisContext = {
                ...baseContext,
                historyId,
              };
              saveActiveAnalysisContext(nextContext);
              setActiveAnalysisContext(nextContext);
            }

            if (currentUser) {
              try {
                await UserProfileService.cleanupOldHistory(currentUser.uid, settings.sync.historyRetention);
              } catch (error) {
                console.warn('Failed to trim remote history:', error);
              }
            }

            if (settings.notifications.historySaved) {
              showAppNotice('Da luu history phan tich.', 'success');
            }
          })
          .catch((error) => console.warn('Save history failed', error));
        } else {
          cvFilterHistoryService.trimHistory(settings.sync.historyRetention);
        }
      }
    }
  }, [
    analysisResults,
    currentUser,
    hardFilters,
    isLoading,
    jdText,
    jobPosition,
    prevHadSuccessfulAnalysis,
    prevIsLoading,
    settings.notifications.analysisComplete,
    settings.notifications.historySaved,
    settings.sync.historyRetention,
    settings.workflow.autoSaveHistory,
    showAppNotice,
    userEmail,
    weights,
  ]);

  useEffect(() => {
    if (!settings.workflow.autoSaveDraft) {
      clearWorkflowDraft();
      clearWorkflowActivity();
      return;
    }

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
    activeAnalysisContext,
    analysisResults,
    completedSteps,
    hardFilters,
    jdText,
    jobPosition,
    rawJdText,
    settings.workflow.autoSaveDraft,
    weights,
  ]);

  useEffect(() => {
    if (settings.workflow.autoSaveDraft) {
      localStorage.setItem('currentJD', jdText);
      localStorage.setItem('currentRawJD', rawJdText);
      localStorage.setItem('currentLocation', hardFilters.location || '');
    } else {
      localStorage.removeItem('currentJD');
      localStorage.removeItem('currentRawJD');
      localStorage.removeItem('currentLocation');
    }

    if (settings.workflow.rememberScoringConfig) {
      localStorage.setItem('analysisWeights', JSON.stringify(weights));
      localStorage.setItem('hardFilters', JSON.stringify(hardFilters));
    } else {
      localStorage.removeItem('analysisWeights');
      localStorage.removeItem('hardFilters');
    }
  }, [
    hardFilters,
    jdText,
    rawJdText,
    settings.workflow.autoSaveDraft,
    settings.workflow.rememberScoringConfig,
    weights,
  ]);

  useEffect(() => {
    cvFilterHistoryService.trimHistory(settings.sync.historyRetention);

    if (!currentUser) return;

    void UserProfileService.cleanupOldHistory(currentUser.uid, settings.sync.historyRetention).catch((error) => {
      console.warn('Failed to apply remote history retention:', error);
    });
  }, [currentUser, settings.sync.historyRetention]);

  useEffect(() => {
    if (!settings.workflow.autoSaveDraft) {
      clearWorkflowActivity();
      return;
    }

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
  }, [settings.workflow.autoSaveDraft]);

  const activeStep = useMemo((): AppStep => {
    switch (location.pathname) {
      case '/process':
      case '/app-docs':
      case '/terms':
      case '/privacy-policy':
      case '/faq':
      case '/pricing':
        return 'app-docs';
      case '/':
      case '/workspace': return 'home';
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
      case '/history': return 'history';
      case '/jd-templates': return 'jd-templates';
      default:
        return 'home';
    }
  }, [location.pathname]);

  const handleNewSession = useCallback(() => {
    setJdText('');
    setRawJdText('');
    setJobPosition('');
    if (settings.workflow.newSessionMode === 'keep-config' && settings.workflow.rememberScoringConfig) {
      localStorage.setItem('analysisWeights', JSON.stringify(weights));
      localStorage.setItem('hardFilters', JSON.stringify(hardFilters));
    } else {
      setWeights(initialWeights);
      setHardFilters(createDefaultHardFilters());
      localStorage.removeItem('analysisWeights');
      localStorage.removeItem('hardFilters');
    }
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
    setCompletedSteps([]);
    const fixedJD = settings.workflow.fixedJD;
    if (fixedJD?.enabled && fixedJD.jdText) {
      setJdText(fixedJD.jdText);
      setRawJdText(fixedJD.jdText);
      setJobPosition(fixedJD.name || '');
      localStorage.setItem('currentJD', fixedJD.jdText);
    }
    navigate('/jd');
  }, [hardFilters, navigate, settings.workflow.fixedJD, settings.workflow.newSessionMode, settings.workflow.rememberScoringConfig, weights]);

  const setActiveStep = useCallback((step: AppStep) => {
    const pathMap: Partial<Record<AppStep, string>> = {
      home: '/workspace',
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

  const isWelcomeRoute = location.pathname === '/welcome';
  const isMarketingRoute = publicMarketingPaths.has(location.pathname);
  
  // Documentation is public and always uses its own header-only layout.
  const isDocsRoute = publicDocsPaths.has(location.pathname);
  const shouldUseWorkspaceShell = isLoggedIn && !isMarketingRoute && !isWelcomeRoute && !isDocsRoute;
  const isWorkflowView = shouldUseWorkspaceShell;
  const isLandingView = !shouldUseWorkspaceShell;
  const isStandaloneToolRoute = false;
  const shouldShowDesktopAppMenu = false;

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
    markStepAsCompleted('jd');
    setActiveStep('jd');
  }, [markStepAsCompleted, setActiveStep]);

  const handleSaveAccountProfile = useCallback(async (payload: { displayName: string; avatar: string | null }) => {
    const nextDisplayName = payload.displayName.trim() || (userEmail ? userEmail.split('@')[0] : 'Support HR');
    const nextAvatar = payload.avatar;

    setUserName(nextDisplayName);
    setUserAvatar(nextAvatar);

    if (currentUser?.email) {
      await UserProfileService.saveUserProfile(
        currentUser.uid,
        currentUser.email,
        nextDisplayName,
        nextAvatar || undefined,
      );

      if (nextAvatar) {
        await UserProfileService.updateUserAvatar(currentUser.uid, nextAvatar);
      }
    } else if (userEmail) {
      localStorage.setItem(`avatar_${userEmail}`, nextAvatar || '');
    }

    updateAccountSnapshot({
      displayName: nextDisplayName,
      avatar: nextAvatar,
      email: currentUser?.email || userEmail,
    });
  }, [currentUser, updateAccountSnapshot, userEmail]);

  const handleClearWorkflowDraft = useCallback(() => {
    clearWorkflowDraft();
    clearWorkflowActivity();
    localStorage.removeItem('currentJD');
    localStorage.removeItem('currentRawJD');
    localStorage.removeItem('currentLocation');
  }, []);

  const handleClearLocalCache = useCallback(() => {
    analysisCacheService.clearCache();
    localStorage.removeItem('cvAnalysisCache');
  }, []);

  const handleClearLocalHistory = useCallback(() => {
    cvFilterHistoryService.clearHistory();
    clearLatestAnalysisRun();
    clearActiveAnalysisContext();
    localStorage.removeItem('analysisHistory');
    localStorage.removeItem('cvAnalysis.latest');
  }, []);

  const handleClearSyncedData = useCallback(async () => {
    await DataSyncService.clearUserSyncedData();

    if (currentUser) {
      try {
        await UserProfileService.cleanupOldHistory(currentUser.uid, 0);
      } catch (error) {
        console.warn('Failed to clear remote history:', error);
      }
    }
  }, [currentUser]);

  const handleCloseStandalonePage = useCallback(() => {
    const routeState = location.state as { from?: string } | null;
    const from = routeState?.from;
    navigate(from && from !== location.pathname ? from : '/workspace');
  }, [location.pathname, location.state, navigate]);

  const authFallback = <div className="h-full min-h-[100dvh] bg-[#f5f5f7]" aria-hidden="true" />;

  const appDocumentationPage = <AppDocumentationPage />;

  const screenerPageProps = {
    jdText, setJdText,
    rawJdText, setRawJdText,
    jobPosition, setJobPosition,
    weights, setWeights,
    hardFilters, setHardFilters: setHardFiltersWithFlag,
    cvFiles, setCvFiles,
    analysisResults, setAnalysisResults,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
    activeStep, setActiveStep,
    completedSteps, markStepAsCompleted,
    documentOwner: currentUser?.uid || userEmail || 'local',
    analysisSessionId: activeAnalysisContext?.sessionId,
    onOpenJdTemplates: () => {
      setJdTemplateSelectionMode('welcome');
      setJdTemplatesModalOpen(true);
    },
  };

  return (
    <div className={`h-[100dvh] bg-white text-slate-900 flex flex-col overflow-hidden ${shouldUseWorkspaceShell ? 'apple-workspace-shell' : ''} ${shouldShowDesktopAppMenu ? 'supporthr-shell--with-app-menu' : ''} ${className || ''}`}>
      {shouldShowDesktopAppMenu && (
        <DesktopAppMenuBar
          sidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleSidebar={() => setIsDesktopSidebarCollapsed((value) => !value)}
        />
      )}

      {shouldUseWorkspaceShell && !isDesktopSidebarCollapsed && (
        <div className="hidden md:block">
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
            onOpenSettingsPanel={() => setSidebarSettingsOpen(true)}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      {shouldUseWorkspaceShell && (
        <div className="md:hidden">
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
            onOpenSettingsPanel={() => setSidebarSettingsOpen(true)}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      <main
        className={`main-content supporthr-main pb-0 ${shouldUseWorkspaceShell ? `supporthr-main--with-sidebar ${isDesktopSidebarCollapsed ? 'supporthr-main--sidebar-collapsed' : ''}` : shouldShowDesktopAppMenu ? 'lg:pt-[34px]' : ''} flex-1 flex flex-col min-h-0 overflow-x-hidden transition-all duration-200 ease-in-out ${!isLandingView
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
            onExportReport={handleExportReport}
            onOpenMobileSidebar={() => setIsSidebarDrawerOpen(true)}
            onNewSession={handleNewSession}
            sidebarCollapsed={isDesktopSidebarCollapsed}
            onToggleSidebar={() => setIsDesktopSidebarCollapsed((value) => !value)}
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
        <div className={`flex h-full min-h-0 w-full flex-1 flex-col ${isWorkflowView ? 'overflow-hidden' : isLandingView || isStandaloneToolRoute ? 'overflow-y-auto custom-scrollbar' : 'max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto py-4 overflow-y-auto custom-scrollbar'}`}>
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
              <Route path="/welcome" element={<Navigate to="/" replace />} />
              <Route path="/" element={isLoggedIn ? (
                <WorkspaceDashboardPage
                  userEmail={userEmail}
                  currentRun={currentWorkspaceRun}
                  onOpenSession={handleOpenWorkspaceSession}
                />
              ) : authFallback} />
              <Route path="/workspace" element={<Navigate to="/" replace />} />
              <Route path="/jd" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : authFallback} />
              <Route path="/upload" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : authFallback} />
              <Route path="/weights" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : authFallback} />
              <Route path="/analysis" element={isLoggedIn ? <ScreenerPage {...screenerPageProps} /> : authFallback} />

              <Route path="/dashboard" element={isLoggedIn ? <Navigate to="/" replace /> : authFallback} />
              <Route path="/detailed-analytics" element={isLoggedIn ? <DetailedAnalyticsPage candidates={analysisResults} jobPosition={jobPosition} onReset={onResetRequest} /> : authFallback} />
              <Route path="/chatbot" element={isLoggedIn ? <CandidateSuggestions candidates={analysisResults} jobPosition={jobPosition} /> : authFallback} />
              <Route path="/feedback" element={isLoggedIn ? <AIFeedbackPage candidates={analysisResults} jobPosition={jobPosition} weights={weights} hardFilters={hardFilters} analysisContext={activeAnalysisContext} /> : authFallback} />
              <Route path="/records" element={isLoggedIn ? <FilteredCvLibraryPage userEmail={userEmail} /> : authFallback} />
              <Route path="/jd-standardizer" element={isLoggedIn ? <JDStandardizerPage onUseJD={handleUseStandardizedJD} /> : authFallback} />
              <Route path="/jd-templates" element={isLoggedIn ? (
                <div className="min-h-screen bg-white">
                  <JDTemplatesModal
                    isOpen
                    presentation="page"
                    onClose={handleCloseStandalonePage}
                    onSelectTemplate={(template: JDTemplate) => handleSelectJDTemplate(template, 'analysis')}
                  />
                </div>
              ) : authFallback} />
              <Route path="/app-docs" element={appDocumentationPage} />
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/guide" element={<DemoPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/ai-methodology" element={<AIMethodologyPage />} />
              <Route path="/use-cases" element={<UseCasesPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/docs/cv-library" element={<ProductFeatureDocsPage />} />
              <Route path="/docs/jd-templates" element={<ProductFeatureDocsPage />} />
              <Route path="/docs/jd-standardizer" element={<ProductFeatureDocsPage />} />
              <Route path="/security" element={<SecurityCompliancePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/team" element={<AchievementsContactPage />} />
              <Route path="/contact-ready" element={<DeploymentReadyPage />} />
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

      {/* Sidebar Settings Modal */}
      <SidebarSettingsModal
        isOpen={sidebarSettingsOpen}
        onClose={() => setSidebarSettingsOpen(false)}
        userEmail={currentUser?.email || userEmail}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={isLoggedIn ? handleLogout : undefined}
        onSaveAccountProfile={handleSaveAccountProfile}
        onClearWorkflowDraft={handleClearWorkflowDraft}
        onClearLocalCache={handleClearLocalCache}
        onClearLocalHistory={handleClearLocalHistory}
        onClearLocalDocuments={() => clearOwnerCvDocuments(currentUser?.uid || userEmail || 'local')}
        onClearSyncedData={handleClearSyncedData}
      />

      {appNotice ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[90] max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 text-[13px] font-medium shadow-xl ${
              appNotice.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {appNotice.message}
          </div>
        </div>
      ) : null}

      {/* Vercel Analytics & Speed Insights for performance monitoring */}
      <Analytics />
      <SpeedInsights />
      <WebVitalsReporter />
    </div>
  );
};

export default App;
