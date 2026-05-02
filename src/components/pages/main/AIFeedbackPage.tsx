import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Candidate, WeightCriteria, HardFilters } from '@/assets/types';
import AIFeedbackForm from '@/components/features/feedback/AIFeedbackForm';
import { Brain, User, AlertCircle, ArrowRight, FileText, CheckCircle2, BarChart3, Target, Briefcase, Layers, GraduationCap, Award, Languages } from 'lucide-react';

interface AIFeedbackPageProps {
  candidates: Candidate[];
  jobPosition?: string;
  weights?: WeightCriteria;
  hardFilters?: HardFilters;
}

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({ candidates, jobPosition, weights, hardFilters }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'summary' | 'feedback'>('summary');
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
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#0B192C] via-[#11213A] to-[#0B192C]">
        <div className="mb-6 flex h-24 w-24 items-center justify-center border border-slate-800/60 bg-[#11213A] shadow-2xl shadow-black/30 rounded-2xl">
          <Brain className="h-10 w-10 text-slate-600" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-md text-sm text-slate-400 leading-relaxed">
          Không tìm thấy ứng viên nào đã được phân tích. Hãy thực hiện quá trình phân tích CV ở các bước trước để xem tổng kết và đánh giá AI.
        </p>
      </div>
    );
  }

  // Calculate stats
  const avgScore = validCandidates.length > 0 
    ? validCandidates.reduce((acc, c) => acc + (c.analysis?.["Tổng điểm"] || 0), 0) / validCandidates.length 
    : 0;

  const topCandidatesCount = validCandidates.filter(c => (c.analysis?.["Tổng điểm"] || 0) >= 75).length;

  if (currentView === 'summary') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B192C]/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#11213A] to-[#0A1628] border border-slate-700/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Hoàn tất quy trình!</h1>
            <p className="text-sm text-slate-400 mb-8">
              Hệ thống đã ghi nhận danh sách ứng viên bạn chọn. Dưới đây là tóm tắt kết quả phân tích.
            </p>

            {/* Compact Stats */}
            <div className="flex items-center justify-center gap-6 mb-8 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">CV Phân Tích</p>
                <p className="text-xl font-bold text-white">{validCandidates.length}</p>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">Điểm TB</p>
                <p className="text-xl font-bold text-amber-400">{avgScore.toFixed(1)}</p>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">Hạng A</p>
                <p className="text-xl font-bold text-emerald-400">{topCandidatesCount}</p>
              </div>
            </div>

            {/* Compact Info */}
            <div className="text-left space-y-3 mb-8">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-sm text-slate-400">Vị trí ứng tuyển</span>
                <span className="text-sm font-semibold text-slate-200">{jobPosition || 'Không có dữ liệu'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-sm text-slate-400">Ngành nghề</span>
                <span className="text-sm font-semibold text-slate-200">{hardFilters?.industry || 'Không xác định'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-400">Trọng số chính</span>
                <span className="text-sm text-slate-300">
                  KN {weights?.workExperience?.children?.reduce((acc, c) => acc + c.weight, 0) || 0}% • 
                  KN {weights?.technicalSkills?.children?.reduce((acc, c) => acc + c.weight, 0) || 0}% • 
                  HV {weights?.education?.children?.reduce((acc, c) => acc + c.weight, 0) || 0}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setCurrentView('feedback')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                Đánh giá AI (Feedback)
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/analysis')}
                className="w-full py-3.5 px-6 font-semibold text-slate-400 bg-transparent rounded-xl hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                Đóng và xem danh sách
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Feedback View ---
  return (
    <div className="flex h-full flex-col lg:flex-row bg-[#0B192C] p-4 md:p-6 gap-4 md:gap-6 animate-in fade-in duration-300">
      {/* ── Sidebar Danh sách Ứng viên ── */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col bg-[#11213A] border border-slate-800/50 overflow-hidden shadow-xl shadow-black/20 rounded-xl">
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/40">
          <button 
            onClick={() => setCurrentView('summary')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Quay lại Tổng kết
          </button>
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
                  <span className={`text-xs font-bold px-2 py-0.5 border rounded ${
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
      <div className="flex-1 bg-[#11213A] border border-slate-800/50 overflow-y-auto custom-scrollbar shadow-xl shadow-black/20 rounded-xl">
        {selectedCandidate ? (
          <div className="h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800/50 bg-gradient-to-r from-[#11213A] to-slate-900/50 shrink-0">
              <h1 className="text-xl font-bold flex items-center gap-3 text-slate-100">
                Hiệu chỉnh AI cho ứng viên: 
                <span className="text-rose-400">{selectedCandidate.candidateName}</span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-500/70" />
                Dữ liệu bạn cung cấp tại biểu mẫu này sẽ được lưu vào hệ thống để cập nhật thuật toán.
              </p>
            </div>
            <div className="flex-1 p-4 md:p-6 pb-20 max-w-4xl mx-auto w-full">
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
                   navigate('/analysis');
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <User className="w-12 h-12 mb-3 text-slate-700" />
            <p>Hãy chọn một ứng viên từ danh sách bên trái.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFeedbackPage;

