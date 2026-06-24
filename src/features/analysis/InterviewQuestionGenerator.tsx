import React, { useState, useMemo } from 'react';
import type { AnalysisRunData, Candidate } from '@/types';
import { generateInterviewQuestions } from '@/services/screening/frontendInterviewQuestions';

interface InterviewQuestionGeneratorProps {
  analysisData: AnalysisRunData;
  selectedCandidates?: Candidate[];
  onClose?: () => void;
}

interface QuestionSet {
  category: string;
  icon: string;
  color: string;
  questions: string[];
}

const InterviewQuestionGenerator: React.FC<InterviewQuestionGeneratorProps> = ({
  analysisData,
  selectedCandidates = [],
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedType, setSelectedType] = useState<'general' | 'specific' | 'comparative'>('general');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  // Lấy thông tin tổng hợp từ dữ liệu phân tích
  const analysisStats = useMemo(() => {
    const candidates = analysisData.candidates.filter(c => c.status === 'SUCCESS');
    const industries = [...new Set(candidates.map(c => c.industry).filter(Boolean))];
    const levels = [...new Set(candidates.map(c => c.experienceLevel).filter(Boolean))];
    const topCandidates = candidates
      .filter(c => c.analysis?.['Hạng'] === 'A')
      .slice(0, 5);

    // Tìm điểm yếu phổ biến
    const commonWeaknesses = new Map<string, number>();
    candidates.forEach(c => {
      c.analysis?.['Điểm yếu CV']?.forEach(weakness => {
        commonWeaknesses.set(weakness, (commonWeaknesses.get(weakness) || 0) + 1);
      });
    });

    // Tìm kỹ năng thiếu phổ biến từ Chi tiết điểm
    const skillGaps = new Map<string, number>();
    candidates.forEach(c => {
      c.analysis?.['Chi tiết']?.forEach(detail => {
        const score = parseFloat(detail['Điểm'].split('/')[0]);
        const maxScore = parseFloat(detail['Điểm'].split('/')[1]);
        const percentage = (score / maxScore) * 100;
        
        if (percentage < 50) { // Điểm yếu nếu dưới 50%
          skillGaps.set(detail['Tiêu chí'], (skillGaps.get(detail['Tiêu chí']) || 0) + 1);
        }
      });
    });

    return {
      jobPosition: analysisData.job.position,
      totalCandidates: candidates.length,
      industries: industries.slice(0, 3), // Top 3 ngành
      levels: levels.slice(0, 3), // Top 3 level
      topCandidates,
      commonWeaknesses: Array.from(commonWeaknesses.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([weakness]) => weakness),
      skillGaps: Array.from(skillGaps.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill]) => skill)
    };
  }, [analysisData]);

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      let candidateData: Candidate | Candidate[] | undefined = undefined;
      
      if (selectedType === 'specific' && selectedCandidate) {
        candidateData = analysisData.candidates.find(c => c.id === selectedCandidate);
      } else if (selectedType === 'comparative' && selectedCandidates.length > 0) {
        candidateData = selectedCandidates;
      }

      const questions = await generateInterviewQuestions(
        analysisData,
        analysisStats,
        selectedType,
        candidateData
      );

      setQuestionSets(questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback questions nếu AI không khả dụng
      setQuestionSets(getFallbackQuestions());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackQuestions = (): QuestionSet[] => {
    const { jobPosition, industries, commonWeaknesses } = analysisStats;
    
    return [
      {
        category: 'Câu hỏi chung về vị trí',
        icon: 'fa-solid fa-briefcase',
        color: 'text-blue-400',
        questions: [
          `Bạn hiểu như thế nào về vai trò ${jobPosition} trong tổ chức?`,
          `Những thách thức lớn nhất mà một ${jobPosition} thường gặp phải là gì?`,
          `Bạn có kinh nghiệm gì liên quan đến ${jobPosition}?`,
          'Tại sao bạn quan tâm đến vị trí này?',
          'Điều gì làm bạn khác biệt so với các ứng viên khác?'
        ]
      },
      {
        category: 'Câu hỏi kỹ thuật theo ngành',
        icon: 'fa-solid fa-cogs',
        color: 'text-green-400',
        questions: industries.length > 0 ? [
          `Trong ngành ${industries[0]}, xu hướng nào đang ảnh hưởng lớn nhất?`,
          'Bạn đã từng giải quyết vấn đề phức tạp nào trong công việc?',
          'Mô tả một dự án thành công mà bạn đã tham gia.',
          'Bạn cập nhật kiến thức chuyên môn bằng cách nào?'
        ] : [
          'Mô tả kinh nghiệm làm việc ấn tượng nhất của bạn.',
          'Bạn xử lý áp lực công việc như thế nào?',
          'Kỹ năng nào bạn muốn phát triển thêm?'
        ]
      },
      {
        category: 'Câu hỏi về điểm yếu phổ biến',
        icon: 'fa-solid fa-exclamation-triangle',
        color: 'text-orange-400',
        questions: commonWeaknesses.length > 0 ? [
          `Nhiều ứng viên có vấn đề về "${commonWeaknesses[0]}". Bạn tự đánh giá thế nào?`,
          'Bạn đã khắc phục những thiếu sót trong CV như thế nào?',
          'Điểm yếu lớn nhất của bạn là gì và bạn cải thiện ra sao?'
        ] : [
          'Điểm yếu lớn nhất của bạn là gì?',
          'Bạn học hỏi từ thất bại như thế nào?',
          'Kỹ năng nào bạn cần cải thiện?'
        ]
      }
    ];
  };

  const candidateOptions = analysisData.candidates
    .filter(c => c.status === 'SUCCESS')
    .sort((a, b) => (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0));

  return (
    <div className="bg-white border border-blue-100 rounded-2xl shadow-[0_18px_48px_rgba(37,99,235,0.12)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <i className="fa-solid fa-question-circle text-blue-500"></i>
              Gợi ý Câu hỏi Phỏng vấn AI
            </h2>
            <p className="text-slate-600 mt-2">
              Tạo câu hỏi phỏng vấn thông minh dựa trên JD và dữ liệu lọc CV
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-blue-700 transition-colors p-2"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Thông tin tổng quan */}
        <div className="bg-blue-50/70 rounded-xl p-4 mb-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-cyan-400"></i>
            Tổng quan dữ liệu lọc CV
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <div className="text-slate-500">Vị trí tuyển dụng</div>
              <div className="text-slate-900 font-semibold">{analysisStats.jobPosition}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <div className="text-slate-500">Tổng ứng viên</div>
              <div className="text-slate-900 font-semibold">{analysisStats.totalCandidates}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <div className="text-slate-500">Ứng viên hạng A</div>
              <div className="text-slate-900 font-semibold">{analysisStats.topCandidates.length}</div>
            </div>
          </div>
          
          {analysisStats.industries.length > 0 && (
            <div className="mt-3">
              <div className="text-slate-500 text-sm">Ngành nghề chính:</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {analysisStats.industries.map((industry, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lựa chọn loại câu hỏi */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Chọn loại câu hỏi:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedType('general')}
              className={`p-4 rounded-xl border transition-all ${
                selectedType === 'general'
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <i className="fa-solid fa-users text-xl mb-2 block"></i>
              <div className="font-semibold">Câu hỏi chung</div>
              <div className="text-sm opacity-80">Dựa trên JD và xu hướng chung</div>
            </button>

            <button
              onClick={() => setSelectedType('specific')}
              className={`p-4 rounded-xl border transition-all ${
                selectedType === 'specific'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <i className="fa-solid fa-user text-xl mb-2 block"></i>
              <div className="font-semibold">Câu hỏi cụ thể</div>
              <div className="text-sm opacity-80">Dành cho 1 ứng viên cụ thể</div>
            </button>

            <button
              onClick={() => setSelectedType('comparative')}
              className={`p-4 rounded-xl border transition-all ${
                selectedType === 'comparative'
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <i className="fa-solid fa-balance-scale text-xl mb-2 block"></i>
              <div className="font-semibold">So sánh ứng viên</div>
              <div className="text-sm opacity-80">Câu hỏi để so sánh nhiều ứng viên</div>
            </button>
          </div>
        </div>

        {/* Chọn ứng viên cụ thể */}
        {selectedType === 'specific' && (
          <div className="mb-6">
            <label className="block text-slate-900 font-semibold mb-2">Chọn ứng viên:</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-slate-900 focus:border-blue-400 focus:outline-none"
            >
              <option value="">-- Chọn ứng viên --</option>
              {candidateOptions.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.candidateName} - Hạng {candidate.analysis?.['Hạng']} ({candidate.analysis?.['Tổng điểm']} điểm)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Thông tin ứng viên được chọn */}
        {selectedType === 'comparative' && selectedCandidates.length > 0 && (
          <div className="mb-6 bg-orange-50 rounded-xl p-4 border border-orange-100">
            <h4 className="text-slate-900 font-semibold mb-2">Ứng viên được chọn để so sánh:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCandidates.map(candidate => (
                <span key={candidate.id} className="bg-white text-orange-700 px-3 py-1 rounded-full text-sm border border-orange-200">
                  {candidate.candidateName} (Hạng {candidate.analysis?.['Hạng']})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Button tạo câu hỏi */}
        <div className="text-center mb-6">
          <button
            onClick={generateQuestions}
            disabled={isLoading || (selectedType === 'specific' && !selectedCandidate)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-300 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Đang tạo câu hỏi...
              </>
            ) : (
              <>
                <i className="fa-solid fa-magic mr-2"></i>
                Tạo câu hỏi phỏng vấn
              </>
            )}
          </button>
        </div>

        {/* Kết quả câu hỏi */}
        {questionSets.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-emerald-500"></i>
              Câu hỏi phỏng vấn được đề xuất
            </h3>
            
            {questionSets.map((set, index) => (
              <div key={index} className="bg-white rounded-xl border border-blue-100 shadow-sm">
                <div className="p-4 border-b border-blue-100">
                  <h4 className={`text-lg font-semibold ${set.color} flex items-center gap-2`}>
                    <i className={set.icon}></i>
                    {set.category}
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {set.questions.map((question, qIndex) => (
                      <div key={qIndex} className="flex items-start gap-3 p-3 bg-blue-50/60 rounded-xl hover:bg-blue-50 transition-colors border border-blue-100">
                        <div className={`w-6 h-6 rounded-full ${set.color.replace('text-', 'bg-').replace('400', '500')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                          {qIndex + 1}
                        </div>
                        <p className="text-slate-700 leading-relaxed">{question}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(question)}
                          className="text-slate-400 hover:text-blue-700 transition-colors p-1 flex-shrink-0"
                          title="Copy câu hỏi"
                        >
                          <i className="fa-solid fa-copy"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Copy all button */}
            <div className="text-center">
              <button
                onClick={() => {
                  const allQuestions = questionSets.map(set => 
                    `${set.category}:\n${set.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
                  ).join('\n\n');
                  navigator.clipboard.writeText(allQuestions);
                }}
                className="bg-white hover:bg-blue-50 text-blue-700 px-6 py-2 rounded-xl transition-colors border border-blue-200"
              >
                <i className="fa-solid fa-copy mr-2"></i>
                Copy tất cả câu hỏi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewQuestionGenerator;
