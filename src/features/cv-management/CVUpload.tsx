import React, { memo, useCallback, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { UploadCloud } from 'lucide-react';
import type { Candidate, HardFilters, WeightCriteria, AppStep } from '@/types';
import { analyzeCVs } from '@/services/screening/frontendScreeningService';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getSafeErrorMessage, isRedirectingToGoogle } from '@/utils/errorMessages';
import '@/features/cv-management/styles/cv-upload.css';

interface CVUploadProps {
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
  jdText: string;
  weights: WeightCriteria;
  hardFilters: HardFilters;
  setAnalysisResults: React.Dispatch<React.SetStateAction<Candidate[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
  onAnalysisStart: () => void;
  completedSteps: AppStep[];
}

const MAX_CV_PER_BATCH = 20;
const REQUIRED_STEPS: AppStep[] = ['jd', 'weights'];

type CVUploadThemeVars = CSSProperties & {
  '--cv-page-bg': string;
  '--cv-header-bg': string;
  '--cv-border-soft': string;
  '--cv-card-bg': string;
  '--cv-card-bg-2': string;
  '--cv-card-border': string;
  '--cv-panel-border': string;
  '--cv-text-primary': string;
  '--cv-text-muted': string;
  '--cv-text-dim': string;
  '--cv-dropzone-bg': string;
  '--cv-file-panel-bg': string;
};

const CVUpload: React.FC<CVUploadProps> = memo((props) => {
  const {
    cvFiles,
    setCvFiles,
    jdText,
    weights,
    hardFilters,
    setAnalysisResults,
    setIsLoading,
    setLoadingMessage,
    onAnalysisStart,
    completedSteps,
  } = props;

  const [error, setError] = useState('');
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  const readyForAnalysis = useMemo(
    () => REQUIRED_STEPS.every((step) => completedSteps.includes(step)),
    [completedSteps],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const newFiles = Array.from(event.target.files);

    setCvFiles((prevFiles: File[]) => {
      const existingMap = new Map(prevFiles.map((file: File) => [`${file.name}-${file.size}`, true]));
      const uniqueNewFiles = newFiles.filter((file: File) => !existingMap.has(`${file.name}-${file.size}`));

      if (uniqueNewFiles.length === 0) {
        return prevFiles;
      }

      const totalFiles = prevFiles.length + uniqueNewFiles.length;
      if (totalFiles > MAX_CV_PER_BATCH) {
        setError(
          `Chỉ được phép tải lên tối đa ${MAX_CV_PER_BATCH} CV. Bạn đang có ${prevFiles.length} và muốn thêm ${uniqueNewFiles.length}.`,
        );
        return prevFiles;
      }

      setError('');
      return [...prevFiles, ...uniqueNewFiles];
    });

    event.target.value = '';
  };

  const handleGoogleDriveSelect = async () => {
    try {
      const driveFiles = await googleDriveService.pickAndImportFiles({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: true,
        fileType: 'cv',
      });

      if (driveFiles.length === 0) {
        return;
      }

      setIsLoading(true);
      setLoadingMessage(`Đang nhập ${driveFiles.length} file từ Google Drive...`);

      setCvFiles((prevFiles: File[]) => {
        const existingMap = new Map(prevFiles.map((file: File) => [`${file.name}-${file.size}`, true]));
        const uniqueNewFiles = driveFiles.filter((file: File) => !existingMap.has(`${file.name}-${file.size}`));

        if (uniqueNewFiles.length === 0) {
          return prevFiles;
        }

        const totalFiles = prevFiles.length + uniqueNewFiles.length;
        if (totalFiles > MAX_CV_PER_BATCH) {
          setError(
            `Chỉ được phép tải lên tối đa ${MAX_CV_PER_BATCH} CV. Bạn đang có ${prevFiles.length} và muốn thêm ${uniqueNewFiles.length}.`,
          );
          return prevFiles;
        }

        setError('');
        return [...prevFiles, ...uniqueNewFiles];
      });
    } catch (err: any) {
      console.error('Google Drive Error:', err);
      if (isRedirectingToGoogle(err)) {
        return;
      }
      setError(getSafeErrorMessage(err, 'drive'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleAnalyzeClick = async () => {
    const missingSteps = REQUIRED_STEPS.filter((step) => !completedSteps.includes(step));

    if (missingSteps.length > 0) {
      const stepNames = missingSteps
        .map((step) => {
          if (step === 'jd') return 'Mô tả công việc';
          if (step === 'weights') return 'Phân bổ trọng số';
          return step;
        })
        .join(', ');

      setError(`Vui lòng hoàn thành các bước trước: ${stepNames}.`);
      return;
    }

    if (cvFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một tệp CV để phân tích.');
      return;
    }

    setError('');
    setIsLoading(true);
    onAnalysisStart();
    setAnalysisResults([]);

    try {
      const analysisGenerator = analyzeCVs(jdText, weights, hardFilters, cvFiles);

      for await (const result of analysisGenerator) {
        if (result.status === 'progress') {
          setLoadingMessage(result.message);
          continue;
        }

        setAnalysisResults((prev) => [...prev, result as Candidate]);
      }
    } catch (err) {
      console.error('Lỗi phân tích CV:', err);
      const message = getSafeErrorMessage(err, 'ai');

      setError(message);
      setAnalysisResults((prev) => {
        if (prev.some((candidate) => candidate.candidateName === 'Đang có lỗi')) {
          return prev;
        }

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
      setIsLoading(false);
      setLoadingMessage('Hoàn tất phân tích!');
    }
  };

  const handleRemoveFile = useCallback((index: number) => {
    setCvFiles((prevFiles) => prevFiles.filter((_, currentIndex) => currentIndex !== index));
  }, [setCvFiles]);

  const handleClearFiles = useCallback(() => {
    setCvFiles([]);
  }, [setCvFiles]);

  const tc = useThemeColors();
  const themeVars: CVUploadThemeVars = {
    '--cv-page-bg': tc.pageBg,
    '--cv-header-bg': tc.headerBg,
    '--cv-border-soft': tc.borderSoft,
    '--cv-card-bg': tc.cardBg,
    '--cv-card-bg-2': tc.cardBg2,
    '--cv-card-border': tc.borderCard,
    '--cv-panel-border': tc.border,
    '--cv-text-primary': tc.textPrimary,
    '--cv-text-muted': tc.textMuted,
    '--cv-text-dim': tc.textDim,
    '--cv-dropzone-bg': tc.isDark ? '#08080a' : '#f8faff',
    '--cv-file-panel-bg': tc.isDark ? '#08080a' : '#ffffff',
  };

  return (
    <section
      id="module-upload"
      className="cv-upload-page module-pane active relative flex h-[calc(100vh)] min-h-[400px] w-full flex-col"
      style={themeVars}
    >
      <div className="cv-upload-page__glow cv-upload-page__glow--top" />
      <div className="cv-upload-page__glow cv-upload-page__glow--bottom" />

      <div className="cv-upload-page__header shrink-0 border-b">
        <div className="cv-upload-page__title-row flex items-center gap-3 px-4 py-3">
          <div className="cv-upload-page__accent shrink-0" />

          <div className="min-w-0">
            <h1 className="cv-upload-page__heading text-base font-bold leading-tight tracking-tight">
              Tải lên và phân tích CV
            </h1>
            <p className="cv-upload-page__subheading mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight">
              CV Upload and AI Analysis
            </p>
          </div>

          <div className="cv-upload-page__support hidden items-center gap-2 lg:flex">
            <span className="text-[10px] font-medium">Tải CV · Kiểm tra · Phân tích bằng AI</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="cv-upload-page__status-pill" data-state={completedSteps.includes('jd') ? 'done' : 'pending'}>
              JD {completedSteps.includes('jd') ? '✓' : '○'}
            </div>
            <div
              className="cv-upload-page__status-pill"
              data-state={completedSteps.includes('weights') ? 'done' : 'pending'}
            >
              Trọng số {completedSteps.includes('weights') ? '✓' : '○'}
            </div>
            <div className="cv-upload-page__count-pill">
              {cvFiles.length} / {MAX_CV_PER_BATCH} CV
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div className="custom-scrollbar h-full w-full overflow-y-auto p-4 lg:px-8 lg:py-6">
          <div className="grid h-full min-h-[500px] gap-6 lg:grid-cols-12">
            <div className="flex h-full flex-col gap-4 lg:col-span-5">
              <div className="group relative flex flex-1 flex-col">
                <div className="cv-upload-page__dropzone relative flex flex-1 flex-col items-center justify-center p-6 text-center transition-all">
                  <div className="cv-upload-page__dropzone-icon mb-6 flex h-16 w-16 items-center justify-center shadow-lg shadow-indigo-500/10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                    <UploadCloud className="h-8 w-8 text-indigo-400" />
                  </div>

                  <h4 className="cv-upload-page__dropzone-title mb-1.5 text-lg font-bold">
                    Kéo thả hoặc chọn file
                  </h4>
                  <p className="cv-upload-page__dropzone-hint mb-6 text-[10px]">
                    PDF, DOCX, PNG, JPG (tối đa {MAX_CV_PER_BATCH} file)
                  </p>

                  <div className="mt-auto flex w-full flex-col gap-2">
                    {!showUploadOptions ? (
                      <button
                        type="button"
                        onClick={() => setShowUploadOptions(true)}
                        className="cv-upload-page__primary-action w-full py-3 text-sm font-semibold text-white transition-all"
                      >
                        Tải CV lên
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                        <label className="cv-upload-page__source-button cv-upload-page__source-button--machine cursor-pointer py-2.5 text-sm font-medium">
                          Từ máy
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleGoogleDriveSelect}
                          className="cv-upload-page__source-button cv-upload-page__source-button--drive py-2.5 text-sm font-medium"
                        >
                          Google Drive
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUploadOptions(false)}
                          className="cv-upload-page__source-button cv-upload-page__source-button--cancel col-span-2 py-1 text-xs"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={cvFiles.length === 0 || !readyForAnalysis}
                data-ready={cvFiles.length > 0 && readyForAnalysis}
                className="cv-upload-page__analyze-button flex w-full items-center justify-center gap-3 py-3 text-base font-bold transition-all"
              >
                {cvFiles.length > 0 && readyForAnalysis ? 'Phân tích ngay' : 'Chưa sẵn sàng'}
                <span className="text-[10px] opacity-80">→</span>
              </button>

              {error && (
                <div className="cv-upload-page__alert flex items-start gap-3 p-3">
                  <div className="cv-upload-page__alert-bar shrink-0" />
                  <p className="cv-upload-page__alert-text text-xs font-medium">{error}</p>
                </div>
              )}

              <div className="cv-upload-page__checklist p-4">
                <h5 className="cv-upload-page__checklist-title mb-3 text-[10px] font-bold uppercase tracking-wider">
                  Yêu cầu trước khi phân tích
                </h5>
                <ul className="space-y-2 text-xs">
                  <li className="cv-upload-page__checklist-item flex items-center gap-2" data-complete={completedSteps.includes('jd')}>
                    <span className="w-4 text-center">{completedSteps.includes('jd') ? '✓' : '○'}</span>
                    Có mô tả công việc (JD)
                  </li>
                  <li
                    className="cv-upload-page__checklist-item flex items-center gap-2"
                    data-complete={completedSteps.includes('weights')}
                  >
                    <span className="w-4 text-center">{completedSteps.includes('weights') ? '✓' : '○'}</span>
                    Đã phân bổ trọng số
                  </li>
                  <li className="cv-upload-page__checklist-item flex items-center gap-2" data-complete={cvFiles.length > 0}>
                    <span className="w-4 text-center">{cvFiles.length > 0 ? '✓' : '○'}</span>
                    Đã chọn CV ({cvFiles.length})
                  </li>
                </ul>
              </div>
            </div>

            <div className="cv-upload-page__file-panel flex h-full flex-col overflow-hidden lg:col-span-7">
              <div className="cv-upload-page__file-panel-header flex items-center justify-between p-4">
                <h4 className="cv-upload-page__file-panel-title text-sm font-medium">Danh sách hồ sơ</h4>
                <div className="flex items-center gap-2">
                  <label
                    className="cv-upload-page__secondary-action cv-upload-page__secondary-action--machine cursor-pointer px-2 py-1 text-xs transition-colors"
                    title="Thêm từ máy tính"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    Thêm file
                  </label>
                  <button
                    type="button"
                    onClick={handleGoogleDriveSelect}
                    className="cv-upload-page__secondary-action cv-upload-page__secondary-action--drive px-2 py-1 text-xs transition-colors"
                    title="Thêm từ Google Drive"
                  >
                    Google Drive
                  </button>
                  {cvFiles.length > 0 && (
                    <>
                      <div className="cv-upload-page__divider h-4 w-px" />
                      <button
                        type="button"
                        onClick={handleClearFiles}
                        className="cv-upload-page__secondary-action cv-upload-page__secondary-action--danger px-2 py-1 text-xs transition-colors"
                      >
                        Xóa tất cả
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="custom-scrollbar min-h-[140px] flex-1 overflow-y-auto p-3">
                {cvFiles.length === 0 ? (
                  <div className="cv-upload-page__empty-state flex h-full flex-col items-center justify-center space-y-3 py-12">
                    <div className="cv-upload-page__empty-icon h-12 w-12" />
                    <p className="text-sm">Chưa có CV nào được chọn</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {cvFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="cv-upload-page__file-row group flex items-center gap-3 p-3 transition-all">
                        <div className="cv-upload-page__file-icon h-8 w-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="cv-upload-page__file-name truncate text-sm">{file.name}</p>
                          <p className="cv-upload-page__file-size text-[10px]">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="cv-upload-page__remove-button flex h-8 w-8 items-center justify-center transition-colors"
                          aria-label={`Xóa ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="cv-upload-page__footer p-3 text-center text-[10px]">
                Nhóm CV theo vị trí để AI phân tích chính xác nhất
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

CVUpload.displayName = 'CVUpload';

export default CVUpload;
