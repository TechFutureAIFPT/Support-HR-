import React, { useState, useMemo } from 'react';
import type { Candidate } from '../../../assets/types';
import AIFeedbackForm from '../../features/feedback/AIFeedbackForm';
import { Brain, User, AlertCircle } from 'lucide-react';

interface AIFeedbackPageProps {
  candidates: Candidate[];
}

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({ candidates }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Filter only successfully analyzed candidates
  const validCandidates = useMemo(() => {
    return candidates.filter(c => c.status === 'SUCCESS' && c.analysis);
  }, [candidates]);

  const selectedCandidate = useMemo(() => {
    return validCandidates.find(c => c.id === selectedCandidateId) || null;
  }, [selectedCandidateId, validCandidates]);

  // Select first candidate by default if none selected
  React.useEffect(() => {
    if (validCandidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(validCandidates[0].id);
    }
  }, [validCandidates, selectedCandidateId]);

  if (validCandidates.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
        <Brain className="mb-4 h-16 w-16 text-slate-700" />
        <h2 className="mb-2 text-xl font-bold text-slate-300">Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-md">
          Không tìm thấy ứng viên nào đã được phân tích trong phiên này. Hãy upload và phân tích CV trước khi thực hiện tính năng Huấn luyện AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row bg-[#0B192C] p-4 md:p-6 gap-4 md:gap-6">
      {/* ── Sidebar Danh sách Ứng viên ── */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col bg-[#11213A] border border-slate-800/50 overflow-hidden shadow-xl shadow-black/20">
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/40">
          <h2 className="flex items-center gap-2 text-lg font-bold text-rose-300">
            <Brain className="h-5 w-5" />
            Danh sách ƯCV (Phiên hiện tại)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chọn ứng viên để tiến hành đánh giá độ chính xác của AI.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {validCandidates.map((candidate) => {
            const isSelected = candidate.id === selectedCandidateId;
            const score = candidate.analysis?.["Tổng điểm"] || 0;
            return (
              <button
                key={candidate.id}
                onClick={() => setSelectedCandidateId(candidate.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-800/40 border-l-2 transition-all duration-200 flex flex-col justify-center min-h-[72px] ${
                  isSelected 
                    ? 'bg-rose-500/5 border-l-rose-500' 
                    : 'bg-transparent border-l-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`font-semibold truncate pr-2 ${isSelected ? 'text-rose-300' : 'text-slate-200'}`}>
                    {candidate.candidateName}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 border ${
                    score >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    score >= 50 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                    'bg-red-500/15 text-red-500 border-red-500/30'
                  }`}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                  <User className="h-3 w-3" />
                  <span className="truncate">{candidate.jobTitle || 'Chưa rõ vị trí'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Khung Content ── */}
      <div className="flex-1 bg-[#11213A] border border-slate-800/50 overflow-y-auto custom-scrollbar shadow-xl shadow-black/20">
        {selectedCandidate ? (
          <div>
            <div className="px-6 py-5 border-b border-slate-800/50 bg-[#11213A]/50">
              <h1 className="text-xl font-bold flex items-center gap-3 text-slate-100">
                Hiệu chỉnh AI cho ứng viên: 
                <span className="text-rose-400">{selectedCandidate.candidateName}</span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-500/70" />
                Dữ liệu bạn cung cấp tại biểu mẫu này sẽ lưu vào hệ thống lịch sử và cập nhật thuật toán.
              </p>
            </div>
            <div className="p-4 md:p-6 pb-20 max-w-4xl mx-auto">
              {/* Form Feedback gọi từ feature */}
              <AIFeedbackForm 
                candidateId={selectedCandidate.id}
                candidateName={selectedCandidate.candidateName}
                aiScore={selectedCandidate.analysis?.["Tổng điểm"] || 0}
                onSubmit={(feedback) => {
                  console.log('Feedback submitted from AIFeedbackPage:', feedback);
                  alert('Cảm ơn bạn đã gửi phản hồi! Điểm số và nhận xét đã được cập nhật.');
                }}
                onCancel={() => {
                   console.log('Feedback cancelled from AIFeedbackPage');
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            Hãy chọn một ứng viên từ danh sách bên trái.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFeedbackPage;

