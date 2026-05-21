import React from 'react';
import { FileText, UploadCloud } from 'lucide-react';

interface CVUploadMiniProps {
  cvFiles: File[];
}

const MAX_CV_PER_BATCH = 20;

const CVUploadMini: React.FC<CVUploadMiniProps> = ({ cvFiles }) => {
  const progressPercent = Math.min(100, Math.round((cvFiles.length / MAX_CV_PER_BATCH) * 100));

  return (
    <div
      className="relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-none border border-white/[0.08] bg-black text-slate-100 shadow-none"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.96) 58%, rgba(0,0,0,1) 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(245,214,187,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/[0.08]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/[0.06]" />

      <div className="shrink-0 border-b border-white/[0.08] px-4 py-4 md:px-5 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="supporthr-mono mb-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#f5d6bb]/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5d6bb]/45" />
              CV Upload
            </div>

            <div className="inline-flex h-12 w-12 items-center justify-center rounded-none border border-white/[0.12] bg-white/[0.035] text-[#f5d6bb]/65 shadow-none">
              <UploadCloud className="h-5 w-5" />
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight text-white">CV đã nạp</h2>
            <p className="mt-1 max-w-[15rem] text-[11px] leading-5 text-slate-300/75">
              Chỉ hiển thị tên file và số lượng hiện có.
            </p>
          </div>

          <div className="supporthr-mono relative grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center overflow-hidden rounded-none border border-white/[0.14] bg-white/[0.035] text-center shadow-none">
            <div className="pointer-events-none absolute inset-0 bg-white/[0.025]" />
            <div className="relative">
              <div className="text-base font-black leading-none text-white">
                {cvFiles.length}/{MAX_CV_PER_BATCH}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]/55">CV</div>
            </div>
            <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-none bg-black/45">
              <div
                className="h-full rounded-none bg-[#f5d6bb]/45 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
          <div className="supporthr-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#f5d6bb]/60">
            Danh sách CV
          </div>
          <div className="supporthr-mono rounded-none border border-white/[0.12] bg-white/[0.025] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-slate-300">
            {cvFiles.length} files
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 md:px-4">
          {cvFiles.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-none border border-dashed border-white/[0.08] bg-white/[0.015] px-6 text-center shadow-none">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-none border border-white/[0.10] bg-black/45">
                <UploadCloud className="h-6 w-6 text-[#f5d6bb]/45" />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-tight text-slate-200">Chưa có CV nào</p>
              <p className="mt-2 max-w-[220px] text-xs leading-6 text-slate-400">
                Tải CV từ bước trước để quản lý danh sách ứng viên tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cvFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-none border border-white/[0.10] bg-white/[0.025] px-3.5 py-3.5 shadow-none transition-colors duration-150 hover:border-white/[0.18] hover:bg-white/[0.04]"
                >
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-px rounded-none bg-[#f5d6bb]/35 transition-colors group-hover:bg-[#f5d6bb]/45" />
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-white/[0.12] bg-black/45 text-[#f5d6bb]/58 shadow-none">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.92rem] font-semibold tracking-tight text-slate-50">{file.name}</p>
                    <p className="supporthr-mono mt-1 text-[9px] uppercase tracking-[0.14em] text-[#f5d6bb]/45">CV file</p>
                  </div>
                  <span className="supporthr-mono inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-white/[0.10] bg-black/50 text-[9px] uppercase tracking-[0.08em] text-[#f5d6bb]/60">
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
