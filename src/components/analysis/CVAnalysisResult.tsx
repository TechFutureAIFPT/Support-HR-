import React, { useMemo } from 'react';

type MatchTone = 'green' | 'amber' | 'red';

type ResultSegment =
  | {
      type: 'match';
      tone: MatchTone;
      title: string;
      body: string;
    }
  | {
      type: 'markdown';
      body: string;
    };

export interface CVAnalysisResultProps {
  markdown: string;
  score?: number;
  title?: string;
  className?: string;
}

const MATCH_TAGS: Array<{ pattern: RegExp; tone: MatchTone; title: string }> = [
  {
    pattern: /^\s*🟢\s*\[KHỚP TUYỆT ĐỐI\]/u,
    tone: 'green',
    title: '🟢 [KHỚP TUYỆT ĐỐI]',
  },
  {
    pattern: /^\s*🟡\s*\[KHỚP MỘT PHẦN\s*\/\s*KHUYẾT\]/u,
    tone: 'amber',
    title: '🟡 [KHỚP MỘT PHẦN / KHUYẾT]',
  },
  {
    pattern: /^\s*🔴\s*\[HOÀN TOÀN LỆCH PHA\s*\/\s*THIẾU\]/u,
    tone: 'red',
    title: '🔴 [HOÀN TOÀN LỆCH PHA / THIẾU]',
  },
];

const MATCH_CARD_CLASS: Record<MatchTone, string> = {
  green: 'bg-green-50 border-green-200 text-green-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  red: 'bg-red-50 border-red-200 text-red-800',
};

const PROGRESS_COLOR: Record<MatchTone, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function extractScore(markdown: string, score?: number): number {
  if (typeof score === 'number') return clampScore(score);

  const totalScoreMatch =
    markdown.match(/(?:tổng\s*điểm(?:\s*phù\s*hợp)?|điểm\s*số\s*tổng)[^\d]{0,40}(\d{1,3}(?:[.,]\d+)?)\s*\/\s*100/iu) ||
    markdown.match(/(\d{1,3}(?:[.,]\d+)?)\s*\/\s*100/u);

  if (!totalScoreMatch) return 0;
  return clampScore(Number(totalScoreMatch[1].replace(',', '.')));
}

function toneFromScore(score: number): MatchTone {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

function stripTag(line: string): string {
  let cleaned = line;
  for (const tag of MATCH_TAGS) {
    cleaned = cleaned.replace(tag.pattern, '').trim();
  }
  return cleaned;
}

function parseSegments(markdown: string): ResultSegment[] {
  const lines = (markdown || '').replace(/\r\n/g, '\n').split('\n');
  const segments: ResultSegment[] = [];
  let markdownBuffer: string[] = [];
  let activeMatch: Extract<ResultSegment, { type: 'match' }> | null = null;

  const flushMarkdown = () => {
    const body = markdownBuffer.join('\n').trim();
    if (body) segments.push({ type: 'markdown', body });
    markdownBuffer = [];
  };

  const flushMatch = () => {
    if (activeMatch) {
      activeMatch.body = activeMatch.body.trim();
      segments.push(activeMatch);
      activeMatch = null;
    }
  };

  for (const line of lines) {
    const matchedTag = MATCH_TAGS.find((tag) => tag.pattern.test(line));

    if (matchedTag) {
      flushMatch();
      flushMarkdown();
      activeMatch = {
        type: 'match',
        tone: matchedTag.tone,
        title: matchedTag.title,
        body: stripTag(line),
      };
      continue;
    }

    if (activeMatch) {
      activeMatch.body += `${activeMatch.body ? '\n' : ''}${line}`;
    } else {
      markdownBuffer.push(line);
    }
  }

  flushMatch();
  flushMarkdown();
  return segments;
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code key={`code-${match.index}`} className="rounded border border-current/15 bg-black/[0.04] px-1.5 py-0.5 text-[0.92em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <strong key={`strong-${match.index}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function MarkdownBlock({ body }: { body: string }) {
  const lines = body.split('\n');

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-300">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const heading = trimmed.match(/^(#{1,4})\s+(.+)$/u);
        if (heading) {
          const level = heading[1].length;
          const Tag = (level <= 2 ? 'h3' : 'h4') as 'h3' | 'h4';
          return (
            <Tag key={`${trimmed}-${index}`} className="pt-2 text-base font-black tracking-wide text-white">
              {renderInline(heading[2])}
            </Tag>
          );
        }

        const bullet = trimmed.match(/^[-*]\s+(.+)$/u);
        if (bullet) {
          return (
            <div key={`${trimmed}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
              <p>{renderInline(bullet[1])}</p>
            </div>
          );
        }

        const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/u);
        if (numbered) {
          return (
            <p key={`${trimmed}-${index}`} className="pl-3">
              {renderInline(numbered[1])}
            </p>
          );
        }

        return <p key={`${trimmed}-${index}`}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function MatchCard({ segment }: { segment: Extract<ResultSegment, { type: 'match' }> }) {
  return (
    <section className={`border p-4 shadow-sm ${MATCH_CARD_CLASS[segment.tone]}`}>
      <div className="mb-3 text-sm font-black tracking-wide">{segment.title}</div>
      <div className="space-y-2 text-sm leading-7">
        {segment.body ? (
          segment.body.split('\n').map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            return <p key={`${segment.title}-${index}`}>{renderInline(trimmed.replace(/^\*\s*/u, ''))}</p>;
          })
        ) : (
          <p>Chưa có nội dung đối sánh chi tiết.</p>
        )}
      </div>
    </section>
  );
}

function ProgressCircle({ score }: { score: number }) {
  const tone = toneFromScore(score);
  const size = 112;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="sticky top-4 z-10 ml-auto flex h-28 w-28 shrink-0 items-center justify-center bg-slate-950/90 p-2 shadow-[0_18px_48px_rgba(2,8,23,0.35)] backdrop-blur">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={PROGRESS_COLOR[tone]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">/100</span>
      </div>
    </div>
  );
}

export default function CVAnalysisResult({
  markdown,
  score,
  title = 'Kết quả phân tích CV',
  className = '',
}: CVAnalysisResultProps) {
  const computedScore = useMemo(() => extractScore(markdown, score), [markdown, score]);
  const segments = useMemo(() => parseSegments(markdown), [markdown]);

  return (
    <article className={`relative border border-white/10 bg-slate-950/80 p-5 text-slate-100 shadow-[0_24px_80px_rgba(2,8,23,0.32)] ${className}`}>
      <div className="mb-6 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Support HR</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Ma trận đối sánh được tô màu theo mức độ khớp giữa JD và CV.
          </p>
        </div>
        <ProgressCircle score={computedScore} />
      </div>

      <div className="space-y-4">
        {segments.length > 0 ? (
          segments.map((segment, index) =>
            segment.type === 'match' ? (
              <MatchCard key={`${segment.title}-${index}`} segment={segment} />
            ) : (
              <MarkdownBlock key={`markdown-${index}`} body={segment.body} />
            ),
          )
        ) : (
          <div className="border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
            Chưa có nội dung phân tích để hiển thị.
          </div>
        )}
      </div>
    </article>
  );
}

