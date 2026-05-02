import React, { useEffect, useState, useCallback, useRef } from 'react';
import { extractTextFromJdFile } from '@/services/file-processing/ocrService';
import { extractJobPositionFromJD, filterAndStructureJD, extractHardFiltersFromJD } from '@/services/ai-ml/models/gemini/geminiService';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import type { HardFilters } from '@/assets/types';

interface CVScreenerWelcomeProps {
  onGetStarted: () => void;
  onFileProcessed: (data: {
    jdText: string;
    jobPosition: string;
    hardFilters: Partial<HardFilters>;
  }) => void;
}

const PROCESSING_STEPS = [
  'Đang đọc file...',
  'Đang cấu trúc JD bằng AI...',
  'Đang trích xuất chức danh...',
  'Đang phân tích tiêu chí lọc...',
];

const CVScreenerWelcome: React.FC<CVScreenerWelcomeProps> = ({ onGetStarted, onFileProcessed }) => {
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setProcessingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setProcessingStep((s) => (s + 1) % PROCESSING_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrorMsg('');
      setProcessingStep(0);
      try {
        const rawText = await extractTextFromJdFile(file, (msg) => {
          if (msg.includes('PDF') || msg.includes('docx')) setProcessingStep(0);
        });
        if (!rawText || rawText.trim().length < 50) {
          throw new Error('Không trích xuất được nội dung. Hãy thử file khác trên Drive hoặc nhập tay.');
        }
        setProcessingStep(1);
        const structuredJd = await filterAndStructureJD(rawText);
        setProcessingStep(2);
        const jobPos = await extractJobPositionFromJD(structuredJd);
        setProcessingStep(3);
        const extracted = await extractHardFiltersFromJD(structuredJd);

        const mandatoryUpdates: Partial<HardFilters> = {};
        if (extracted?.location) (mandatoryUpdates as any).locationMandatory = true;
        if (extracted?.minExp) (mandatoryUpdates as any).minExpMandatory = true;
        if (extracted?.seniority) (mandatoryUpdates as any).seniorityMandatory = true;
        if (extracted?.education) (mandatoryUpdates as any).educationMandatory = true;
        if (extracted?.language) (mandatoryUpdates as any).languageMandatory = true;
        if (extracted?.certificates) (mandatoryUpdates as any).certificatesMandatory = true;
        if (extracted?.workFormat) (mandatoryUpdates as any).workFormatMandatory = true;
        if (extracted?.contractType) (mandatoryUpdates as any).contractTypeMandatory = true;

        onFileProcessed({
          jdText: structuredJd,
          jobPosition: jobPos || '',
          hardFilters: { ...(extracted || {}), ...mandatoryUpdates },
        });
      } catch (err: any) {
        const msg = err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
        setErrorMsg(
          msg.includes('network') || msg.includes('fetch') ? 'Lỗi kết nối. Vui lòng kiểm tra mạng.' : msg
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleGoogleDrive = async () => {
    try {
      const token = await googleDriveService.authenticate();
      const driveFiles = await googleDriveService.openPicker({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: false,
      });
      if (driveFiles.length > 0) {
        setIsProcessing(true);
        setProcessingStep(0);
        const blob = await googleDriveService.downloadFile(driveFiles[0].id, token);
        const file = new File([blob], driveFiles[0].name, { type: driveFiles[0].mimeType });
        await processFile(file);
      }
    } catch {
      setErrorMsg('Không kết nối được Google Drive.');
    }
  };

  return (
    <div
      className={`
        relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[#0B192C]
        transition-all duration-700
        ${mounted ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Minimal Background Gradients */}
      <div className="absolute top-[-20%] left-[20%] h-[50%] w-[60%] -full bg-blue-500/[0.03] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] -full bg-purple-500/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div
          className={`mx-auto flex w-full max-w-2xl flex-col transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Header Section */}
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-12 w-12 items-center justify-center overflow-hidden  border border-white/10 bg-[#0B192C] shadow-sm ring-1 ring-inset ring-white/5">
              <img src="/images/logos/logo.jpg" alt="SupportHR" className="h-[70%] w-[70%] object-cover  shadow-md" />
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Bắt đầu sàng lọc
            </h1>
            <p className="mt-3 text-sm font-medium text-neutral-400 sm:text-base max-w-md">
              Chọn nguồn tải lên JD và CV để AI tự động trích xuất tiêu chí và đánh giá mức độ phù hợp.
            </p>
          </div>

          {/* Action Cards (Sleek Horizontal Layout) */}
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Tải file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-start gap-4  border border-white/5 bg-white/[0.02] p-5 text-left transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center -full bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-500/20">
                <i className="fa-solid fa-file-arrow-up text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Máy tính</h3>
                <p className="mt-1 text-xs text-neutral-500">Tải file PDF, DOCX</p>
              </div>
            </button>

            {/* Nhập tay */}
            <button
              type="button"
              onClick={onGetStarted}
              className="group flex flex-col items-start gap-4  border border-white/5 bg-white/[0.02] p-5 text-left transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center -full bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-purple-500/20">
                <i className="fa-solid fa-align-left text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Nhập tay</h3>
                <p className="mt-1 text-xs text-neutral-500">Dán trực tiếp văn bản</p>
              </div>
            </button>

            {/* Google Drive */}
            <button
              type="button"
              onClick={handleGoogleDrive}
              disabled={isProcessing}
              className="group flex flex-col items-start gap-4  border border-white/5 bg-white/[0.02] p-5 text-left transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:border-white/5 disabled:hover:bg-white/[0.02]"
            >
              <div className="flex h-10 w-10 items-center justify-center -full bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-emerald-500/20">
                <i className="fa-brands fa-google-drive text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Drive</h3>
                <p className="mt-1 text-xs text-neutral-500">Lấy file trực tuyến</p>
              </div>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />

          {errorMsg && (
            <div className={`mt-6 flex w-full items-start gap-3  border border-red-500/20 bg-red-500/10 p-3 text-left text-sm text-red-200 transition-all duration-300 animate-in fade-in`}>
              <div className="flex shrink-0 items-center justify-center text-red-400 mt-0.5">
                <i className="fa-solid fa-circle-exclamation text-xs" />
              </div>
              <span className="min-w-0 flex-1 leading-snug">{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="shrink-0  p-1 opacity-60 transition-opacity hover:bg-red-500/20 hover:opacity-100"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>
          )}

          <div className="mt-10 mx-auto flex max-w-fit items-center gap-2 -full border border-white/5 bg-white/[0.02] px-4 py-2">
            <i className="fa-solid fa-lightbulb text-[10px] text-amber-500"></i>
            <p className="text-[11px] font-medium text-neutral-400">
              Mẹo: Chia nhỏ các đầu mục (vị trí, yêu cầu, kỹ năng) để AI chấm điểm chuẩn xác hơn.
            </p>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ${
            isProcessing ? 'bg-[#0B192C]/70 opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="mx-4 w-full max-w-sm  border border-slate-700/60 bg-[#0B192C] p-8 text-center shadow-2xl shadow-black/60">
            <div className="relative mx-auto mb-5 h-16 w-16">
              <div
                className="absolute inset-0 animate-ping -full border-2 border-cyan-500/20"
                style={{ animationDuration: '2s' }}
              />
              <div className="relative flex h-full w-full items-center justify-center -full border border-slate-600/40 bg-gradient-to-br from-indigo-600/30 to-cyan-600/30">
                <i className="fa-solid fa-brain animate-pulse text-xl text-cyan-300" />
              </div>
            </div>
            <h3 className="mb-1 text-lg font-black text-white">AI đang xử lý</h3>
            <p className="mb-4 text-[11px] text-slate-400">Vui lòng chờ trong giây lát...</p>
            <div className="mb-4 space-y-1.5">
              {PROCESSING_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-[11px] transition-all duration-300 ${
                    processingStep === idx ? 'text-cyan-400 opacity-100' : 'text-slate-600 opacity-45'
                  }`}
                >
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center -full border transition-all ${
                      processingStep === idx
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : processingStep > idx
                          ? 'border-emerald-400 bg-emerald-400/20'
                          : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {processingStep > idx ? (
                      <i className="fa-solid fa-check text-[7px] text-emerald-400" />
                    ) : processingStep === idx ? (
                      <div className="h-1.5 w-1.5 animate-pulse -full bg-cyan-400" />
                    ) : (
                      <div className="h-1 w-1 -full bg-slate-600" />
                    )}
                  </div>
                  {step}
                </div>
              ))}
            </div>
            <div className="h-1 overflow-hidden -full bg-slate-800/80">
              <div
                className="h-full -full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-[width] duration-500 ease-out"
                style={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVScreenerWelcome;



