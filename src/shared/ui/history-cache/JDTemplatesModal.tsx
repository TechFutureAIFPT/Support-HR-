import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  JDTemplatesService,
  type CreateJDTemplateInput,
  type UserJDTemplate,
} from '@/lib/services/data-sync/jdTemplatesService';
import { auth } from '@/lib/services/firebase';
import { analysisCacheService } from '@/lib/services/history-cache/analysisCache';
import { cvFilterHistoryService } from '@/lib/services/history-cache/analysisHistory';
import {
  buildActivityHistoryStats,
  extractRecentUsedJDTemplates,
  getActivityHistory,
  type ActivityHistoryEntry,
  type ActivityHistoryStats,
  type RecentUsedJDTemplate,
} from '@/lib/services/history-cache/activityHistoryService';

export interface JDTemplate {
  id: string;
  name: string;
  category: string;
  jobPosition: string;
  jdText: string;
  hardFilters: any;
}

interface JDTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: JDTemplate) => void;
}

type TemplateListItem =
  | (UserJDTemplate & { origin: 'saved' })
  | (RecentUsedJDTemplate & { origin: 'history' });

interface TemplateFormProps {
  initial?: Partial<CreateJDTemplateInput>;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (input: CreateJDTemplateInput) => Promise<void>;
}

const CATEGORIES = [
  'IT/Software',
  'Marketing',
  'Sales',
  'Finance/Accounting',
  'HR',
  'Design/Creative',
  'Operations',
  'Customer Service',
  'Engineering',
  'Healthcare',
  'Education',
  'Other',
];

const EMPTY_HARD_FILTERS = {
  location: '',
  minExp: '',
  seniority: '',
  education: '',
  industry: '',
  language: '',
  languageLevel: '',
  certificates: '',
  salaryMin: '',
  salaryMax: '',
  workFormat: '',
  contractType: '',
  locationMandatory: true,
  minExpMandatory: true,
  seniorityMandatory: true,
  educationMandatory: false,
  contactMandatory: false,
  industryMandatory: true,
  languageMandatory: false,
  certificatesMandatory: false,
  salaryMandatory: false,
  workFormatMandatory: false,
  contractTypeMandatory: false,
};

const modalLabelClass = 'supporthr-mono mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500';
const modalMetaClass = 'supporthr-mono text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500';
const modalFieldClass =
  'supporthr-mono w-full rounded-none border border-white/[0.08] bg-black/80 px-3.5 py-3 text-[12px] text-slate-200 placeholder:text-slate-600 transition-colors focus:border-cyan-400/30 focus:bg-white/[0.02] focus:outline-none';
const modalSecondaryButtonClass =
  'supporthr-mono rounded-none border border-white/[0.08] bg-black/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-white/[0.16] hover:text-white';
const modalPrimaryButtonClass =
  'supporthr-mono rounded-none border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60';
const modalDangerButtonClass =
  'supporthr-mono rounded-none border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60';
const modalCardClass =
  'group rounded-none border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.012)_100%)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition-all hover:border-cyan-400/24 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.018)_100%)]';
const modalChipClass =
  'supporthr-mono inline-flex rounded-none border border-white/[0.08] bg-black/75 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-zinc-400';

function TemplateForm({ initial, isSaving, onCancel, onSave }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [jobPosition, setJobPosition] = useState(initial?.jobPosition || '');
  const [jdText, setJdText] = useState(initial?.jdText || '');
  const [industry, setIndustry] = useState(initial?.hardFilters?.industry || '');
  const [location, setLocation] = useState(initial?.hardFilters?.location || '');
  const [minExp, setMinExp] = useState(initial?.hardFilters?.minExp || '');
  const [seniority, setSeniority] = useState(initial?.hardFilters?.seniority || '');
  const [education, setEducation] = useState(initial?.hardFilters?.education || '');
  const [language, setLanguage] = useState(initial?.hardFilters?.language || '');
  const [workFormat, setWorkFormat] = useState(initial?.hardFilters?.workFormat || '');
  const [salaryMin, setSalaryMin] = useState(initial?.hardFilters?.salaryMin || '');
  const [salaryMax, setSalaryMax] = useState(initial?.hardFilters?.salaryMax || '');
  const [error, setError] = useState('');

  const fieldClassName = modalFieldClass;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Tên mẫu không được để trống.');
      return;
    }

    if (!jobPosition.trim()) {
      setError('Vị trí công việc không được để trống.');
      return;
    }

    if (jdText.trim().length < 30) {
      setError('Nội dung JD cần ít nhất 30 ký tự.');
      return;
    }

    setError('');
    await onSave({
      name: name.trim(),
      category,
      jobPosition: jobPosition.trim(),
      jdText: jdText.trim(),
      hardFilters: {
        ...EMPTY_HARD_FILTERS,
        industry,
        location,
        minExp,
        seniority,
        education,
        language,
        workFormat,
        salaryMin,
        salaryMax,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={modalLabelClass}>
            Tên mẫu
          </label>
          <input className={fieldClassName} value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div>
          <label className={modalLabelClass}>
            Vị trí công việc
          </label>
          <input className={fieldClassName} value={jobPosition} onChange={(event) => setJobPosition(event.target.value)} />
        </div>

        <div>
          <label className={modalLabelClass}>
            Danh mục
          </label>
          <select className={fieldClassName} value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={modalLabelClass}>
          Nội dung JD
        </label>
        <textarea
          rows={7}
          className={`${fieldClassName} resize-none leading-relaxed`}
          value={jdText}
          onChange={(event) => setJdText(event.target.value)}
        />
      </div>

      <details className="border border-white/[0.08] bg-white/[0.02] p-4">
        <summary className="supporthr-mono cursor-pointer text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
          Bộ lọc mặc định
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['Ngành nghề', industry, setIndustry],
            ['Địa điểm', location, setLocation],
            ['Kinh nghiệm', minExp, setMinExp],
            ['Cấp độ', seniority, setSeniority],
            ['Học vấn', education, setEducation],
            ['Ngôn ngữ', language, setLanguage],
            ['Hình thức', workFormat, setWorkFormat],
            ['Lương tối thiểu', salaryMin, setSalaryMin],
            ['Lương tối đa', salaryMax, setSalaryMax],
          ].map(([label, value, setter]) => (
            <div key={label}>
              <label className={modalLabelClass}>{label}</label>
              <input
                className={fieldClassName}
                value={value as string}
                onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
              />
            </div>
          ))}
        </div>
      </details>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={modalSecondaryButtonClass}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className={modalPrimaryButtonClass}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu mẫu'}
        </button>
      </div>
    </form>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-none border border-white/[0.08] bg-white/[0.02] text-2xl text-slate-600">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div>
        <p className="supporthr-display text-[1.15rem] font-semibold tracking-[-0.04em] text-slate-200">{title}</p>
        {description && <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

const JDTemplatesModal: React.FC<JDTemplatesModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [activeTab, setActiveTab] = useState<'jd' | 'history'>('jd');
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'confirm-delete'>('list');
  const [templates, setTemplates] = useState<UserJDTemplate[]>([]);
  const [recentUsedTemplates, setRecentUsedTemplates] = useState<RecentUsedJDTemplate[]>([]);
  const [recentHistory, setRecentHistory] = useState<ActivityHistoryEntry[]>([]);
  const [historyStats, setHistoryStats] = useState<ActivityHistoryStats>({
    totalSessions: 0,
    lastSession: null,
    thisWeekCount: 0,
    thisMonthCount: 0,
  });
  const [historySource, setHistorySource] = useState<'render' | 'local' | 'none'>('none');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0, oldestEntry: 0, newestEntry: 0 });
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTimeFilter, setHistoryTimeFilter] = useState('Tất cả');
  const [historyIndustryFilter, setHistoryIndustryFilter] = useState('Tất cả');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<UserJDTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<UserJDTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isLoggedIn = Boolean(auth.currentUser);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!isLoggedIn) {
      setTemplates([]);
      return;
    }

    setLoadingTemplates(true);
    try {
      await JDTemplatesService.seedDefaultTemplatesIfEmpty();
      setTemplates(await JDTemplatesService.getUserTemplates());
    } catch {
      showToast('Không thể tải danh sách mẫu JD.', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  }, [isLoggedIn, showToast]);

  const syncTemplates = useCallback(async () => {
    if (!isLoggedIn) {
      setTemplates([]);
      return;
    }

    const cachedTemplates = JDTemplatesService.getCachedUserTemplates();
    if (cachedTemplates.length > 0) {
      setTemplates(cachedTemplates);
      setLoadingTemplates(false);
    } else {
      setLoadingTemplates(true);
    }

    try {
      let nextTemplates = await JDTemplatesService.getUserTemplates();

      if (nextTemplates.length === 0) {
        try {
          await JDTemplatesService.seedDefaultTemplatesIfEmpty();
          nextTemplates = await JDTemplatesService.getUserTemplates();
        } catch (error) {
          console.warn('Failed to seed default JD templates:', error);
        }
      }

      setTemplates(nextTemplates);
    } catch (error) {
      console.warn('Failed to load JD templates:', error);
      if (cachedTemplates.length > 0) {
        showToast('Không thể đồng bộ mẫu JD. Đang hiển thị bản gần nhất.', 'error');
      } else {
        showToast('Không thể tải danh sách mẫu JD.', 'error');
      }
    } finally {
      setLoadingTemplates(false);
    }
  }, [isLoggedIn, showToast]);

  const loadHistoryData = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { entries, source } = await getActivityHistory(50);
      setHistorySource(source);
      setRecentHistory(entries);
      setHistoryStats(buildActivityHistoryStats(entries));
      setRecentUsedTemplates(extractRecentUsedJDTemplates(entries));
    } catch {
      setHistorySource('none');
      setRecentHistory([]);
      setHistoryStats({
        totalSessions: 0,
        lastSession: null,
        thisWeekCount: 0,
        thisMonthCount: 0,
      });
      setRecentUsedTemplates([]);
      showToast('Không thể tải lịch sử hoạt động.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isOpen) return;

    setView('list');
    setSelectedCategory('Tất cả');
    setSearchTerm('');
    setHistorySearchTerm('');
    setHistoryTimeFilter('Tất cả');
    setHistoryIndustryFilter('Tất cả');
    setSelectedHistoryIds([]);
    setCacheStats(analysisCacheService.getCacheStats());

    void syncTemplates();
    void loadHistoryData();
  }, [isOpen, loadHistoryData, syncTemplates]);

  const combinedTemplates = useMemo<TemplateListItem[]>(() => {
    const savedItems: TemplateListItem[] = templates.map((template) => ({ ...template, origin: 'saved' }));
    const savedKeys = new Set(
      templates.map((template) => `${template.jobPosition.trim().toLowerCase()}::${template.jdText.trim().toLowerCase()}`)
    );
    const historyItems: TemplateListItem[] = recentUsedTemplates
      .filter((template) => !savedKeys.has(`${template.jobPosition.trim().toLowerCase()}::${template.jdText.trim().toLowerCase()}`))
      .map((template) => ({ ...template, origin: 'history' }));

    return [...savedItems, ...historyItems];
  }, [recentUsedTemplates, templates]);

  const categories = useMemo(
    () => ['Tất cả', ...Array.from(new Set(combinedTemplates.map((template) => template.category).filter(Boolean)))],
    [combinedTemplates]
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return combinedTemplates.filter((template) => {
      const matchesCategory = selectedCategory === 'Tất cả' || template.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      return [template.name, template.jobPosition, template.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [combinedTemplates, searchTerm, selectedCategory]);

  const historyIndustries = useMemo(
    () => ['Tất cả', ...Array.from(new Set(recentHistory.map((entry) => entry.industry || 'Khác')))],
    [recentHistory]
  );

  const filteredHistory = useMemo(() => {
    return recentHistory.filter((entry) => {
      if (historyTimeFilter === 'Hôm nay') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        if (entry.timestamp < startOfToday) return false;
      } else if (historyTimeFilter === 'Tuần này') {
        if (entry.timestamp < Date.now() - 7 * 24 * 60 * 60 * 1000) return false;
      } else if (historyTimeFilter === 'Tháng này') {
        if (entry.timestamp < Date.now() - 30 * 24 * 60 * 60 * 1000) return false;
      } else if (historyTimeFilter === '3 tháng qua') {
        if (entry.timestamp < Date.now() - 90 * 24 * 60 * 60 * 1000) return false;
      } else if (historyTimeFilter === '6 tháng qua') {
        if (entry.timestamp < Date.now() - 180 * 24 * 60 * 60 * 1000) return false;
      } else if (historyTimeFilter === 'Năm nay') {
        if (entry.timestamp < new Date(new Date().getFullYear(), 0, 1).getTime()) return false;
      }

      if (historyIndustryFilter !== 'Tất cả' && (entry.industry || 'Khác') !== historyIndustryFilter) {
        return false;
      }

      if (historySearchTerm.trim()) {
        return entry.jobPosition.toLowerCase().includes(historySearchTerm.trim().toLowerCase());
      }

      return true;
    });
  }, [historyIndustryFilter, historySearchTerm, historyTimeFilter, recentHistory]);

  const handleSelectTemplate = (template: JDTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleTemplateSave = async (input: CreateJDTemplateInput) => {
    setIsSaving(true);
    try {
      if (view === 'edit' && editingTemplate) {
        await JDTemplatesService.updateTemplate(editingTemplate.id, input);
        showToast('Đã cập nhật mẫu JD.');
      } else {
        await JDTemplatesService.createTemplate(input);
        showToast('Đã tạo mẫu JD mới.');
      }

      await syncTemplates();
      setEditingTemplate(null);
      setView('list');
    } catch {
      showToast('Không thể lưu mẫu JD.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);
    try {
      await JDTemplatesService.deleteTemplate(deletingTemplate.id);
      await syncTemplates();
      showToast('Đã xóa mẫu JD.');
      setDeletingTemplate(null);
      setView('list');
    } catch {
      showToast('Không thể xóa mẫu JD.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshHistory = async () => {
    setCacheStats(analysisCacheService.getCacheStats());
    await loadHistoryData();
  };

  const handleDeleteSelectedHistory = async () => {
    if (historySource !== 'local') {
      showToast('Lịch sử từ Render hiện chỉ hỗ trợ xem lại, chưa hỗ trợ xóa từ frontend.', 'error');
      return;
    }

    if (selectedHistoryIds.length === 0) {
      if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử cục bộ?')) return;
      cvFilterHistoryService.clearHistory();
    } else {
      if (!window.confirm(`Bạn có chắc muốn xóa ${selectedHistoryIds.length} mục đã chọn?`)) return;
      cvFilterHistoryService.deleteHistoryEntries(
        selectedHistoryIds
          .filter((id) => id.startsWith('local-'))
          .map((id) => Number(id.replace('local-', '')))
      );
    }

    setSelectedHistoryIds([]);
    await loadHistoryData();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-[88rem] flex-col overflow-hidden rounded-none border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,rgba(8,12,23,0.98)_0%,rgba(4,7,15,0.98)_100%)] shadow-[0_38px_120px_rgba(0,0,0,0.56)]">
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-black/35 px-6 py-4">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <button
                  onClick={() => {
                    setView('list');
                    setEditingTemplate(null);
                    setDeletingTemplate(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-none border border-white/[0.08] bg-black/55 text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-white"
                >
                  <i className="fa-solid fa-arrow-left text-xs" />
                </button>
              )}
              <div className="flex h-11 w-11 items-center justify-center rounded-none border border-cyan-400/20 bg-cyan-400/10">
                <i className={`fa-solid ${activeTab === 'jd' ? 'fa-file-invoice' : 'fa-clock-rotate-left'} text-cyan-200`} />
              </div>
              <div>
                <h2 className="supporthr-display text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                  {view === 'create' && 'Tạo mẫu JD'}
                  {view === 'edit' && 'Chỉnh sửa mẫu JD'}
                  {view === 'confirm-delete' && 'Xác nhận xóa'}
                  {view === 'list' && activeTab === 'jd' && 'Mẫu JD đã dùng'}
                  {view === 'list' && activeTab === 'history' && 'Lịch sử hoạt động'}
                </h2>
                <p className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  {view === 'list' && activeTab === 'jd'
                    ? `${combinedTemplates.length} mẫu từ tài khoản và các JD đã từng phân tích`
                    : 'Đồng bộ từ Render API và dữ liệu cục bộ'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-none border border-white/[0.08] bg-black/55 text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-white"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {view === 'list' && (
            <div className="grid grid-cols-2 border-b border-white/[0.08] bg-black/20">
              <button
                onClick={() => setActiveTab('jd')}
                className={`supporthr-display flex items-center justify-center gap-2 border-b px-4 py-4 text-[1.05rem] font-semibold tracking-[-0.04em] transition-colors ${
                  activeTab === 'jd'
                    ? 'border-cyan-400/60 bg-cyan-400/8 text-cyan-100'
                    : 'border-transparent text-slate-500 hover:bg-white/[0.02] hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-file-invoice text-sm" />
                Mẫu JD đã dùng
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`supporthr-display flex items-center justify-center gap-2 border-b px-4 py-4 text-[1.05rem] font-semibold tracking-[-0.04em] transition-colors ${
                  activeTab === 'history'
                    ? 'border-emerald-400/60 bg-emerald-400/8 text-emerald-100'
                    : 'border-transparent text-slate-500 hover:bg-white/[0.02] hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-clock-rotate-left text-sm" />
                Lịch sử hoạt động
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === 'create' && (
              <TemplateForm isSaving={isSaving} onCancel={() => setView('list')} onSave={handleTemplateSave} />
            )}

            {view === 'edit' && editingTemplate && (
              <TemplateForm
                initial={editingTemplate}
                isSaving={isSaving}
                onCancel={() => {
                  setEditingTemplate(null);
                  setView('list');
                }}
                onSave={handleTemplateSave}
              />
            )}

            {view === 'confirm-delete' && deletingTemplate && (
              <div className="flex flex-col items-center gap-6 px-8 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-none border border-red-500/30 bg-red-500/10">
                  <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400" />
                </div>
                <div>
                  <h3 className="supporthr-display text-[1.3rem] font-semibold tracking-[-0.04em] text-white">Xóa mẫu JD này?</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Mẫu <span className="font-semibold text-slate-200">{deletingTemplate.name}</span> sẽ bị xóa khỏi tài khoản của bạn.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeletingTemplate(null);
                      setView('list');
                    }}
                    className={modalSecondaryButtonClass}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDeleteTemplate}
                    disabled={isDeleting}
                    className={modalDangerButtonClass}
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa mẫu'}
                  </button>
                </div>
              </div>
            )}

            {view === 'list' && activeTab === 'jd' && (
              <div className="flex h-full flex-col">
                <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm theo tên mẫu, vị trí hoặc ngành nghề..."
                      className={`${modalFieldClass} py-3 pl-9 pr-4 text-sm`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setView('create');
                    }}
                    className={modalPrimaryButtonClass}
                  >
                    <i className="fa-solid fa-plus mr-2 text-xs" />
                    Tạo mẫu mới
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto border-b border-white/[0.06] px-5 py-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`supporthr-mono whitespace-nowrap rounded-none border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                        selectedCategory === category
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
                          : 'border-white/[0.08] bg-black/55 text-slate-500 hover:border-white/[0.16] hover:text-slate-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-5">
                  {loadingTemplates ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <div className="h-10 w-10 animate-spin rounded-none border-[3px] border-cyan-400/15 border-t-cyan-300" />
                      <p className="text-sm text-slate-500">Đang tải mẫu JD và dữ liệu đã dùng gần đây...</p>
                    </div>
                  ) : !isLoggedIn ? (
                    <EmptyState
                      icon="fa-lock"
                      title="Vui lòng đăng nhập"
                      description="Bạn cần đăng nhập để xem mẫu JD của tài khoản và đồng bộ lịch sử."
                    />
                  ) : filteredTemplates.length === 0 ? (
                    <EmptyState
                      icon="fa-box-open"
                      title={searchTerm ? `Không tìm thấy kết quả cho "${searchTerm}"` : 'Chưa có mẫu JD nào'}
                      description="Các JD đã từng phân tích từ lịch sử Render cũng sẽ hiện tại đây."
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={modalCardClass}
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="supporthr-display truncate text-[1.3rem] font-semibold tracking-[-0.04em] text-white">{template.name}</h3>
                              <div className="supporthr-mono mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-200/75">
                                <i className="fa-solid fa-briefcase text-[9px]" />
                                <span className="truncate">{template.jobPosition}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={modalChipClass}>
                                {template.category}
                              </span>
                              <span
                                className={`supporthr-mono px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                                  template.origin === 'saved'
                                    ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
                                    : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                                }`}
                              >
                                {template.origin === 'saved' ? 'Đã lưu' : 'Từ lịch sử'}
                              </span>
                            </div>
                          </div>

                          <p className="mb-4 line-clamp-3 text-sm leading-7 text-slate-500">{template.jdText}</p>

                          <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
                            {template.origin === 'saved' ? (
                              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => {
                                    setEditingTemplate(template);
                                    setView('edit');
                                  }}
                                  className="supporthr-mono rounded-none border border-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-cyan-400/20 hover:bg-cyan-400/8 hover:text-cyan-100"
                                >
                                  <i className="fa-solid fa-pen mr-1 text-[9px]" />
                                  Sửa
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingTemplate(template);
                                    setView('confirm-delete');
                                  }}
                                  className="supporthr-mono rounded-none border border-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-red-500/20 hover:bg-red-500/8 hover:text-red-200"
                                >
                                  <i className="fa-solid fa-trash mr-1 text-[9px]" />
                                  Xóa
                                </button>
                              </div>
                            ) : (
                              <span className="supporthr-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Khôi phục nhanh từ lần phân tích trước</span>
                            )}

                            <button
                              onClick={() =>
                                handleSelectTemplate({
                                  id: template.id,
                                  name: template.name,
                                  category: template.category,
                                  jobPosition: template.jobPosition,
                                  jdText: template.jdText,
                                  hardFilters: template.hardFilters,
                                })
                              }
                              className="supporthr-mono rounded-none border border-cyan-400/30 bg-cyan-400/8 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-all hover:bg-cyan-400/14"
                            >
                              Sử dụng
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'list' && activeTab === 'history' && (
              <div className="flex h-full flex-col">
                <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-300">
                    <div className="supporthr-mono rounded-none border border-white/[0.08] bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Tổng phiên: <span className="font-bold text-white">{historyStats.totalSessions}</span>
                    </div>
                    <div className="supporthr-mono rounded-none border border-white/[0.08] bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Tuần này: <span className="font-bold text-white">{historyStats.thisWeekCount}</span>
                    </div>
                    <div className="supporthr-mono rounded-none border border-white/[0.08] bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Nguồn: {historySource === 'render' ? 'Render API' : historySource === 'local' ? 'Cục bộ' : 'Chưa có dữ liệu'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRefreshHistory}
                      className="flex h-10 w-10 items-center justify-center rounded-none border border-white/[0.08] bg-black/55 text-slate-400 transition-colors hover:border-emerald-400/30 hover:text-white"
                      title="Làm mới"
                    >
                      <i className={`fa-solid fa-rotate ${historyLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleDeleteSelectedHistory}
                      disabled={historySource !== 'local' || (historyStats.totalSessions === 0 && selectedHistoryIds.length === 0)}
                      className="supporthr-mono rounded-none border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200 transition-colors hover:bg-red-500/14 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-black/35 disabled:text-slate-600"
                    >
                      {selectedHistoryIds.length > 0 ? `Xóa (${selectedHistoryIds.length})` : 'Xóa cục bộ'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-3 sm:flex-row">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" />
                    <input
                      type="text"
                      value={historySearchTerm}
                      onChange={(event) => setHistorySearchTerm(event.target.value)}
                      placeholder="Tìm vị trí công việc..."
                      className={`${modalFieldClass} py-3 pl-9 pr-4 text-sm focus:border-emerald-400/30`}
                    />
                  </div>

                  <select
                    value={historyTimeFilter}
                    onChange={(event) => setHistoryTimeFilter(event.target.value)}
                    className={`${modalFieldClass} w-full sm:w-[13rem] focus:border-emerald-400/30`}
                  >
                    {['Tất cả', 'Hôm nay', 'Tuần này', 'Tháng này', '3 tháng qua', '6 tháng qua', 'Năm nay'].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={historyIndustryFilter}
                    onChange={(event) => setHistoryIndustryFilter(event.target.value)}
                    className={`${modalFieldClass} w-full sm:w-[13rem] focus:border-emerald-400/30`}
                  >
                    {historyIndustries.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-b border-white/[0.06] px-5 py-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-none border border-white/[0.08] bg-white/[0.02] p-3">
                      <div className={modalMetaClass}>Cache</div>
                      <div className="supporthr-display mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">{cacheStats.size}</div>
                    </div>
                    <div className="rounded-none border border-white/[0.08] bg-white/[0.02] p-3">
                      <div className={modalMetaClass}>Hit Rate</div>
                      <div className="supporthr-display mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-cyan-100">{cacheStats.hitRate.toFixed(1)}%</div>
                    </div>
                    <div className="rounded-none border border-white/[0.08] bg-white/[0.02] p-3">
                      <div className={modalMetaClass}>Lần gần nhất</div>
                      <div className="mt-2 text-xs font-semibold leading-5 text-slate-300">{historyStats.lastSession || 'Chưa có'}</div>
                    </div>
                    <button
                      onClick={() => {
                        analysisCacheService.clearCache();
                        setCacheStats(analysisCacheService.getCacheStats());
                      }}
                      className="rounded-none border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-colors hover:border-white/[0.16] hover:bg-white/[0.04]"
                    >
                      <div className={modalMetaClass}>Cache</div>
                      <div className="mt-2 text-xs font-semibold text-slate-300">Xóa cache hệ thống</div>
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-5">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <div className="h-10 w-10 animate-spin rounded-none border-[3px] border-emerald-500/15 border-t-emerald-300" />
                      <p className="text-sm text-slate-500">Đang tải lịch sử hoạt động...</p>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <EmptyState
                      icon="fa-clock-rotate-left"
                      title="Chưa có lịch sử hoạt động nào"
                      description="Sau mỗi lần phân tích thành công, lịch sử sẽ được đồng bộ tại đây."
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {filteredHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className={`${modalCardClass} relative`}
                        >
                          {historySource === 'local' && (
                            <div className="absolute right-4 top-4">
                              <input
                                type="checkbox"
                                checked={selectedHistoryIds.includes(entry.id)}
                                onChange={(event) =>
                                  setSelectedHistoryIds((current) =>
                                    event.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id)
                                  )
                                }
                                className="h-4 w-4 cursor-pointer rounded-none border-white/[0.12] bg-black accent-red-500"
                              />
                            </div>
                          )}

                          <div className="mb-2 flex items-start justify-between gap-3 pr-6">
                            <div className="min-w-0">
                              <h3 className="supporthr-display truncate text-[1.25rem] font-semibold tracking-[-0.04em] text-white">{entry.jobPosition || 'Không rõ vị trí'}</h3>
                              <div className="supporthr-mono mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-200/75">
                                <i className="fa-solid fa-calendar-days text-[9px]" />
                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <span className="supporthr-mono border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-emerald-100">
                              {entry.industry || 'Khác'}
                            </span>
                          </div>

                          <p className="line-clamp-3 text-sm leading-7 text-slate-500">
                            {entry.jdTextSnippet || 'Phiên này không còn phần mô tả JD rút gọn.'}
                          </p>

                          <div className="supporthr-mono mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            <span>{entry.totalCandidates > 0 ? `${entry.totalCandidates} ứng viên` : 'Đã hoàn thành'}</span>
                            <span className="font-medium text-slate-400">{entry.source === 'render' ? 'Render API' : 'Cục bộ'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`supporthr-mono fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-none px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-2xl ${
            toast.type === 'success'
              ? 'border border-cyan-400/40 bg-slate-950/95 text-cyan-100'
              : 'border border-red-500/40 bg-slate-950/95 text-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

export default JDTemplatesModal;
