import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  FileText,
  FolderOpen,
  HardDriveUpload,
  UploadCloud,
  X,
} from 'lucide-react';
import { extractTextFromJdFile } from '@/lib/services/file-processing/ocrService';
import {
  extractHardFiltersFromJD,
  extractJobPositionFromJD,
  filterAndStructureJD,
} from '@/lib/services/screening/frontendScreeningService';
import { googleDriveService } from '@/lib/services/file-processing/googleDriveService';
import type { HardFilters } from '@/shared/types';
import { getSafeErrorMessage, isRedirectingToGoogle } from '@/shared/utils/errorMessages';

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

type IntakeStep = 'jd' | 'cv';

const PROCESSING_STEPS = [
  'Đọc tệp JD',
  'Chuẩn hóa nội dung',
  'Tách chức danh',
  'Trích xuất tiêu chí',
];

const MAX_CV_PER_BATCH = 20;
const FILE_ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg';

const cardClass =
  'group supporthr-display relative flex min-h-[156px] flex-col justify-between overflow-hidden rounded-none border border-white/[0.1] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_100%)] p-5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.34)] transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.018)_100%)] hover:shadow-[0_28px_60px_rgba(0,0,0,0.42)]';

const panelClass =
  'rounded-none border border-white/[0.08] bg-[linear-gradient(180deg,rgba(7,7,9,0.98)_0%,rgba(2,2,4,0.98)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.4)]';

const subPanelClass =
  'rounded-none border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.012)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';

const helperPillClass =
  'supporthr-mono mt-4 inline-flex w-fit rounded-none border border-white/[0.08] bg-black/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-300';

const sectionEyebrowClass = 'supporthr-mono text-[10px] font-medium uppercase tracking-[0.26em] text-zinc-500';

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({
  onGetStarted,
  onUseTemplate,
  onFileProcessed,
  cvFiles,
  setCvFiles,
  hasPreparedJd = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<IntakeStep>(hasPreparedJd ? 'cv' : 'jd');
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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasPreparedJd) {
      setJdReady(true);
      setStep('cv');
      if (!successMsg) setSuccessMsg('JD đã sẵn sàng.');
    }
  }, [hasPreparedJd, successMsg]);

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
    [setCvFiles]
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
        setStep('cv');
      } catch (err: any) {
        setErrorMsg(getSafeErrorMessage(err, 'ai'));
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed]
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
          setSuccessMsg('Dang tiep tuc ket noi Google Drive cho tep JD...');
          setIsProcessing(true);
        } else if (pendingType === 'cv') {
          setCvError('');
          setIsLoadingCvDrive(true);
          setStep('cv');
        }

        const driveFiles = await googleDriveService.resumePendingPickAndImportIfNeeded();
        if (cancelled || !driveFiles || driveFiles.length === 0) return;

        if (pendingType === 'jd') {
          await processFile(driveFiles[0]);
          return;
        }

        appendCvFiles(driveFiles);
        setSuccessMsg(`Da nhap ${driveFiles.length} CV tu Google Drive.`);
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

  const handleDropCvFiles = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      appendCvFiles(droppedFiles);
    }
  };

  return (
    <div
      className={`feature-page-shell relative flex h-[100dvh] w-full overflow-hidden bg-black text-slate-100 transition-all duration-500 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08)_0%,transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.06)_0%,transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:52px_52px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.42)_100%)]" />

      <div className="relative z-10 h-full w-full overflow-auto">
        <div className="origin-top-left lg:h-[125%] lg:w-[125%] lg:scale-[0.8]">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <header className={`mb-4 flex shrink-0 items-center justify-between gap-4 px-5 py-5 ${panelClass}`}>
          <div className="min-w-0">
            <div className={`${sectionEyebrowClass} text-cyan-300/75`}>CV Screening</div>
            <h1 className="supporthr-display mt-2 text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.05em] text-white">
              Nạp JD và CV
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('jd')}
              className={`supporthr-mono inline-flex h-10 items-center gap-2 rounded-none border px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
                step === 'jd'
                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                  : 'border-white/[0.08] bg-black/80 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              JD
            </button>
            <button
              type="button"
              onClick={() => jdReady && setStep('cv')}
              disabled={!jdReady}
              className={`supporthr-mono inline-flex h-10 items-center gap-2 rounded-none border px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
                step === 'cv'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.12)]'
                  : 'border-white/[0.08] bg-black/80 text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <UploadCloud className="h-4 w-4" />
              CV
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <section className={`grid min-h-0 grid-rows-[auto_1fr_auto] gap-4 p-5 ${panelClass}`}>
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <div className={sectionEyebrowClass}>
                  {step === 'jd' ? 'Bước 01' : 'Bước 02'}
                </div>
                <h2 className="supporthr-display mt-2 text-[1.75rem] font-semibold tracking-[-0.05em] text-white">
                  {step === 'jd' ? 'Nạp JD' : 'Nạp CV'}
                </h2>
              </div>

              {step === 'cv' && (
                <button
                  type="button"
                  onClick={onGetStarted}
                  disabled={cvFiles.length === 0}
                  className="supporthr-mono inline-flex h-10 items-center gap-2 rounded-none border border-cyan-400/30 bg-cyan-400/10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-all hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Tiếp tục
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {step === 'jd' ? (
              <div className="grid min-h-0 gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={cardClass}>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-sky-400/20 bg-sky-400/10 text-sky-300">
                      <HardDriveUpload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="supporthr-display text-base font-semibold tracking-[-0.03em] text-white">Máy tính</div>
                      <div className="supporthr-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">PDF, DOCX</div>
                    </div>
                    <div className={helperPillClass}>Tác vụ nhanh</div>
                  </button>

                  <button type="button" onClick={onUseTemplate ?? onGetStarted} className={cardClass}>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="supporthr-display text-base font-semibold tracking-[-0.03em] text-white">Dùng mẫu</div>
                      <div className="supporthr-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Chọn JD mẫu</div>
                    </div>
                    <div className={helperPillClass}>Kho mẫu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGoogleDrive()}
                    disabled={isProcessing}
                    className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      <FolderOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="supporthr-display text-base font-semibold tracking-[-0.03em] text-white">Google Drive</div>
                      <div className="supporthr-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Lấy tệp</div>
                    </div>
                    <div className={helperPillClass}>Đồng bộ cloud</div>
                  </button>
                </div>

                <input ref={fileInputRef} type="file" className="hidden" accept={FILE_ACCEPT} onChange={handleFileChange} />

                <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.25fr)_240px]">
                  <div className={`flex min-h-0 flex-col overflow-hidden ${subPanelClass}`}>
                    <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-none border border-white/10 bg-white/[0.04] text-cyan-200">
                          {jdReady ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className={sectionEyebrowClass}>Bộ nạp JD</div>
                          <div className="supporthr-display mt-2 text-[1.75rem] font-semibold tracking-[-0.05em] text-white">
                            {isProcessing ? 'AI đang xử lý JD' : jdReady ? 'JD đã sẵn sàng' : 'Chưa có JD'}
                          </div>
                          <div className="supporthr-mono mt-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            {isProcessing ? PROCESSING_STEPS[processingStep] : successMsg || errorMsg || 'Chọn nguồn để nạp JD'}
                          </div>
                        </div>
                      </div>
                      <div className="hidden shrink-0 border border-white/[0.08] bg-black/70 px-3 py-2 supporthr-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 sm:block">
                        {jdReady ? 'Ready' : 'Waiting'}
                      </div>
                    </div>

                    {isProcessing ? (
                      <div className="grid flex-1 gap-2 px-5 py-5 sm:grid-cols-2">
                        {PROCESSING_STEPS.map((item, index) => {
                          const isCurrent = processingStep === index;
                          const isDone = processingStep > index;

                          return (
                            <div
                              key={item}
                              className={`supporthr-mono flex items-center gap-3 rounded-none border px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${
                                isCurrent
                                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                                  : isDone
                                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                                    : 'border-white/[0.08] bg-black text-slate-500'
                              }`}
                            >
                              <div className="flex h-6 w-6 items-center justify-center border border-current/40">
                                {isDone ? <Check className="h-3.5 w-3.5" /> : <span>{index + 1}</span>}
                              </div>
                              <span>{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-1 flex-col justify-between gap-4 px-5 py-5">
                        <div className="border border-white/[0.08] bg-black/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div className={sectionEyebrowClass}>{errorMsg ? 'Cần kiểm tra' : jdReady ? 'Đã đồng bộ' : 'Sẵn sàng nạp'}</div>
                          <div className="supporthr-display mt-3 text-[1.35rem] font-semibold tracking-[-0.04em] text-white">
                            {errorMsg ? 'Kiểm tra lại tệp JD' : jdReady ? 'JD đã được chuẩn hóa' : 'Chọn nguồn để bắt đầu'}
                          </div>
                          <p className={`mt-3 text-sm leading-7 ${errorMsg ? 'text-red-200' : 'text-slate-300'}`}>
                            {errorMsg
                              ? errorMsg
                              : successMsg || 'Hệ thống sẽ đọc, chuẩn hóa và trích xuất tiêu chí JD trước khi chuyển sang bước CV.'}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="border border-white/[0.08] bg-white/[0.02] p-4">
                            <div className={sectionEyebrowClass}>Luồng xử lý</div>
                            <div className="mt-3 text-sm font-medium leading-6 text-white">JD luôn được xử lý trước khi sang bước CV.</div>
                          </div>
                          <div className="border border-white/[0.08] bg-white/[0.02] p-4">
                            <div className={sectionEyebrowClass}>Tệp hiện tại</div>
                            <div className="mt-3 truncate text-sm font-medium leading-6 text-white">
                              {jdFileName || 'Chưa có tệp nào được chọn'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className={`flex min-h-[120px] flex-col justify-between p-4 ${subPanelClass}`}>
                      <div className={sectionEyebrowClass}>Trạng thái</div>
                      <div className="supporthr-display text-[1.2rem] font-semibold tracking-[-0.04em] text-white">
                        {jdReady ? 'Đã nạp JD' : 'Chưa nạp JD'}
                      </div>
                    </div>
                    <div className={`flex min-h-[120px] flex-col justify-between p-4 ${subPanelClass}`}>
                      <div className={sectionEyebrowClass}>Tệp JD</div>
                      <div className="supporthr-display truncate text-[1.2rem] font-semibold tracking-[-0.04em] text-white">
                        {jdFileName || 'Chưa chọn tệp'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-0 gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => cvFileInputRef.current?.click()}
                    className={cardClass}
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                      <HardDriveUpload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="supporthr-display text-base font-semibold tracking-[-0.03em] text-white">Từ máy tính</div>
                      <div className="supporthr-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Chọn nhiều CV</div>
                    </div>
                    <div className={helperPillClass}>Tái sử dụng danh sách</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCvDriveSelect()}
                    disabled={isLoadingCvDrive}
                    className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      {isLoadingCvDrive ? (
                        <div className="h-4.5 w-4.5 animate-spin border-2 border-emerald-300 border-t-transparent" />
                      ) : (
                        <FolderOpen className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div>
                      <div className="supporthr-display text-base font-semibold tracking-[-0.03em] text-white">Google Drive</div>
                      <div className="supporthr-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Lấy nhiều CV</div>
                    </div>
                    <div className={helperPillClass}>Đồng bộ cloud</div>
                  </button>
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
                  className={`flex min-h-0 flex-col ${subPanelClass}`}
                  onDragOver={handleDropCvFiles}
                  onDrop={handleDropCvFiles}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                    <div>
                      <div className={sectionEyebrowClass}>Danh sách CV</div>
                      <div className="mt-1 text-xs text-slate-500">Thêm, kiểm tra và loại bỏ tệp ngay tại đây</div>
                    </div>
                    <div className="supporthr-mono rounded-none border border-white/[0.08] bg-black px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {cvFiles.length}/{MAX_CV_PER_BATCH}
                    </div>
                  </div>

                  {cvError && (
                    <div className="border-b border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-100">
                      {cvError}
                    </div>
                  )}

                  <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                    {cvFiles.length === 0 ? (
                      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-none border border-dashed border-white/[0.08] bg-black px-4 text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-none border border-white/[0.08] bg-white/[0.02]">
                          <UploadCloud className="h-7 w-7 text-slate-600" />
                        </div>
                        <p className="supporthr-display mt-4 text-[1.2rem] font-semibold tracking-[-0.04em] text-slate-200">Chưa có CV nào</p>
                        <p className="mt-2 max-w-xs text-xs leading-6 text-slate-500">
                          Kéo thả file vào khung này hoặc dùng hai nguồn nạp ở phía trên.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cvFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="group flex items-center gap-3 rounded-none border border-white/[0.08] bg-black px-4 py-3 transition-all hover:border-white/[0.14] hover:bg-white/[0.03]"
                          >
                            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-slate-700 bg-white/[0.04] text-slate-300">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCv(index)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-slate-500 transition-all hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-200"
                              aria-label={`Xóa ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between gap-3 px-4 py-3 ${subPanelClass}`}>
              <div className="supporthr-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
                {step === 'jd' ? 'Hoàn tất JD để chuyển sang bước CV.' : 'Nạp xong CV rồi tiếp tục.'}
              </div>
              {step === 'jd' && jdReady && (
                <button
                  type="button"
                  onClick={() => setStep('cv')}
                  className="supporthr-mono inline-flex h-10 items-center gap-2 rounded-none border border-emerald-400/30 bg-emerald-400/10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100 transition-all hover:bg-emerald-400/15 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
                >
                  Sang bước CV
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>

          <aside className={`grid min-h-0 grid-rows-[auto_1fr] gap-4 p-5 ${panelClass}`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className={`p-4 ${subPanelClass}`}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-sky-400/20 bg-sky-400/10 text-sky-300">
                    <BriefcaseBusiness className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className={sectionEyebrowClass}>JD</div>
                    <div className="supporthr-display mt-2 truncate text-base font-semibold tracking-[-0.03em] text-white">
                      {jdFileName || 'Chưa nạp JD'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 ${subPanelClass}`}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <UploadCloud className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className={sectionEyebrowClass}>CV</div>
                    <div className="supporthr-display mt-2 text-base font-semibold tracking-[-0.03em] text-white">
                      {cvFiles.length}/{MAX_CV_PER_BATCH}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex min-h-0 flex-col ${subPanelClass}`}>
                  <div className="border-b border-white/[0.08] px-4 py-3">
                <div className={sectionEyebrowClass}>Danh sách CV</div>
                <div className="mt-1 text-xs text-slate-500">Tóm tắt nhanh các CV đã nạp</div>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-none border border-dashed border-white/[0.08] bg-black px-4 text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-none border border-white/[0.08] bg-white/[0.02]">
                      <UploadCloud className="h-7 w-7 text-slate-600" />
                    </div>
                    <p className="supporthr-display mt-4 text-[1.2rem] font-semibold tracking-[-0.04em] text-slate-200">Chưa có CV nào</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">Số lượng CV sẽ hiển thị tại đây ngay khi bạn nạp file.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 rounded-none border border-white/[0.08] bg-black px-4 py-3"
                      >
                        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-slate-700 bg-white/[0.04] text-slate-300">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                        </div>
                        <span className="text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVScreenerWelcome;
