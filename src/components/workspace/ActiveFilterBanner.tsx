import React from 'react';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { useUserSettings } from '@/context/settings/UserSettingsProvider';

interface ActiveFilterBannerProps {
  onOpenSettings: () => void;
}

const ActiveFilterBanner: React.FC<ActiveFilterBannerProps> = ({ onOpenSettings }) => {
  const { settings } = useUserSettings();
  const fixedJD = settings.workflow.fixedJD;

  if (!fixedJD?.enabled || !fixedJD.jdText) return null;

  const hardFilterCount = fixedJD.hardFilters
    ? Object.entries(fixedJD.hardFilters).filter(([key, v]) => {
        if (key.endsWith('Mandatory')) return false;
        return v !== '' && v !== null && v !== undefined && v !== false;
      }).length
    : 0;

  const weightCount = fixedJD.weights
    ? Object.values(fixedJD.weights).filter((c) => c && typeof c === 'object' && 'children' in c).length
    : 0;

  return (
    <div className="shrink-0 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2">
      <div className="flex items-center gap-2 text-[12px]">
        <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
        <span className="font-semibold text-emerald-800">
          Đang áp dụng:
        </span>
        <span className="text-emerald-700 font-medium truncate max-w-[200px]">
          {fixedJD.name || 'JD đã lưu'}
        </span>
        {hardFilterCount > 0 && (
          <>
            <span className="text-emerald-400">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <SlidersHorizontal size={11} />
              {hardFilterCount} bộ lọc cứng
            </span>
          </>
        )}
        {weightCount > 0 && (
          <>
            <span className="text-emerald-400">·</span>
            <span className="text-emerald-600">{weightCount} tiêu chí trọng số</span>
          </>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="ml-auto shrink-0 rounded-lg border border-emerald-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Thay đổi
        </button>
      </div>
    </div>
  );
};

export default ActiveFilterBanner;
