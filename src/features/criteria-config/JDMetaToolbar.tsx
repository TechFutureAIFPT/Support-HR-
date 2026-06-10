import React, { useState } from 'react';
import type { HardFilters } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';

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
        borderColor: 'rgba(55,125,255,0.14)',
      }}
      role="region"
      aria-label="Thông tin JD nhanh"
    >
      <div
        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
        style={{ borderBottom: tc.borderSoft }}
      >
        <div
          className="h-8 w-[3px] rounded-full shrink-0"
          style={{ background: 'linear-gradient(180deg, #2388ff, #14b8a6)' }}
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

        <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
          {onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold transition-all hover:brightness-110 sm:flex-none"
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
            className="flex flex-1 items-center justify-center gap-1.5 px-4 py-1.5 text-[10px] font-bold transition-all hover:brightness-110 disabled:opacity-30 sm:flex-none"
            style={
              isCompleteEnabled
                ? {
                    background: 'linear-gradient(135deg, #2388ff, #14b8a6)',
                    border: '1px solid rgba(35,136,255,0.28)',
                    color: '#fff',
                    boxShadow: '0 14px 34px rgba(35,136,255,0.18)',
                  }
                : {
                    background: '#f8fbff',
                    border: '1px solid rgba(55,125,255,0.14)',
                    color: '#94a3b8',
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
            background: '#ffffff',
            border: '1px solid rgba(55,125,255,0.14)',
            borderRadius: '12px',
            minWidth: '160px',
            flex: '1 1 140px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#2388ff' }}>
            Vị trí
          </span>
          <input
            type="text"
            placeholder="VD: Senior Frontend Developer"
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(55,125,255,0.14)',
            borderRadius: '12px',
            minWidth: '130px',
            flex: '1 1 110px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#2388ff' }}>
            Công ty
          </span>
          <input
            type="text"
            placeholder="VD: TechCorp Vietnam"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(55,125,255,0.14)',
            borderRadius: '12px',
            minWidth: '120px',
            flex: '1 1 100px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#2388ff' }}>
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
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(55,125,255,0.14)',
            borderRadius: '12px',
            minWidth: '130px',
            flex: '1 1 110px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#2388ff' }}>
            Lương
          </span>
          <input
            type="text"
            placeholder="VD: 15–25 triệu"
            value={hardFilters.salaryMin}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 transition-all"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(55,125,255,0.14)',
            borderRadius: '12px',
            minWidth: '140px',
            flex: '1 1 120px',
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#2388ff' }}>
            Kinh nghiệm
          </span>
          <input
            type="text"
            placeholder="VD: 3+ năm"
            value={hardFilters.minExp}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, minExp: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

export default JDMetaToolbar;
