import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import type { AppStep, Candidate, HardFilters, WeightCriteria } from '@/types';
import CVScreenerWelcome from '@/pages/main/CVScreenerWelcome';
import { analyzeCVs } from '@/services/screening/frontendScreeningService';
import { getSafeErrorMessage } from '@/utils/errorMessages';
import SupportHRLoading from '@/components/common/SupportHRLoading';
import { findCvDocument, linkCvDocument, storeCvFiles } from '@/services/workspace/cvDocumentStore';
import { broadcastProgress, broadcastSessionDone, broadcastSessionStart, clearSession } from '@/services/desktopSessionService';

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
  documentOwner?: string;
  analysisSessionId?: string;
}

const ScreenerPage: React.FC<ScreenerPageProps> = (props) => {
  const { activeStep } = props;
  const [intakeNotice, setIntakeNotice] = useState('');

  useEffect(() => {
    if (!props.cvFiles.length) return;
    void storeCvFiles(props.documentOwner || 'local', props.cvFiles).catch((error) => {
      console.warn('Unable to persist CV files locally:', error);
    });
  }, [props.cvFiles, props.documentOwner]);

  useEffect(() => {
    if (!props.analysisResults.length || !props.analysisSessionId) return;
    const owner = props.documentOwner || 'local';
    void Promise.all(props.analysisResults.map(async (candidate) => {
      const document = await findCvDocument(owner, candidate.fileName).catch(() => null);
      if (document) await linkCvDocument(owner, props.analysisSessionId!, candidate.id, document);
    })).catch((error) => console.warn('Unable to link local CV documents:', error));
  }, [props.analysisResults, props.analysisSessionId, props.documentOwner]);

  useEffect(() => {
    if (props.jdText.trim().length > 0) setIntakeNotice('');
  }, [props.jdText]);

  const handleUseTemplate = useCallback(() => {
    props.onOpenJdTemplates?.();
  }, [props.onOpenJdTemplates]);

  const handleContinueIntake = useCallback(() => {
    if (props.jdText.trim().length === 0) {
      setIntakeNotice('Vui lòng nhập hoặc tải JD trước khi tiếp tục.');
      props.setActiveStep('jd');
      return;
    }

    props.markStepAsCompleted('jd');

    if (props.cvFiles.length === 0) {
      props.setActiveStep('upload');
      return;
    }

    props.markStepAsCompleted('upload');
    props.setActiveStep('weights');
  }, [props]);

  const handleCvReady = useCallback(() => {
    if (props.jdText.trim().length === 0 || props.cvFiles.length === 0) return;

    props.markStepAsCompleted('jd');
    props.markStepAsCompleted('upload');
    props.setActiveStep('weights');
  }, [props]);

  const handleJdProcessed = useCallback((data: {
    jdText: string;
    rawJdText?: string;
    jobPosition: string;
    hardFilters: Partial<HardFilters>;
  }) => {
    props.setJdText(data.jdText);
    props.setRawJdText(data.rawJdText || data.jdText);
    if (data.jobPosition) props.setJobPosition(data.jobPosition);
    if (data.hardFilters && Object.keys(data.hardFilters).length > 0) {
      props.setHardFilters((prev) => ({ ...prev, ...data.hardFilters }));
    }

    props.markStepAsCompleted('jd');
    props.setActiveStep('upload');
  }, [props]);

  const handleStartAnalysis = async () => {
    props.setActiveStep('analysis');
    props.setIsLoading(true);
    props.setAnalysisResults([]);
    props.setLoadingMessage('Đang khởi tạo...');

    const totalCvs = props.cvFiles.length;
    let analyzedCount = 0;

    void broadcastSessionStart(props.jobPosition || 'Sàng lọc CV', totalCvs).catch(() => {});

    try {
      const analysisGenerator = analyzeCVs(props.jdText, props.weights, props.hardFilters, props.cvFiles);
      for await (const result of analysisGenerator) {
        if (result.status === 'progress') {
          props.setLoadingMessage(result.message);
        } else {
          analyzedCount += 1;
          props.setAnalysisResults((prev) => [...prev, result as Candidate]);
          void broadcastProgress(analyzedCount, totalCvs).catch(() => {});
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
      void broadcastSessionDone(analyzedCount, totalCvs).catch(() => {});
    }
  };

  return (
    <div className="feature-page-shell flex h-full flex-1 flex-col overflow-hidden bg-white">
      <div className={`flex min-h-0 flex-1 flex-col ${activeStep === 'analysis' ? 'overflow-hidden' : 'overflow-hidden'}`}>
        {intakeNotice && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
            {intakeNotice}
          </div>
        )}

        {(activeStep === 'jd' || activeStep === 'upload') && (
          <CVScreenerWelcome
            embedded
            initialStage={activeStep === 'upload' ? 'cv' : 'jd'}
            continueLabel="Thiết lập mặc định"
            onGetStarted={handleContinueIntake}
            onUseTemplate={handleUseTemplate}
            onCvReady={handleCvReady}
            cvFiles={props.cvFiles}
            setCvFiles={props.setCvFiles}
            hasPreparedJd={props.jdText.trim().length > 0}
            jdText={props.jdText}
            rawJdText={props.rawJdText}
            jobPosition={props.jobPosition}
            hardFilters={props.hardFilters}
            onFileProcessed={handleJdProcessed}
          />
        )}

        <div className={activeStep === 'weights' ? 'block h-full' : 'hidden'}>
          <Suspense fallback={<ModuleLoader />}>
            <WeightsConfig
              weights={props.weights}
              setWeights={props.setWeights}
              hardFilters={props.hardFilters}
              setHardFilters={props.setHardFilters}
              jdText={props.jdText}
              onComplete={() => {
                props.markStepAsCompleted('jd');
                props.markStepAsCompleted('upload');
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
              setActiveStep={props.setActiveStep}
              markStepAsCompleted={props.markStepAsCompleted}
              weights={props.weights}
              hardFilters={props.hardFilters}
              documentOwner={props.documentOwner}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ScreenerPage;
