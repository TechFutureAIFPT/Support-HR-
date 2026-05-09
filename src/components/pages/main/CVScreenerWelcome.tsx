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
} from '@/services/ai-ml/models/gemini/geminiService';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import type { HardFilters } from '@/assets/types';

interface CVScreenerWelcomeProps {
  onGetStarted: () => void;
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
  'group flex min-h-[132px] flex-col justify-between border border-slate-800 bg-[#11213A]/45 p-4 text-left transition-all duration-300 hover:border-slate-700 hover:bg-[#132746]';

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({
  onGetStarted,
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
      const token = await googleDriveService.authenticate();
      const driveFiles = await googleDriveService.openPicker({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: false,
      });

      if (driveFiles.length > 0) {
        const blob = await googleDriveService.downloadFile(driveFiles[0].id, token);
        const file = new File([blob], driveFiles[0].name, { type: driveFiles[0].mimeType });
        await processFile(file);
      }
    } catch {
      setErrorMsg('Không kết nối được Google Drive.');
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
      const token = await googleDriveService.authenticate();
      const driveFiles = await googleDriveService.openPicker({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: true,
      });

      if (driveFiles.length === 0) return;

      const filesFromDrive: File[] = [];
      for (const driveFile of driveFiles) {
        try {
          const blob = await googleDriveService.downloadFile(driveFile.id, token);
          filesFromDrive.push(new File([blob], driveFile.name, { type: driveFile.mimeType }));
        } catch (error) {
          console.error(`Failed to download ${driveFile.name}`, error);
        }
      }

      appendCvFiles(filesFromDrive);
    } catch (err: any) {
      if (err?.message && (err.message.includes('Client ID') || err.message.includes('API Key'))) {
        setCvError('Google Drive chưa được cấu hình.');
      } else {
        setCvError('Không lấy được CV từ Google Drive.');
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
        <header className="mb-4 flex shrink-0 items-center justify-between gap-4 border border-slate-800 bg-[#0B192C]/94 px-5 py-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">CV Screening</div>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Nạp JD và CV</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('jd')}
              className={`inline-flex h-10 items-center gap-2 border px-3 text-sm font-medium transition-all ${
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
              className={`inline-flex h-10 items-center gap-2 border px-3 text-sm font-medium transition-all ${
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
          <section className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4 border border-slate-800 bg-[#0B192C]/94 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {step === 'jd' ? 'Bước 1' : 'Bước 2'}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {step === 'jd' ? 'Nạp JD' : 'Nạp CV'}
                </h2>
              </div>

              {step === 'cv' && (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex h-10 items-center gap-2 border border-sky-500/30 bg-sky-500/10 px-4 text-sm font-semibold text-sky-100 transition-all hover:bg-sky-500/15"
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
                  </button>

                  <button type="button" onClick={onGetStarted} className={cardClass}>
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Nhập tay</div>
                      <div className="mt-1 text-xs text-slate-400">Dán trực tiếp</div>
                    </div>
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
                  </button>
                </div>

                <input ref={fileInputRef} type="file" className="hidden" accept={FILE_ACCEPT} onChange={handleFileChange} />

                <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_220px]">
                  <div className="flex min-h-0 flex-col border border-slate-800 bg-[#11213A]/35 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-cyan-200">
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
                              className={`flex items-center gap-3 border px-3 py-3 text-xs ${
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
                      <div className="flex flex-1 items-end border border-slate-800 bg-[#0B192C] px-4 py-4 text-sm text-slate-300">
                        {errorMsg ? <span className="text-red-200">{errorMsg}</span> : <span>{successMsg || 'JD sẽ được xử lý trước khi sang bước CV.'}</span>}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="border border-slate-800 bg-[#11213A]/35 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Trạng thái</div>
                      <div className="mt-3 text-sm font-semibold text-white">{jdReady ? 'Đã nạp JD' : 'Chưa nạp JD'}</div>
                    </div>
                    <div className="border border-slate-800 bg-[#11213A]/35 p-4">
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
                  className="flex min-h-0 flex-col border border-slate-800 bg-[#11213A]/35"
                  onDragOver={handleDropCvFiles}
                  onDrop={handleDropCvFiles}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Danh sách CV</div>
                      <div className="mt-1 text-xs text-slate-500">Chỉ hiển thị tên file</div>
                    </div>
                    <div className="border border-slate-800 bg-[#0B192C] px-3 py-1.5 text-xs text-slate-300">
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
                      <div className="flex h-full min-h-[220px] flex-col items-center justify-center border border-dashed border-slate-800 bg-[#0B192C] px-4 text-center">
                        <UploadCloud className="h-10 w-10 text-slate-600" />
                        <p className="mt-3 text-sm text-slate-400">Chưa có CV nào</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cvFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="group flex items-center gap-3 border border-slate-800 bg-[#0B192C] px-4 py-3 transition-all hover:border-slate-700 hover:bg-[#11213A]"
                          >
                            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-slate-700 bg-white/[0.04] text-slate-300">
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

            <div className="flex items-center justify-between gap-3 border border-slate-800 bg-[#11213A]/35 px-4 py-3">
              <div className="text-sm text-slate-400">
                {step === 'jd' ? 'Hoàn tất JD để chuyển sang bước CV.' : 'Nạp xong CV rồi tiếp tục.'}
              </div>
              {step === 'jd' && jdReady && (
                <button
                  type="button"
                  onClick={() => setStep('cv')}
                  className="inline-flex h-10 items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-400/15"
                >
                  Sang bước CV
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>

          <aside className="grid min-h-0 grid-rows-[auto_1fr] gap-4 border border-slate-800 bg-[#0B192C]/94 p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="border border-slate-800 bg-[#11213A]/35 p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center border border-sky-400/20 bg-sky-400/10 text-sky-300">
                    <BriefcaseBusiness className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">JD</div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">{jdFileName || 'Chưa nạp JD'}</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-800 bg-[#11213A]/35 p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <UploadCloud className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">CV</div>
                    <div className="mt-1 text-sm font-semibold text-white">{cvFiles.length}/{MAX_CV_PER_BATCH}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col border border-slate-800 bg-[#11213A]/35">
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Danh sách CV</div>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                {cvFiles.length === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center border border-dashed border-slate-800 bg-[#0B192C] px-4 text-center">
                    <UploadCloud className="h-10 w-10 text-slate-600" />
                    <p className="mt-3 text-sm text-slate-400">Chưa có CV nào</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 border border-slate-800 bg-[#0B192C] px-4 py-3"
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
