import React from 'react';
import { MapPin, Clock, Layers, Building, FileText, GraduationCap, Award, Coins, ToggleLeft as ToggleIcon, Wifi, FileSignature, Sparkles } from 'lucide-react';
import type { HardFilters } from '@/types';

interface HardFilterPanelProps {
    hardFilters: HardFilters;
    setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
}

type MandatoryKey = Extract<keyof HardFilters, `${string}Mandatory`>;
type ValueKey = Exclude<keyof HardFilters, MandatoryKey>;

const HardFilterPanel: React.FC<HardFilterPanelProps> = ({ hardFilters, setHardFilters }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setHardFilters((prev) => ({ ...prev, [id]: value }));
    };

    const handleMandatoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        setHardFilters((prev) => ({ ...prev, [id]: checked }));
    };

    const hasValue = (val: unknown) => {
        if (typeof val === 'string') return val.trim().length > 0;
        return Boolean(val);
    };

    const inputClasses = (isMandatory: boolean, valuePresent: boolean) =>
        `w-full border backdrop-blur-sm rounded-none-none px-4 py-3 text-xs placeholder-slate-500/70 transition-all duration-300 focus:outline-none focus:ring-4 appearance-none shadow-inner ${
            isMandatory
                ? valuePresent
                    ? 'bg-[#05070b] border-white/10 hover:border-sky-400/35 focus:border-sky-400/35 focus:ring-sky-400/10 text-slate-200'
                    : 'bg-[#05070b] border-rose-500/35 bg-rose-500/5 hover:border-rose-500 focus:border-rose-400 focus:ring-rose-500/10 text-slate-200'
                : 'bg-[#05070b] border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-400/35 focus:ring-indigo-400/10 text-slate-200'
        }`;

    const selectFieldConfigs: Array<{
        id: ValueKey;
        label: string;
        placeholder: string;
        mandatoryKey: MandatoryKey;
        icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        color: string;
        colorBg: string;
        options: { value: string; label: string }[];
    }> = [
        {
            id: 'location',
            label: 'Địa điểm',
            placeholder: 'VD: Hà Nội, Quận 1, Remote, Hybrid...',
            mandatoryKey: 'locationMandatory',
            icon: MapPin,
            color: '#6366f1',
            colorBg: 'indigo',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Hà Nội', label: 'Hà Nội' },
                { value: 'Hải Phòng', label: 'Hải Phòng' },
                { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                { value: 'Thành phố Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
                { value: 'Remote', label: 'Remote / Từ xa' },
            ],
        },
        {
            id: 'minExp',
            label: 'Kinh nghiệm tối thiểu',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'minExpMandatory',
            icon: Clock,
            color: '#8b5cf6',
            colorBg: 'violet',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: '1', label: '1 năm' },
                { value: '2', label: '2 năm' },
                { value: '3', label: '3 năm' },
                { value: '5', label: '5 năm' },
            ],
        },
        {
            id: 'seniority',
            label: 'Cấp bậc',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'seniorityMandatory',
            icon: Layers,
            color: '#60a5fa',  // tokens.dark.primary (thống nhất cyan → blue)
            colorBg: 'cyan',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Intern', label: 'Intern' },
                { value: 'Junior', label: 'Junior' },
                { value: 'Mid-level', label: 'Mid-level' },
                { value: 'Senior', label: 'Senior' },
                { value: 'Lead', label: 'Lead / Quản lý' },
            ],
        },
        {
            id: 'workFormat',
            label: 'Hình thức làm việc',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'workFormatMandatory',
            icon: Building,
            color: '#3b82f6',
            colorBg: 'blue',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Onsite', label: 'Onsite' },
                { value: 'Hybrid', label: 'Hybrid' },
                { value: 'Remote', label: 'Remote' },
            ],
        },
        {
            id: 'contractType',
            label: 'Loại hợp đồng',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'contractTypeMandatory',
            icon: FileSignature,
            color: '#10b981',
            colorBg: 'emerald',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Intern', label: 'Intern' },
                { value: 'Contract', label: 'Hợp đồng' },
            ],
        },
    ];

    const renderToggle = (id: string, isChecked: boolean, label: string = 'Bắt buộc') => (
        <div className="flex items-center gap-2">
            <label htmlFor={id} className={`text-[10px] font-bold tracking-[0.15em] cursor-pointer transition-colors duration-300 ${isChecked ? 'text-sky-300' : 'text-slate-500 hover:text-slate-400'}`}>
                {label}
            </label>
            <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in group">
                <input
                    type="checkbox"
                    id={id}
                    checked={isChecked}
                    onChange={handleMandatoryChange}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-none-full bg-slate-100 border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out border-transparent top-0.5 shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
                    style={{
                        transform: isChecked ? 'translateX(100%)' : 'translateX(0)',
                        zIndex: 10,
                        left: isChecked ? '-2px' : '2px',
                        boxShadow: isChecked ? `0 0 12px ${isChecked ? 'rgba(56,189,248,0.45)' : ''}` : ''
                    }}
                />
                <label
                    htmlFor={id}
                    className={`toggle-label block overflow-hidden h-6 rounded-none-full cursor-pointer transition-all duration-300 ease-in-out border ${isChecked ? 'bg-[linear-gradient(90deg,rgba(34,211,238,0.55),rgba(99,102,241,0.55))] border-sky-400/35 shadow-[inset_0_0_10px_rgba(0,0,0,0.25)]' : 'bg-[#05070b] border-white/[0.1] group-hover:bg-[#0a0d12]'}`}
                />
            </div>
        </div>
    );

    const renderCompactField = (config: (typeof selectFieldConfigs)[number]) => {
        const isMandatory = hardFilters[config.mandatoryKey];
        const hasCurrentValue = hasValue(hardFilters[config.id]);
        const Icon = config.icon;

        return (
            <div key={config.id} className={`relative isolate flex flex-col gap-3 p-5 rounded-none-none border transition-all duration-300 overflow-hidden group ${
                isMandatory
                ? 'border-white/12 bg-white/[0.025] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] hover:border-sky-400/30 hover:bg-white/[0.04]'
                : 'border-white/[0.07] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.015]'
            }`}>
                {isMandatory && (
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-20 h-20 rounded-none-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-35 group-hover:opacity-60" style={{ background: `${config.color}18` }} />
                )}
                {isMandatory && (
                    <div className="absolute top-0 left-0 w-full h-[1.5px] opacity-70" style={{ background: `linear-gradient(90deg, ${config.color}, transparent 78%)` }} />
                )}

                <div className="flex items-center justify-between z-10">
                    <label htmlFor={config.id} className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                        <div className={`w-9 h-9 rounded-none-none flex items-center justify-center transition-all duration-300 border ${
                            isMandatory
                            ? `bg-${config.colorBg}-500/15 text-${config.colorBg}-400 border-${config.colorBg}-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-inset`
                            : 'bg-[#05070b] text-slate-400 group-hover:bg-[#0a0d12] group-hover:text-slate-200 ring-1 ring-inset ring-white/10'
                        }`}
                        style={isMandatory ? { background: `${config.color}15`, borderColor: `${config.color}30`, color: config.color, boxShadow: `0 0 12px ${config.color}15`, border: `1px solid ${config.color}30` } : {}}>
                            <Icon className="text-xs" />
                        </div>
                        {config.label}
                    </label>
                    {renderToggle(config.mandatoryKey, Boolean(isMandatory))}
                </div>

                <div className="relative z-10 w-full">
                    {config.id === 'location' ? (
                        <input
                            id={config.id}
                            type="text"
                            value={String(hardFilters[config.id] ?? '')}
                            onChange={handleChange}
                            placeholder={config.placeholder}
                            className={inputClasses(Boolean(isMandatory), hasCurrentValue)}
                            autoComplete="off"
                        />
                    ) : (
                        <>
                            <select
                                id={config.id}
                                value={String(hardFilters[config.id] ?? '')}
                                onChange={handleChange}
                                className={inputClasses(Boolean(isMandatory), hasCurrentValue)}
                            >
                                {config.options.map((option) => (
                                    <option key={option.value ?? option.label} value={option.value} className="bg-[#05070b] text-slate-200">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 flex items-center justify-center rounded-none bg-transparent">
                                <i className="fa-solid fa-chevron-down text-[9px] text-slate-400" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-10 w-full animate-fade-in">



            {/* Group 1: Basic Info */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-none-none bg-black/40 border border-indigo-500/20 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Điều kiện cơ bản</h5>
                        <p className="text-[10px] text-slate-600 mt-0.5">Thông tin tuyển dụng cơ bản</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/12 to-transparent ml-2" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectFieldConfigs.map((config) => renderCompactField(config))}
                </div>
            </div>

            {/* Group 2: Context & Quality */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-none-none bg-black/40 border border-violet-500/20 flex items-center justify-center">
                        <Award className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Chuyên môn & Yêu cầu</h5>
                        <p className="text-[10px] text-slate-600 mt-0.5">Kỹ năng, bằng cấp và chứng chỉ</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/12 to-transparent ml-2" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Industry */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-none-none border transition-all duration-300 overflow-hidden group ${
                        hardFilters.industryMandatory
                        ? 'border-white/12 bg-white/[0.025] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] hover:border-sky-400/30 hover:bg-white/[0.04]'
                        : 'border-white/[0.07] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.015]'
                    }`}>
                        {hardFilters.industryMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="industry" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-none-none flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.industryMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-[#05070b] text-slate-400 group-hover:bg-[#0a0d12] group-hover:text-slate-200 ring-1 ring-inset ring-white/10'
                                }`}>
                                    <i className="fa-solid fa-industry text-xs"></i>
                                </div>
                                Ngành nghề
                            </label>
                            {renderToggle('industryMandatory', Boolean(hardFilters.industryMandatory))}
                        </div>
                        <input
                            type="text"
                            id="industry"
                            value={hardFilters.industry}
                            onChange={handleChange}
                            placeholder="Ví dụ: Fintech, SaaS, E-commerce..."
                            className={inputClasses(hardFilters.industryMandatory, hasValue(hardFilters.industry))}
                        />
                    </div>

                    {/* Language */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-none-none border transition-all duration-300 overflow-hidden group ${
                        hardFilters.languageMandatory
                        ? 'border-white/12 bg-white/[0.025] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] hover:border-sky-400/30 hover:bg-white/[0.04]'
                        : 'border-white/[0.07] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.015]'
                    }`}>
                        {hardFilters.languageMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="language" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-none-none flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.languageMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-[#05070b] text-slate-400 group-hover:bg-[#0a0d12] group-hover:text-slate-200 ring-1 ring-inset ring-white/10'
                                }`}>
                                    <i className="fa-solid fa-language text-xs"></i>
                                </div>
                                Ngôn ngữ
                            </label>
                            {renderToggle('languageMandatory', Boolean(hardFilters.languageMandatory))}
                        </div>
                        <div className="grid grid-cols-[1fr_90px] gap-2.5 relative z-10">
                            <input
                                type="text"
                                id="language"
                                value={hardFilters.language}
                                onChange={handleChange}
                                placeholder="Tên ngôn ngữ"
                                className={inputClasses(hardFilters.languageMandatory, hasValue(hardFilters.language))}
                            />
                            <div className="relative h-full">
                                <select
                                    id="languageLevel"
                                    value={hardFilters.languageLevel}
                                    onChange={handleChange}
                                    className={`${inputClasses(false, hasValue(hardFilters.languageLevel))} h-full pl-2 pr-6 text-[11px]`}
                                >
                                    <option value="" className="bg-[#05070b] text-slate-400">Độ</option>
                                    <option value="B1" className="bg-[#05070b] text-slate-200">B1</option>
                                    <option value="B2" className="bg-[#05070b] text-slate-200">B2</option>
                                    <option value="C1" className="bg-[#05070b] text-slate-200">C1</option>
                                    <option value="C2" className="bg-[#05070b] text-slate-200">C2</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 flex items-center justify-center rounded-none bg-transparent">
                                    <i className="fa-solid fa-chevron-down text-[9px] text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Education */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-none-none border transition-all duration-300 overflow-hidden group ${
                        hardFilters.educationMandatory
                        ? 'border-white/12 bg-white/[0.025] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] hover:border-sky-400/30 hover:bg-white/[0.04]'
                        : 'border-white/[0.07] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.015]'
                    }`}>
                        {hardFilters.educationMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="education" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-none-none flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.educationMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-[#05070b] text-slate-400 group-hover:bg-[#0a0d12] group-hover:text-slate-200 ring-1 ring-inset ring-white/10'
                                }`}>
                                    <GraduationCap className="text-xs" />
                                </div>
                                Học vấn / Bằng cấp
                            </label>
                            {renderToggle('educationMandatory', Boolean(hardFilters.educationMandatory))}
                        </div>
                        <div className="relative z-10">
                            <select
                                id="education"
                                value={hardFilters.education}
                                onChange={handleChange}
                                className={inputClasses(hardFilters.educationMandatory, hasValue(hardFilters.education))}
                            >
                                <option value="" className="bg-[#05070b] text-slate-400">Không yêu cầu</option>
                                <option value="High School" className="bg-[#05070b]">Tốt nghiệp THPT</option>
                                <option value="Associate" className="bg-[#05070b]">Cao đẳng</option>
                                <option value="Bachelor" className="bg-[#05070b]">Cử nhân</option>
                                <option value="Master" className="bg-[#05070b]">Thạc sĩ</option>
                                <option value="PhD" className="bg-[#05070b]">Tiến sĩ</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 flex items-center justify-center rounded-none bg-transparent">
                                <i className="fa-solid fa-chevron-down text-[9px] text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Certificates */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-none-none border transition-all duration-300 overflow-hidden group ${
                        hardFilters.certificatesMandatory
                        ? 'border-white/12 bg-white/[0.025] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] hover:border-sky-400/30 hover:bg-white/[0.04]'
                        : 'border-white/[0.07] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.015]'
                    }`}>
                        {hardFilters.certificatesMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="certificates" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-none-none flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.certificatesMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-[#05070b] text-slate-400 group-hover:bg-[#0a0d12] group-hover:text-slate-200 ring-1 ring-inset ring-white/10'
                                }`}>
                                    <Award className="text-xs" />
                                </div>
                                Chứng chỉ / Certificates
                            </label>
                            {renderToggle('certificatesMandatory', Boolean(hardFilters.certificatesMandatory))}
                        </div>
                        <input
                            type="text"
                            id="certificates"
                            value={hardFilters.certificates}
                            onChange={handleChange}
                            placeholder="Ví dụ: PMP, AWS, IELTS..."
                            className={inputClasses(hardFilters.certificatesMandatory, hasValue(hardFilters.certificates))}
                        />
                    </div>
                </div>
            </div>

            {/* Group 3: Salary */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-none-none bg-black/40 border border-amber-500/20 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Mức lương kỳ vọng</h5>
                        <p className="text-[10px] text-slate-600 mt-0.5">Khoảng lương mong muốn của ứng viên</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-slate-800/30 ml-2" />
                </div>
                <div className={`relative isolate flex flex-col gap-4 p-6 rounded-none-none border transition-all duration-300 overflow-hidden group ${
                    hardFilters.salaryMandatory
                    ? 'border-white/12 bg-white/[0.025] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] hover:border-amber-400/30 hover:bg-white/[0.04]'
                    : 'border-white/[0.07] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.015]'
                }`}>
                     {hardFilters.salaryMandatory && <div className="absolute top-0 right-0 -mr-8 -mt-8 w-20 h-20 rounded-none-full blur-2xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.1)' }} />}
                     {hardFilters.salaryMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-amber-500 to-orange-500 opacity-70" />}

                     <div className="flex items-center justify-between z-10 flex-col sm:flex-row gap-3">
                        <label htmlFor="salary" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                            <div className={`w-9 h-9 rounded-none-none flex items-center justify-center transition-all duration-300 border ${
                                hardFilters.salaryMandatory
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                : 'bg-[#05070b] text-slate-400 group-hover:bg-[#0a0d12] group-hover:text-slate-200 ring-1 ring-inset ring-white/10'
                            }`}>
                                <Coins className="text-xs" />
                            </div>
                            Khoảng lương (VNĐ)
                        </label>
                        {renderToggle('salaryMandatory', Boolean(hardFilters.salaryMandatory))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 relative z-10">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Từ</span>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-xs">₫</span>
                                <input
                                    type="number"
                                    id="salaryMin"
                                    value={hardFilters.salaryMin || ''}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className={`${inputClasses(hardFilters.salaryMandatory, hasValue(hardFilters.salaryMin))} pl-8`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Đến</span>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-xs">₫</span>
                                <input
                                    type="number"
                                    id="salaryMax"
                                    value={hardFilters.salaryMax || ''}
                                    onChange={handleChange}
                                    placeholder="Không giới hạn"
                                    className={`${inputClasses(hardFilters.salaryMandatory, hasValue(hardFilters.salaryMax))} pl-8`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HardFilterPanel;


