import React, { useState } from 'react';
import type { HardFilters } from '@/shared/types';
import { useThemeColors } from '@/shared/ui/theme/useThemeColors';

export interface JDMetaToolbarProps {
  jdText: string;
  setJdText: React.Dispatch<React.SetStateAction<string>>;
  rawJdText: string;
  setRawJdText: React.Dispatch<React.SetStateAction<string>>;
  jobPosition: string;
  setJobPosition: React.Dispatch<React.SetStateAction<string>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
  onBackToWelcome?: () => void;
  leading?: React.ReactNode;
}

const JDMetaToolbar: React.FC<JDMetaToolbarProps> = ({
  jdText,
  jobPosition,
  setJobPosition,
  hardFilters,
  setHardFilters,
  onComplete,
  onBackToWelcome,
  leading,
}) => {
  const isCompleteEnabled = jdText.trim().length > 50 && jobPosition.trim().length > 3;
  const [company, setCompany] = useState('');
  const tc = useThemeColors();

  return (
    <div
      className="shrink-0 border-b"
      style={{
        background: tc.headerBg,
        borderColor: 'rgba(99,102,241,0.18)',
      }}
      role="region"
      aria-label="Thông tin JD nhanh"
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: tc.borderSoft }}
      >
        <div
          className="h-8 w-[3px] -full shrink-0"
          style={{ background: 'linear-gradient(180deg, #6366f1, #3b82f6)' }}
        />

        {leading ? (
          <div className="flex items-center gap-3 min-w-0">{leading}</div>
        ) : (
          <div className="min-w-0">
            <h1
              className="text-base font-bold leading-tight tracking-tight"
              style={{ color: tc.textPrimary }}
            >
              Sàng lọc ứng viên
            </h1>
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5"
              style={{ color: tc.textAccent }}
            >
              Recruitment Intelligence
            </p>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4" style={{ borderLeft: tc.border }}>
          <span className="text-[10px] font-medium" style={{ color: tc.textDim }}>
            JD mẫu · Bộ lọc · Phân tích CV
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold transition-all hover:brightness-110"
              style={{
                background: tc.cardBg2,
                border: tc.borderCard,
                color: tc.textMuted,
              }}
            >
              <i className="fa-solid fa-file-import text-[9px]" />
              Tải file JD
            </button>
          )}
          <button
            type="button"
            onClick={onComplete}
            disabled={!isCompleteEnabled}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
            style={
              isCompleteEnabled
                ? {
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#fff',
                    boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#475569',
                  }
            }
          >
            Tiếp theo
            <i className="fa-solid fa-arrow-right text-[9px]" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '160px',
            flex: '1 1 140px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Vị trí
          </span>
          <input
            type="text"
            placeholder="VD: Senior Frontend Developer"
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '130px',
            flex: '1 1 110px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Công ty
          </span>
          <input
            type="text"
            placeholder="VD: TechCorp Vietnam"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '120px',
            flex: '1 1 100px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Ngành
          </span>
          <input
            type="text"
            placeholder="VD: Công nghệ thông tin"
            value={hardFilters.industry}
            onChange={(e) =>
              setHardFilters((prev) => ({
                ...prev,
                industry: e.target.value,
                industryManual: 'manual',
              }))
            }
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '130px',
            flex: '1 1 110px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Lương
          </span>
          <input
            type="text"
            placeholder="VD: 15–25 triệu"
            value={hardFilters.salaryMin}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '140px',
            flex: '1 1 120px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(99,102,241,0.6)' }}>
            Kinh nghiệm
          </span>
          <input
            type="text"
            placeholder="VD: 3+ năm"
            value={hardFilters.minExp}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, minExp: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>
    </div>
  );
};

export default JDMetaToolbar;
