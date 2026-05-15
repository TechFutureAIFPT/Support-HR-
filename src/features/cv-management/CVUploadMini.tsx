import React from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CVUploadMiniProps {
  cvFiles: File[];
}

const MAX_CV_PER_BATCH = 20;

const CVUploadMini: React.FC<CVUploadMiniProps> = ({ cvFiles }) => {
  const tc = useThemeColors();

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border text-slate-100 shadow-[0_24px_64px_rgba(2,8,23,0.22)]"
      style={{ background: tc.modalBg, border: tc.borderCard }}
    >
      <div className="shrink-0 border-b px-5 py-4" style={{ borderColor: 'rgba(99,102,241,0.18)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="supporthr-mono mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              CV Upload
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-bold tracking-tight text-white">CV đã nạp</h2>
            <p className="mt-1 text-[10px] text-slate-500">Chỉ hiển thị tên file và số lượng hiện có.</p>
          </div>

          <div
            className="supporthr-mono rounded-full px-3 py-2 text-right"
            style={{ background: tc.cardBg2, border: tc.borderCard }}
          >
            <div className="text-sm font-semibold text-white">{cvFiles.length}/{MAX_CV_PER_BATCH}</div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400">CV</div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="px-5 py-4">
          <div className="supporthr-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Danh sách CV</div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {cvFiles.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] px-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <UploadCloud className="h-6 w-6 text-slate-500" />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-tight text-slate-200">Chưa có CV nào</p>
              <p className="mt-2 max-w-[220px] text-xs leading-6 text-slate-500">
                Tải CV từ bước trước để quản lý danh sách ứng viên tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cvFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
                >
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-white/[0.04] text-slate-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                  </div>
                  <span className="supporthr-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
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
