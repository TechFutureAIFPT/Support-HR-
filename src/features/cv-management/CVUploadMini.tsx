import React from 'react';
import { FileText, UploadCloud } from 'lucide-react';

interface CVUploadMiniProps {
  cvFiles: File[];
}

const MAX_CV_PER_BATCH = 20;

const CVUploadMini: React.FC<CVUploadMiniProps> = ({ cvFiles }) => {
  const progressPercent = Math.min(100, Math.round((cvFiles.length / MAX_CV_PER_BATCH) * 100));

  return (
    <div className="relative isolate flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f9ff] p-3 text-slate-900">
      <div className="rounded-[1.35rem] border border-blue-100 bg-white p-4 shadow-[0_18px_48px_rgba(30,64,175,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="supporthr-mono mb-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Tải CV
            </div>

            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <UploadCloud className="h-5 w-5" />
            </div>

            <h2 className="mt-3 text-lg font-black tracking-tight text-slate-900">CV đã nạp</h2>
            <p className="mt-1 max-w-[15rem] text-[11px] leading-5 text-slate-500">
              Theo dõi số lượng file đang chờ AI phân tích trong phiên hiện tại.
            </p>
          </div>

          <div className="supporthr-mono relative grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center overflow-hidden rounded-2xl border border-blue-100 bg-[#f6f9ff] text-center">
            <div className="relative">
              <div className="text-base font-black leading-none text-slate-900">
                {cvFiles.length}/{MAX_CV_PER_BATCH}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-blue-500">CV</div>
            </div>
            <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.35rem] border border-blue-100 bg-white shadow-[0_18px_48px_rgba(30,64,175,0.08)]">
        <div className="flex items-center justify-between gap-3 border-b border-blue-50 px-4 py-3 md:px-5 md:py-4">
          <div className="supporthr-mono text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
            Danh sách CV
          </div>
          <div className="supporthr-mono rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-blue-700">
            {cvFiles.length} tệp
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3 md:px-4">
          {cvFiles.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-100 bg-[#f6f9ff] px-6 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-500">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-tight text-slate-800">Chưa có CV nào</p>
              <p className="mt-2 max-w-[220px] text-xs leading-6 text-slate-500">
                Tải CV từ màn hình chào mừng để quản lý danh sách ứng viên tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cvFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-blue-100 bg-white px-3.5 py-3.5 shadow-sm transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-blue-400 transition-colors group-hover:bg-emerald-400" />
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.92rem] font-semibold tracking-tight text-slate-900">{file.name}</p>
                    <p className="supporthr-mono mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-400">Tệp CV</p>
                  </div>
                  <span className="supporthr-mono inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#f6f9ff] text-[9px] uppercase tracking-[0.08em] text-blue-600">
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
