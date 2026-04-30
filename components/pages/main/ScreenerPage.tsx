import React, { Suspense, lazy, useState, useCallback } from 'react';
import type { AppStep, Candidate, HardFilters, WeightCriteria } from '../../../assets/types';
import JDInput from '../../../components/features/criteria-config/JDInput';
import JDMetaToolbar from '../../../components/features/criteria-config/JDMetaToolbar';
import CVScreenerWelcome from './CVScreenerWelcome';

const WeightsConfig = lazy(() => import('../../../components/features/criteria-config/WeightsConfig'));
const AnalysisResults = lazy(() => import('../../../components/features/cv-management/AnalysisResults'));
import CVUploadMini from '../../../components/features/cv-management/CVUploadMini';
import { analyzeCVs } from '../../../services/ai-ml/models/gemini/geminiService';

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center h-40 gap-4">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 -full border-[3px] border-transparent border-t-cyan-400 border-r-cyan-400/40 animate-spin"
        style={{ animationDuration: '0.8s' }} />
      <div className="absolute inset-1.5 -full border-[3px] border-transparent border-b-indigo-400 border-l-indigo-400/40 animate-spin"
        style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
    </div>
    <span className="text-[10px] uppercase tracking-[0.3em] font-semibold animate-pulse text-slate-600">
      Đang tải...</span>
  </div>
);

interface ScreenerPageProps {
  jdText: string;
  setJdText: React.Dispatch<React.SetStateAction<string>>;
  rawJdText: string;
  setRawJdText: React.Dispatch<React.SetStateAction<string>>;
  jobPosition: string;
  setJobPosition: React.Dispatch<React.SetStateAction<string>>;
  weights: WeightCriteria;
  setWeights: React.Dispatch<React.SetStateAction<WeightCriteria>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
  analysisResults: Candidate[];
  setAnalysisResults: React.Dispatch<React.SetStateAction<Candidate[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMessage: string;
  setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
  activeStep: AppStep;
  setActiveStep: (step: AppStep) => void;
  completedSteps: AppStep[];
  markStepAsCompleted: (step: AppStep) => void;
  onWelcomeChange?: (visible: boolean) => void;
}

const ScreenerPage: React.FC<ScreenerPageProps> = (props) => {
  const { activeStep } = props;
  const [showWelcome, setShowWelcome] = useState<boolean>(() => props.jdText.trim().length === 0);

  const hideWelcome = useCallback(() => {
    setShowWelcome(false);
    props.onWelcomeChange?.(false);
  }, [props.onWelcomeChange]);

  const handleStartAnalysis = async () => {
    props.setActiveStep('analysis');
    props.setIsLoading(true);
    props.setAnalysisResults([]);
    props.setLoadingMessage('Đang khởi tạo...');

    try {
      const analysisGenerator = analyzeCVs(props.jdText, props.weights, props.hardFilters, props.cvFiles);
      for await (const result of analysisGenerator) {
        if (result.status === 'progress') {
          props.setLoadingMessage(result.message);
        } else {
          props.setAnalysisResults(prev => [...prev, result as Candidate]);
        }
      }
    } catch (err) {
      console.error("Lỗi phân tích CV:", err);
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
      props.setAnalysisResults(prev => {
        if (prev.some(c => c.candidateName === 'Lỗi Hệ Thống')) return prev;
        return [...prev, {
          id: `system-error-${Date.now()}`,
          status: 'FAILED',
          error: message,
          candidateName: 'Lỗi Hệ Thống',
          fileName: 'N/A',
          jobTitle: '', industry: '', department: '', experienceLevel: '', detectedLocation: '',
        }];
      });
    } finally {
      props.setIsLoading(false);
      props.setLoadingMessage('Hoàn tất phân tích!');
    }
  };

  if (activeStep === 'jd' && showWelcome) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <CVScreenerWelcome
          onGetStarted={hideWelcome}
          onFileProcessed={(data) => {
            props.setJdText(data.jdText);
            if (data.jobPosition) props.setJobPosition(data.jobPosition);
            if (data.hardFilters && Object.keys(data.hardFilters).length > 0) {
              props.setHardFilters((prev) => ({ ...prev, ...data.hardFilters }));
            }
            hideWelcome();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#0B192C]">
      {activeStep === 'jd' && (
        <JDMetaToolbar
          jdText={props.jdText}
          setJdText={props.setJdText}
          rawJdText={props.rawJdText}
          setRawJdText={props.setRawJdText}
          jobPosition={props.jobPosition}
          setJobPosition={props.setJobPosition}
          hardFilters={props.hardFilters}
          setHardFilters={props.setHardFilters}
          onComplete={() => {
            if (props.cvFiles.length === 0) {
              alert('Vui lòng tải lên ít nhất 1 CV để tiếp tục.');
              return;
            }
            props.markStepAsCompleted('jd');
            props.setActiveStep('weights');
          }}
          onBackToWelcome={() => setShowWelcome(true)}
        />
      )}

      {/* ── Nội dung module ────────────────────────────────────── */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          activeStep === 'jd' || activeStep === 'analysis'
            ? 'overflow-hidden'
            : 'custom-scrollbar overflow-y-auto'
        }`}
      >
        <div className={activeStep === 'jd' ? 'flex h-full min-h-0 flex-1 flex-col md:flex-row' : 'hidden'}>
          <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-slate-800">
            <JDInput
              hideToolbar
              jdText={props.jdText}
              setJdText={props.setJdText}
              jobPosition={props.jobPosition}
              setJobPosition={props.setJobPosition}
              hardFilters={props.hardFilters}
              setHardFilters={props.setHardFilters}
              onComplete={() => {
                if (props.cvFiles.length === 0) {
                  alert('Vui lòng tải lên ít nhất 1 CV để tiếp tục.');
                  return;
                }
                props.markStepAsCompleted('jd');
                props.setActiveStep('weights');
              }}
              onBackToWelcome={() => setShowWelcome(true)}
            />
          </div>
          <div className="w-full md:w-[350px] lg:w-[400px] shrink-0 h-[40vh] md:h-full bg-[#0B192C]">
            <CVUploadMini cvFiles={props.cvFiles} setCvFiles={props.setCvFiles} />
          </div>
        </div>

        <div className={activeStep === 'weights' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <WeightsConfig
              weights={props.weights}
              setWeights={props.setWeights}
              hardFilters={props.hardFilters}
              setHardFilters={props.setHardFilters}
              onComplete={() => {
                props.markStepAsCompleted('weights');
                handleStartAnalysis();
              }}
            />
          </Suspense>
        </div>

        <div className={activeStep === 'analysis' ? 'flex h-full min-h-0 flex-1 flex-col' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <AnalysisResults
              isLoading={props.isLoading}
              loadingMessage={props.loadingMessage}
              results={props.analysisResults}
              jobPosition={props.jobPosition}
              locationRequirement={props.hardFilters.location}
              jdText={props.jdText}
              rawJdText={props.rawJdText}
              setActiveStep={props.setActiveStep}
              markStepAsCompleted={props.markStepAsCompleted}
            />
          </Suspense>
        </div>

        <div className={activeStep === 'chatbot' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <div className="p-4"><ModuleLoader /></div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ScreenerPage;



