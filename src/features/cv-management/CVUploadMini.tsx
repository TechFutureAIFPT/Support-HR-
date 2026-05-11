import React from 'react';
import { FileText, UploadCloud } from 'lucide-react';

interface CVUploadMiniProps {
  cvFiles: File[];
}

const MAX_CV_PER_BATCH = 20;

const CVUploadMini: React.FC<CVUploadMiniProps> = ({ cvFiles }) => {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0B192C] text-slate-100">
      <div className="shrink-0 border-b border-slate-800 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-white">CV đã nạp</h2>
            <p className="mt-1 text-[11px] text-slate-400">Chỉ hiển thị tên file.</p>
          </div>

          <div className="border border-slate-800 bg-[#11213A]/50 px-3 py-2 text-right">
            <div className="text-sm font-semibold text-white">{cvFiles.length}/{MAX_CV_PER_BATCH}</div>
            <div className="text-[11px] text-slate-400">CV</div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Danh sách CV</div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {cvFiles.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center border border-dashed border-slate-800 bg-[#11213A]/20 px-6 text-center">
              <UploadCloud className="h-11 w-11 text-slate-500" />
              <p className="mt-4 text-xs font-medium text-slate-400">Chưa có CV nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cvFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 border border-slate-800 bg-[#11213A]/30 px-4 py-3"
                >
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-slate-700 bg-white/[0.04] text-slate-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                  </div>
                  <span className="text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
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
