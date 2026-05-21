import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  FileText,
  FolderOpen,
  HardDriveUpload,
  ListChecks,
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
const panelClass = 'border border-white/10 bg-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.34)]';
const secondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-none border border-white/10 bg-white/[0.025] px-3.5 text-xs font-semibold text-zinc-300 transition-all hover:border-[#f5d6bb]/40 hover:bg-[#f5d6bb]/10 hover:text-[#f5d6bb] disabled:cursor-not-allowed disabled:opacity-45';
const primaryButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-none bg-white px-5 text-sm font-black text-black shadow-[0_18px_60px_rgba(255,255,255,0.10)] transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-600 disabled:shadow-none';

const StepButton = ({
  active,
  disabled,
  index,
  label,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  index: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex min-w-0 flex-1 items-center gap-3 rounded-none border px-3 py-3 text-left transition-all ${
      active
        ? 'border-[#f5d6bb]/35 bg-[#f5d6bb]/10 text-white'
        : 'border-white/10 bg-white/[0.025] text-zinc-400 hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-100'
    } disabled:cursor-not-allowed disabled:opacity-45`}
  >
    <span
      className={`supporthr-mono flex h-9 w-9 shrink-0 items-center justify-center border text-[10px] font-black ${
        active ? 'border-[#f5d6bb]/45 text-[#f5d6bb]' : 'border-white/10 text-zinc-500'
      }`}
    >
      {index}
    </span>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-black/60">
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold leading-5">{label}</span>
      <span className="mt-0.5 block truncate text-[11px] text-zinc-500">{description}</span>
    </span>
  </button>
);

const ProcessingModal = ({
  step,
}: {
  step: number;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
    <div className={`${panelClass} w-full max-w-sm p-5 sm:p-6`}>
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
      className={`relative flex h-[100svh] w-full overflow-hidden bg-black text-zinc-100 transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-45" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(245,214,187,0.075),transparent_62%)]" />

      {isProcessing && <ProcessingModal step={processingStep} />}

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1120px] flex-col overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="shrink-0 border-b border-white/10 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="supporthr-mono mb-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#f5d6bb]">
                <span className="h-2 w-2 bg-[#f5d6bb]" />
                JD & CV Intake
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Nạp dữ liệu tuyển dụng</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-[15px]">
                Hoàn tất JD trước để hệ thống chuẩn hóa tiêu chí, sau đó chuyển sang trang CV để nạp danh sách ứng viên.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[30rem]">
              <StepButton
                active={stage === 'jd'}
                index="01"
                label="Nạp JD"
                description={jdReady ? 'Đã sẵn sàng' : 'Bước bắt buộc'}
                icon={<BriefcaseBusiness className="h-4 w-4 text-[#f5d6bb]" />}
                onClick={() => setStage('jd')}
              />
              <StepButton
                active={stage === 'cv'}
                disabled={!jdReady}
                index="02"
                label="Nạp CV"
                description={`${cvFiles.length}/${MAX_CV_PER_BATCH} hồ sơ`}
                icon={<UploadCloud className="h-4 w-4 text-[#f5d6bb]" />}
                onClick={goToCv}
              />
            </div>
          </div>
        </header>

        {stage === 'jd' ? (
          <main className="flex min-h-0 flex-1 py-4 lg:py-5">
            <section className={`${panelClass} flex min-h-0 w-full flex-col p-4 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="supporthr-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#f5d6bb]/80">
                    Bước 01
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Nạp JD</h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-400">
                    Hệ thống sẽ đọc, chuẩn hóa và trích xuất tiêu chí JD trước khi mở bước CV.
                  </p>
                </div>
                <div
                  className={`shrink-0 border px-2.5 py-2 text-right ${
                    errorMsg
                      ? 'border-red-400/35 bg-red-500/10 text-red-100'
                      : jdReady
                        ? 'border-[#f5d6bb]/30 bg-[#f5d6bb]/10 text-[#f5d6bb]'
                        : 'border-white/10 bg-white/[0.025] text-zinc-500'
                  }`}
                >
                  <div className="supporthr-mono flex items-center justify-end gap-1.5 text-[9px] font-black uppercase tracking-[0.16em]">
                    <ListChecks className="h-3.5 w-3.5" />
                    {isProcessing ? `${String(processingStep + 1).padStart(2, '0')}/04` : jdReady ? '04/04' : '00/04'}
                  </div>
                  <div className="mt-1 whitespace-nowrap text-xs font-semibold">
                    {isProcessing ? 'Đang xử lý' : errorMsg ? 'Cần kiểm tra' : jdReady ? 'Sẵn sàng' : 'Chưa có JD'}
                  </div>
                </div>
              </div>

              <input ref={fileInputRef} type="file" className="hidden" accept={FILE_ACCEPT} onChange={handleFileChange} />

              <div
                className="mt-4 flex min-h-[320px] flex-1 flex-col border border-dashed border-white/12 bg-white/[0.018] p-4 text-center transition-colors hover:border-[#f5d6bb]/40 hover:bg-[#f5d6bb]/[0.035] sm:min-h-[360px] sm:p-5"
                onDragOver={handleDragOver}
                onDrop={handleDropJdFile}
              >
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center border border-[#f5d6bb]/28 bg-[#f5d6bb]/10 text-[#f5d6bb] sm:h-20 sm:w-20">
                    {isProcessing ? (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5d6bb] border-t-transparent" />
                    ) : jdReady ? (
                      <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
                    ) : (
                      <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10" />
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-black tracking-tight text-white sm:text-xl">
                    {isProcessing ? 'AI đang xử lý JD' : jdReady ? 'JD đã sẵn sàng' : 'Kéo thả JD vào đây'}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                    {isProcessing
                      ? PROCESSING_STEPS[processingStep]
                      : jdReady
                        ? jdFileName || successMsg || 'JD đã được chuẩn hóa và sẵn sàng dùng cho bước CV.'
                        : 'Hỗ trợ PDF, DOCX, PNG và JPG. Có thể nạp từ máy, Google Drive hoặc chọn JD từ kho mẫu.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className={`${primaryButtonClass} mt-5`}
                  >
                    <HardDriveUpload className="h-4 w-4" />
                    {jdReady ? 'Đổi file JD' : 'Nạp file từ máy'}
                  </button>
                </div>

                <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleGoogleDrive()}
                    disabled={isProcessing}
                    className={secondaryButtonClass}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Google Drive
                  </button>
                  <button
                    type="button"
                    onClick={onUseTemplate ?? onGetStarted}
                    disabled={isProcessing}
                    className={secondaryButtonClass}
                  >
                    <FileText className="h-4 w-4" />
                    Chọn từ kho mẫu
                  </button>
                </div>
              </div>

              <div
                className={`mt-3 flex items-start gap-3 border px-3 py-3 ${
                  errorMsg
                    ? 'border-red-400/25 bg-red-500/10'
                    : jdReady
                      ? 'border-[#f5d6bb]/24 bg-[#f5d6bb]/10'
                      : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-black/60 text-[#f5d6bb]">
                  {jdReady ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${errorMsg ? 'text-red-100' : 'text-white'}`}>
                    {errorMsg ? 'Kiểm tra lại tệp JD' : jdReady ? 'JD đã nạp' : 'Chưa có JD'}
                  </p>
                  <p className={`mt-1 text-sm leading-5 ${errorMsg ? 'text-red-100/80' : 'text-zinc-400'}`}>
                    {errorMsg || successMsg || 'Nạp JD để mở trang CV và bắt đầu chuẩn bị danh sách ứng viên.'}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-zinc-500">
                  CV chỉ được mở sau khi JD đã được đọc và chuẩn hóa thành công.
                </p>
                <button
                  type="button"
                  onClick={goToCv}
                  disabled={!jdReady}
                  className={`${primaryButtonClass} sm:w-auto`}
                >
                  Sang trang CV
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </main>
        ) : (
          <main className="grid flex-1 gap-5 py-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-7">
            <section className={`${panelClass} flex flex-col p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="supporthr-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#f5d6bb]/80">
                    Bước 02
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Nạp CV</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                    JD đã sẵn sàng. Nạp tối đa {MAX_CV_PER_BATCH} CV để hệ thống phân tích và xếp hạng.
                  </p>
                </div>
                <div className="supporthr-mono w-fit border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
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
                className="mt-6 border border-dashed border-white/12 bg-white/[0.018] p-5 transition-colors hover:border-[#f5d6bb]/40 hover:bg-[#f5d6bb]/[0.035]"
                onDragOver={handleDragOver}
                onDrop={handleDropCvFiles}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#f5d6bb]/24 bg-[#f5d6bb]/10 text-[#f5d6bb]">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-base font-black text-white">Kéo thả CV vào đây</p>
                      <p className="mt-1 text-sm text-zinc-500">PDF, DOCX, PNG, JPG</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => cvFileInputRef.current?.click()}
                      className={secondaryButtonClass}
                    >
                      <HardDriveUpload className="h-4 w-4" />
                      Chọn file
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
                      Google Drive
                    </button>
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-[#f5d6bb] transition-[width] duration-500"
                    style={{ width: `${cvProgressPercent}%` }}
                  />
                </div>
              </div>

              {cvError && (
                <div className="mt-4 border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {cvError}
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                <button type="button" onClick={() => setStage('jd')} className={`${secondaryButtonClass} sm:w-auto`}>
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại JD
                </button>
                <button
                  type="button"
                  onClick={onGetStarted}
                  disabled={!canContinue}
                  className={`${primaryButtonClass} flex-1`}
                >
                  Tiếp tục phân tích
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className={`${panelClass} flex min-h-[520px] flex-col overflow-hidden`}>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-base font-black text-white">Danh sách CV</h3>
                  <p className="mt-1 text-xs text-zinc-500">Kiểm tra và loại bỏ tệp trước khi phân tích.</p>
                </div>

                {cvFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCvFiles}
                    className="px-2.5 py-1.5 text-xs font-semibold text-zinc-500 transition hover:bg-red-500/10 hover:text-red-200"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.015] px-5 text-center">
                    <div className="flex h-14 w-14 items-center justify-center border border-white/10 bg-black/70 text-zinc-500">
                      <FileText className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-base font-black text-white">Chưa có CV nào</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">
                      Danh sách CV sẽ hiển thị tại đây ngay sau khi bạn nạp file từ máy hoặc Google Drive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group flex items-center gap-3 border border-white/10 bg-white/[0.025] px-3.5 py-3 transition-colors hover:border-[#f5d6bb]/24 hover:bg-[#f5d6bb]/[0.05]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-black/70 text-[#f5d6bb]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-100">{file.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <span className="supporthr-mono hidden border border-white/10 bg-black/70 px-2 py-1 text-[10px] text-zinc-500 sm:inline-flex">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCv(index)}
                          className="flex h-9 w-9 items-center justify-center text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-200"
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
