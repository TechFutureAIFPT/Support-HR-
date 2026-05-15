import React from 'react';
import type { HardFilters } from '@/types';

interface JDInputProps {
  jdText: string;
  setJdText: React.Dispatch<React.SetStateAction<string>>;
  jobPosition: string;
  setJobPosition: React.Dispatch<React.SetStateAction<string>>;
  hardFilters: HardFilters;
  setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
  onComplete: () => void;
  onBackToWelcome?: () => void;
  hideToolbar?: boolean;
}

const toolbarFieldStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  '--tw-ring-color': 'rgba(99,102,241,0.5)',
} as React.CSSProperties;

const JDInput: React.FC<JDInputProps> = ({
  jdText,
  setJdText,
  jobPosition,
  setJobPosition,
  hardFilters,
  setHardFilters,
  onComplete,
  onBackToWelcome,
  hideToolbar = false,
}) => {
  const isCompleteEnabled = jdText.trim().length > 50 && jobPosition.trim().length > 3;
  const characterCount = jdText.length;

  if (hideToolbar) {
    return (
      <section
        id="module-jd"
        className="module-pane active custom-scrollbar flex h-full min-h-0 w-full flex-1 flex-col"
        aria-labelledby="jd-title"
      >
        <textarea
          className="custom-scrollbar min-h-0 w-full flex-1 resize-none border-none p-5 text-sm leading-[1.75] text-slate-200 outline-none placeholder:text-slate-500 focus:ring-0 font-mono"
          rows={12}
          style={{ background: 'transparent' }}
          placeholder={
            'Paste the Job Description here...\n\nInclude role title, responsibilities, required skills, experience level, and any other relevant details.'
          }
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          spellCheck={false}
        />
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(100,116,139,0.4)', padding: '0 20px 20px', textAlign: 'right' }}
        >
          {characterCount > 0 ? `${characterCount} ky tu` : 'Bat dau nhap JD'}
        </div>
      </section>
    );
  }

  return (
    <section
      id="module-jd"
      className="module-pane active flex h-full min-h-0 w-full flex-col"
      aria-labelledby="jd-title"
    >
      <div
        className="flex shrink-0 items-center gap-2 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="group flex min-w-[150px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-solid fa-briefcase text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Vi tri cong viec..."
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        <div
          className="group flex min-w-[130px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-regular fa-building text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Cong ty..."
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        <div
          className="group flex min-w-[130px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-solid fa-layer-group text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Nganh nghe..."
            value={hardFilters.industry}
            onChange={(e) =>
              setHardFilters((prev) => ({
                ...prev,
                industry: e.target.value,
                industryManual: 'manual',
              }))
            }
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        <div
          className="group flex min-w-[120px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-solid fa-money-bill text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Muc luong..."
            value={hardFilters.salaryMin}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#cbd5e1' }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pl-1">
          {onBackToWelcome && (
            <button
              onClick={onBackToWelcome}
              className="flex h-8 w-8 items-center justify-center text-slate-500 transition-all hover:bg-white/5 hover:text-indigo-400"
              title="Quay lai tai file"
            >
              <i className="fa-solid fa-file-arrow-up text-xs" />
            </button>
          )}

          <button
            onClick={onComplete}
            disabled={!isCompleteEnabled}
            className="flex h-8 w-8 items-center justify-center text-slate-500 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30"
            style={isCompleteEnabled ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8' } : {}}
            title="Ke tiep"
          >
            <i className="fa-solid fa-arrow-right text-xs" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <textarea
          className="custom-scrollbar min-h-0 w-full flex-1 resize-none border-none bg-transparent p-5 text-sm leading-[1.75] text-slate-300 outline-none placeholder:text-slate-700 focus:ring-0 font-mono"
          placeholder={
            'Paste the Job Description here...\n\nInclude role title, responsibilities, required skills, experience level, and any other relevant details.'
          }
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          spellCheck={false}
        />

        <div className="pointer-events-none absolute right-5 top-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.5)' }}>
          {characterCount > 0 ? `${characterCount} ký tự` : ''}
        </div>
      </div>
    </section>
  );
};

export default JDInput;
