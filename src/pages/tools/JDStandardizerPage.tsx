import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  Info,
  Loader2,
  Save,
  Sparkles,
  Star,
  UploadCloud,
  WandSparkles,
  Zap,
} from 'lucide-react';
import type {
  JDStandardizeResponse,
  JDStandardizeTargetPlatform,
  JDSupplementalFields,
  NormalizedJD,
} from '@/types';
import { standardizeJDFile, standardizeJDText } from '@/services/data-sync/recruitmentToolsService';
import { JDTemplatesService } from '@/services/data-sync/jdTemplatesService';
import { getGoogleDriveService } from '@/services/file-processing/googleDriveLoader';
import { getSafeErrorMessage, isRedirectingToGoogle } from '@/utils/errorMessages';

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStage = 'input' | 'supplement' | 'format' | 'result';
type InputMode = 'text' | 'file' | 'drive';

type ExtendedPlatform = JDStandardizeTargetPlatform | 'support_hr';

interface JDStandardizerPageProps {
  onUseJD?: (payload: {
    jdText: string;
    rawJdText: string;
    jobPosition: string;
    supplementalFields: JDSupplementalFields;
  }) => void;
}

// ─── Platform config ──────────────────────────────────────────────────────────

interface PlatformOption {
  value: ExtendedPlatform;
  label: string;
  hint: string;
  badge?: string;
  highlight?: boolean;
}

const platformOptions: PlatformOption[] = [
  {
    value: 'support_hr',
    label: 'Support HR',
    hint: 'Tối ưu cho hệ thống phân tích AI của Support HR — tự động lưu bộ lọc và paste vào trang nạp dữ liệu.',
    badge: 'Đề xuất',
    highlight: true,
  },
  {
    value: 'generic',
    label: 'Mẫu tuyển dụng chung',
    hint: 'Phù hợp đăng nội bộ hoặc gửi quản lý tuyển dụng.',
  },
  {
    value: 'topcv',
    label: 'TopCV',
    hint: 'Tối ưu cho bài đăng tuyển dụng phổ biến tại Việt Nam.',
  },
  {
    value: 'vietnamworks',
    label: 'VietnamWorks',
    hint: 'Rõ mô tả, yêu cầu và quyền lợi theo chuẩn VietnamWorks.',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    hint: 'Ngắn gọn, chuyên nghiệp, dễ quét theo chuẩn quốc tế.',
  },
  {
    value: 'parse_jd',
    label: 'Chuẩn hóa để phân tích AI',
    hint: 'Ưu tiên cấu trúc tối ưu cho AI đọc và phân tích JD.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyNormalizedJD: NormalizedJD = {
  title: '',
  overview: '',
  responsibilities: [],
  requirements: [],
  benefits: [],
  workingTime: '',
  location: '',
  salary: '',
  applicationInfo: '',
  keywords: [],
};

const emptySupplemental: JDSupplementalFields = {
  companyName: '',
  salary: '',
  location: '',
  workingTime: '',
  benefits: '',
  applicationInfo: '',
  notes: '',
};

function buildJDText(normalized: NormalizedJD): string {
  const sections = [
    normalized.title ? `# ${normalized.title}` : '',
    normalized.overview ? `\n## Tổng quan\n${normalized.overview}` : '',
    normalized.responsibilities.length
      ? `\n## Trách nhiệm chính\n${normalized.responsibilities.map((item) => `- ${item}`).join('\n')}`
      : '',
    normalized.requirements.length
      ? `\n## Yêu cầu ứng viên\n${normalized.requirements.map((item) => `- ${item}`).join('\n')}`
      : '',
    normalized.benefits.length
      ? `\n## Quyền lợi\n${normalized.benefits.map((item) => `- ${item}`).join('\n')}`
      : '',
    normalized.workingTime ? `\n## Thời gian làm việc\n${normalized.workingTime}` : '',
    normalized.location ? `\n## Địa điểm\n${normalized.location}` : '',
    normalized.salary ? `\n## Mức lương\n${normalized.salary}` : '',
    normalized.applicationInfo ? `\n## Thông tin ứng tuyển\n${normalized.applicationInfo}` : '',
    normalized.keywords.length ? `\n## Từ khóa chính\n${normalized.keywords.join(', ')}` : '',
  ];
  return sections.filter(Boolean).join('\n').trim();
}

// Determine if JD has enough info to skip supplemental step
function hasEnoughInfo(result: JDStandardizeResponse): boolean {
  return result.score >= 55 && result.missingSections.length < 4;
}

// Resolve actual API platform from extended
function resolveApiPlatform(platform: ExtendedPlatform): JDStandardizeTargetPlatform {
  if (platform === 'support_hr') return 'parse_jd';
  return platform;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const JDStandardizerPage: React.FC<JDStandardizerPageProps> = ({ onUseJD }) => {
  const [stage, setStage] = useState<WizardStage>('input');
  const [jdText, setJdText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [forceOcr, setForceOcr] = useState(false);
  const [supplementalFields, setSupplementalFields] = useState<JDSupplementalFields>(emptySupplemental);
  const [selectedPlatform, setSelectedPlatform] = useState<ExtendedPlatform>('support_hr');
  const [preAnalysisResult, setPreAnalysisResult] = useState<JDStandardizeResponse | null>(null);
  const [result, setResult] = useState<JDStandardizeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  const normalizedJD = result?.normalizedJD ?? emptyNormalizedJD;
  const outputText = useMemo(() => buildJDText(normalizedJD), [normalizedJD]);

  useEffect(() => {
    let cancelled = false;

    const resumeGoogleDriveImport = async () => {
      try {
        const driveService = await getGoogleDriveService();
        if (driveService.getPendingImportFileType() !== 'jd') return;

        setIsDriveLoading(true);
        const files = await driveService.resumePendingPickAndImportIfNeeded();
        if (!cancelled && files.length > 0) {
          setFile(files[0]);
          setInputMode('drive');
          setNotice(`Đã nhập ${files[0].name} từ Google Drive.`);
        }
      } catch (err) {
        if (!cancelled && !isRedirectingToGoogle(err)) {
          setError(getSafeErrorMessage(err, 'drive'));
        }
      } finally {
        if (!cancelled) setIsDriveLoading(false);
      }
    };

    void resumeGoogleDriveImport();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectInputMode = (mode: InputMode) => {
    setInputMode(mode);
    setFile(null);
    setError('');
    setNotice('');
  };

  const handleGoogleDrivePicker = async () => {
    setError('');
    setNotice('');
    setIsDriveLoading(true);

    try {
      const driveService = await getGoogleDriveService();
      const files = await driveService.pickAndImportFiles({
        mimeTypes:
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,text/plain',
        multiSelect: false,
        fileType: 'jd',
      });

      if (files.length > 0) {
        setFile(files[0]);
        setInputMode('drive');
        setNotice(`Đã chọn ${files[0].name} từ Google Drive.`);
      }
    } catch (err) {
      if (!isRedirectingToGoogle(err)) setError(getSafeErrorMessage(err, 'drive'));
    } finally {
      setIsDriveLoading(false);
    }
  };

  const updateSupplemental = (key: keyof JDSupplementalFields, value: string) => {
    setSupplementalFields((prev) => ({ ...prev, [key]: value }));
  };

  // ── Step 1: analyse JD to detect missing fields ───────────────────────────
  const handleAnalyseJD = async () => {
    setError('');
    if (inputMode === 'text' && jdText.trim().length < 20) {
      setError('Vui lòng nhập ít nhất 20 ký tự mô tả công việc để tiếp tục.');
      return;
    }
    if (inputMode !== 'text' && !file) {
      setError(inputMode === 'drive' ? 'Vui lòng chọn một file từ Google Drive.' : 'Vui lòng tải lên một file JD.');
      return;
    }

    setIsLoading(true);
    try {
      const response = inputMode !== 'text' && file
        ? await standardizeJDFile({ file, targetPlatform: 'parse_jd', supplementalFields, forceOcr })
        : await standardizeJDText({ jdText, targetPlatform: 'parse_jd', supplementalFields });

      setPreAnalysisResult(response);

      if (hasEnoughInfo(response)) {
        // Skip supplement stage
        setStage('format');
      } else {
        setStage('supplement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể phân tích JD. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2/3: do full standardization ────────────────────────────────────
  const handleStandardize = async () => {
    setError('');
    setNotice('');
    setIsLoading(true);
    setTemplateSaved(false);

    try {
      const apiPlatform = resolveApiPlatform(selectedPlatform);
      const response = inputMode !== 'text' && file
        ? await standardizeJDFile({ file, targetPlatform: apiPlatform, supplementalFields, forceOcr })
        : await standardizeJDText({ jdText, targetPlatform: apiPlatform, supplementalFields });

      setResult(response);
      setStage('result');
      setNotice('JD đã được chuẩn hóa thành công.');

      // Auto-save + paste for Support HR
      if (selectedPlatform === 'support_hr') {
        void handleSupportHRActions(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể chuẩn hóa JD từ backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportHRActions = async (res: JDStandardizeResponse) => {
    const jdOutputText = buildJDText(res.normalizedJD);
    const title = res.normalizedJD.title || 'Vị trí tuyển dụng';

    try {
      await JDTemplatesService.createTemplate({
        name: `Support HR — ${title}`,
        category: 'Support HR',
        jobPosition: title,
        jdText: jdOutputText,
        hardFilters: {
          location: res.normalizedJD.location || supplementalFields.location || '',
          minExp: '',
          seniority: '',
          education: '',
          industry: '',
          language: '',
          languageLevel: '',
          certificates: '',
          salaryMin: '',
          salaryMax: res.normalizedJD.salary || supplementalFields.salary || '',
          workFormat: '',
          contractType: '',
          age: {},
          majorGroups: [],
          locationMandatory: Boolean(res.normalizedJD.location || supplementalFields.location),
          minExpMandatory: false,
          seniorityMandatory: false,
          educationMandatory: false,
          ageMandatory: false,
          contactMandatory: false,
          industryMandatory: false,
          majorMandatory: false,
          languageMandatory: false,
          certificatesMandatory: false,
          salaryMandatory: Boolean(res.normalizedJD.salary || supplementalFields.salary),
          workFormatMandatory: false,
          contractTypeMandatory: false,
        },
      });
      setTemplateSaved(true);
      setNotice('Đã lưu bộ lọc Support HR. JD sẵn sàng để phân tích.');
    } catch {
      // Non-blocking
    }
  };

  const handleUseJD = () => {
    if (!outputText) return;
    onUseJD?.({
      jdText: outputText,
      rawJdText: jdText || outputText,
      jobPosition: normalizedJD.title || 'Vị trí tuyển dụng',
      supplementalFields,
    });
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard?.writeText(outputText);
    setNotice('Đã sao chép JD chuẩn hóa vào clipboard.');
  };

  const handleSaveTemplate = async () => {
    if (!outputText) return;
    setError('');
    try {
      await JDTemplatesService.createTemplate({
        name: normalizedJD.title ? `Chuẩn hóa JD - ${normalizedJD.title}` : 'Chuẩn hóa JD',
        category: 'Chuẩn hóa JD',
        jobPosition: normalizedJD.title || 'Vị trí tuyển dụng',
        jdText: outputText,
        hardFilters: {
          location: normalizedJD.location || supplementalFields.location || '',
          minExp: '',
          seniority: '',
          education: '',
          industry: '',
          language: '',
          languageLevel: '',
          certificates: '',
          salaryMin: '',
          salaryMax: normalizedJD.salary || supplementalFields.salary || '',
          workFormat: '',
          contractType: '',
          age: {},
          majorGroups: [],
          locationMandatory: Boolean(normalizedJD.location || supplementalFields.location),
          minExpMandatory: false,
          seniorityMandatory: false,
          educationMandatory: false,
          ageMandatory: false,
          contactMandatory: false,
          industryMandatory: false,
          majorMandatory: false,
          languageMandatory: false,
          certificatesMandatory: false,
          salaryMandatory: Boolean(normalizedJD.salary || supplementalFields.salary),
          workFormatMandatory: false,
          contractTypeMandatory: false,
        },
      });
      setNotice('Đã lưu mẫu JD chuẩn hóa.');
    } catch {
      setError('Không thể lưu mẫu JD.');
    }
  };

  const handleReset = () => {
    setStage('input');
    setJdText('');
    setFile(null);
    setInputMode('text');
    setForceOcr(false);
    setSupplementalFields(emptySupplemental);
    setSelectedPlatform('support_hr');
    setPreAnalysisResult(null);
    setResult(null);
    setError('');
    setNotice('');
    setTemplateSaved(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="feature-page-shell recruitment-compact-shell flex h-full min-h-0 w-full flex-1 flex-col bg-white">
      {/* Page Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-balance text-2xl font-semibold text-slate-950">Chuẩn hóa JD</h1>
            <p className="mt-1 text-sm text-slate-600">
              Quy trình từng bước biến mô tả công việc thô thành JD rõ ràng, đủ mục và sẵn sàng cho AI.
            </p>
          </div>
          {/* Wizard step indicator */}
          <WizardStepBar stage={stage} />
        </div>
      </div>

      {/* Main Content */}
      <div className={`custom-scrollbar min-h-0 flex-1 bg-white px-4 py-3 sm:px-6 ${stage === 'input' ? 'overflow-y-auto lg:overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`mx-auto max-w-7xl ${stage === 'input' ? 'flex h-full min-h-0 flex-col gap-3' : 'space-y-4'}`}>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Notice */}
          {notice && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </div>
          )}

          {/* ── Stage: input ── */}
          {stage === 'input' && (
            <StageCard
              icon={<FileText className="h-5 w-5" />}
              title="Nhập mô tả công việc"
              subtitle="Chọn một cách nhập JD. Hệ thống sẽ phân tích và hỏi bổ sung khi cần."
              className="min-h-0 flex-1"
            >
              <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-1.5" role="tablist" aria-label="Cách nhập JD">
                  {([
                    ['text', 'Dán văn bản'],
                    ['file', 'Tải file'],
                    ['drive', 'Google Drive'],
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={inputMode === mode}
                      onClick={() => selectInputMode(mode)}
                      className={`h-10 rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ${
                        inputMode === mode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                  {inputMode === 'text' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <label htmlFor="jd-standardizer-text" className="mb-2 block text-sm font-semibold text-slate-800">
                        Nội dung mô tả công việc
                      </label>
                      <textarea
                        id="jd-standardizer-text"
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Dán mô tả công việc hiện tại vào đây..."
                        className="min-h-40 flex-1 resize-none overflow-y-auto rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                      />
                      <p className="mt-2 text-pretty text-xs leading-5 text-slate-500">
                        Có thể dán JD thô; hệ thống sẽ tự nhận diện tiêu đề, trách nhiệm, yêu cầu và quyền lợi.
                      </p>
                    </div>
                  )}

                  {inputMode === 'file' && (
                    <div className="space-y-4">
                      <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/40 px-6 py-8 text-center hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="flex size-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <UploadCloud className="size-6" />
                        </span>
                        <span className="mt-4 max-w-full truncate text-sm font-semibold text-slate-900">
                          {file ? file.name : 'Chọn file JD từ máy tính'}
                        </span>
                        <span className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX, PNG, JPG hoặc TXT</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <OcrOption checked={forceOcr} onChange={setForceOcr} />
                    </div>
                  )}

                  {inputMode === 'drive' && (
                    <div className="space-y-4">
                      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-6 py-8 text-center">
                        <GoogleDriveIcon className="size-12" />
                        <h3 className="mt-4 text-balance text-base font-semibold text-slate-950">Nhập JD từ Google Drive</h3>
                        <p className="mt-1 max-w-md text-pretty text-sm leading-6 text-slate-500">
                          Chọn một file JD trong Drive. File được đưa vào cùng luồng phân tích với file tải từ máy.
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleGoogleDrivePicker()}
                          disabled={isDriveLoading}
                          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDriveLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleDriveIcon className="size-5" />}
                          {isDriveLoading ? 'Đang mở Google Drive...' : 'Chọn từ Google Drive'}
                        </button>
                        {file && <p className="mt-3 max-w-full truncate text-xs font-medium text-blue-700">Đã chọn: {file.name}</p>}
                      </div>
                      <OcrOption checked={forceOcr} onChange={setForceOcr} />
                    </div>
                  )}

                  <details className="mt-3 shrink-0 border-t border-slate-200 pt-2 text-sm text-slate-600">
                    <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                      <Info className="size-4 text-blue-600" />
                      Mẹo nhập JD
                    </summary>
                    <p className="mt-2 pl-6 text-pretty text-xs leading-5 text-slate-500">
                      Với file scan hoặc ảnh, hãy bật OCR. Nếu JD thiếu thông tin, hệ thống sẽ hỏi bổ sung ở bước tiếp theo.
                    </p>
                  </details>

                  <div className="mt-3 flex shrink-0 justify-center border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => void handleAnalyseJD()}
                      disabled={isLoading || isDriveLoading}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto sm:min-w-64"
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      {isLoading ? 'Đang phân tích JD...' : 'Phân tích & Tiếp tục'}
                      {!isLoading && <ArrowRight className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </StageCard>
          )}

          {/* ── Stage: supplement ── */}
          {stage === 'supplement' && preAnalysisResult && (
            <>
              {/* Missing sections banner */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-amber-900">
                      JD chưa đủ thông tin (điểm: {preAnalysisResult.score}/100)
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Các mục còn thiếu:{' '}
                      <span className="font-semibold">
                        {preAnalysisResult.missingSections.map((s) => s.label).join(', ') || 'Một số trường quan trọng'}
                      </span>
                      . Bổ sung bên dưới để JD chuẩn hóa chính xác hơn.
                    </p>
                  </div>
                </div>
              </div>

              <StageCard
                icon={<WandSparkles className="h-5 w-5" />}
                title="Bổ sung thông tin còn thiếu"
                subtitle="Điền các trường bên dưới để AI chuẩn hóa JD chính xác hơn."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Công ty"
                    value={supplementalFields.companyName || ''}
                    onChange={(v) => updateSupplemental('companyName', v)}
                    placeholder="VD: TechCorp Vietnam"
                  />
                  <InputField
                    label="Địa điểm"
                    value={supplementalFields.location || ''}
                    onChange={(v) => updateSupplemental('location', v)}
                    placeholder="VD: Hà Nội / Remote"
                  />
                  <InputField
                    label="Mức lương"
                    value={supplementalFields.salary || ''}
                    onChange={(v) => updateSupplemental('salary', v)}
                    placeholder="VD: 15-25 triệu"
                  />
                  <InputField
                    label="Thời gian làm việc"
                    value={supplementalFields.workingTime || ''}
                    onChange={(v) => updateSupplemental('workingTime', v)}
                    placeholder="VD: Thứ 2 - Thứ 6"
                  />
                  <InputField
                    label="Thông tin ứng tuyển"
                    value={supplementalFields.applicationInfo || ''}
                    onChange={(v) => updateSupplemental('applicationInfo', v)}
                    placeholder="Email hoặc link form ứng tuyển"
                  />
                  <InputField
                    label="Quyền lợi bổ sung"
                    value={supplementalFields.benefits || ''}
                    onChange={(v) => updateSupplemental('benefits', v)}
                    placeholder="Bảo hiểm, đào tạo, thưởng..."
                  />
                </div>
                <InputField
                  label="Ghi chú thêm cho AI"
                  value={supplementalFields.notes || ''}
                  onChange={(v) => updateSupplemental('notes', v)}
                  placeholder="Nhấn mạnh kỹ năng, ngành hoặc yêu cầu nội bộ..."
                />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStage('input')}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-blue-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('format')}
                    className="inline-flex h-10 flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Chọn định dạng
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </StageCard>
            </>
          )}

          {/* ── Stage: format ── */}
          {stage === 'format' && (
            <StageCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Chọn định dạng chuẩn hóa"
              subtitle="Chọn nền tảng hoặc mục đích sử dụng JD sau khi chuẩn hóa."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {platformOptions.map((option) => {
                  const isSelected = selectedPlatform === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedPlatform(option.value)}
                      className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? option.highlight
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-blue-300 bg-blue-50'
                          : option.highlight
                            ? 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                            : 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {option.badge && (
                        <span
                          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                            isSelected && option.highlight
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          isSelected && option.highlight
                            ? 'bg-white/20 text-white'
                            : isSelected
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-blue-50 text-blue-500'
                        }`}
                      >
                        {option.highlight ? (
                          <Star className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 pr-8">
                        <p
                          className={`text-sm font-black ${
                            isSelected && option.highlight ? 'text-white' : 'text-slate-950'
                          }`}
                        >
                          {option.label}
                        </p>
                        <p
                          className={`mt-0.5 text-xs leading-5 ${
                            isSelected && option.highlight ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {option.hint}
                        </p>
                      </div>
                      {isSelected && (
                        <span
                          className={`absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full ${
                            option.highlight ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Support HR note */}
              {selectedPlatform === 'support_hr' && (
                <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <p className="text-xs leading-5 text-blue-700">
                    <span className="font-black">Support HR:</span> Sau khi chuẩn hóa, hệ thống sẽ tự động lưu bộ lọc
                    từ JD vào danh sách mẫu và paste JD vào trang nạp dữ liệu để bạn dùng ngay.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setStage(preAnalysisResult && !hasEnoughInfo(preAnalysisResult) ? 'supplement' : 'input')
                  }
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => void handleStandardize()}
                  disabled={isLoading}
                  className="inline-flex h-10 flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                  {isLoading ? 'Đang chuẩn hóa...' : 'Chuẩn hóa JD'}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </StageCard>
          )}

          {/* ── Stage: result ── */}
          {stage === 'result' && result && (
            <>
              {/* Quality score */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Điểm chất lượng</p>
                  <p className="mt-2 text-4xl font-black text-slate-950">
                    {result.score}
                    <span className="text-lg text-blue-600">/100</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Nền tảng</p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {selectedPlatform === 'support_hr' ? 'Support HR' : result.platform.name}
                  </p>
                  {selectedPlatform === 'support_hr' && templateSaved && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã lưu bộ lọc
                    </span>
                  )}
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Mục còn thiếu</p>
                  <p className="mt-2 text-4xl font-black text-slate-950">{result.missingSections.length}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <ActionButton icon={<Copy className="h-4 w-4" />} label="Sao chép" onClick={() => void handleCopy()} />
                <ActionButton icon={<Save className="h-4 w-4" />} label="Lưu mẫu JD" onClick={() => void handleSaveTemplate()} />
                {onUseJD && (
                  <button
                    type="button"
                    onClick={handleUseJD}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    {selectedPlatform === 'support_hr' ? (
                      <>
                        <Zap className="h-4 w-4" />
                        Paste vào Screener
                      </>
                    ) : (
                      <>
                        Dùng JD này
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-blue-50"
                >
                  Chuẩn hóa JD mới
                </button>
              </div>

              {/* Findings */}
              {(result.missingSections.length > 0 || result.weakPoints.length > 0 || result.suggestions.length > 0) && (
                <div className="grid gap-3 md:grid-cols-3">
                  <FindingList title="Mục còn thiếu" items={result.missingSections} />
                  <FindingList title="Điểm yếu" items={result.weakPoints} tone="amber" />
                  <FindingList title="Gợi ý cải thiện" items={result.suggestions} tone="emerald" />
                </div>
              )}

              {/* JD Preview */}
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                      Normalized JD
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      {normalizedJD.title || 'JD đã chuẩn hóa'}
                    </h2>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {selectedPlatform === 'support_hr' ? 'Support HR' : result.platform.name}
                  </span>
                </div>
                <JDPreview normalized={normalizedJD} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const WizardStepBar = ({ stage }: { stage: WizardStage }) => {
  const steps: { key: WizardStage | 'supplement'; label: string }[] = [
    { key: 'input', label: 'Nhập JD' },
    { key: 'supplement', label: 'Bổ sung' },
    { key: 'format', label: 'Định dạng' },
    { key: 'result', label: 'Kết quả' },
  ];

  const stageOrder: Record<WizardStage, number> = { input: 0, supplement: 1, format: 2, result: 3 };
  const currentIndex = stageOrder[stage];

  return (
    <div className="flex items-center gap-1" aria-label="Tiến trình chuẩn hóa JD">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 className="size-4" /> : index + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  isCurrent || isDone ? 'text-blue-700' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mb-5 h-1 w-7 rounded-full transition-colors sm:w-10 ${
                  index < currentIndex ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OcrOption = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
    />
    <span>
      <span className="block font-semibold text-slate-800">Ưu tiên OCR</span>
      <span className="block text-xs leading-5 text-slate-500">Dùng cho ảnh hoặc PDF scan từ máy tính và Google Drive.</span>
    </span>
  </label>
);

const GoogleDriveIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#0F9D58" d="M8.3 3h7.1L22 14.3h-7.1L8.3 3Z" />
    <path fill="#F4B400" d="M8.3 3 2 14.3l3.6 6.2L11.8 9.2 8.3 3Z" />
    <path fill="#4285F4" d="M5.6 20.5 9.1 14.3H22l-3.6 6.2H5.6Z" />
  </svg>
);

const StageCard = ({
  icon,
  title,
  subtitle,
  children,
  className = '',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`flex flex-col gap-3 border-t border-slate-200 pt-3 ${className}`}>
    <div className="flex shrink-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <div>
        <h2 className="text-balance text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-0.5 text-pretty text-sm text-slate-600">{subtitle}</p>
      </div>
    </div>
    <div className="min-h-0 flex-1">{children}</div>
  </section>
);

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <label className="block">
    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    />
  </label>
);

const ActionButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
  >
    {icon}
    {label}
  </button>
);

const FindingList = ({
  title,
  items,
  tone = 'blue',
}: {
  title: string;
  items: JDStandardizeResponse['suggestions'];
  tone?: 'blue' | 'amber' | 'emerald';
}) => {
  const color =
    tone === 'amber'
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : tone === 'emerald'
        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
        : 'border-blue-100 bg-blue-50 text-blue-700';

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">Không có ghi nhận.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.label}-${index}`} className={`rounded-xl border px-3 py-2 ${color}`}>
              <p className="text-xs font-black">{item.label}</p>
              {(item.reason || item.detail) && (
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.reason || item.detail}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SectionPreview = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-blue-100 py-4 first:border-t-0 first:pt-0">
    <h3 className="text-sm font-black text-slate-950">{title}</h3>
    <div className="mt-2 text-sm leading-7 text-slate-700">{children}</div>
  </section>
);

const JDPreview = ({ normalized }: { normalized: NormalizedJD }) => (
  <div className="space-y-0">
    <SectionPreview title="Tổng quan">
      <p>{normalized.overview || 'Chưa có tổng quan.'}</p>
    </SectionPreview>
    <SectionPreview title="Trách nhiệm chính">
      {normalized.responsibilities.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {normalized.responsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>Chưa có trách nhiệm chính.</p>
      )}
    </SectionPreview>
    <SectionPreview title="Yêu cầu ứng viên">
      {normalized.requirements.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {normalized.requirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>Chưa có yêu cầu ứng viên.</p>
      )}
    </SectionPreview>
    <SectionPreview title="Quyền lợi">
      {normalized.benefits.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {normalized.benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>Chưa có quyền lợi.</p>
      )}
    </SectionPreview>
    <div className="grid gap-3 border-t border-blue-100 pt-4 md:grid-cols-3">
      <MiniInfo label="Địa điểm" value={normalized.location || 'Chưa có'} />
      <MiniInfo label="Lương" value={normalized.salary || 'Chưa có'} />
      <MiniInfo label="Thời gian" value={normalized.workingTime || 'Chưa có'} />
    </div>
    {normalized.keywords.length > 0 && (
      <div className="mt-4 flex flex-wrap gap-2">
        {normalized.keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
          >
            {keyword}
          </span>
        ))}
      </div>
    )}
  </div>
);

const MiniInfo = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
  </div>
);

export default JDStandardizerPage;
