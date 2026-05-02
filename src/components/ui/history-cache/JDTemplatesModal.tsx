import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { JDTemplatesService, UserJDTemplate, CreateJDTemplateInput } from '@/services/data-sync/jdTemplatesService';
import { auth } from '@/services/firebase';
import { analysisCacheService } from '@/services/history-cache/analysisCache';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';

// ─── Public interface for App.tsx ─────────────────────────────────────────────
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

// ─── Empty hard-filters object ────────────────────────────────────────────────
const emptyHardFilters = {
  location: '', minExp: '', seniority: '', education: '', industry: '',
  language: '', languageLevel: '', certificates: '', salaryMin: '', salaryMax: '',
  workFormat: '', contractType: '',
  locationMandatory: true, minExpMandatory: true, seniorityMandatory: true,
  educationMandatory: false, contactMandatory: false, industryMandatory: true,
  languageMandatory: false, certificatesMandatory: false, salaryMandatory: false,
  workFormatMandatory: false, contractTypeMandatory: false,
};

// ─── Inline form for creating / editing a template ────────────────────────────
interface TemplateFormProps {
  initial?: Partial<CreateJDTemplateInput>;
  onSave: (data: CreateJDTemplateInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const CATEGORIES = [
  'IT/Software', 'Marketing', 'Sales', 'Finance/Accounting', 'HR', 'Design/Creative',
  'Operations', 'Customer Service', 'Engineering', 'Healthcare', 'Education', 'Other',
];

const TemplateForm: React.FC<TemplateFormProps> = ({ initial, onSave, onCancel, isSaving }) => {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [jobPosition, setJobPosition] = useState(initial?.jobPosition || '');
  const [jdText, setJdText] = useState(initial?.jdText || '');
  const [location, setLocation] = useState(initial?.hardFilters?.location || '');
  const [minExp, setMinExp] = useState(initial?.hardFilters?.minExp || '');
  const [seniority, setSeniority] = useState(initial?.hardFilters?.seniority || '');
  const [education, setEducation] = useState(initial?.hardFilters?.education || '');
  const [industry, setIndustry] = useState(initial?.hardFilters?.industry || '');
  const [salaryMin, setSalaryMin] = useState(initial?.hardFilters?.salaryMin || '');
  const [salaryMax, setSalaryMax] = useState(initial?.hardFilters?.salaryMax || '');
  const [workFormat, setWorkFormat] = useState(initial?.hardFilters?.workFormat || '');
  const [language, setLanguage] = useState(initial?.hardFilters?.language || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên mẫu không được để trống.'); return; }
    if (!jobPosition.trim()) { setError('Vị trí công việc không được để trống.'); return; }
    if (jdText.trim().length < 30) { setError('Nội dung JD cần ít nhất 30 ký tự.'); return; }
    setError('');

    await onSave({
      name: name.trim(),
      category,
      jobPosition: jobPosition.trim(),
      jdText: jdText.trim(),
      hardFilters: {
        ...emptyHardFilters,
        location, minExp, seniority, education, industry,
        salaryMin, salaryMax, workFormat, language,
        industryManual: industry ? 'manual' : undefined,
      },
    });
  };

  const fieldCls = "w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors";
  const labelCls = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tên mẫu */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Tên mẫu *</label>
          <input className={fieldCls} placeholder="VD: Senior Frontend Engineer" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Vị trí */}
        <div>
          <label className={labelCls}>Vị trí công việc *</label>
          <input className={fieldCls} placeholder="VD: Frontend Developer" value={jobPosition} onChange={e => setJobPosition(e.target.value)} />
        </div>

        {/* Danh mục */}
        <div>
          <label className={labelCls}>Danh mục</label>
          <select className={fieldCls} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Nội dung JD */}
      <div>
        <label className={labelCls}>Nội dung Job Description *</label>
        <textarea
          className={`${fieldCls} font-mono leading-relaxed resize-none`}
          rows={6}
          placeholder="Mô tả công việc, yêu cầu kỹ năng, kinh nghiệm..."
          value={jdText}
          onChange={e => setJdText(e.target.value)}
        />
        <div className="text-right text-[10px] text-slate-600 mt-0.5">{jdText.length} ký tự</div>
      </div>

      {/* Bộ lọc nhanh */}
      <details className="group">
        <summary className="cursor-pointer list-none flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors select-none">
          <i className="fa-solid fa-sliders text-xs group-open:text-indigo-400 transition-colors" />
          Bộ lọc mặc định (tuỳ chọn)
          <i className="fa-solid fa-chevron-down text-[9px] ml-auto transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Địa điểm', val: location, set: setLocation, ph: 'VD: Hà Nội' },
            { label: 'Kinh nghiệm (năm)', val: minExp, set: setMinExp, ph: 'VD: 2' },
            { label: 'Cấp độ', val: seniority, set: setSeniority, ph: 'VD: Mid-level' },
            { label: 'Học vấn', val: education, set: setEducation, ph: 'VD: Cử nhân CNTT' },
            { label: 'Ngành nghề', val: industry, set: setIndustry, ph: 'VD: IT' },
            { label: 'Ngôn ngữ', val: language, set: setLanguage, ph: 'VD: Tiếng Anh' },
            { label: 'Lương từ (VND)', val: salaryMin, set: setSalaryMin, ph: 'VD: 15000000' },
            { label: 'Lương đến (VND)', val: salaryMax, set: setSalaryMax, ph: 'VD: 30000000' },
            { label: 'Hình thức', val: workFormat, set: setWorkFormat, ph: 'VD: Hybrid' },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label className="block text-[10px] text-slate-600 mb-1">{label}</label>
              <input className={fieldCls} placeholder={ph} value={val} onChange={e => set(e.target.value)} />
            </div>
          ))}
        </div>
      </details>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
          <i className="fa-solid fa-circle-exclamation text-xs" /> {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors">
          Huỷ
        </button>
        <button type="submit" disabled={isSaving}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2">
          {isSaving ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Đang lưu...</> : <><i className="fa-solid fa-floppy-disk text-xs" /> Lưu mẫu</>}
        </button>
      </div>
    </form>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const JDTemplatesModal: React.FC<JDTemplatesModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [activeTab, setActiveTab] = useState<'jd' | 'history'>('jd');
  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0, oldestEntry: 0, newestEntry: 0 });
  const [historyStats, setHistoryStats] = useState({ totalSessions: 0, lastSession: null as string | null, thisWeekCount: 0, thisMonthCount: 0 });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTimeFilter, setHistoryTimeFilter] = useState('Tất cả');
  const [historyIndustryFilter, setHistoryIndustryFilter] = useState('Tất cả');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<number[]>([]);

  const [templates, setTemplates] = useState<UserJDTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  // Form states
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'confirm-delete'>('list');
  const [editingTemplate, setEditingTemplate] = useState<UserJDTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const isLoggedIn = !!auth.currentUser;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTemplates = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      // Seed nếu user chưa có mẫu nào
      await JDTemplatesService.seedDefaultTemplatesIfEmpty();
      const data = await JDTemplatesService.getUserTemplates();
      setTemplates(data);
    } catch {
      showToast('Không thể tải danh sách mẫu JD.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isOpen) {
      setView('list');
      setSearchTerm('');
      setSelectedCategory('Tất cả');
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      setCacheStats(analysisCacheService.getCacheStats());
      setHistoryStats(cvFilterHistoryService.getHistoryStats());
      setRecentHistory(cvFilterHistoryService.getRecentHistory());
    }
  }, [isOpen, activeTab]);

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cache? Điều này sẽ làm chậm các lần phân tích tiếp theo.')) {
      analysisCacheService.clearCache();
      setCacheStats({ size: 0, hitRate: 0, oldestEntry: 0, newestEntry: 0 });
    }
  };

  const handleDeleteSelectedHistory = () => {
    if (selectedHistoryIds.length === 0) {
      if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử lọc CV? Hành động này không thể hoàn tác.')) {
        cvFilterHistoryService.clearHistory();
        setHistoryStats({ totalSessions: 0, lastSession: null, thisWeekCount: 0, thisMonthCount: 0 });
        setRecentHistory([]);
        setSelectedHistoryIds([]);
      }
    } else {
      if (window.confirm(`Bạn có chắc muốn xóa ${selectedHistoryIds.length} mục đã chọn?`)) {
        cvFilterHistoryService.deleteHistoryEntries(selectedHistoryIds);
        refreshHistoryStats();
        setSelectedHistoryIds([]);
      }
    }
  };

  const refreshStats = () => setCacheStats(analysisCacheService.getCacheStats());
  const refreshHistoryStats = () => {
    setHistoryStats(cvFilterHistoryService.getHistoryStats());
    setRecentHistory(cvFilterHistoryService.getRecentHistory());
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const getCacheSizeColor = (size: number) => {
    if (size < 20) return 'text-green-400';
    if (size < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // ── Category list ──────────────────────────────────────────────────────────
  const categories = ['Tất cả', ...Array.from(new Set(templates.map(t => t.category)))];

  // ── History Filters ────────────────────────────────────────────────────────
  const historyIndustries = useMemo(() => {
    return ['Tất cả', ...Array.from(new Set(recentHistory.map(h => h.industry || 'Khác')))];
  }, [recentHistory]);

  const suggestedHistoryPositions = useMemo(() => {
    return Array.from(new Set(recentHistory.map(h => h.jobPosition).filter(Boolean))) as string[];
  }, [recentHistory]);

  const filteredHistory = useMemo(() => {
    return recentHistory.filter(h => {
      // time filter
      if (historyTimeFilter === 'Hôm nay') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        if (h.timestamp < startOfToday) return false;
      } else if (historyTimeFilter === 'Tuần này') {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (h.timestamp < oneWeekAgo) return false;
      } else if (historyTimeFilter === 'Tháng này') {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (h.timestamp < oneMonthAgo) return false;
      } else if (historyTimeFilter === '3 tháng qua') {
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        if (h.timestamp < threeMonthsAgo) return false;
      } else if (historyTimeFilter === '6 tháng qua') {
        const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
        if (h.timestamp < sixMonthsAgo) return false;
      } else if (historyTimeFilter === 'Năm nay') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
        if (h.timestamp < startOfYear) return false;
      }
      
      // industry filter
      if (historyIndustryFilter !== 'Tất cả') {
         if ((h.industry || 'Khác') !== historyIndustryFilter) return false;
      }

      // position search
      if (historySearchTerm && !h.jobPosition?.toLowerCase().includes(historySearchTerm.toLowerCase())) {
         return false;
      }

      return true;
    });
  }, [recentHistory, historyTimeFilter, historyIndustryFilter, historySearchTerm]);

  const filtered = templates.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (t.name || '').toLowerCase().includes(q) || 
                        (t.jobPosition || '').toLowerCase().includes(q) || 
                        (t.category || '').toLowerCase().includes(q);
    const matchCat = selectedCategory === 'Tất cả' || t.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = async (data: CreateJDTemplateInput) => {
    setIsSaving(true);
    try {
      const created = await JDTemplatesService.createTemplate(data);
      if (created) {
        setTemplates(prev => [created, ...prev]);
        setView('list');
        showToast('✅ Đã tạo mẫu JD mới thành công!');
      } else {
        showToast('Tạo mẫu thất bại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (data: CreateJDTemplateInput) => {
    if (!editingTemplate) return;
    setIsSaving(true);
    try {
      const ok = await JDTemplatesService.updateTemplate(editingTemplate.id, data);
      if (ok) {
        setTemplates(prev => prev.map(t =>
          t.id === editingTemplate.id ? { ...t, ...data, updatedAt: new Date() } : t
        ));
        setView('list');
        setEditingTemplate(null);
        showToast('✅ Đã cập nhật mẫu JD!');
      } else {
        showToast('Cập nhật thất bại.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const ok = await JDTemplatesService.deleteTemplate(deletingId);
      if (ok) {
        setTemplates(prev => prev.filter(t => t.id !== deletingId));
        showToast('Đã xóa mẫu JD.');
      } else {
        showToast('Xóa thất bại.', 'error');
      }
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setView('list');
    }
  };

  const handleSelect = (tpl: UserJDTemplate) => {
    onSelectTemplate({
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      jobPosition: tpl.jobPosition,
      jdText: tpl.jdText,
      hardFilters: tpl.hardFilters,
    });
    onClose();
  };

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          className="bg-[#0B1120] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-900/20 pointer-events-auto"
          style={{ animation: 'fadeInScale 0.2s ease' }}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <button
                  onClick={() => { setView('list'); setEditingTemplate(null); setDeletingId(null); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                  title="Quay lại"
                >
                  <i className="fa-solid fa-arrow-left text-xs" />
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <i className={`fa-solid ${activeTab === 'jd' ? 'fa-file-invoice text-indigo-400' : 'fa-clock-rotate-left text-green-400'} text-sm`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {activeTab === 'jd' && view === 'list' && 'Mẫu JD của bạn'}
                  {activeTab === 'history' && view === 'list' && 'Lịch sử & Thống kê'}
                  {view === 'create' && 'Tạo mẫu JD mới'}
                  {view === 'edit' && 'Chỉnh sửa mẫu JD'}
                  {view === 'confirm-delete' && 'Xác nhận xóa'}
                </h2>
                {activeTab === 'jd' && view === 'list' && (
                  <p className="text-[11px] text-slate-500">
                    {templates.length} mẫu • Riêng tư cho tài khoản của bạn
                  </p>
                )}
                {activeTab === 'history' && view === 'list' && (
                  <p className="text-[11px] text-slate-500">
                    Theo dõi lịch sử và các phiên sàng lọc ứng viên của bạn
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <i className="fa-solid fa-times" />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          {view === 'list' && (
            <div className="flex border-b border-slate-800/60 bg-slate-900/20 flex-shrink-0">
              <button
                onClick={() => setActiveTab('jd')}
                className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'jd' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              >
                <i className="fa-solid fa-file-invoice mr-2"></i> Mẫu JD đã dùng
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'history' ? 'border-green-500 text-green-400 bg-green-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              >
                <i className="fa-solid fa-clock-rotate-left mr-2"></i> Lịch sử hoạt động
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col h-full min-h-0">

            {/* LIST VIEW */}
            {view === 'list' && activeTab === 'jd' && (
              <div className="flex flex-col h-full">
                {/* Search + Filter toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-slate-800/60 flex-shrink-0">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm mẫu JD..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 px-5 py-3 overflow-x-auto custom-scrollbar flex-shrink-0 border-b border-slate-800/40">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        selectedCategory === cat
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Template cards */}
                <div className="p-5 flex-1">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-400 border-r-indigo-400/40 animate-spin" />
                      </div>
                      <p className="text-sm text-slate-500">Đang tải mẫu JD của bạn...</p>
                    </div>
                  ) : !isLoggedIn ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center text-2xl">
                        <i className="fa-solid fa-lock text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Vui lòng đăng nhập</p>
                      <p className="text-slate-500 text-xs">Bạn cần đăng nhập để sử dụng tính năng mẫu JD cá nhân.</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center text-2xl">
                        <i className="fa-solid fa-box-open text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">
                        {searchTerm ? `Không tìm thấy kết quả cho "${searchTerm}"` : 'Chưa có mẫu JD nào'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filtered.map(tpl => (
                        <div
                          key={tpl.id}
                          className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all"
                        >
                          {/* Card header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 flex-1">
                              {tpl.name}
                            </h3>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 whitespace-nowrap shrink-0">
                              {tpl.category}
                            </span>
                          </div>

                          {/* Job position */}
                          <div className="flex items-center gap-1.5 text-[11px] text-indigo-400/80 mb-2">
                            <i className="fa-solid fa-briefcase text-[9px]" />
                            {tpl.jobPosition}
                          </div>

                          {/* JD preview */}
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                            {tpl.jdText}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => { e.stopPropagation(); setEditingTemplate(tpl); setView('edit'); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <i className="fa-solid fa-pen text-[9px]" /> Sửa
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setDeletingId(tpl.id); setView('confirm-delete'); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Xóa"
                              >
                                <i className="fa-solid fa-trash text-[9px]" /> Xóa
                              </button>
                            </div>
                            <button
                              onClick={() => handleSelect(tpl)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 transition-all"
                            >
                              Sử dụng <i className="fa-solid fa-arrow-right text-[9px]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY VIEW */}
            {view === 'list' && activeTab === 'history' && (
              <div className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-slate-800/60 flex-shrink-0 items-center justify-between">
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                     <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                       <i className="fa-solid fa-chart-line text-blue-400" />
                       Tổng phiên: <span className="text-white font-bold">{historyStats.totalSessions}</span>
                     </div>
                     <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                       <i className="fa-solid fa-calendar-week text-emerald-400" />
                       Tuần này: <span className="text-white font-bold">{historyStats.thisWeekCount}</span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={refreshHistoryStats}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-slate-700 transition-all group shrink-0"
                      title="Cập nhật"
                    >
                      <i className="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    <button
                      onClick={handleDeleteSelectedHistory}
                      disabled={historyStats.totalSessions === 0 && selectedHistoryIds.length === 0}
                      className="px-3 py-1.5 flex items-center gap-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:bg-slate-800 disabled:text-slate-600 transition-all border border-red-500/20 hover:border-red-500/40 shrink-0"
                    >
                      <i className="fa-solid fa-trash-can" />
                      {selectedHistoryIds.length > 0 ? `Xóa (${selectedHistoryIds.length})` : 'Xóa tất cả'}
                    </button>
                  </div>
                </div>

                {/* History Filter Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 px-5 py-3 border-b border-slate-800/60 flex-shrink-0">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                    <input
                      type="text"
                      list="history-position-suggestions"
                      placeholder="Tìm kiếm vị trí công việc..."
                      value={historySearchTerm}
                      onChange={e => setHistorySearchTerm(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <datalist id="history-position-suggestions">
                      {suggestedHistoryPositions.map(pos => (
                        <option key={pos} value={pos} />
                      ))}
                    </datalist>
                  </div>

                  <select
                    value={historyTimeFilter}
                    onChange={(e) => setHistoryTimeFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
                  >
                    <option value="Tất cả">Mọi lúc</option>
                    <option value="Hôm nay">Hôm nay</option>
                    <option value="Tuần này">Tuần này</option>
                    <option value="Tháng này">Tháng này</option>
                    <option value="3 tháng qua">3 tháng qua</option>
                    <option value="6 tháng qua">6 tháng qua</option>
                    <option value="Năm nay">Năm nay</option>
                  </select>

                  <select
                    value={historyIndustryFilter}
                    onChange={(e) => setHistoryIndustryFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-green-500 transition-colors cursor-pointer max-w-[200px]"
                  >
                    {historyIndustries.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  {filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center text-2xl">
                        <i className="fa-solid fa-clock-rotate-left text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Chưa có lịch sử hoạt động nào</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {filteredHistory.map((entry, idx) => (
                         <div key={idx} className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-green-500/40 hover:bg-slate-800/40 transition-all">
                           
                           {/* Checkbox Overlay */}
                           <div className={`absolute top-4 right-4 z-10 transition-opacity ${selectedHistoryIds.includes(entry.timestamp) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                             <input 
                               type="checkbox" 
                               checked={selectedHistoryIds.includes(entry.timestamp)}
                               onChange={(e) => {
                                 if (e.target.checked) setSelectedHistoryIds(prev => [...prev, entry.timestamp]);
                                 else setSelectedHistoryIds(prev => prev.filter(id => id !== entry.timestamp));
                               }}
                               className="w-4 h-4 cursor-pointer accent-red-500 rounded border-slate-600 bg-slate-800"
                             />
                           </div>

                           <div className="flex items-start justify-between gap-2 mb-2 pr-6">
                              <h3 className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors line-clamp-1 flex-1">
                                {entry.jobPosition || 'Không rõ vị trí'}
                              </h3>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap shrink-0">
                                {entry.industry || 'Khác'}
                              </span>
                           </div>

                           <div className="flex items-center gap-1.5 text-[11px] text-green-400/80 mb-3">
                              <i className="fa-solid fa-calendar-alt text-[9px]" />
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleString('vi-VN') : 'N/A'}
                           </div>

                           <div className="flex items-center justify-end pt-3 border-t border-slate-800/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 w-fit cursor-default">
                                <i className="fa-solid fa-check" /> Đã hoàn thành
                              </div>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CREATE / EDIT VIEW */}
            {(view === 'create' || view === 'edit') && (
              <div className="p-5">
                <TemplateForm
                  initial={editingTemplate ? {
                    name: editingTemplate.name,
                    category: editingTemplate.category,
                    jobPosition: editingTemplate.jobPosition,
                    jdText: editingTemplate.jdText,
                    hardFilters: editingTemplate.hardFilters,
                  } : undefined}
                  onSave={view === 'create' ? handleCreate : handleEdit}
                  onCancel={() => { setView('list'); setEditingTemplate(null); }}
                  isSaving={isSaving}
                />
              </div>
            )}

            {/* CONFIRM DELETE VIEW */}
            {view === 'confirm-delete' && (
              <div className="flex flex-col items-center justify-center py-16 px-8 gap-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center">
                  <i className="fa-solid fa-triangle-exclamation text-red-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">Xác nhận xóa mẫu JD</h3>
                  <p className="text-slate-400 text-sm">Hành động này không thể hoàn tác. Mẫu JD sẽ bị xóa vĩnh viễn khỏi tài khoản của bạn.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setView('list'); setDeletingId(null); }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-colors flex items-center gap-2"
                  >
                    {isDeleting ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Đang xóa...</> : <><i className="fa-solid fa-trash text-xs" /> Xóa mẫu</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
          style={{
            background: 'rgba(15,23,42,0.97)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(99,102,241,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.type === 'success' ? '#a5b4fc' : '#f87171',
            backdropFilter: 'blur(12px)',
            animation: 'fadeInScale 0.2s ease',
          }}
        >
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} text-xs`} />
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  );
};

export default JDTemplatesModal;
