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
  'group flex min-h-[104px] flex-col justify-between border border-white/[0.06] bg-white/[0.025] p-4 text-left transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.04]';

const panelClass =
  'bg-black/45';

const subPanelClass =
  'bg-white/[0.018]';

const helperPillClass =
  'supporthr-mono mt-2 inline-flex w-fit text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f5d6bb]/70';

const sectionEyebrowClass = 'supporthr-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f5d6bb]/60';

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

  const jdStatusLabel = isProcessing
    ? 'Đang xử lý'
    : errorMsg
      ? 'Cần kiểm tra'
      : jdReady
        ? 'Sẵn sàng'
        : 'Chờ nạp';

  const jdStatusToneClass = isProcessing
    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
    : errorMsg
      ? 'border-red-400/30 bg-red-400/10 text-red-100'
      : jdReady
        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
        : 'border-white/[0.06] bg-transparent text-zinc-400';

  return (
    <div
      className={`relative flex h-[100svh] w-full overflow-hidden bg-[#050505] text-slate-100 transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />

      <div className="relative z-10 flex h-full w-full items-stretch justify-center overflow-hidden p-3 sm:p-4">
        <div className="h-full w-full">
          <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="mb-3 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-3">
          <div className="min-w-0">
            <div className={sectionEyebrowClass}>CV Screening</div>
            <h1 className="mt-1.5 text-[1.35rem] font-black tracking-tight text-white sm:text-[1.55rem]">
              Nạp JD và CV
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('jd')}
              className={`supporthr-mono inline-flex h-9 items-center gap-2 border px-4 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all ${
                step === 'jd'
                  ? 'border-white bg-white text-black'
                  : 'border-transparent bg-white/[0.025] text-[#f5d6bb]/70 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              JD
            </button>
            <button
              type="button"
              onClick={() => jdReady && setStep('cv')}
              disabled={!jdReady}
              className={`supporthr-mono inline-flex h-9 items-center gap-2 border px-4 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all ${
                step === 'cv'
                  ? 'border-white bg-white text-black'
                  : 'border-transparent bg-white/[0.025] text-[#f5d6bb]/70 hover:bg-white/[0.05] hover:text-white'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <UploadCloud className="h-4 w-4" />
              CV
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.34fr)_minmax(390px,0.96fr)]">
          <section className={`grid min-h-0 grid-rows-[auto_1fr_auto] gap-3 p-4 xl:p-5 ${panelClass}`}>
            <div className="flex items-start justify-between gap-3 pb-1">
              <div>
                <div className={sectionEyebrowClass}>
                  {step === 'jd' ? 'Bước 01' : 'Bước 02'}
                </div>
                <h2 className="mt-1 text-[1.25rem] font-black tracking-tight text-white sm:text-[1.4rem]">
                  {step === 'jd' ? 'Nạp JD' : 'Nạp CV'}
                </h2>
              </div>

              {step === 'cv' && (
                <button
                  type="button"
                  onClick={onGetStarted}
                  disabled={cvFiles.length === 0}
                  className="supporthr-mono inline-flex h-10 items-center gap-2 border border-white bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-black transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                  <div className="inline-flex h-10 w-10 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                      <HardDriveUpload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-white">Máy tính</div>
                      <div className="supporthr-mono mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">PDF, DOCX</div>
                    </div>
                    <div className={helperPillClass}>Tác vụ nhanh</div>
                  </button>

                  <button type="button" onClick={onUseTemplate ?? onGetStarted} className={cardClass}>
                  <div className="inline-flex h-10 w-10 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-white">Dùng mẫu</div>
                      <div className="supporthr-mono mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">Chọn JD mẫu</div>
                    </div>
                    <div className={helperPillClass}>Kho mẫu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGoogleDrive()}
                    disabled={isProcessing}
                    className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                      <FolderOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-white">Google Drive</div>
                      <div className="supporthr-mono mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">Lấy tệp</div>
                    </div>
                    <div className={helperPillClass}>Đồng bộ cloud</div>
                  </button>
                </div>

                <input ref={fileInputRef} type="file" className="hidden" accept={FILE_ACCEPT} onChange={handleFileChange} />

                <div className="grid min-h-0 gap-4">
                  <div className={`flex min-h-0 flex-col overflow-hidden ${subPanelClass}`}>
                    <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                          {jdReady ? <CheckCircle2 className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className={sectionEyebrowClass}>Bộ nạp JD</div>
                          <div className="mt-2 text-[1.1rem] font-black tracking-tight text-white sm:text-[1.2rem]">
                            {isProcessing ? 'AI đang xử lý JD' : jdReady ? 'JD đã sẵn sàng' : 'Chưa có JD'}
                          </div>
                          <div className="supporthr-mono mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">
                            {isProcessing ? PROCESSING_STEPS[processingStep] : successMsg || errorMsg || 'Chọn nguồn để nạp JD'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className={`hidden shrink-0 items-center border px-3 py-1.5 supporthr-mono text-[9px] uppercase tracking-[0.16em] sm:inline-flex ${jdStatusToneClass}`}>
                          {jdStatusLabel}
                        </div>
                        <div className="hidden shrink-0 items-center px-3 py-1.5 supporthr-mono text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65 sm:inline-flex">
                          {jdFileName ? '1 tệp đã chọn' : 'Chưa có tệp'}
                        </div>
                      </div>
                    </div>

                    {isProcessing ? (
                      <div className="grid flex-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
                        {PROCESSING_STEPS.map((item, index) => {
                          const isCurrent = processingStep === index;
                          const isDone = processingStep > index;

                          return (
                            <div
                              key={item}
                              className={`supporthr-mono flex items-center gap-3 border px-3 py-3 text-[10px] uppercase tracking-[0.14em] ${
                                isCurrent
                                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                                  : isDone
                                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                                    : 'border-white/[0.06] bg-transparent text-slate-500'
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
                      <div className="flex flex-1 flex-col gap-4 p-4">
                        <div className={`p-4 sm:p-5 ${
                          errorMsg ? 'bg-red-500/[0.06]' : 'bg-white/[0.02]'
                        }`}>
                          <div className={sectionEyebrowClass}>{errorMsg ? 'Cần kiểm tra' : jdReady ? 'Đã đồng bộ' : 'Sẵn sàng nạp'}</div>
                          <div className="mt-3 text-[1rem] font-semibold tracking-tight text-white sm:text-[1.08rem]">
                            {errorMsg ? 'Kiểm tra lại tệp JD' : jdReady ? 'JD đã được chuẩn hóa' : 'Chọn nguồn để bắt đầu'}
                          </div>
                          <p className={`mt-3 text-sm leading-6 ${errorMsg ? 'text-red-100' : 'text-slate-300'}`}>
                            {errorMsg
                              ? errorMsg
                              : successMsg || 'Hệ thống sẽ đọc, chuẩn hóa và trích xuất tiêu chí JD trước khi chuyển sang bước CV.'}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="bg-white/[0.02] p-4">
                            <div className={sectionEyebrowClass}>Luồng xử lý</div>
                            <div className="mt-3 text-sm font-medium leading-6 text-white">JD luôn được xử lý trước khi sang bước CV.</div>
                          </div>
                          <div className="bg-white/[0.02] p-4">
                            <div className={sectionEyebrowClass}>Tệp hiện tại</div>
                            <div className="mt-3 truncate text-sm font-medium leading-6 text-white">
                              {jdFileName || 'Chưa có tệp nào được chọn'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden">
                    <div className={`flex min-h-[120px] flex-col justify-between p-4 ${subPanelClass}`}>
                      <div className={sectionEyebrowClass}>Trạng thái</div>
                      <div className="text-sm font-semibold tracking-tight text-white">
                        {jdReady ? 'Đã nạp JD' : 'Chưa nạp JD'}
                      </div>
                    </div>
                    <div className={`flex min-h-[120px] flex-col justify-between p-4 ${subPanelClass}`}>
                      <div className={sectionEyebrowClass}>Tệp JD</div>
                      <div className="truncate text-sm font-semibold tracking-tight text-white">
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
                    <div className="inline-flex h-10 w-10 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                      <HardDriveUpload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-white">Từ máy tính</div>
                      <div className="supporthr-mono mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">Chọn nhiều CV</div>
                    </div>
                    <div className={helperPillClass}>Tái sử dụng danh sách</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCvDriveSelect()}
                    disabled={isLoadingCvDrive}
                    className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                      {isLoadingCvDrive ? (
                        <div className="h-4.5 w-4.5 animate-spin border-2 border-emerald-300 border-t-transparent" />
                      ) : (
                        <FolderOpen className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-white">Google Drive</div>
                      <div className="supporthr-mono mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">Lấy nhiều CV</div>
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
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div>
                      <div className={sectionEyebrowClass}>Danh sách CV</div>
                      <div className="mt-1 text-xs text-[#f5d6bb]/55">Thêm, kiểm tra và loại bỏ tệp ngay tại đây</div>
                    </div>
                    <div className="supporthr-mono px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/65">
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
                      <div className="flex h-full min-h-[180px] flex-col items-center justify-center bg-white/[0.015] px-4 text-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center bg-white/[0.03]">
                          <UploadCloud className="h-7 w-7 text-slate-600" />
                        </div>
                        <p className="mt-4 text-[1rem] font-semibold tracking-tight text-slate-200">Chưa có CV nào</p>
                        <p className="mt-2 max-w-xs text-xs leading-6 text-[#f5d6bb]/55">
                          Kéo thả file vào khung này hoặc dùng hai nguồn nạp ở phía trên.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cvFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="group flex items-center gap-3 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                          >
                            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-white/[0.04] text-slate-300">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCv(index)}
                              className="inline-flex h-8 w-8 items-center justify-center border border-transparent text-slate-500 transition-all hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-200"
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
              <div className="supporthr-mono text-[10px] uppercase tracking-[0.16em] text-[#f5d6bb]/70">
                {step === 'jd' ? 'Hoàn tất JD để chuyển sang bước CV.' : 'Nạp xong CV rồi tiếp tục.'}
              </div>
              {step === 'jd' && jdReady && (
                <button
                  type="button"
                  onClick={() => setStep('cv')}
                  className="supporthr-mono inline-flex h-10 items-center gap-2 border border-white bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-black transition-all hover:bg-slate-100"
                >
                  Sang bước CV
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>

            <aside className={`grid min-h-0 grid-rows-[auto_1fr] gap-3 p-4 xl:p-5 ${panelClass}`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <div className={`p-4 ${subPanelClass}`}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                    <BriefcaseBusiness className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className={sectionEyebrowClass}>JD</div>
                    <div className="mt-2 truncate text-sm font-semibold tracking-tight text-white">
                      {jdFileName || 'Chưa nạp JD'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 ${subPanelClass}`}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center bg-white/[0.035] text-[#f5d6bb]/80">
                    <UploadCloud className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className={sectionEyebrowClass}>CV</div>
                    <div className="mt-2 text-sm font-semibold tracking-tight text-white">
                      {cvFiles.length}/{MAX_CV_PER_BATCH}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex min-h-0 flex-col ${subPanelClass}`}>
                  <div className="px-4 py-2.5">
                <div className={sectionEyebrowClass}>Danh sách CV</div>
                <div className="mt-1 text-xs text-[#f5d6bb]/55">Tóm tắt nhanh các CV đã nạp</div>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center bg-white/[0.015] px-4 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center bg-white/[0.03]">
                      <UploadCloud className="h-7 w-7 text-slate-600" />
                    </div>
                    <p className="mt-4 text-[1rem] font-semibold tracking-tight text-slate-200">Chưa có CV nào</p>
                    <p className="mt-2 text-xs leading-6 text-[#f5d6bb]/55">Số lượng CV sẽ hiển thị tại đây ngay khi bạn nạp file.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 bg-white/[0.02] px-4 py-3"
                      >
                        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-white/[0.04] text-slate-300">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                        </div>
                        <span className="text-xs text-[#f5d6bb]/55">{String(index + 1).padStart(2, '0')}</span>
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
