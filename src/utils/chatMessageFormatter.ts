import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

export interface FormattedChatSection {
  heading: string | null;
  items: string[];
  ordered: boolean;
}

const HEADING_ALIASES: Array<[RegExp, string]> = [
  [/kết luận|tổng quan|đánh giá nhanh/i, 'Kết luận'],
  [/điểm mạnh|thế mạnh|ưu điểm/i, 'Điểm mạnh'],
  [/rủi ro|điểm yếu|hạn chế|cần xác minh/i, 'Rủi ro cần xác minh'],
  [/câu hỏi.*phỏng vấn|phỏng vấn.*nên hỏi/i, 'Câu hỏi phỏng vấn'],
  [/đề xuất|khuyến nghị|bước tiếp theo|hành động/i, 'Đề xuất'],
];

function stripDecorators(value: string): string {
  return normalizeVietnameseDisplay(value)
    .replace(/^```(?:json|markdown|md|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function extractPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return record.responseText ?? record.text ?? record.message ?? record.content ?? value;
  }
  if (typeof value !== 'string') return value;
  const text = normalizeVietnameseDisplay(value).trim();
  if (!text) return '';
  try {
    return extractPayload(JSON.parse(text));
  } catch {
    // Some model responses use Python-style single-quoted lists.
  }
  if (text.startsWith('[') && text.endsWith(']')) {
    const items = Array.from(text.matchAll(/'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/g))
      .map((match) => (match[1] ?? match[2] ?? '').replace(/\\(['"])/g, '$1'))
      .filter(Boolean);
    if (items.length) return items;
  }
  return text;
}

function canonicalHeading(value: string): string | null {
  return HEADING_ALIASES.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

function inferHeading(value: string, index: number): string {
  const matched = canonicalHeading(value);
  if (matched) return matched;
  if (/\?$/.test(value)) return 'Câu hỏi phỏng vấn';
  if (index === 0) return 'Kết luận';
  return 'Nhận định';
}

export function normalizeChatMessageContent(value: unknown): string {
  const payload = extractPayload(value);
  const parts = Array.isArray(payload) ? payload : String(payload ?? '').split(/\r?\n/);
  return parts.map((part) => stripDecorators(String(part))).filter(Boolean).join('\n');
}

export function formatChatMessageContent(value: unknown): FormattedChatSection[] {
  const normalized = normalizeChatMessageContent(value);
  if (!normalized) return [];
  const sections: FormattedChatSection[] = [];
  let current: FormattedChatSection | null = null;

  normalized.split('\n').forEach((rawLine, index) => {
    const line = stripDecorators(rawLine);
    if (!line) return;
    const headingMatch = line.match(/^(?:\d+[.)]\s*)?([^:]{2,40}):\s*(.*)$/);
    const explicitHeading = headingMatch ? canonicalHeading(headingMatch[1]) : null;
    const item = explicitHeading ? stripDecorators(headingMatch?.[2] || '') : line;
    const heading = explicitHeading || inferHeading(line, index);
    if (!current || current.heading !== heading) {
      current = { heading, items: [], ordered: heading === 'Câu hỏi phỏng vấn' };
      sections.push(current);
    }
    if (item && item.toLocaleLowerCase('vi-VN') !== heading.toLocaleLowerCase('vi-VN')) current.items.push(item);
  });
  return sections.filter((section) => section.items.length > 0);
}

export function chatMessageToPlainText(value: unknown): string {
  return formatChatMessageContent(value)
    .map((section) => [section.heading, ...section.items.map((item, index) =>
      `${section.ordered ? `${index + 1}.` : '•'} ${item}`
    )].filter(Boolean).join('\n'))
    .join('\n\n');
}
