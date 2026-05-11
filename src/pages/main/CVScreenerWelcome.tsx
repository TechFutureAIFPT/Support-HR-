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

interface CVScreenerWelcomeProps {
  onGetStarted: () => void;
  onManualEntry?: () => void;
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
  'group flex min-h-[148px] flex-col justify-between rounded-2xl border border-slate-800/90 bg-[linear-gradient(180deg,rgba(17,33,58,0.58)_0%,rgba(13,28,50,0.92)_100%)] p-4 text-left shadow-[0_16px_40px_rgba(2,6,23,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-[0_20px_50px_rgba(2,6,23,0.28)]';

const panelClass =
  'rounded-2xl border border-slate-800/90 bg-[linear-gradient(180deg,rgba(11,25,44,0.96)_0%,rgba(11,25,44,0.92)_100%)] shadow-[0_18px_50px_rgba(2,6,23,0.28)]';

const subPanelClass =
  'rounded-2xl border border-slate-800/90 bg-[linear-gradient(180deg,rgba(17,33,58,0.5)_0%,rgba(11,25,44,0.78)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]';

const helperPillClass =
  'mt-3 inline-flex w-fit rounded-full border border-slate-700/80 bg-[#0B192C]/80 px-2.5 py-1 text-[11px] text-slate-300';

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({
  onGetStarted,
  onManualEntry,
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
        const message = err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
        setErrorMsg(
          message.includes('network') || message.includes('fetch')
            ? 'Lỗi kết nối mạng.'
            : message
        );
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
      if (err?.message?.includes('Đang chuyển tới Google')) {
        return;
      }
      setErrorMsg(err?.message || 'Không kết nối được Google Drive.');
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
      if (err?.message?.includes('Đang chuyển tới Google')) {
        return;
      }
      if (err?.message?.includes('đăng nhập')) {
        setCvError('Vui lòng đăng nhập để dùng Google Drive.');
      } else {
        setCvError(err?.message || 'Không lấy được CV từ Google Drive.');
      }
    } finally {
      setIsLoadingCvDrive(false);
    }
  };

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
      className={`feature-page-shell relative flex h-[100dvh] w-full overflow-hidden bg-[#07111F] text-slate-100 transition-all duration-500 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.06)_0%,transparent_34%,transparent_66%,rgba(99,102,241,0.08)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:52px_52px] opacity-20" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <header className={`mb-4 flex shrink-0 items-center justify-between gap-4 px-5 py-4 ${panelClass}`}>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">CV Screening</div>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Nạp JD và CV</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Chuẩn bị JD và hồ sơ ứng viên trong cùng một không gian làm việc, gọn gàng hơn nhưng vẫn giữ nguyên quy trình hiện tại.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-slate-800 bg-[#11213A]/55 px-3 py-2 text-right xl:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Quy trình</div>
              <div className="mt-1 text-sm font-semibold text-slate-200">1. JD  2. CV  3. Phân tích</div>
            </div>

            <button
              type="button"
              onClick={() => setStep('jd')}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all ${
                step === 'jd'
                  ? 'border-sky-400/30 bg-sky-400/10 text-sky-100'
                  : 'border-slate-800 bg-[#11213A]/45 text-slate-400'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              JD
            </button>
            <button
              type="button"
              onClick={() => jdReady && setStep('cv')}
              disabled={!jdReady}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all ${
                step === 'cv'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                  : 'border-slate-800 bg-[#11213A]/45 text-slate-400'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <UploadCloud className="h-4 w-4" />
              CV
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <section className={`grid min-h-0 grid-rows-[auto_1fr_auto] gap-4 p-5 ${panelClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {step === 'jd' ? 'Bước 1' : 'Bước 2'}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {step === 'jd' ? 'Nạp JD' : 'Nạp CV'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {step === 'jd'
                    ? 'Chọn nguồn JD phù hợp để hệ thống chuẩn hóa trước khi bước sang CV.'
                    : 'Thêm CV theo lô và theo dõi danh sách ngay tại cùng màn hình.'}
                </p>
              </div>

              {step === 'cv' && (
                <button
                  type="button"
                  onClick={onGetStarted}
                  disabled={cvFiles.length === 0}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 text-sm font-semibold text-sky-100 transition-all hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-40"
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
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-sky-400/20 bg-sky-400/10 text-sky-300">
                      <HardDriveUpload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Máy tính</div>
                      <div className="mt-1 text-xs text-slate-400">PDF, DOCX</div>
                    </div>
                    <div className={helperPillClass}>Tác vụ nhanh</div>
                  </button>

                  <button type="button" onClick={onManualEntry ?? onGetStarted} className={cardClass}>
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Nhập tay</div>
                      <div className="mt-1 text-xs text-slate-400">Dán trực tiếp</div>
                    </div>
                    <div className={helperPillClass}>Linh hoạt</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGoogleDrive()}
                    disabled={isProcessing}
                    className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      <FolderOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Google Drive</div>
                      <div className="mt-1 text-xs text-slate-400">Lấy tệp</div>
                    </div>
                    <div className={helperPillClass}>Đồng bộ cloud</div>
                  </button>
                </div>

                <input ref={fileInputRef} type="file" className="hidden" accept={FILE_ACCEPT} onChange={handleFileChange} />

                <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_220px]">
                  <div className={`flex min-h-0 flex-col p-4 ${subPanelClass}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-200">
                        {jdReady ? <CheckCircle2 className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">
                          {isProcessing ? 'AI đang xử lý JD' : jdReady ? 'JD đã sẵn sàng' : 'Chưa có JD'}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {isProcessing ? PROCESSING_STEPS[processingStep] : successMsg || errorMsg || 'Chọn một nguồn để nạp JD.'}
                        </div>
                      </div>
                    </div>

                    {isProcessing ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {PROCESSING_STEPS.map((item, index) => {
                          const isCurrent = processingStep === index;
                          const isDone = processingStep > index;

                          return (
                            <div
                              key={item}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-xs ${
                                isCurrent
                                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                                  : isDone
                                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                                    : 'border-slate-800 bg-[#0B192C] text-slate-500'
                              }`}
                            >
                              <div className="flex h-5 w-5 items-center justify-center border border-current/40">
                                {isDone ? <Check className="h-3.5 w-3.5" /> : <span>{index + 1}</span>}
                              </div>
                              <span>{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-1 items-end rounded-xl border border-slate-800 bg-[#0B192C] px-4 py-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        {errorMsg ? <span className="text-red-200">{errorMsg}</span> : <span>{successMsg || 'JD sẽ được xử lý trước khi sang bước CV.'}</span>}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className={`p-4 ${subPanelClass}`}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Trạng thái</div>
                      <div className="mt-3 text-sm font-semibold text-white">{jdReady ? 'Đã nạp JD' : 'Chưa nạp JD'}</div>
                    </div>
                    <div className={`p-4 ${subPanelClass}`}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Tệp JD</div>
                      <div className="mt-3 truncate text-sm font-semibold text-white">{jdFileName || 'Chưa chọn tệp'}</div>
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
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                      <HardDriveUpload className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Từ máy tính</div>
                      <div className="mt-1 text-xs text-slate-400">Chọn nhiều CV</div>
                    </div>
                    <div className={helperPillClass}>Tái sử dụng danh sách</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCvDriveSelect()}
                    disabled={isLoadingCvDrive}
                    className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      {isLoadingCvDrive ? (
                        <div className="h-4.5 w-4.5 animate-spin border-2 border-emerald-300 border-t-transparent" />
                      ) : (
                        <FolderOpen className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Google Drive</div>
                      <div className="mt-1 text-xs text-slate-400">Lấy nhiều CV</div>
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
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Danh sách CV</div>
                      <div className="mt-1 text-xs text-slate-500">Thêm, kiểm tra và loại bỏ tệp ngay tại đây</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0B192C] px-3 py-1.5 text-xs text-slate-300">
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
                      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0B192C] px-4 text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-white/[0.03]">
                          <UploadCloud className="h-7 w-7 text-slate-600" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-300">Chưa có CV nào</p>
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          Kéo thả file vào khung này hoặc dùng hai nguồn nạp ở phía trên.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cvFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0B192C] px-4 py-3 transition-all hover:border-slate-700 hover:bg-[#11213A]"
                          >
                            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-white/[0.04] text-slate-300">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCv(index)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-all hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-200"
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
              <div className="text-sm text-slate-400">
                {step === 'jd' ? 'Hoàn tất JD để chuyển sang bước CV.' : 'Nạp xong CV rồi tiếp tục.'}
              </div>
              {step === 'jd' && jdReady && (
                <button
                  type="button"
                  onClick={() => setStep('cv')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-400/15"
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
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                    <BriefcaseBusiness className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">JD</div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">{jdFileName || 'Chưa nạp JD'}</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 ${subPanelClass}`}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <UploadCloud className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">CV</div>
                    <div className="mt-1 text-sm font-semibold text-white">{cvFiles.length}/{MAX_CV_PER_BATCH}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex min-h-0 flex-col ${subPanelClass}`}>
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Danh sách CV</div>
                <div className="mt-1 text-xs text-slate-500">Tóm tắt nhanh các CV đã nạp</div>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center border border-dashed border-slate-800 bg-[#0B192C] px-4 text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-white/[0.03]">
                      <UploadCloud className="h-7 w-7 text-slate-600" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-300">Chưa có CV nào</p>
                    <p className="mt-1 text-xs text-slate-500">Số lượng CV sẽ hiển thị tại đây ngay khi bạn nạp file.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0B192C] px-4 py-3"
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
  );
};

export default CVScreenerWelcome;
