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
  background: '#ffffff',
  border: '1px solid rgba(55,125,255,0.16)',
  boxShadow: '0 8px 22px rgba(30,64,175,0.06)',
  '--tw-ring-color': 'rgba(35,136,255,0.45)',
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
        className="module-pane active custom-scrollbar flex h-full min-h-0 w-full flex-1 flex-col border-0 bg-white"
        aria-labelledby="jd-title"
      >
        <div className="shrink-0 border-b border-blue-100 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                Nội dung JD
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-blue-50 hover:text-blue-700">
                Tiêu chí
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-blue-50 hover:text-blue-700">
                Ghi chú AI
              </button>
            </div>
            <div className="supporthr-mono rounded-lg border border-blue-100 bg-[#f6f9ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {characterCount > 0 ? `${characterCount} ký tự` : 'Chưa nhập'}
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto border-t border-blue-50 px-5 py-2">
            {[
              'fa-bold',
              'fa-italic',
              'fa-list-ul',
              'fa-list-ol',
              'fa-align-left',
              'fa-link',
              'fa-wand-magic-sparkles',
            ].map((icon) => (
              <button
                key={icon}
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <i className={`fa-solid ${icon} text-xs`} />
              </button>
            ))}
            <span className="mx-2 h-5 w-px shrink-0 bg-blue-100" />
            <button
              type="button"
              onClick={onBackToWelcome}
              className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <i className="fa-solid fa-file-arrow-up text-xs" />
              Tải lại JD
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={!isCompleteEnabled}
              className="ml-auto inline-flex h-8 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-[0_10px_24px_rgba(35,136,255,0.18)] transition hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              Tiếp theo
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-white">
          <textarea
            className="custom-scrollbar min-h-0 h-full w-full resize-none border-none bg-white px-7 py-6 text-[14px] leading-[1.85] text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 font-mono"
            rows={12}
            style={{ background: '#ffffff' }}
            placeholder={
              'Nhập nội dung phiếu tuyển dụng / mô tả công việc tại đây...\n\nNên bao gồm: vị trí, trách nhiệm, kỹ năng bắt buộc, kinh nghiệm, địa điểm và các điều kiện ưu tiên.'
            }
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            spellCheck={false}
          />
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
        style={{ borderBottom: '1px solid rgba(55,125,255,0.12)', background: 'rgba(247,251,255,0.92)' }}
      >
        <div
          className="group flex min-w-[150px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-solid fa-briefcase text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Vị trí công việc..."
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#102033' }}
          />
        </div>

        <div
          className="group flex min-w-[130px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-regular fa-building text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Công ty..."
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#102033' }}
          />
        </div>

        <div
          className="group flex min-w-[130px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-solid fa-layer-group text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Ngành nghề..."
            value={hardFilters.industry}
            onChange={(e) =>
              setHardFilters((prev) => ({
                ...prev,
                industry: e.target.value,
                industryManual: 'manual',
              }))
            }
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#102033' }}
          />
        </div>

        <div
          className="group flex min-w-[120px] flex-1 items-center px-3 py-2 transition-all focus-within:ring-1"
          style={toolbarFieldStyle}
        >
          <i className="fa-solid fa-money-bill text-xs transition-colors group-focus-within:text-purple-400" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Mức lương..."
            value={hardFilters.salaryMin}
            onChange={(e) => setHardFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
            className="ml-2 w-full border-none bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-600"
            style={{ color: '#102033' }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pl-1">
          {onBackToWelcome && (
            <button
              onClick={onBackToWelcome}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-600"
              title="Quay lại tải file"
            >
              <i className="fa-solid fa-file-arrow-up text-xs" />
            </button>
          )}

          <button
            onClick={onComplete}
            disabled={!isCompleteEnabled}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30"
            style={isCompleteEnabled ? { background: 'rgba(35,136,255,0.12)', color: '#0875ee' } : {}}
            title="Kế tiếp"
          >
            <i className="fa-solid fa-arrow-right text-xs" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <textarea
          className="custom-scrollbar min-h-0 w-full flex-1 resize-none border-none bg-white p-5 text-sm leading-[1.75] text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 font-mono"
          placeholder={
            'Dán nội dung mô tả công việc tại đây...\n\nNên có: vị trí, trách nhiệm, kỹ năng bắt buộc, kinh nghiệm, địa điểm và các điều kiện ưu tiên.'
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
