const MOJIBAKE_PATTERN = /(?:\u00c2|\u00c3|\u00c4|\u00c6|\u00d0|\u00f0|\u00e1\u00ba|\u00e1\u00bb|\u00e2\u20ac|T\u00e1\u00bb|\ufffd)/;
const DAMAGED_MOJIBAKE_PATTERN = /(?:\u00e1\u00ba\?|\u00e1\u00bb\?|\u00c3\?|\u00c4\?)/;
const VIETNAMESE_MARK_PATTERN = /[\u00c0-\u1ef9\u0110\u0111]/;
const COMMON_DAMAGED_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Ti\u00e1\u00ba(?:\u00bf|\?)p t\u00e1\u00bb(?:\u00a5|\u00a3|\?)c/g, 'Tiếp tục'],
  [/ti\u00e1\u00ba(?:\u00bf|\?)p t\u00e1\u00bb(?:\u00a5|\u00a3|\?)c/g, 'tiếp tục'],
  [/D\u00c3\u00b9ng th\u00e1\u00bb\u00ad mi\u00e1\u00bb\u2026n ph\u00c3\u00ad/g, 'Dùng thử miễn phí'],
  [/D\u00c3\u00b9ng th\u00e1\u00bb\u00ad/g, 'Dùng thử'],
  [/Nh\u00e1\u00ba\u00adn t\u00c6\u00b0 v\u00e1\u00ba\u00a5n/g, 'Nhận tư vấn'],
  [/T\u00e1\u00ba\u00a3i file/g, 'Tải file'],
  [/T\u00e1\u00ba\u00a3i l\u00c3\u00aan/g, 'Tải lên'],
  [/T\u00c3\u00a0i li\u00e1\u00bb\u2021u/g, 'Tài liệu'],
  [/M\u00e1\u00ba\u00abu JD/g, 'Mẫu JD'],
  [/Th\u00c6\u00b0 vi\u00e1\u00bb\u2021n CV/g, 'Thư viện CV'],
  [/Chu\u00e1\u00ba\u00a9n h\u00c3\u00b3a JD/g, 'Chuẩn hóa JD'],
  [/\u00c4\u0090ang t\u00e1\u00ba\u00a3i/g, 'Đang tải'],
  [/Ch\u00c6\u00b0a c\u00c3\u00b3/g, 'Chưa có'],
  [/Kh\u00c3\u00b4ng c\u00c3\u00b3/g, 'Không có'],
];
const CP1252_BYTE_BY_CODE_POINT: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function countMatches(value: string, pattern: RegExp): number {
  const matches = value.match(new RegExp(pattern.source, 'g'));
  return matches ? matches.length : 0;
}

function scoreDisplayText(value: string): number {
  return countMatches(value, MOJIBAKE_PATTERN) * -8
    + countMatches(value, VIETNAMESE_MARK_PATTERN) * 2
    - (value.includes('\ufffd') ? 20 : 0);
}

function decodeLatin1Mojibake(value: string): string | null {
  try {
    const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

function decodeCp1252Mojibake(value: string): string | null {
  try {
    const bytes = Uint8Array.from(Array.from(value), (char) => {
      const codePoint = char.charCodeAt(0);
      if (codePoint <= 0xff) return codePoint;
      const mapped = CP1252_BYTE_BY_CODE_POINT[codePoint];
      if (mapped === undefined) throw new Error('Unsupported cp1252 marker');
      return mapped;
    });
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

function decodeMojibake(value: string): string | null {
  const latin1 = decodeLatin1Mojibake(value);
  const cp1252 = decodeCp1252Mojibake(value);
  const candidates = [latin1, cp1252].filter((candidate): candidate is string => Boolean(candidate) && !candidate.includes('\ufffd'));

  return candidates.sort((a, b) => scoreDisplayText(b) - scoreDisplayText(a))[0] ?? null;
}

function repairDamagedMojibake(value: string): string {
  return COMMON_DAMAGED_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value
  );
}

function decodeLiteralUnicodeEscapes(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_match, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16))
  );
}

export function normalizeVietnameseDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';

  let current = repairDamagedMojibake(decodeLiteralUnicodeEscapes(String(value)));
  for (let index = 0; index < 4; index += 1) {
    if (!MOJIBAKE_PATTERN.test(current) && !DAMAGED_MOJIBAKE_PATTERN.test(current)) return current;

    const decoded = decodeMojibake(current);
    if (!decoded || decoded.includes('\ufffd') || scoreDisplayText(decoded) <= scoreDisplayText(current)) {
      return current;
    }
    current = repairDamagedMojibake(decoded);
  }
  return current;
}

export function normalizeVietnameseList(values: unknown[] | undefined | null): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeVietnameseDisplay(value)).filter(Boolean);
}

// Backend AI-scoring pipeline occasionally falls back to keyword/vector matching and
// leaves the raw JSON-parser exception in a warning field (e.g. "Expecting ',' delimiter:
// line 2907 column 8 (char 129425)"). That text must never reach recruiter-facing UI as if
// it were a real evaluation of the candidate.
const SYSTEM_DIAGNOSTIC_PATTERN =
  /expecting\s+\S+\s+delimiter|line\s+\d+\s+column\s+\d+|\(char\s+\d+\)|json\s*decode\s*error|traceback\s*\(most recent call last\)|ai generation (?:t[aạ]m ?th[oờ]i|tam thoi) l[oỗ]i|fallback (?:keyword\/vector )?scoring|ch[aấ]m [dđ]i[eể]m t[aạ]m th[oờ]i d[uự]a tr[eê]n [dđ][oộ] kh[oớ]p/i;

export function isSystemDiagnosticText(value: unknown): boolean {
  return typeof value === 'string' && SYSTEM_DIAGNOSTIC_PATTERN.test(value);
}

export function filterSystemDiagnosticText(values: unknown[] | undefined | null): string[] {
  return normalizeVietnameseList(values).filter((item) => !isSystemDiagnosticText(item));
}

export function normalizeVietnamesePayload<T = unknown>(payload: T): T {
  if (typeof payload === 'string') {
    return normalizeVietnameseDisplay(payload) as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeVietnamesePayload(item)) as T;
  }

  if (payload && typeof payload === 'object') {
    const normalized: Record<string, unknown> = {};
    Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
      normalized[normalizeVietnameseDisplay(key)] = normalizeVietnamesePayload(value);
    });
    return normalized as T;
  }

  return payload;
}
