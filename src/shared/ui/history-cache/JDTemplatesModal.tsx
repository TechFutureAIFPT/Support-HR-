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

  const fieldClassName =
    'w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors';

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
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Tên mẫu
          </label>
          <input className={fieldClassName} value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Vị trí công việc
          </label>
          <input className={fieldClassName} value={jobPosition} onChange={(event) => setJobPosition(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Nội dung JD
        </label>
        <textarea
          rows={7}
          className={`${fieldClassName} resize-none font-mono leading-relaxed`}
          value={jdText}
          onChange={(event) => setJdText(event.target.value)}
        />
      </div>

      <details className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-400">
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
              <label className="mb-1 block text-[10px] text-slate-500">{label}</label>
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 text-2xl text-slate-600">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
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
        <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1120] shadow-2xl shadow-indigo-900/20">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 py-4">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <button
                  onClick={() => {
                    setView('list');
                    setEditingTemplate(null);
                    setDeletingTemplate(null);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-white"
                >
                  <i className="fa-solid fa-arrow-left text-xs" />
                </button>
              )}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                <i className={`fa-solid ${activeTab === 'jd' ? 'fa-file-invoice' : 'fa-clock-rotate-left'} text-indigo-300`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {view === 'create' && 'Tạo mẫu JD'}
                  {view === 'edit' && 'Chỉnh sửa mẫu JD'}
                  {view === 'confirm-delete' && 'Xác nhận xóa'}
                  {view === 'list' && activeTab === 'jd' && 'Mẫu JD đã dùng'}
                  {view === 'list' && activeTab === 'history' && 'Lịch sử hoạt động'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {view === 'list' && activeTab === 'jd'
                    ? `${combinedTemplates.length} mẫu từ tài khoản và các JD đã từng phân tích`
                    : 'Đồng bộ từ Render API và dữ liệu cục bộ'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-white"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {view === 'list' && (
            <div className="flex border-b border-slate-800/60 bg-slate-900/20">
              <button
                onClick={() => setActiveTab('jd')}
                className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'jd'
                    ? 'border-indigo-500 bg-indigo-500/5 text-indigo-300'
                    : 'border-transparent text-slate-500 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-file-invoice mr-2" />
                Mẫu JD đã dùng
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'history'
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-300'
                    : 'border-transparent text-slate-500 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-clock-rotate-left mr-2" />
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                  <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Xóa mẫu JD này?</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Mẫu <span className="font-semibold text-slate-200">{deletingTemplate.name}</span> sẽ bị xóa khỏi tài khoản của bạn.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeletingTemplate(null);
                      setView('list');
                    }}
                    className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/70"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDeleteTemplate}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa mẫu'}
                  </button>
                </div>
              </div>
            )}

            {view === 'list' && activeTab === 'jd' && (
              <div className="flex h-full flex-col">
                <div className="flex flex-col gap-3 border-b border-slate-800/60 px-5 py-4 sm:flex-row">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm theo tên mẫu, vị trí hoặc ngành nghề..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setView('create');
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                  >
                    <i className="fa-solid fa-plus mr-2 text-xs" />
                    Tạo mẫu mới
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto border-b border-slate-800/40 px-5 py-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selectedCategory === category
                          ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200'
                          : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-5">
                  {loadingTemplates ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-500/20 border-t-indigo-400" />
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
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-indigo-500/40 hover:bg-slate-800/40"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-white">{template.name}</h3>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-indigo-300/80">
                                <i className="fa-solid fa-briefcase text-[9px]" />
                                <span className="truncate">{template.jobPosition}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[9px] text-slate-400">
                                {template.category}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                  template.origin === 'saved'
                                    ? 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
                                    : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                }`}
                              >
                                {template.origin === 'saved' ? 'Đã lưu' : 'Từ lịch sử'}
                              </span>
                            </div>
                          </div>

                          <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-slate-500">{template.jdText}</p>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-800/50 pt-3">
                            {template.origin === 'saved' ? (
                              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => {
                                    setEditingTemplate(template);
                                    setView('edit');
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300"
                                >
                                  <i className="fa-solid fa-pen mr-1 text-[9px]" />
                                  Sửa
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingTemplate(template);
                                    setView('confirm-delete');
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <i className="fa-solid fa-trash mr-1 text-[9px]" />
                                  Xóa
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">Khôi phục nhanh từ lần phân tích trước</span>
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
                              className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-all hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
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
                <div className="flex flex-col gap-3 border-b border-slate-800/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-300">
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5">
                      Tổng phiên: <span className="font-bold text-white">{historyStats.totalSessions}</span>
                    </div>
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5">
                      Tuần này: <span className="font-bold text-white">{historyStats.thisWeekCount}</span>
                    </div>
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400">
                      Nguồn: {historySource === 'render' ? 'Render API' : historySource === 'local' ? 'Cục bộ' : 'Chưa có dữ liệu'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRefreshHistory}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                      title="Làm mới"
                    >
                      <i className={`fa-solid fa-rotate ${historyLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleDeleteSelectedHistory}
                      disabled={historySource !== 'local' || (historyStats.totalSessions === 0 && selectedHistoryIds.length === 0)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
                    >
                      {selectedHistoryIds.length > 0 ? `Xóa (${selectedHistoryIds.length})` : 'Xóa cục bộ'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-slate-800/60 px-5 py-3 sm:flex-row">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" />
                    <input
                      type="text"
                      value={historySearchTerm}
                      onChange={(event) => setHistorySearchTerm(event.target.value)}
                      placeholder="Tìm vị trí công việc..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={historyTimeFilter}
                    onChange={(event) => setHistoryTimeFilter(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none"
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
                    className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none"
                  >
                    {historyIndustries.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-b border-slate-800/40 px-5 py-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Cache</div>
                      <div className="mt-1 text-lg font-black text-white">{cacheStats.size}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Hit Rate</div>
                      <div className="mt-1 text-lg font-black text-cyan-300">{cacheStats.hitRate.toFixed(1)}%</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Lần gần nhất</div>
                      <div className="mt-1 text-xs font-semibold text-slate-300">{historyStats.lastSession || 'Chưa có'}</div>
                    </div>
                    <button
                      onClick={() => {
                        analysisCacheService.clearCache();
                        setCacheStats(analysisCacheService.getCacheStats());
                      }}
                      className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/40"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Cache</div>
                      <div className="mt-1 text-xs font-semibold text-slate-300">Xóa cache hệ thống</div>
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-5">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500/20 border-t-emerald-400" />
                      <p className="text-sm text-slate-500">Đang tải lịch sử hoạt động...</p>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <EmptyState
                      icon="fa-clock-rotate-left"
                      title="Chưa có lịch sử hoạt động nào"
                      description="Sau mỗi lần phân tích thành công, lịch sử sẽ được đồng bộ tại đây."
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {filteredHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="group relative rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-slate-800/40"
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
                                className="h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-800 accent-red-500"
                              />
                            </div>
                          )}

                          <div className="mb-2 flex items-start justify-between gap-3 pr-6">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-white">{entry.jobPosition || 'Không rõ vị trí'}</h3>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-300/80">
                                <i className="fa-solid fa-calendar-days text-[9px]" />
                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-300">
                              {entry.industry || 'Khác'}
                            </span>
                          </div>

                          <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">
                            {entry.jdTextSnippet || 'Phiên này không còn phần mô tả JD rút gọn.'}
                          </p>

                          <div className="mt-3 flex items-center justify-between border-t border-slate-800/50 pt-3 text-[11px] text-slate-500">
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
          className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
            toast.type === 'success'
              ? 'border border-indigo-500/40 bg-slate-950/95 text-indigo-200'
              : 'border border-red-500/40 bg-slate-950/95 text-red-300'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

export default JDTemplatesModal;
