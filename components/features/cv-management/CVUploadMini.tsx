import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, X, HardDrive } from 'lucide-react';
import { googleDriveService } from '../../../services/file-processing/googleDriveService';

interface CVUploadMiniProps {
  cvFiles: File[];
  setCvFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const MAX_CV_PER_BATCH = 20;

const CVUploadMini: React.FC<CVUploadMiniProps> = ({ cvFiles, setCvFiles }) => {
  const [error, setError] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      setCvFiles((prev: File[]) => {
        const existingMap = new Map(prev.map((f: File) => [`${f.name}-${f.size}`, true]));
        const uniqueNewFiles = newFiles.filter((f: File) => !existingMap.has(`${f.name}-${f.size}`));

        if (uniqueNewFiles.length === 0) return prev;

        const totalFiles = prev.length + uniqueNewFiles.length;

        if (totalFiles > MAX_CV_PER_BATCH) {
          setError(`Chỉ được phép tải lên tối đa ${MAX_CV_PER_BATCH} CV.`);
          return prev;
        }

        setError('');
        return [...prev, ...uniqueNewFiles];
      });

      e.target.value = '';
    }
  };

  const handleGoogleDriveSelect = async () => {
    try {
      setError('');
      setIsLoadingDrive(true);
      const token = await googleDriveService.authenticate();
      const driveFiles = await googleDriveService.openPicker({
        mimeTypes: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg',
        multiSelect: true
      });

      if (driveFiles.length > 0) {
        const newFiles: File[] = [];
        for (const dFile of driveFiles) {
            try {
                const blob = await googleDriveService.downloadFile(dFile.id, token);
                const file = new File([blob], dFile.name, { type: dFile.mimeType });
                newFiles.push(file);
            } catch (err) {
                console.error(`Failed to download ${dFile.name}`, err);
            }
        }

        if (newFiles.length > 0) {
             setCvFiles((prev: File[]) => {
                const existingMap = new Map(prev.map(f => [`${f.name}-${f.size}`, true]));
                const uniqueNewFiles = newFiles.filter(f => !existingMap.has(`${f.name}-${f.size}`));

                if (uniqueNewFiles.length === 0) return prev;

                const totalFiles = prev.length + uniqueNewFiles.length;
                if (totalFiles > MAX_CV_PER_BATCH) {
                  setError(`Chỉ được phép tải lên tối đa ${MAX_CV_PER_BATCH} CV.`);
                  return prev;
                }

                return [...prev, ...uniqueNewFiles];
              });
        }
      }
    } catch (err: any) {
      console.error("Google Drive Error:", err);
      if (err.message && (err.message.includes('Client ID') || err.message.includes('API Key'))) {
         setError('Chưa cấu hình Google Drive API.');
      } else {
         setError('Lỗi kết nối Google Drive.');
      }
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleRemoveFile = useCallback((index: number) => {
    setCvFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, [setCvFiles]);

  return (
    <div className="flex flex-col h-full bg-[#0B192C]">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-slate-800/60 bg-[#11213A]/50">
        <h2 className="text-sm font-bold text-white mb-1">Tải CV ứng viên</h2>
        <p className="text-[10px] text-slate-400">PDF, DOCX, PNG, JPG (Tối đa {MAX_CV_PER_BATCH})</p>
      </div>

      {/* Upload Zone */}
      <div className="shrink-0 p-4 border-b border-slate-800/40">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-lg border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
              <HardDrive className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Từ máy tính</span>
          </button>
          
          <button
            onClick={handleGoogleDriveSelect}
            disabled={isLoadingDrive}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-lg border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
              {isLoadingDrive ? (
                 <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              ) : (
                 <UploadCloud className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Google Drive</span>
          </button>
        </div>
        
        <input type="file" multiple accept=".pdf,.docx,.png,.jpg,.jpeg" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        
        {error && (
          <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#0B192C]">
        <div className="px-4 py-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Danh sách ({cvFiles.length})
          </span>
          {cvFiles.length > 0 && (
            <button onClick={() => setCvFiles([])} className="text-[10px] text-red-400 hover:text-red-300">
              Xóa tất cả
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {cvFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
               <UploadCloud className="w-10 h-10 mb-2 text-slate-500" />
               <p className="text-xs text-slate-400">Chưa có CV nào</p>
            </div>
          ) : (
            cvFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 group transition-all">
                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-slate-400">{file.name.split('.').pop()?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{file.name}</p>
                  <p className="text-[9px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CVUploadMini;
