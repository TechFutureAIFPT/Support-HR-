import React, { useState } from 'react';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle, Info, Target, Lightbulb } from 'lucide-react';
import { analyzeSalary } from '@/services/salary-analysis/salaryAnalysisService';
import type { Candidate } from '@/types';
import { getSafeErrorMessage } from '@/utils/errorMessages';

interface SalaryAnalysisPanelProps {
  candidate?: Candidate;
  jdText?: string;
  onAnalysisComplete?: (result: any) => void;
}

interface SalaryAnalysisResult {
  summary: string;
  marketSalary: {
    p25: number;
    median: number;
    p75: number;
    currency: string;
    period: string;
  } | null;
  comparison?: {
    currentSalary: number;
    marketPosition: 'below' | 'reasonable' | 'above';
    difference: number;
    differencePercent: number;
  };
  recommendation: string;
  negotiationTips: string[];
  source: string;
  error?: string;
}

const formatVND = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  return `${amount.toLocaleString('vi-VN')}`;
};

const SalaryAnalysisPanel: React.FC<SalaryAnalysisPanelProps> = ({
  candidate,
  jdText,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SalaryAnalysisResult | null>(null);
  const [manualInput, setManualInput] = useState({
    jobTitle: '',
    location: '',
    yearsOfExperience: '',
    currentSalary: '',
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysisResult = await analyzeSalary({
        jobTitle: manualInput.jobTitle || candidate?.jobTitle || '',
        location: manualInput.location || candidate?.detectedLocation || '',
        yearsOfExperience: manualInput.yearsOfExperience
          ? parseInt(manualInput.yearsOfExperience)
          : undefined,
        currentSalary: manualInput.currentSalary
          ? parseFloat(manualInput.currentSalary) * 1_000_000
          : undefined,
        cvText: candidate
          ? `${candidate.candidateName}\n${candidate.jobTitle}\n${candidate.experienceLevel}\n${candidate.detectedLocation}`
          : undefined,
        jdText: jdText || '',
      });

      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (error) {
      console.error('Salary analysis error:', error);
      const safeMessage = getSafeErrorMessage(error, 'ai');
      setResult({
        summary: 'Có lỗi xảy ra khi phân tích mức lương.',
        marketSalary: null,
        recommendation: 'Vui lòng thử lại sau.',
        negotiationTips: [],
        source: 'N/A',
        error: safeMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMarketPositionColor = (position?: 'below' | 'reasonable' | 'above') => {
    switch (position) {
      case 'below':   return 'text-orange-600 bg-orange-50';
      case 'reasonable': return 'text-green-600 bg-green-50';
      case 'above':   return 'text-blue-600 bg-blue-50';
      default:        return 'text-slate-600 bg-slate-50';
    }
  };

  const getMarketPositionIcon = (position?: 'below' | 'reasonable' | 'above') => {
    switch (position) {
      case 'below':       return <AlertCircle className="w-5 h-5" />;
      case 'reasonable':  return <CheckCircle className="w-5 h-5" />;
      case 'above':       return <TrendingUp className="w-5 h-5" />;
      default:            return <Info className="w-5 h-5" />;
    }
  };

  const getMarketPositionText = (position?: 'below' | 'reasonable' | 'above') => {
    switch (position) {
      case 'below':       return 'Dưới thị trường';
      case 'reasonable':  return 'Hợp lý';
      case 'above':       return 'Trên thị trường';
      default:            return 'Chưa xác định';
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Phân tích mức lương</h2>
          <p className="text-[12px] text-slate-500">So sánh với thị trường Việt Nam</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Chức danh
            </label>
            <input
              type="text"
              value={manualInput.jobTitle}
              onChange={(e) => setManualInput({ ...manualInput, jobTitle: e.target.value })}
              placeholder={candidate?.jobTitle || 'VD: Senior Backend Developer'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Địa điểm
            </label>
            <input
              type="text"
              value={manualInput.location}
              onChange={(e) => setManualInput({ ...manualInput, location: e.target.value })}
              placeholder={candidate?.detectedLocation || 'VD: Hà Nội'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Số năm kinh nghiệm
            </label>
            <input
              type="number"
              value={manualInput.yearsOfExperience}
              onChange={(e) => setManualInput({ ...manualInput, yearsOfExperience: e.target.value })}
              placeholder="VD: 5"
              min="0"
              max="30"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Lương hiện tại (triệu VNĐ/tháng)
            </label>
            <input
              type="number"
              value={manualInput.currentSalary}
              onChange={(e) => setManualInput({ ...manualInput, currentSalary: e.target.value })}
              placeholder="VD: 25"
              min="0"
              step="0.5"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang phân tích...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Phân tích mức lương
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-[13px] font-semibold text-red-900">Lỗi phân tích</p>
                <p className="mt-1 text-[12px] text-red-700">{result.error}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <p className="text-[13px] font-semibold text-blue-900">Tóm tắt</p>
              <p className="mt-1 text-[12px] text-blue-800">{result.summary}</p>
            </div>
          </div>

          {result.marketSalary && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                <Target className="h-4 w-4 text-green-600" />
                Khoảng lương thị trường
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">P25 (Thấp)</p>
                  <p className="mt-1 text-[15px] font-semibold text-slate-900">
                    {formatVND(result.marketSalary.p25)}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-[11px] font-semibold text-green-700">Median</p>
                  <p className="mt-1 text-[15px] font-semibold text-green-700">
                    {formatVND(result.marketSalary.median)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">P75 (Cao)</p>
                  <p className="mt-1 text-[15px] font-semibold text-slate-900">
                    {formatVND(result.marketSalary.p75)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                {result.marketSalary.currency} / {result.marketSalary.period === 'MONTHLY' ? 'Tháng' : 'Năm'}
              </p>
            </div>
          )}

          {result.comparison && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-[13px] font-semibold text-slate-900">So sánh với thị trường</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-[13px] text-slate-600">Lương hiện tại</span>
                  <span className="text-[13px] font-semibold text-slate-900">
                    {formatVND(result.comparison.currentSalary)} VNĐ/tháng
                  </span>
                </div>

                <div className={`flex items-center justify-between rounded-xl p-3 ${getMarketPositionColor(result.comparison.marketPosition)}`}>
                  <div className="flex items-center gap-2">
                    {getMarketPositionIcon(result.comparison.marketPosition)}
                    <span className="text-[13px] font-semibold">
                      {getMarketPositionText(result.comparison.marketPosition)}
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold">
                    {result.comparison.differencePercent > 0 ? '+' : ''}
                    {result.comparison.differencePercent}%
                  </span>
                </div>

                {result.comparison.difference !== 0 && (
                  <p className="text-center text-[12px] text-slate-500">
                    {result.comparison.difference > 0 ? 'Cao hơn' : 'Thấp hơn'} median{' '}
                    <span className="font-semibold text-slate-700">{formatVND(Math.abs(result.comparison.difference))}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <div>
              <p className="text-[13px] font-semibold text-green-900">Đề xuất</p>
              <p className="mt-1 text-[12px] text-green-800">{result.recommendation}</p>
            </div>
          </div>

          {result.negotiationTips.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Gợi ý thương lượng
              </h3>
              <ul className="space-y-2">
                {result.negotiationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <span className="mt-1 shrink-0 text-yellow-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400">
            {result.source}
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryAnalysisPanel;
