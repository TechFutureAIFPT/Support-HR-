import React from 'react';
import { Search } from 'lucide-react';

export const workspaceScoreTone = (score: number) => {
  if (score >= 80) return { text: 'text-[#16883f]', dot: 'bg-[#34c759]', bg: 'bg-[#eefaf2]', label: 'Rất phù hợp' };
  if (score >= 60) return { text: 'text-[#a35d00]', dot: 'bg-[#ff9f0a]', bg: 'bg-[#fff7e8]', label: 'Cần xem xét' };
  return { text: 'text-[#d70015]', dot: 'bg-[#ff3b30]', bg: 'bg-[#fff1f0]', label: 'Chưa phù hợp' };
};

export function TrafficLights() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/5" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/5" />
      <span className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/5" />
    </div>
  );
}

export function WorkspaceSearch({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`apple-search-field relative flex h-9 items-center ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3 text-[#86868b]" strokeWidth={1.8} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-lg border border-[#d2d2d7] bg-white pl-9 pr-3 text-[13px] text-[#1d1d1f] outline-none transition focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
      />
    </label>
  );
}

export function ScoreLabel({ score, compact = false }: { score: number; compact?: boolean }) {
  const tone = workspaceScoreTone(score);
  const formattedScore = Number.isInteger(score) ? String(score) : score.toFixed(1);
  return (
    <span className={`inline-flex items-center gap-2 font-medium ${tone.text} ${compact ? 'text-[13px]' : 'text-sm'}`}>
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {formattedScore} điểm{compact ? '' : ` · ${tone.label}`}
    </span>
  );
}

export function WorkspaceDivider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-[#e5e5ea] ${className}`} />;
}

export function WorkspaceSection({
  title,
  icon,
  children,
  tone = 'default',
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning';
}) {
  const color = tone === 'success' ? 'text-[#16883f]' : tone === 'warning' ? 'text-[#a35d00]' : 'text-[#1d1d1f]';
  return (
    <section className="py-5 first:pt-0">
      <h3 className={`mb-3 flex items-center gap-2 text-[14px] font-semibold ${color}`}>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function WorkspaceEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-8 text-center">
      <p className="text-[15px] font-semibold text-[#1d1d1f]">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-5 text-[#6e6e73]">{description}</p>
    </div>
  );
}
