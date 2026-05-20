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
      className="relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-none border border-[#f5d6bb]/26 bg-black text-slate-100 shadow-[0_28px_100px_rgba(245,214,187,0.10)]"
      style={{
        background:
          'linear-gradient(155deg, rgba(245,214,187,0.18) 0%, rgba(245,214,187,0.075) 34%, rgba(0,0,0,0.98) 78%, rgba(0,0,0,1) 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(245,214,187,0.32),transparent_36%),radial-gradient(circle_at_92%_18%,rgba(255,216,168,0.26),transparent_34%),linear-gradient(180deg,rgba(245,214,187,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#f5d6bb]/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-[#f5d6bb]/70 via-[#f5d6bb]/20 to-transparent" />

      <div className="shrink-0 border-b border-[#f5d6bb]/18 px-4 py-4 md:px-5 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="supporthr-mono mb-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#f5d6bb]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5d6bb] shadow-[0_0_16px_rgba(245,214,187,0.9)]" />
              CV Upload
            </div>

            <div className="inline-flex h-12 w-12 items-center justify-center rounded-none border border-[#f5d6bb]/45 bg-[#f5d6bb]/16 text-[#f5d6bb] shadow-[0_0_34px_rgba(245,214,187,0.22)]">
              <UploadCloud className="h-5 w-5" />
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight text-white">CV đã nạp</h2>
            <p className="mt-1 max-w-[15rem] text-[11px] leading-5 text-[#f5d6bb]/68">
              Chỉ hiển thị tên file và số lượng hiện có.
            </p>
          </div>

          <div className="supporthr-mono relative grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center overflow-hidden rounded-none border border-[#f5d6bb]/42 bg-[#f5d6bb]/12 text-center shadow-[inset_0_1px_0_rgba(245,214,187,0.24),0_20px_42px_rgba(245,214,187,0.14)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(245,214,187,0.30),rgba(245,214,187,0.08)_52%,transparent_78%)]" />
            <div className="relative">
              <div className="text-base font-black leading-none text-white drop-shadow-[0_0_14px_rgba(245,214,187,0.34)]">
                {cvFiles.length}/{MAX_CV_PER_BATCH}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#f5d6bb]">CV</div>
            </div>
            <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-none bg-black/45">
              <div
                className="h-full rounded-none bg-gradient-to-r from-[#f5d6bb] via-[#ffd8a8] to-white shadow-[0_0_14px_rgba(245,214,187,0.65)] transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
          <div className="supporthr-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#f5d6bb]">
            Danh sách CV
          </div>
          <div className="supporthr-mono rounded-none border border-[#f5d6bb]/22 bg-[#f5d6bb]/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#f5d6bb]/78">
            {cvFiles.length} files
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 md:px-4">
          {cvFiles.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-none border border-dashed border-[#f5d6bb]/20 bg-[#f5d6bb]/[0.045] px-6 text-center shadow-[inset_0_1px_0_rgba(245,214,187,0.10)]">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-none border border-[#f5d6bb]/18 bg-black/55">
                <UploadCloud className="h-6 w-6 text-[#f5d6bb]/58" />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-tight text-slate-200">Chưa có CV nào</p>
              <p className="mt-2 max-w-[220px] text-xs leading-6 text-[#f5d6bb]/55">
                Tải CV từ bước trước để quản lý danh sách ứng viên tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cvFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-none border border-[#f5d6bb]/18 bg-[#f5d6bb]/[0.055] px-3.5 py-3.5 shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f5d6bb]/45 hover:bg-[#f5d6bb]/[0.095]"
                >
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-none bg-gradient-to-b from-[#f5d6bb] to-[#ffd8a8]/45 opacity-60 transition-opacity group-hover:opacity-100" />
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-[#f5d6bb]/22 bg-black/55 text-[#f5d6bb] shadow-[inset_0_1px_0_rgba(245,214,187,0.12)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.92rem] font-semibold tracking-tight text-slate-50">{file.name}</p>
                    <p className="supporthr-mono mt-1 text-[9px] uppercase tracking-[0.14em] text-[#f5d6bb]/58">CV file</p>
                  </div>
                  <span className="supporthr-mono inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-[#f5d6bb]/20 bg-black/62 text-[9px] uppercase tracking-[0.08em] text-[#f5d6bb]">
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
