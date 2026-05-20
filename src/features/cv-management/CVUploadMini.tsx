import React from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CVUploadMiniProps {
  cvFiles: File[];
}

const MAX_CV_PER_BATCH = 20;

const CVUploadMini: React.FC<CVUploadMiniProps> = ({ cvFiles }) => {
  const tc = useThemeColors();
  const progressPercent = Math.min(100, Math.round((cvFiles.length / MAX_CV_PER_BATCH) * 100));

  return (
    <div
      className="relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border text-slate-100 shadow-[0_28px_90px_rgba(2,8,23,0.34)]"
      style={{
        background:
          'linear-gradient(155deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.96) 52%, rgba(3,7,18,0.98) 100%)',
        border: tc.borderCard,
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(99,102,241,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <div className="shrink-0 border-b px-4 py-4 md:px-5 md:py-5" style={{ borderColor: 'rgba(148,163,184,0.14)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="supporthr-mono mb-3 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
              CV Upload
            </div>

            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_32px_rgba(14,165,233,0.18)]">
              <UploadCloud className="h-5 w-5" />
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight text-white">CV đã nạp</h2>
            <p className="mt-1 max-w-[15rem] text-[11px] leading-5 text-slate-400">
              Chỉ hiển thị tên file và số lượng hiện có.
            </p>
          </div>

          <div
            className="supporthr-mono relative grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-200/20 bg-slate-950/80 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_36px_rgba(2,8,23,0.32)]"
            style={{ background: tc.cardBg2 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),transparent_55%)]" />
            <div className="relative">
              <div className="text-base font-bold leading-none text-white">
                {cvFiles.length}/{MAX_CV_PER_BATCH}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-cyan-100/70">CV</div>
            </div>
            <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-300 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
          <div className="supporthr-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Danh sách CV
          </div>
          <div className="supporthr-mono rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">
            {cvFiles.length} files
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 md:px-4">
          {cvFiles.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-200/[0.14] bg-white/[0.035] px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-slate-950/55">
                <UploadCloud className="h-6 w-6 text-slate-500" />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-tight text-slate-200">Chưa có CV nào</p>
              <p className="mt-2 max-w-[220px] text-xs leading-6 text-slate-500">
                Tải CV từ bước trước để quản lý danh sách ứng viên tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cvFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] px-3.5 py-3.5 shadow-[0_16px_34px_rgba(2,8,23,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200/20 hover:bg-white/[0.07]"
                >
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-300/70 to-indigo-400/30 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-950/55 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.92rem] font-semibold tracking-tight text-slate-50">{file.name}</p>
                    <p className="supporthr-mono mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">CV file</p>
                  </div>
                  <span className="supporthr-mono inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-slate-950/60 text-[9px] uppercase tracking-[0.08em] text-cyan-100/70">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVUploadMini;
