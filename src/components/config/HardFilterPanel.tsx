import React from 'react';
import {
  Award,
  Building,
  Clock,
  Coins,
  FileSignature,
  GraduationCap,
  Languages,
  Layers,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { HardFilters } from '@/types';

interface HardFilterPanelProps {
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
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
    icon: 'border-blue-100 bg-blue-50 text-blue-600',
    strip: 'from-blue-500 to-sky-300',
  },
  mint: {
    icon: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    strip: 'from-emerald-500 to-cyan-300',
  },
  orange: {
    icon: 'border-orange-100 bg-orange-50 text-orange-500',
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

const HardFilterPanel: React.FC<HardFilterPanelProps> = ({ hardFilters, setHardFilters }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = event.target;
    setHardFilters((prev) => ({ ...prev, [id]: value }));
  };

  const handleMandatoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    setHardFilters((prev) => ({ ...prev, [id]: checked }));
  };

  const hasValue = (value: unknown) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  };

  const inputClasses = (isMandatory: boolean, valuePresent: boolean) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-inner transition-all duration-200 focus:outline-none focus:ring-4 ${
      isMandatory && !valuePresent
        ? 'border-red-200 focus:border-red-300 focus:ring-red-100'
        : isMandatory
          ? 'border-blue-200 focus:border-blue-300 focus:ring-blue-100'
          : 'border-blue-100 hover:border-blue-200 focus:border-blue-300 focus:ring-blue-100'
    }`;

  const Toggle = ({ id, checked }: { id: MandatoryKey; checked: boolean }) => (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className={`supporthr-mono text-[9px] font-bold uppercase tracking-[0.14em] ${checked ? 'text-blue-600' : 'text-slate-400'}`}>
        Bắt buộc
      </span>
      <input id={id} type="checkbox" checked={checked} onChange={handleMandatoryChange} className="sr-only" />
      <span className={`relative h-5 w-10 rounded-full border transition ${checked ? 'border-blue-300 bg-blue-500' : 'border-blue-100 bg-slate-100'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'left-5' : 'left-0.5'}`} />
      </span>
    </label>
  );

  const FieldCard = ({ config }: { config: FieldConfig }) => {
    const isMandatory = Boolean(hardFilters[config.mandatoryKey]);
    const hasCurrentValue = hasValue(hardFilters[config.id]);
    const Icon = config.icon;
    const tone = toneClass[config.tone];

    return (
      <div className={`relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-[0_10px_26px_rgba(30,64,175,0.055)] transition ${
        isMandatory ? 'border-blue-200' : 'border-blue-100 hover:border-blue-200'
      }`}>
        {isMandatory && <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${tone.strip}`} />}
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <label htmlFor={config.id} className="flex min-w-0 items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone.icon}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">{config.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{isMandatory ? 'Đang bật điều kiện bắt buộc' : 'Điều kiện tùy chọn'}</span>
            </span>
          </label>
          <Toggle id={config.mandatoryKey} checked={isMandatory} />
        </div>

        {config.type === 'select' ? (
          <select
            id={config.id}
            value={String(hardFilters[config.id] ?? '')}
            onChange={handleChange}
            className={inputClasses(isMandatory, hasCurrentValue)}
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
            className={inputClasses(isMandatory, hasCurrentValue)}
            autoComplete="off"
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full animate-fade-in space-y-4 pb-4">
      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">Điều kiện cơ bản</h5>
            <p className="mt-0.5 text-[11px] text-slate-500">Thông tin tuyển dụng cơ bản</p>
          </div>
          <div className="ml-2 h-px flex-1 bg-blue-100" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coreFields.map((config) => <FieldCard key={String(config.id)} config={config} />)}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">Chuyên môn & yêu cầu</h5>
            <p className="mt-0.5 text-[11px] text-slate-500">Kỹ năng, bằng cấp và chứng chỉ</p>
          </div>
          <div className="ml-2 h-px flex-1 bg-blue-100" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {detailFields.map((config) => <FieldCard key={String(config.id)} config={config} />)}

          <div className={`relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-[0_10px_26px_rgba(30,64,175,0.055)] transition ${
            hardFilters.languageMandatory ? 'border-blue-200' : 'border-blue-100 hover:border-blue-200'
          }`}>
            {hardFilters.languageMandatory && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-300" />}
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <label htmlFor="language" className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                  <Languages className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">Ngôn ngữ</span>
                  <span className="block truncate text-[11px] text-slate-500">Tên ngôn ngữ và cấp độ</span>
                </span>
              </label>
              <Toggle id="languageMandatory" checked={Boolean(hardFilters.languageMandatory)} />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5.5rem]">
              <input
                id="language"
                type="text"
                value={hardFilters.language}
                onChange={handleChange}
                placeholder="Tên ngôn ngữ"
                className={inputClasses(Boolean(hardFilters.languageMandatory), hasValue(hardFilters.language))}
              />
              <select
                id="languageLevel"
                value={hardFilters.languageLevel}
                onChange={handleChange}
                className={inputClasses(false, hasValue(hardFilters.languageLevel))}
              >
                {selectOptions.languageLevel.map((option) => (
                  <option key={option.value || option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            <Coins className="h-4 w-4" />
          </span>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">Mức lương kỳ vọng</h5>
            <p className="mt-0.5 text-[11px] text-slate-500">Khoảng lương mong muốn của ứng viên</p>
          </div>
          <div className="ml-2 h-px flex-1 bg-blue-100" />
        </div>

        <div className={`relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-[0_10px_26px_rgba(30,64,175,0.055)] transition ${
          hardFilters.salaryMandatory ? 'border-blue-200' : 'border-blue-100 hover:border-blue-200'
        }`}>
          {hardFilters.salaryMandatory && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-300" />}
          <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.9fr)_minmax(12rem,0.9fr)] xl:items-end">
            <div className="flex items-center justify-between gap-3 xl:items-center">
              <label className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                  <Coins className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">Khoảng lương (VNĐ)</span>
                  <span className="block text-[11px] text-slate-500">Có thể bỏ trống một đầu khoảng</span>
                </span>
              </label>
              <div className="xl:hidden">
                <Toggle id="salaryMandatory" checked={Boolean(hardFilters.salaryMandatory)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Từ</span>
              <input
                type="number"
                id="salaryMin"
                value={hardFilters.salaryMin || ''}
                onChange={handleChange}
                placeholder="0"
                className={inputClasses(Boolean(hardFilters.salaryMandatory), hasValue(hardFilters.salaryMin))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1.5">
                <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Đến</span>
                <input
                  type="number"
                  id="salaryMax"
                  value={hardFilters.salaryMax || ''}
                  onChange={handleChange}
                  placeholder="Không giới hạn"
                  className={inputClasses(Boolean(hardFilters.salaryMandatory), hasValue(hardFilters.salaryMax))}
                />
              </div>
              <div className="hidden pb-1 xl:block">
                <Toggle id="salaryMandatory" checked={Boolean(hardFilters.salaryMandatory)} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HardFilterPanel;
