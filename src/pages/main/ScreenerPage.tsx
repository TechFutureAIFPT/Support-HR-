import React, { Suspense, lazy, useCallback, useState } from 'react';
import type { AppStep, Candidate, HardFilters, WeightCriteria } from '@/shared/types';
import JDInput from '@/features/criteria-config/JDInput';
import JDMetaToolbar from '@/features/criteria-config/JDMetaToolbar';
import CVScreenerWelcome from '@/pages/main/CVScreenerWelcome';
import CVUploadMini from '@/features/cv-management/CVUploadMini';
import { analyzeCVs } from '@/lib/services/screening/frontendScreeningService';
import { getSafeErrorMessage } from '@/shared/utils/errorMessages';
import SupportHRLoading from '@/shared/ui/common/SupportHRLoading';

const WeightsConfig = lazy(() => import('@/features/criteria-config/WeightsConfig'));
const AnalysisResults = lazy(() => import('@/features/cv-management/AnalysisResults'));

const ModuleLoader = () => (
  <SupportHRLoading
    mode="inline"
    minHeightClass="min-h-[12rem]"
    label="Support HR // Module"
    title="Đang tải module"
    description="Chuẩn bị công cụ sàng lọc và hiển thị dữ liệu."
    stages={[
      { label: 'Nạp UI', hint: 'Khởi tạo thành phần', tone: 'cyan' },
      { label: 'Kết nối', hint: 'Đồng bộ trạng thái', tone: 'violet' },
      { label: 'Sẵn sàng', hint: 'Cho bước tiếp theo', tone: 'emerald' },
    ]}
  />
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
  onOpenJdTemplates?: () => void;
}

const ScreenerPage: React.FC<ScreenerPageProps> = (props) => {
  const { activeStep } = props;
  const [showWelcome, setShowWelcome] = useState<boolean>(() => props.jdText.trim().length === 0);
  const [manualJdFlow, setManualJdFlow] = useState(false);

  const hideWelcome = useCallback(() => {
    setShowWelcome(false);
    props.onWelcomeChange?.(false);
  }, [props.onWelcomeChange]);

  const showWelcomePanel = useCallback(() => {
    setShowWelcome(true);
    props.onWelcomeChange?.(true);
  }, [props.onWelcomeChange]);

  const handleUseTemplate = useCallback(() => {
    props.onOpenJdTemplates?.();
  }, [props.onOpenJdTemplates]);

  const moveToWeights = useCallback(() => {
    props.markStepAsCompleted('jd');
    props.setActiveStep('weights');
    setManualJdFlow(false);
  }, [props.markStepAsCompleted, props.setActiveStep]);

  const handleContinueAfterWelcome = useCallback(() => {
    hideWelcome();

    if (manualJdFlow && props.jdText.trim().length > 0 && props.cvFiles.length > 0) {
      moveToWeights();
    }
  }, [hideWelcome, manualJdFlow, moveToWeights, props.cvFiles.length, props.jdText]);

  const handleJdComplete = useCallback(() => {
    if (props.cvFiles.length === 0) {
      if (manualJdFlow) {
        showWelcomePanel();
        return;
      }

      alert('Vui lòng tải lên ít nhất 1 CV để tiếp tục.');
      return;
    }

    moveToWeights();
  }, [manualJdFlow, moveToWeights, props.cvFiles.length, showWelcomePanel]);

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
          props.setAnalysisResults((prev) => [...prev, result as Candidate]);
        }
      }
    } catch (err) {
      console.error('Lỗi phân tích CV:', err);
      const message = getSafeErrorMessage(err, 'ai');
      props.setAnalysisResults((prev) => {
        if (prev.some((candidate) => candidate.candidateName === 'Đang có lỗi')) return prev;
        return [
          ...prev,
          {
            id: `system-error-${Date.now()}`,
            status: 'FAILED',
            error: message,
            candidateName: 'Đang có lỗi',
            fileName: 'N/A',
            jobTitle: '',
            industry: '',
            department: '',
            experienceLevel: '',
            detectedLocation: '',
          },
        ];
      });
    } finally {
      props.setIsLoading(false);
      props.setLoadingMessage('Hoàn tất phân tích!');
    }
  };

  if (activeStep === 'jd' && showWelcome) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <CVScreenerWelcome
          onGetStarted={handleContinueAfterWelcome}
          onUseTemplate={handleUseTemplate}
          cvFiles={props.cvFiles}
          setCvFiles={props.setCvFiles}
          hasPreparedJd={props.jdText.trim().length > 0}
          onFileProcessed={(data) => {
            setManualJdFlow(false);
            props.setJdText(data.jdText);
            if (data.jobPosition) props.setJobPosition(data.jobPosition);
            if (data.hardFilters && Object.keys(data.hardFilters).length > 0) {
              props.setHardFilters((prev) => ({ ...prev, ...data.hardFilters }));
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="feature-page-shell flex h-full flex-1 flex-col overflow-hidden bg-black">
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
          onComplete={handleJdComplete}
          onBackToWelcome={showWelcomePanel}
        />
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col ${
          activeStep === 'jd' || activeStep === 'analysis'
            ? 'overflow-hidden'
            : 'custom-scrollbar overflow-y-auto'
        }`}
      >
        <div className={activeStep === 'jd' ? 'flex h-full min-h-0 flex-1 flex-col md:flex-row' : 'hidden'}>
          <div className="flex min-w-0 flex-1 flex-col border-b border-slate-800 md:border-b-0 md:border-r">
            <JDInput
              hideToolbar
              jdText={props.jdText}
              setJdText={props.setJdText}
              jobPosition={props.jobPosition}
              setJobPosition={props.setJobPosition}
              hardFilters={props.hardFilters}
              setHardFilters={props.setHardFilters}
              onComplete={handleJdComplete}
              onBackToWelcome={showWelcomePanel}
            />
          </div>

          <div className="h-[40vh] w-full shrink-0 bg-black md:h-full md:w-[350px] lg:w-[400px]">
            <CVUploadMini cvFiles={props.cvFiles} />
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
              weights={props.weights}
              hardFilters={props.hardFilters}
            />
          </Suspense>
        </div>

        <div className={activeStep === 'chatbot' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <div className="p-4">
              <ModuleLoader />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ScreenerPage;
