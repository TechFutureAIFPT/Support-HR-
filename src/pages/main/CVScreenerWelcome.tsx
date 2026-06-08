import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  FolderOpen,
  HardDriveUpload,
  UploadCloud,
  X,
} from 'lucide-react';
import { extractTextFromJdFile } from '@/services/file-processing/ocrService';
import {
  extractHardFiltersFromJD,
  extractJobPositionFromJD,
  filterAndStructureJD,
} from '@/services/screening/frontendScreeningService';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import type { HardFilters } from '@/types';
import { getSafeErrorMessage, isRedirectingToGoogle } from '@/utils/errorMessages';

interface CVScreenerWelcomeProps {
  onGetStarted: () => void;
  onUseTemplate?: () => void;
  onFileProcessed: (data: {
    jdText: string;
    jobPosition: string;
    hardFilters: Partial<HardFilters>;
  }) => void;
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
  hasPreparedJd?: boolean;
}

type IntakeStage = 'jd' | 'cv';

const PROCESSING_STEPS = [
  'Đọc tệp JD',
  'Chuẩn hóa nội dung',
  'Tách chức danh',
  'Trích xuất tiêu chí',
];

const MAX_CV_PER_BATCH = 20;
const FILE_ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg';

const accent = '#f5d6bb';
const modalPanelClass = 'border border-white/10 bg-black/90 shadow-[0_24px_80px_rgba(0,0,0,0.34)]';
const secondaryButtonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-none px-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-[#f5d6bb] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:px-3';
const primaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-none bg-white px-4 text-sm font-black text-black shadow-[0_18px_60px_rgba(255,255,255,0.08)] transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-600 disabled:shadow-none sm:h-11 sm:px-5';

const StepButton = ({
  active,
  disabled,
  index,
  label,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  index: string;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group relative flex min-w-0 items-center gap-2 py-2 text-left transition-colors ${
      active
        ? 'text-white'
        : 'text-zinc-500 hover:text-zinc-200'
    } disabled:cursor-not-allowed disabled:opacity-45`}
  >
    <span
      className={`supporthr-mono text-[10px] font-black ${
        active ? 'text-[#f5d6bb]' : 'text-zinc-600 group-hover:text-zinc-400'
      }`}
    >
      {index}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold leading-5">{label}</span>
      <span className="mt-0.5 hidden truncate text-[11px] text-zinc-600 sm:block">{description}</span>
    </span>
    <span
      className={`absolute inset-x-0 -bottom-px h-px transition-colors ${
        active ? 'bg-[#f5d6bb]' : 'bg-transparent'
      }`}
    />
  </button>
);

const ProcessingModal = ({
  step,
}: {
  step: number;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
    <div className={`${modalPanelClass} w-full max-w-sm p-5 sm:p-6`}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-[#f5d6bb]/35 bg-[#f5d6bb]/10 text-[#f5d6bb]">
          <div className="absolute inset-2 animate-ping border border-[#f5d6bb]/20" />
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#f5d6bb] border-t-transparent" />
        </div>
        <div className="min-w-0">
          <p className="supporthr-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#f5d6bb]/80">
            Quy trình JD
          </p>
          <h3 className="mt-1 text-lg font-black text-white">Đang chuẩn bị tiêu chí</h3>
          <p className="mt-1 truncate text-sm text-zinc-400">{PROCESSING_STEPS[step]}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {PROCESSING_STEPS.map((item, index) => {
          const isCurrent = step === index;
          const isDone = step > index;

          return (
            <div
              key={item}
              className={`flex items-center gap-3 border px-3 py-2.5 text-sm transition-all ${
                isCurrent
                  ? 'border-[#f5d6bb]/40 bg-[#f5d6bb]/10 text-[#f5d6bb]'
                  : isDone
                    ? 'border-white/10 bg-white/[0.035] text-zinc-100'
                    : 'border-white/8 bg-white/[0.015] text-zinc-500'
              }`}
            >
              <span className="supporthr-mono flex h-6 w-6 shrink-0 items-center justify-center border border-current/35 text-[10px]">
                {isDone ? <Check className="h-3.5 w-3.5" /> : String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 truncate">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({
  onGetStarted,
  onUseTemplate,
  onFileProcessed,
  cvFiles,
  setCvFiles,
  hasPreparedJd = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<IntakeStage>(hasPreparedJd ? 'cv' : 'jd');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(hasPreparedJd ? 'JD đã sẵn sàng.' : '');
  const [jdReady, setJdReady] = useState(hasPreparedJd);
  const [jdFileName, setJdFileName] = useState('');
  const [cvError, setCvError] = useState('');
  const [isLoadingCvDrive, setIsLoadingCvDrive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  const hasHandledPendingDriveRef = useRef(false);

  const cvProgressPercent = useMemo(
    () => Math.min(100, Math.round((cvFiles.length / MAX_CV_PER_BATCH) * 100)),
    [cvFiles.length],
  );
  const canContinue = jdReady && cvFiles.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasPreparedJd) return;

    setJdReady(true);
    setStage('cv');
    setSuccessMsg((current) => current || 'JD đã sẵn sàng.');
  }, [hasPreparedJd]);

  useEffect(() => {
    if (!isProcessing) {
      setProcessingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProcessingStep((current) => (current + 1) % PROCESSING_STEPS.length);
    }, 1100);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const appendCvFiles = useCallback(
    (incomingFiles: File[]) => {
      if (incomingFiles.length === 0) return;

      setCvFiles((prev) => {
        const existingMap = new Map(prev.map((file) => [`${file.name}-${file.size}`, true]));
        const uniqueNewFiles = incomingFiles.filter((file) => !existingMap.has(`${file.name}-${file.size}`));

        if (uniqueNewFiles.length === 0) {
          setCvError('Các CV này đã có trong danh sách.');
          return prev;
        }

        if (prev.length + uniqueNewFiles.length > MAX_CV_PER_BATCH) {
          setCvError(`Chỉ được tải tối đa ${MAX_CV_PER_BATCH} CV.`);
          return prev;
        }

        setCvError('');
        return [...prev, ...uniqueNewFiles];
      });
    },
    [setCvFiles],
  );

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrorMsg('');
      setSuccessMsg('');
      setProcessingStep(0);

      try {
        const rawText = await extractTextFromJdFile(file, (message) => {
          if (message.includes('PDF') || message.toLowerCase().includes('docx')) {
            setProcessingStep(0);
          }
        });

        if (!rawText || rawText.trim().length < 50) {
          throw new Error('Không đọc được nội dung JD.');
        }

        setProcessingStep(1);
        const structuredJd = await filterAndStructureJD(rawText);

        setProcessingStep(2);
        const jobPosition = await extractJobPositionFromJD(structuredJd);

        setProcessingStep(3);
        const extractedFilters = await extractHardFiltersFromJD(structuredJd);
        const mandatoryUpdates: Partial<HardFilters> = {};

        if (extractedFilters?.location) (mandatoryUpdates as any).locationMandatory = true;
        if (extractedFilters?.minExp) (mandatoryUpdates as any).minExpMandatory = true;
        if (extractedFilters?.seniority) (mandatoryUpdates as any).seniorityMandatory = true;
        if (extractedFilters?.education) (mandatoryUpdates as any).educationMandatory = true;
        if (extractedFilters?.language) (mandatoryUpdates as any).languageMandatory = true;
        if (extractedFilters?.certificates) (mandatoryUpdates as any).certificatesMandatory = true;
        if (extractedFilters?.workFormat) (mandatoryUpdates as any).workFormatMandatory = true;
        if (extractedFilters?.contractType) (mandatoryUpdates as any).contractTypeMandatory = true;

        onFileProcessed({
          jdText: structuredJd,
          jobPosition: jobPosition || '',
          hardFilters: { ...(extractedFilters || {}), ...mandatoryUpdates },
        });

        setJdReady(true);
        setJdFileName(file.name);
        setSuccessMsg(`Đã nạp JD: ${file.name}`);
        setStage('cv');
      } catch (err: any) {
        setErrorMsg(getSafeErrorMessage(err, 'ai'));
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    event.target.value = '';
  };

  const handleGoogleDrive = async () => {
    try {
      setErrorMsg('');
      const driveFiles = await googleDriveService.pickAndImportFiles({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: false,
        fileType: 'jd',
      });

      if (driveFiles.length > 0) {
        await processFile(driveFiles[0]);
      }
    } catch (err: any) {
      if (isRedirectingToGoogle(err)) {
        return;
      }
      setErrorMsg(getSafeErrorMessage(err, 'drive'));
    }
  };

  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      appendCvFiles(Array.from(event.target.files));
    }
    event.target.value = '';
  };

  const handleCvDriveSelect = async () => {
    try {
      setCvError('');
      setIsLoadingCvDrive(true);
      const driveFiles = await googleDriveService.pickAndImportFiles({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: true,
        fileType: 'cv',
      });

      if (driveFiles.length === 0) return;
      appendCvFiles(driveFiles);
    } catch (err: any) {
      if (isRedirectingToGoogle(err)) {
        return;
      }
      setCvError(getSafeErrorMessage(err, 'drive'));
    } finally {
      setIsLoadingCvDrive(false);
    }
  };

  useEffect(() => {
    if (hasHandledPendingDriveRef.current) return;
    hasHandledPendingDriveRef.current = true;

    let cancelled = false;

    const resumePendingDriveImport = async () => {
      const pendingType = googleDriveService.getPendingImportFileType();

      try {
        if (pendingType === 'jd') {
          setErrorMsg('');
          setSuccessMsg('Đang tiếp tục kết nối Google Drive cho tệp JD...');
          setIsProcessing(true);
          setStage('jd');
        } else if (pendingType === 'cv') {
          setCvError('');
          setIsLoadingCvDrive(true);
          setStage('cv');
        }

        const driveFiles = await googleDriveService.resumePendingPickAndImportIfNeeded();
        if (cancelled || !driveFiles || driveFiles.length === 0) return;

        if (pendingType === 'jd') {
          await processFile(driveFiles[0]);
          return;
        }

        appendCvFiles(driveFiles);
        setSuccessMsg(`Đã nhập ${driveFiles.length} CV từ Google Drive.`);
      } catch (err: any) {
        if (isRedirectingToGoogle(err)) return;

        if (pendingType === 'jd') {
          setErrorMsg(getSafeErrorMessage(err, 'drive'));
        } else if (pendingType === 'cv') {
          setCvError(getSafeErrorMessage(err, 'drive'));
        }
      } finally {
        if (cancelled) return;
        if (pendingType === 'jd') {
          setIsProcessing(false);
        }
        if (pendingType === 'cv') {
          setIsLoadingCvDrive(false);
        }
      }
    };

    void resumePendingDriveImport();

    return () => {
      cancelled = true;
    };
  }, [appendCvFiles, processFile]);

  const handleRemoveCv = (index: number) => {
    setCvFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleClearCvFiles = () => {
    setCvFiles([]);
    setCvError('');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDropJdFile = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const [file] = Array.from(event.dataTransfer.files || []);
    if (file) {
      void processFile(file);
    }
  };

  const handleDropCvFiles = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      appendCvFiles(droppedFiles);
    }
  };

  const goToCv = () => {
    if (!jdReady) return;
    setStage('cv');
  };

  return (
    <div
      className={`relative flex h-[100svh] w-full overflow-hidden bg-[#030303] text-zinc-100 transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {isProcessing && <ProcessingModal step={processingStep} />}

      <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto px-4 py-4 sm:px-7 sm:py-5 lg:overflow-hidden lg:px-10 xl:px-12">
        <header className="shrink-0">
          <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                Nạp JD & CV
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
                Cổng nộp tài liệu HR: đọc JD trước, sau đó nạp danh sách CV để phân tích.
              </p>
            </div>

            <div className="flex min-w-0 gap-8 border-b border-white/[0.07] lg:min-w-[25rem]">
              <StepButton
                active={stage === 'jd'}
                index="01"
                label="Nạp JD"
                description={jdReady ? 'Đã sẵn sàng' : 'Bước bắt buộc'}
                onClick={() => setStage('jd')}
              />
              <StepButton
                active={stage === 'cv'}
                disabled={!jdReady}
                index="02"
                label="Nạp CV"
                description={`${cvFiles.length}/${MAX_CV_PER_BATCH} hồ sơ`}
                onClick={goToCv}
              />
            </div>
          </div>
        </header>

        {stage === 'jd' ? (
          <main className="flex min-h-0 flex-1 py-5 lg:py-6">
            <section className="flex min-h-0 w-full flex-col">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="supporthr-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/75">
                    Bước 01
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Nạp JD</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                    Tải tài liệu mô tả công việc để hệ thống chuẩn hóa tiêu chí.
                  </p>
                </div>
                <div
                  className={`supporthr-mono flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    errorMsg
                      ? 'text-red-200'
                      : jdReady
                        ? 'text-[#f5d6bb]'
                        : 'text-zinc-600'
                  }`}
                >
                  <span>{isProcessing ? `${String(processingStep + 1).padStart(2, '0')}/04` : jdReady ? '04/04' : '00/04'}</span>
                  <span>{isProcessing ? 'Đang xử lý' : errorMsg ? 'Cần kiểm tra' : jdReady ? 'Sẵn sàng' : 'Chưa có JD'}</span>
                </div>
              </div>

              <input ref={fileInputRef} type="file" className="hidden" accept={FILE_ACCEPT} onChange={handleFileChange} />

              <div
                className="mt-5 flex min-h-[320px] flex-1 flex-col border border-dashed border-white/[0.14] bg-white/[0.012] p-4 text-center transition-colors hover:border-[#f5d6bb]/45 hover:bg-white/[0.018] sm:min-h-[420px] sm:p-6 lg:min-h-0"
                onDragOver={handleDragOver}
                onDrop={handleDropJdFile}
              >
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center border border-[#f5d6bb]/24 bg-[#f5d6bb]/8 text-[#f5d6bb] sm:h-20 sm:w-20">
                    {isProcessing ? (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5d6bb] border-t-transparent sm:h-9 sm:w-9" />
                    ) : jdReady ? (
                      <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9" />
                    ) : (
                      <UploadCloud className="h-8 w-8 sm:h-9 sm:w-9" />
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {isProcessing ? 'Đang xử lý JD' : jdReady ? 'JD sẵn sàng' : 'Kéo thả JD'}
                  </h3>
                  <p className="mt-1.5 max-w-md text-xs leading-5 text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
                    {isProcessing
                      ? PROCESSING_STEPS[processingStep]
                      : jdReady
                        ? jdFileName || 'Sẵn sàng sang bước CV.'
                        : 'PDF, DOCX, PNG, JPG'}
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className={`${primaryButtonClass} mt-3 sm:mt-4`}
                  >
                    <HardDriveUpload className="h-4 w-4" />
                    {jdReady ? 'Đổi JD' : 'Nạp file'}
                  </button>
                </div>

                <div className="mt-4 flex justify-center gap-5">
                  <button
                    type="button"
                    onClick={() => void handleGoogleDrive()}
                    disabled={isProcessing}
                    className={secondaryButtonClass}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Drive
                  </button>
                  <button
                    type="button"
                    onClick={onUseTemplate ?? onGetStarted}
                    disabled={isProcessing}
                    className={secondaryButtonClass}
                  >
                    <FileText className="h-4 w-4" />
                    Mẫu
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {jdReady ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#f5d6bb]" /> : <FileText className="h-4 w-4 shrink-0 text-zinc-600" />}
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${errorMsg ? 'text-red-100' : 'text-white'}`}>
                      {errorMsg ? 'Kiểm tra lại tệp JD' : jdReady ? 'JD đã nạp' : 'Chưa có JD'}
                    </p>
                    <p className={`mt-0.5 truncate text-xs leading-5 sm:text-sm ${errorMsg ? 'text-red-100/80' : 'text-zinc-400'}`}>
                      {errorMsg || successMsg || 'Nạp JD để mở bước CV.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={goToCv}
                  disabled={!jdReady}
                  className={`${primaryButtonClass} w-full sm:w-[150px]`}
                >
                  Tiếp tục
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </main>
        ) : (
          <main className="grid min-h-0 flex-1 gap-6 py-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:py-6">
            <section className="flex min-h-0 flex-col">
              <div className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="supporthr-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/75">
                    Bước 02
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Nạp CV</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                    Tối đa {MAX_CV_PER_BATCH} hồ sơ trong một lần phân tích.
                  </p>
                </div>
                <div className="supporthr-mono w-fit shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {cvFiles.length}/{MAX_CV_PER_BATCH} CV
                </div>
              </div>

              <input
                ref={cvFileInputRef}
                type="file"
                multiple
                accept={FILE_ACCEPT}
                className="hidden"
                onChange={handleCvFileChange}
              />

              <div
                className="mt-5 flex min-h-[240px] flex-col justify-between border border-dashed border-white/[0.14] bg-white/[0.012] p-4 transition-colors hover:border-[#f5d6bb]/45 hover:bg-white/[0.018] sm:p-6 lg:min-h-[360px]"
                onDragOver={handleDragOver}
                onDrop={handleDropCvFiles}
              >
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#f5d6bb]/24 bg-[#f5d6bb]/8 text-[#f5d6bb] sm:h-20 sm:w-20">
                    <UploadCloud className="h-8 w-8 sm:h-9 sm:w-9" />
                  </div>
                  <p className="mt-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">Kéo thả CV</p>
                  <p className="mt-2 text-sm text-zinc-500">PDF, DOCX, PNG, JPG</p>

                  <div className="mt-4 flex justify-center gap-5">
                    <button
                      type="button"
                      onClick={() => cvFileInputRef.current?.click()}
                      className={secondaryButtonClass}
                    >
                      <HardDriveUpload className="h-4 w-4" />
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCvDriveSelect()}
                      disabled={isLoadingCvDrive}
                      className={secondaryButtonClass}
                    >
                      {isLoadingCvDrive ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f5d6bb] border-t-transparent" />
                      ) : (
                        <FolderOpen className="h-4 w-4" />
                      )}
                      Drive
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Tiến độ hồ sơ</span>
                    <span className="supporthr-mono">{cvFiles.length}/{MAX_CV_PER_BATCH}</span>
                  </div>
                  <div className="mt-2 h-px bg-white/[0.08]">
                    <div
                      className="h-px bg-[#f5d6bb] transition-[width] duration-500"
                      style={{ width: `${cvProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {cvError && (
                <div className="mt-4 border-l border-red-400/50 bg-red-500/5 px-4 py-3 text-sm text-red-100">
                  {cvError}
                </div>
              )}

              <div className="mt-auto flex flex-col gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:gap-3 lg:mt-6">
                <button type="button" onClick={() => setStage('jd')} className={`${secondaryButtonClass} sm:w-auto`}>
                  <ArrowLeft className="h-4 w-4" />
                  JD
                </button>
                <button
                  type="button"
                  onClick={onGetStarted}
                  disabled={!canContinue}
                  className={`${primaryButtonClass} flex-1`}
                >
                  Phân tích
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="flex min-h-[300px] flex-col overflow-hidden border-t border-white/[0.07] pt-5 lg:min-h-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div className="flex shrink-0 items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">Danh sách CV</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-zinc-500 sm:block">Kiểm tra và loại bỏ tệp trước khi phân tích.</p>
                </div>

                {cvFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCvFiles}
                    className="px-1 py-1.5 text-xs font-semibold text-zinc-500 transition hover:text-red-200"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="custom-scrollbar mt-5 min-h-0 flex-1 overflow-y-auto border-t border-white/[0.07]">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-4 text-center sm:min-h-[360px]">
                    <FileText className="h-10 w-10 text-zinc-700 sm:h-12 sm:w-12" />
                    <p className="mt-4 text-base font-semibold text-white">Chưa có CV</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                      File đã nạp sẽ hiện tại đây.
                    </p>
                  </div>
                ) : (
                  <div>
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group flex items-center gap-3 border-b border-white/[0.07] py-4 transition-colors hover:bg-white/[0.015]"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-[#f5d6bb]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-100">{file.name}</p>
                          <p className="mt-1 text-xs text-zinc-600">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <span className="supporthr-mono hidden text-[10px] text-zinc-600 sm:inline-flex">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCv(index)}
                          className="flex h-9 w-9 items-center justify-center text-zinc-600 transition-colors hover:text-red-200"
                          aria-label={`Xóa ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
};

export default CVScreenerWelcome;
