import React, { useState } from 'react';
import {
  Award,
  Building,
  Clock,
  Coins,
  FileSignature,
  GraduationCap,
  Languages,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Tags,
  X,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import type { HardFilters } from '@/types';
import { extractHardFiltersFromJD } from '@/services/screening/frontendScreeningService';

interface HardFilterPanelProps {
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  jdText?: string;
}

type MandatoryKey = Extract<keyof HardFilters, `${string}Mandatory`>;
type ValueKey = Exclude<keyof HardFilters, MandatoryKey>;

type FieldConfig = {
  id: ValueKey;
  label: string;
  placeholder: string;
  mandatoryKey: MandatoryKey;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'mint' | 'orange';
  type?: 'input' | 'select';
  options?: { value: string; label: string }[];
};

const toneClass = {
  blue: {
    icon: 'border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]',
    strip: 'from-blue-500 to-sky-300',
  },
  mint: {
    icon: 'border-[color:var(--th-border)] bg-[color:var(--th-accent-muted)] text-[var(--th-accent)]',
    strip: 'from-emerald-500 to-cyan-300',
  },
  orange: {
    icon: 'border-[color:var(--th-border)] bg-[color:var(--th-warning-muted)] text-[var(--th-warning)]',
    strip: 'from-orange-400 to-blue-300',
  },
} as const;

const selectOptions = {
  minExp: [
    { value: '', label: 'Không yêu cầu' },
    { value: '1', label: '1 năm' },
    { value: '2', label: '2 năm' },
    { value: '3', label: '3 năm' },
    { value: '5', label: '5 năm' },
  ],
  seniority: [
    { value: '', label: 'Không yêu cầu' },
    { value: 'Intern', label: 'Intern' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Mid-level', label: 'Mid-level' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Lead', label: 'Lead / Quản lý' },
  ],
  workFormat: [
    { value: '', label: 'Không yêu cầu' },
    { value: 'Onsite', label: 'Onsite' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Remote', label: 'Remote' },
  ],
  contractType: [
    { value: '', label: 'Không yêu cầu' },
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Intern', label: 'Intern' },
    { value: 'Contract', label: 'Hợp đồng' },
  ],
  education: [
    { value: '', label: 'Không yêu cầu' },
    { value: 'High School', label: 'Tốt nghiệp THPT' },
    { value: 'Associate', label: 'Cao đẳng' },
    { value: 'Bachelor', label: 'Cử nhân' },
    { value: 'Master', label: 'Thạc sĩ' },
    { value: 'PhD', label: 'Tiến sĩ' },
  ],
  languageLevel: [
    { value: '', label: 'Độ' },
    { value: 'B1', label: 'B1' },
    { value: 'B2', label: 'B2' },
    { value: 'C1', label: 'C1' },
    { value: 'C2', label: 'C2' },
  ],
};

const coreFields: FieldConfig[] = [
  {
    id: 'location',
    label: 'Địa điểm',
    placeholder: 'VD: Hà Nội, Quận 1, Remote...',
    mandatoryKey: 'locationMandatory',
    icon: MapPin,
    tone: 'blue',
  },
  {
    id: 'minExp',
    label: 'Kinh nghiệm tối thiểu',
    placeholder: 'Không yêu cầu',
    mandatoryKey: 'minExpMandatory',
    icon: Clock,
    tone: 'blue',
    type: 'select',
    options: selectOptions.minExp,
  },
  {
    id: 'seniority',
    label: 'Cấp bậc',
    placeholder: 'Không yêu cầu',
    mandatoryKey: 'seniorityMandatory',
    icon: Layers,
    tone: 'blue',
    type: 'select',
    options: selectOptions.seniority,
  },
  {
    id: 'workFormat',
    label: 'Hình thức làm việc',
    placeholder: 'Không yêu cầu',
    mandatoryKey: 'workFormatMandatory',
    icon: Building,
    tone: 'mint',
    type: 'select',
    options: selectOptions.workFormat,
  },
  {
    id: 'contractType',
    label: 'Loại hợp đồng',
    placeholder: 'Không yêu cầu',
    mandatoryKey: 'contractTypeMandatory',
    icon: FileSignature,
    tone: 'mint',
    type: 'select',
    options: selectOptions.contractType,
  },
];

const detailFields: FieldConfig[] = [
  {
    id: 'industry',
    label: 'Ngành nghề',
    placeholder: 'Ví dụ: Fintech, SaaS, E-commerce...',
    mandatoryKey: 'industryMandatory',
    icon: Building,
    tone: 'blue',
  },
  {
    id: 'education',
    label: 'Học vấn / Bằng cấp',
    placeholder: 'Không yêu cầu',
    mandatoryKey: 'educationMandatory',
    icon: GraduationCap,
    tone: 'blue',
    type: 'select',
    options: selectOptions.education,
  },
  {
    id: 'certificates',
    label: 'Chứng chỉ',
    placeholder: 'Ví dụ: PMP, AWS, IELTS...',
    mandatoryKey: 'certificatesMandatory',
    icon: Award,
    tone: 'orange',
  },
];

const HardFilterPanel: React.FC<HardFilterPanelProps> = ({ hardFilters, setHardFilters, jdText }) => {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillNotice, setAutoFillNotice] = useState('');
  const [majorInput, setMajorInput] = useState('');

  const handleAutoFill = async () => {
    if (!jdText || jdText.trim().length < 20) {
      setAutoFillNotice('Chưa có nội dung JD để phân tích.');
      return;
    }
    setIsAutoFilling(true);
    setAutoFillNotice('');
    try {
      const extracted = await extractHardFiltersFromJD(jdText);
      setHardFilters((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(extracted).filter(([, v]) => v !== undefined && v !== '')
        ),
      }));
      setAutoFillNotice('Đã tự động điền thông tin từ JD.');
    } catch {
      setAutoFillNotice('Không thể trích xuất thông tin từ JD.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = event.target;
    setHardFilters((prev) => ({ ...prev, [id]: value }));
  };

  const handleMandatoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    setHardFilters((prev) => ({ ...prev, [id]: checked }));
  };

  const handleAgeChange = (key: 'min' | 'max', value: string) => {
    setHardFilters((prev) => ({
      ...prev,
      age: {
        ...(prev.age || {}),
        [key]: value === '' ? undefined : Number(value),
      },
    }));
  };

  const addMajorGroup = () => {
    const value = majorInput.trim();
    if (!value) return;
    setHardFilters((prev) => ({
      ...prev,
      majorGroups: Array.from(new Set([...(prev.majorGroups || []), value])),
    }));
    setMajorInput('');
  };

  const removeMajorGroup = (value: string) => {
    setHardFilters((prev) => ({
      ...prev,
      majorGroups: (prev.majorGroups || []).filter((item) => item !== value),
    }));
  };

  const hasValue = (value: unknown) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  };

  const rowInputClasses = (isMandatory: boolean, valuePresent: boolean) =>
    `w-full rounded-lg border bg-[var(--th-bg-elevated)] px-3 py-2 text-xs text-[var(--th-text)] placeholder:text-[var(--th-text-muted)] transition-all duration-150 focus:outline-none focus:ring-2 ${
      isMandatory && !valuePresent
        ? 'border-[color:var(--th-error)] focus:border-[color:var(--th-error)] focus:ring-[color:var(--th-error-muted)]'
        : isMandatory
          ? 'border-[color:var(--th-primary)] focus:border-[color:var(--th-primary)] focus:ring-[color:var(--th-primary-muted)]'
          : 'border-[color:var(--th-border-subtle)] hover:border-[color:var(--th-border)] focus:border-[color:var(--th-primary)] focus:ring-[color:var(--th-primary-muted)]'
    }`;

  const MandatoryToggle = ({ id, checked }: { id: MandatoryKey; checked: boolean }) => (
    <label className="flex shrink-0 cursor-pointer items-center gap-1.5">
      <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${checked ? 'text-[var(--th-primary)]' : 'text-[var(--th-text-muted)]'}`}>
        Bắt buộc
      </span>
      <input id={id} type="checkbox" checked={checked} onChange={handleMandatoryChange} className="sr-only" />
      <span className={`relative h-5 w-9 rounded-full border transition ${checked ? 'border-[color:var(--th-primary)] bg-[var(--th-primary)]' : 'border-[color:var(--th-border)] bg-[var(--th-bg-tertiary)]'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--th-text-inverse)] shadow-sm transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </label>
  );

  const FieldRow = ({ config }: { config: FieldConfig }) => {
    const isMandatory = Boolean(hardFilters[config.mandatoryKey]);
    const hasCurrentValue = hasValue(hardFilters[config.id]);
    const Icon = config.icon;
    const tone = toneClass[config.tone];

    return (
      <div className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isMandatory ? 'bg-[color:var(--th-primary-muted)]' : 'hover:bg-[var(--th-surface-hover)]'}`}>
        <label htmlFor={config.id} className="flex w-[180px] shrink-0 items-center gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${tone.icon}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-xs font-semibold text-[var(--th-text-secondary)]">{config.label}</span>
        </label>

        <div className="flex-1">
          {config.type === 'select' ? (
            <select
              id={config.id}
              value={String(hardFilters[config.id] ?? '')}
              onChange={handleChange}
              className={rowInputClasses(isMandatory, hasCurrentValue)}
            >
              {(config.options || []).map((option) => (
                <option key={option.value || option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={config.id}
              type="text"
              value={String(hardFilters[config.id] ?? '')}
              onChange={handleChange}
              placeholder={config.placeholder}
              className={rowInputClasses(isMandatory, hasCurrentValue)}
              autoComplete="off"
            />
          )}
        </div>

        <MandatoryToggle id={config.mandatoryKey} checked={isMandatory} />
      </div>
    );
  };

  const sectionCardClass = 'rounded-2xl border border-[color:var(--th-border-subtle)] bg-[var(--th-surface-card)] overflow-hidden';
  const sectionHeaderClass = 'border-b border-[color:var(--th-border-subtle)] bg-[var(--th-bg-elevated)] px-4 py-3 flex items-center gap-2.5';

  return (
    <div className="w-full animate-fade-in space-y-4 pb-4">
      {/* Auto-fill status notice (auto-fill is triggered from JD sub-page) */}
      {autoFillNotice && (
        <p className={`text-[12px] font-medium ${autoFillNotice.startsWith('Đã') ? 'text-[var(--th-success)]' : 'text-[var(--th-warning)]'}`}>{autoFillNotice}</p>
      )}

      {/* Section 1 - Dieu kien co ban */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--th-text-secondary)]">Điều kiện cơ bản</span>
        </div>
        <div className="divide-y divide-[color:var(--th-border-subtle)]">
          {coreFields.map((config) => (
            <FieldRow key={String(config.id)} config={config} />
          ))}
        </div>
      </div>

      {/* Section 2 - Chuyen mon & yeu cau */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-accent-muted)] text-[var(--th-accent)]">
            <Award className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--th-text-secondary)]">Chuyên môn &amp; yêu cầu</span>
        </div>
        <div className="divide-y divide-[color:var(--th-border-subtle)]">
          {detailFields.map((config) => (
            <FieldRow key={String(config.id)} config={config} />
          ))}

          {/* Do tuoi - 2 number inputs side by side */}
          <div className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${hardFilters.ageMandatory ? 'bg-[color:var(--th-primary-muted)]' : 'hover:bg-[var(--th-surface-hover)]'}`}>
            <div className="flex w-[180px] shrink-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-xs font-semibold text-[var(--th-text-secondary)]">Độ tuổi</span>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <input
                type="number"
                value={hardFilters.age?.min ?? ''}
                onChange={(event) => handleAgeChange('min', event.target.value)}
                placeholder="Từ"
                className={rowInputClasses(Boolean(hardFilters.ageMandatory), hasValue(hardFilters.age?.min))}
              />
              <span className="shrink-0 text-xs text-[var(--th-text-muted)]">—</span>
              <input
                type="number"
                value={hardFilters.age?.max ?? ''}
                onChange={(event) => handleAgeChange('max', event.target.value)}
                placeholder="Đến"
                className={rowInputClasses(Boolean(hardFilters.ageMandatory), hasValue(hardFilters.age?.max))}
              />
            </div>
            <MandatoryToggle id="ageMandatory" checked={Boolean(hardFilters.ageMandatory)} />
          </div>

          {/* Nhom chuyen nganh - tag input */}
          <div className={`px-4 py-2.5 transition-colors ${hardFilters.majorMandatory ? 'bg-[color:var(--th-primary-muted)]' : 'hover:bg-[var(--th-surface-hover)]'}`}>
            <div className="flex items-center gap-3">
              <div className="flex w-[180px] shrink-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-warning-muted)] text-[var(--th-warning)]">
                  <Tags className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-xs font-semibold text-[var(--th-text-secondary)]">Nhóm chuyên ngành</span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={majorInput}
                  onChange={(event) => setMajorInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addMajorGroup();
                    }
                  }}
                  placeholder="Nhập nhóm ngành rồi Enter"
                  className={rowInputClasses(Boolean(hardFilters.majorMandatory), (hardFilters.majorGroups || []).length > 0)}
                />
                <button
                  type="button"
                  onClick={addMajorGroup}
                  className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-lg border border-[color:var(--th-primary)] bg-[color:var(--th-primary-muted)] px-3 text-xs font-bold text-[var(--th-primary)] transition hover:bg-[var(--th-surface-active)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>
              <MandatoryToggle id="majorMandatory" checked={Boolean(hardFilters.majorMandatory)} />
            </div>
            {(hardFilters.majorGroups || []).length > 0 && (
              <div className="mt-2 ml-[192px] flex flex-wrap gap-1.5">
                {(hardFilters.majorGroups || []).map((group) => (
                  <span key={group} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--th-primary)]">
                    {group}
                    <button type="button" onClick={() => removeMajorGroup(group)} className="text-[var(--th-primary)] opacity-70 transition hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ngon ngu - name input + level select */}
          <div className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${hardFilters.languageMandatory ? 'bg-[color:var(--th-primary-muted)]' : 'hover:bg-[var(--th-surface-hover)]'}`}>
            <label htmlFor="language" className="flex w-[180px] shrink-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]">
                <Languages className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-xs font-semibold text-[var(--th-text-secondary)]">Ngôn ngữ</span>
            </label>
            <div className="flex flex-1 items-center gap-2">
              <input
                id="language"
                type="text"
                value={hardFilters.language}
                onChange={handleChange}
                placeholder="Tên ngôn ngữ"
                className={rowInputClasses(Boolean(hardFilters.languageMandatory), hasValue(hardFilters.language))}
              />
              <select
                id="languageLevel"
                value={hardFilters.languageLevel}
                onChange={handleChange}
                className="w-20 shrink-0 rounded-lg border border-[color:var(--th-border-subtle)] bg-[var(--th-bg-elevated)] px-2 py-2 text-xs text-[var(--th-text)] transition-all duration-150 hover:border-[color:var(--th-border)] focus:border-[color:var(--th-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--th-primary-muted)]"
              >
                {selectOptions.languageLevel.map((option) => (
                  <option key={option.value || option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <MandatoryToggle id="languageMandatory" checked={Boolean(hardFilters.languageMandatory)} />
          </div>
        </div>
      </div>

      {/* Section 3 - Muc luong ky vong */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]">
            <Coins className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--th-text-secondary)]">Mức lương kỳ vọng</span>
        </div>
        <div className="divide-y divide-[color:var(--th-border-subtle)]">
          <div className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${hardFilters.salaryMandatory ? 'bg-[color:var(--th-primary-muted)]' : 'hover:bg-[var(--th-surface-hover)]'}`}>
            <div className="flex w-[180px] shrink-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[color:var(--th-border)] bg-[color:var(--th-primary-muted)] text-[var(--th-primary)]">
                <Coins className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-xs font-semibold text-[var(--th-text-secondary)]">Khoảng lương (VNĐ)</span>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 items-center gap-2">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--th-text-muted)]">Từ</span>
                <input
                  type="number"
                  id="salaryMin"
                  value={hardFilters.salaryMin || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className={rowInputClasses(Boolean(hardFilters.salaryMandatory), hasValue(hardFilters.salaryMin))}
                />
              </div>
              <span className="shrink-0 text-xs text-[var(--th-text-muted)]">—</span>
              <div className="flex flex-1 items-center gap-2">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--th-text-muted)]">Đến</span>
                <input
                  type="number"
                  id="salaryMax"
                  value={hardFilters.salaryMax || ''}
                  onChange={handleChange}
                  placeholder="Không giới hạn"
                  className={rowInputClasses(Boolean(hardFilters.salaryMandatory), hasValue(hardFilters.salaryMax))}
                />
              </div>
            </div>
            <MandatoryToggle id="salaryMandatory" checked={Boolean(hardFilters.salaryMandatory)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardFilterPanel;
