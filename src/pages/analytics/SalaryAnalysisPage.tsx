import React, { useState } from 'react';
import SalaryAnalysisPanel from '@/features/analysis/SalaryAnalysisPanel';
import type { Candidate } from '@/types';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

interface SalaryAnalysisPageProps {
  candidates?: Candidate[];
  jdText?: string;
}

const SalaryAnalysisPage: React.FC<SalaryAnalysisPageProps> = ({ candidates, jdText }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | undefined>(
    candidates && candidates.length > 0 ? candidates[0] : undefined
  );
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResults(prev => [...prev, result]);
  };

  return (
    <div className="feature-page-shell space-y-5">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-emerald-500 text-sm"></i>
            </div>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-medium">Salary Insights</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Phân tích mức lương</h1>
          <p className="text-xs text-slate-500 mt-0.5">So sánh mức lương ứng viên với thị trường Việt Nam</p>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Candidate Selection ─────────────────────────────── */}
        {candidates && candidates.length > 0 && (
          <div className="lg:col-span-1 bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-[0_18px_48px_rgba(37,99,235,0.10)]">
            <div className="px-4 py-3.5 border-b border-blue-100 bg-blue-50/70">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-users text-cyan-500 text-xs"></i>
                Chọn ứng viên
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">{candidates.length} ứng viên có sẵn</p>
            </div>
            <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {candidates.map((candidate) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 shadow-lg shadow-blue-500/10'
                        : 'bg-white border border-blue-100 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{normalizeVietnameseDisplay(candidate.candidateName)}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{normalizeVietnameseDisplay(candidate.jobTitle) || 'Chưa rõ chức danh'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            candidate.analysis?.['Hạng'] === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            candidate.analysis?.['Hạng'] === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {candidate.analysis?.['Hạng'] || '—'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Điểm: <span className="font-bold text-slate-700">{candidate.analysis?.['Tổng điểm'] || 0}</span>
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-check text-[9px] text-blue-600"></i>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Salary Analysis Panel ───────────────────────────── */}
        <div className={candidates && candidates.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <SalaryAnalysisPanel
            candidate={selectedCandidate}
            jdText={jdText}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>

      {/* ── Analysis History ────────────────────────────────────── */}
      {analysisResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-[0_18px_48px_rgba(37,99,235,0.10)]">
          <div className="px-4 py-3.5 border-b border-blue-100 bg-blue-50/70">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-amber-500 text-xs"></i>
              Lịch sử phân tích
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {analysisResults.map((result, index) => (
              <div key={index} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{result.summary}</p>
                  {result.marketSalary && (
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-slate-500">
                        Median: <span className="font-bold text-slate-700">{(result.marketSalary.median / 1_000_000).toFixed(1)} tr VNĐ</span>
                      </span>
                      {result.comparison && (
                        <span className={`text-xs font-semibold ${
                          result.comparison.marketPosition === 'below' ? 'text-amber-400' :
                          result.comparison.marketPosition === 'reasonable' ? 'text-emerald-400' :
                          'text-blue-400'
                        }`}>
                          {result.comparison.marketPosition === 'below' ? '↓ Dưới thị trường' :
                           result.comparison.marketPosition === 'reasonable' ? '✓ Hợp lý' :
                           '↑ Trên thị trường'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 flex-shrink-0 mt-1">
                  {new Date().toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Usage Guide ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-[0_18px_48px_rgba(37,99,235,0.10)]">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-cyan-500 text-xs"></i>
          Hướng dẫn sử dụng
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: 'fa-mouse-pointer', label: 'Tự động', desc: 'Chọn ứng viên từ danh sách bên trái' },
            { icon: 'fa-keyboard', label: 'Thủ công', desc: 'Nhập thông tin trực tiếp vào form' },
            { icon: 'fa-cloud', label: 'API', desc: 'Dữ liệu từ job-salary-data API' },
            { icon: 'fa-brain', label: 'Fallback', desc: 'Ước tính thông minh khi API không khả dụng' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${item.icon} text-cyan-500 text-xs`}></i>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{item.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalaryAnalysisPage;
