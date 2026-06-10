import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  Loader2,
  Save,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from 'lucide-react';
import type { JDStandardizeResponse, JDStandardizeTargetPlatform, JDSupplementalFields, NormalizedJD } from '@/types';
import { standardizeJDFile, standardizeJDText } from '@/services/data-sync/recruitmentToolsService';
import { JDTemplatesService } from '@/services/data-sync/jdTemplatesService';

interface JDStandardizerPageProps {
  onUseJD?: (payload: { jdText: string; rawJdText: string; jobPosition: string; supplementalFields: JDSupplementalFields }) => void;
}

const platformOptions: Array<{ value: JDStandardizeTargetPlatform; label: string; hint: string }> = [
  { value: 'generic', label: 'Mẫu tuyển dụng chung', hint: 'Phù hợp đăng nội bộ hoặc gửi quản lý tuyển dụng' },
  { value: 'topcv', label: 'TopCV', hint: 'Tối ưu cho bài đăng tuyển dụng phổ biến' },
  { value: 'vietnamworks', label: 'VietnamWorks', hint: 'Rõ mô tả, yêu cầu và quyền lợi' },
  { value: 'linkedin', label: 'LinkedIn', hint: 'Ngắn gọn, chuyên nghiệp, dễ quét' },
  { value: 'parse_jd', label: 'Chuẩn hóa để phân tích', hint: 'Ưu tiên cấu trúc cho AI đọc JD' },
];

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

const buildJDText = (normalized: NormalizedJD) => {
  const sections = [
    normalized.title ? `# ${normalized.title}` : '',
    normalized.overview ? `\n## Tổng quan\n${normalized.overview}` : '',
    normalized.responsibilities.length ? `\n## Trách nhiệm chính\n${normalized.responsibilities.map((item) => `- ${item}`).join('\n')}` : '',
    normalized.requirements.length ? `\n## Yêu cầu ứng viên\n${normalized.requirements.map((item) => `- ${item}`).join('\n')}` : '',
    normalized.benefits.length ? `\n## Quyền lợi\n${normalized.benefits.map((item) => `- ${item}`).join('\n')}` : '',
    normalized.workingTime ? `\n## Thời gian làm việc\n${normalized.workingTime}` : '',
    normalized.location ? `\n## Địa điểm\n${normalized.location}` : '',
    normalized.salary ? `\n## Mức lương\n${normalized.salary}` : '',
    normalized.applicationInfo ? `\n## Thông tin ứng tuyển\n${normalized.applicationInfo}` : '',
    normalized.keywords.length ? `\n## Từ khóa chính\n${normalized.keywords.join(', ')}` : '',
  ];
  return sections.filter(Boolean).join('\n').trim();
};

const JDStandardizerPage: React.FC<JDStandardizerPageProps> = ({ onUseJD }) => {
  const [jdText, setJdText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<JDStandardizeTargetPlatform>('generic');
  const [forceOcr, setForceOcr] = useState(false);
  const [supplementalFields, setSupplementalFields] = useState<JDSupplementalFields>({
    companyName: '',
    salary: '',
    location: '',
    workingTime: '',
    benefits: '',
    applicationInfo: '',
    notes: '',
  });
  const [result, setResult] = useState<JDStandardizeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const normalizedJD = result?.normalizedJD || emptyNormalizedJD;
  const outputText = useMemo(() => buildJDText(normalizedJD), [normalizedJD]);
  const selectedPlatform = platformOptions.find((item) => item.value === targetPlatform) || platformOptions[0];

  const updateField = (key: keyof JDSupplementalFields, value: string) => {
    setSupplementalFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!file && jdText.trim().length < 20) {
      setError('Vui lòng nhập JD hoặc tải file JD để chuẩn hóa.');
      return;
    }

    setIsLoading(true);
    try {
      const response = file
        ? await standardizeJDFile({ file, targetPlatform, supplementalFields, forceOcr })
        : await standardizeJDText({ jdText, targetPlatform, supplementalFields });
      setResult(response);
      setNotice('JD đã được chuẩn hóa. Bạn có thể sao chép, lưu mẫu hoặc dùng ngay trong quy trình.');
    } catch (submitError) {
      console.warn('Không thể chuẩn hóa JD:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Không thể chuẩn hóa JD từ backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard?.writeText(outputText);
    setNotice('Đã sao chép JD chuẩn hóa.');
  };

  const handleSaveTemplate = async () => {
    if (!outputText) return;
    setError('');
    setNotice('');
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
          locationMandatory: Boolean(normalizedJD.location || supplementalFields.location),
          minExpMandatory: false,
          seniorityMandatory: false,
          educationMandatory: false,
          contactMandatory: false,
          industryMandatory: false,
          languageMandatory: false,
          certificatesMandatory: false,
          salaryMandatory: Boolean(normalizedJD.salary || supplementalFields.salary),
          workFormatMandatory: false,
          contractTypeMandatory: false,
        },
      });
      setNotice('Đã lưu mẫu JD chuẩn hóa.');
    } catch (saveError) {
      console.warn('Không thể lưu mẫu JD:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu mẫu JD.');
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

  return (
    <div className="feature-page-shell flex h-full min-h-0 w-full flex-1 flex-col bg-white">
      <div className="shrink-0 border-b border-blue-100 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="border-l-4 border-blue-500 pl-3">
            <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">JD Standardizer</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Chuẩn hóa JD</h1>
            <p className="mt-1 text-sm text-slate-600">Biến mô tả công việc thô thành bản JD rõ ràng, đủ mục và dễ dùng cho phân tích AI.</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Nền tảng mục tiêu</p>
            <p className="mt-1 text-sm font-black text-slate-950">{selectedPlatform.label}</p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5">
        <div className="grid min-h-full gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 shadow-[0_18px_46px_rgba(30,64,175,0.07)]">
            <PanelTitle icon={<WandSparkles className="h-5 w-5" />} title="Thông tin đầu vào" subtitle="Nhập JD hoặc tải file, sau đó bổ sung ngữ cảnh tuyển dụng." />

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nội dung JD</label>
              <textarea
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                placeholder="Dán mô tả công việc hiện tại vào đây..."
                className="mt-2 min-h-[14rem] w-full resize-y rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-3 transition hover:bg-blue-50">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-950">{file ? file.name : 'Tải file JD'}</span>
                  <span className="block truncate text-xs text-slate-500">PDF, DOCX, PNG, JPG hoặc tài liệu JD phổ biến</span>
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
              <label className="flex h-20 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-xs font-bold text-slate-600">
                <input type="checkbox" checked={forceOcr} onChange={(event) => setForceOcr(event.target.checked)} className="h-4 w-4 rounded border-blue-200 text-blue-600" />
                Ưu tiên OCR
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label="Nền tảng" value={targetPlatform} onChange={(value) => setTargetPlatform(value as JDStandardizeTargetPlatform)}>
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectField>
              <InputField label="Công ty" value={supplementalFields.companyName || ''} onChange={(value) => updateField('companyName', value)} placeholder="VD: TechCorp Vietnam" />
              <InputField label="Mức lương" value={supplementalFields.salary || ''} onChange={(value) => updateField('salary', value)} placeholder="VD: 15-25 triệu" />
              <InputField label="Địa điểm" value={supplementalFields.location || ''} onChange={(value) => updateField('location', value)} placeholder="VD: Hà Nội / Remote" />
              <InputField label="Thời gian làm việc" value={supplementalFields.workingTime || ''} onChange={(value) => updateField('workingTime', value)} placeholder="VD: Thứ 2 - Thứ 6" />
              <InputField label="Thông tin ứng tuyển" value={supplementalFields.applicationInfo || ''} onChange={(value) => updateField('applicationInfo', value)} placeholder="Email hoặc form ứng tuyển" />
            </div>

            <InputField label="Quyền lợi bổ sung" value={supplementalFields.benefits || ''} onChange={(value) => updateField('benefits', value)} placeholder="Bảo hiểm, đào tạo, thưởng hiệu suất..." />
            <InputField label="Ghi chú cho AI" value={supplementalFields.notes || ''} onChange={(value) => updateField('notes', value)} placeholder="Nhấn mạnh kỹ năng, ngành hoặc yêu cầu nội bộ..." />

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(35,136,255,0.2)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Chuẩn hóa JD
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <section className="flex min-h-[34rem] flex-col rounded-3xl border border-blue-100 bg-white shadow-[0_18px_46px_rgba(30,64,175,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-[#f8fbff] px-5 py-4">
              <PanelTitle icon={<FileText className="h-5 w-5" />} title="Kết quả chuẩn hóa" subtitle={selectedPlatform.hint} compact />
              {result && (
                <div className="flex items-center gap-2">
                  <ActionButton icon={<Copy className="h-4 w-4" />} label="Sao chép" onClick={() => void handleCopy()} />
                  <ActionButton icon={<Save className="h-4 w-4" />} label="Lưu mẫu JD" onClick={() => void handleSaveTemplate()} />
                  <button
                    type="button"
                    onClick={handleUseJD}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    Dùng JD này
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {notice && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            {!result ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <Clipboard className="h-12 w-12 text-blue-500" />
                <h2 className="mt-4 text-xl font-black text-slate-950">Chưa có JD chuẩn hóa</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Sau khi gửi JD, kết quả sẽ hiển thị gồm điểm chất lượng, mục còn thiếu, gợi ý cải thiện và bản JD mới.</p>
              </div>
            ) : (
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
                  <aside className="space-y-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Điểm chất lượng</p>
                      <p className="mt-2 text-4xl font-black text-slate-950">{result.score}<span className="text-lg text-blue-600">/100</span></p>
                    </div>
                    <FindingList title="Mục còn thiếu" items={result.missingSections} />
                    <FindingList title="Điểm yếu" items={result.weakPoints} tone="amber" />
                    <FindingList title="Gợi ý cải thiện" items={result.suggestions} tone="emerald" />
                  </aside>

                  <article className="rounded-2xl border border-blue-100 bg-white p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Normalized JD</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950">{normalizedJD.title || 'JD đã chuẩn hóa'}</h2>
                      </div>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{result.platform.name}</span>
                    </div>
                    <JDPreview normalized={normalizedJD} />
                  </article>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const PanelTitle = ({ icon, title, subtitle, compact = false }: { icon: React.ReactNode; title: string; subtitle: string; compact?: boolean }) => (
  <div className="flex min-w-0 items-center gap-3">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">{icon}</span>
    <div className="min-w-0">
      <h2 className={`${compact ? 'text-base' : 'text-lg'} font-black text-slate-950`}>{title}</h2>
      <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
    </div>
  </div>
);

const InputField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) => (
  <label className="block">
    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
    />
  </label>
);

const SelectField = ({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
    >
      {children}
    </select>
  </label>
);

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
  >
    {icon}
    {label}
  </button>
);

const FindingList = ({ title, items, tone = 'blue' }: { title: string; items: JDStandardizeResponse['suggestions']; tone?: 'blue' | 'amber' | 'emerald' }) => {
  const color = tone === 'amber'
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
        ) : items.map((item, index) => (
          <div key={`${item.label}-${index}`} className={`rounded-xl border px-3 py-2 ${color}`}>
            <p className="text-xs font-black">{item.label}</p>
            {(item.reason || item.detail) && <p className="mt-1 text-xs leading-5 text-slate-600">{item.reason || item.detail}</p>}
          </div>
        ))}
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
        <ul className="list-disc space-y-1 pl-5">{normalized.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : <p>Chưa có trách nhiệm chính.</p>}
    </SectionPreview>
    <SectionPreview title="Yêu cầu ứng viên">
      {normalized.requirements.length ? (
        <ul className="list-disc space-y-1 pl-5">{normalized.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : <p>Chưa có yêu cầu ứng viên.</p>}
    </SectionPreview>
    <SectionPreview title="Quyền lợi">
      {normalized.benefits.length ? (
        <ul className="list-disc space-y-1 pl-5">{normalized.benefits.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : <p>Chưa có quyền lợi.</p>}
    </SectionPreview>
    <div className="grid gap-3 border-t border-blue-100 pt-4 md:grid-cols-3">
      <MiniInfo label="Địa điểm" value={normalized.location || 'Chưa có'} />
      <MiniInfo label="Lương" value={normalized.salary || 'Chưa có'} />
      <MiniInfo label="Thời gian" value={normalized.workingTime || 'Chưa có'} />
    </div>
    {normalized.keywords.length > 0 && (
      <div className="mt-4 flex flex-wrap gap-2">
        {normalized.keywords.map((keyword) => (
          <span key={keyword} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{keyword}</span>
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
