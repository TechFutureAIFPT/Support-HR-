import React, { useState } from 'react';

interface AIFeedbackFormProps {
  candidateId: string;
  candidateName: string;
  aiScore: number;
  onSubmit: (feedback: any) => void;
  onCancel: () => void;
}

const FEEDBACK_CRITERIA = [
  'Kỹ năng chuyên môn (AI chấm quá cao/thấp)',
  'Kinh nghiệm làm việc (Chưa sát thực tế)',
  'Dự án thực tế (Thiếu link/mô tả chưa sâu)',
  'Kỹ năng mềm/Bằng cấp'
];

const AIFeedbackForm: React.FC<AIFeedbackFormProps> = ({ candidateId, candidateName, aiScore, onSubmit, onCancel }) => {
  const [actualScore, setActualScore] = useState<number>(aiScore);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [reason, setReason] = useState<string>('');
  const [decision, setDecision] = useState<'PASS' | 'REJECT' | null>(null);

  const handleCriteriaChange = (criterion: string) => {
    setSelectedCriteria(prev => 
      prev.includes(criterion) 
        ? prev.filter(c => c !== criterion)
        : [...prev, criterion]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
        alert("Vui lòng chọn trạng thái quyết định!");
        return;
    }
    
    const feedback = {
      candidateId,
      actualScore,
      scoreDifference: actualScore - aiScore,
      selectedCriteria,
      reason,
      decision,
      timestamp: Date.now()
    };
    
    onSubmit(feedback);
  };

  return (
    <div className="mt-4 border border-slate-800/60 bg-[#11213A] p-6">
      <div className="mb-5 flex items-center gap-2 border-b border-slate-800/60 pb-4">
        <div className="flex h-6 w-6 items-center justify-center bg-rose-500/10 border border-rose-500/20">
          <i className="fa-solid fa-brain text-xs text-rose-400"></i>
        </div>
        <h4 className="text-sm font-bold text-slate-200">Phản hồi & Huấn luyện AI</h4>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Slider cho điểm thực tế */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-400">1. Điều chỉnh điểm thực tế</label>
            <div className="text-[10px] text-neutral-500">
              Độ lệch: 
              <span className={`ml-1 font-semibold ${actualScore - aiScore > 0 ? "text-emerald-400" : actualScore - aiScore < 0 ? "text-rose-400" : "text-neutral-400"}`}>
                {actualScore - aiScore > 0 ? "+" : ""}{actualScore - aiScore}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 border border-slate-800/60 bg-slate-900/30 p-3">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={actualScore} 
              onChange={(e) => setActualScore(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <div className="shrink-0 text-right w-12">
              <span className="text-lg font-bold text-slate-200">{actualScore}</span>
            </div>
          </div>
        </div>

        {/* Checkbox tiêu chí sai */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400">2. Lý do lệch điểm</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {FEEDBACK_CRITERIA.map(criterion => (
              <label key={criterion} className="flex cursor-pointer items-start gap-2.5 border border-slate-800/60 bg-slate-900/30 p-3 transition hover:bg-slate-800/50">
                <input 
                  type="checkbox" 
                  className="mt-0.5 rounded-none border-slate-700 bg-transparent accent-rose-500 text-rose-500 focus:ring-rose-500/20"
                  checked={selectedCriteria.includes(criterion)}
                  onChange={() => handleCriteriaChange(criterion)}
                />
                <span className="text-xs text-neutral-300 leading-snug">{criterion}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Text Area cho lý do */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400">3. Chi tiết (Tùy chọn)</label>
          <textarea 
            className="w-full border border-slate-800/60 bg-slate-900/30 p-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-rose-500/40 focus:bg-[#11213A] focus:ring-1 focus:ring-rose-500/40 resize-y"
            rows={3}
            placeholder="Ghi chú chi tiết để AI có thể học hỏi..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Quyết định */}
        <div className="space-y-3 pt-4 border-t border-slate-800/60">
             <label className="text-xs font-medium text-neutral-400">4. Chốt kết quả</label>
             <div className="flex gap-3">
                 <button
                    type="button"
                    onClick={() => setDecision('PASS')}
                    className={`flex-1 py-2.5 text-xs font-bold transition-all border ${
                        decision === 'PASS' 
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' 
                          : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                 >
                     Pass phỏng vấn
                 </button>
                 <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    className={`flex-1 py-2.5 text-xs font-bold transition-all border ${
                        decision === 'REJECT' 
                          ? 'bg-rose-600 border-rose-500 text-white shadow-sm' 
                          : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                 >
                     Loại
                 </button>
             </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
            <button 
                type="button" 
                onClick={onCancel}
                className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50"
            >
                Hủy
            </button>
            <button 
                type="submit"
                className="bg-rose-600 border border-rose-500 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!decision && !reason.trim()}
            >
                Gửi phản hồi
            </button>
        </div>
      </form>
    </div>
  );
};

export default AIFeedbackForm;

