const MOJIBAKE_PATTERN = /(?:Ã|Ä|Æ|Ð|ð|áº|á»|Tá»|�)/;
const VIETNAMESE_MARK_PATTERN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

function countMatches(value: string, pattern: RegExp): number {
  const matches = value.match(new RegExp(pattern.source, 'g'));
  return matches ? matches.length : 0;
}

function scoreDisplayText(value: string): number {
  return countMatches(value, MOJIBAKE_PATTERN) * -8
    + countMatches(value, VIETNAMESE_MARK_PATTERN) * 2
    - (value.includes('�') ? 20 : 0);
}

function decodeLatin1Mojibake(value: string): string | null {
  try {
    const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

export function normalizeVietnameseDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';

  const text = String(value);
  if (!MOJIBAKE_PATTERN.test(text)) return text;

  const decoded = decodeLatin1Mojibake(text);
  if (!decoded || decoded.includes('�')) return text;

  return scoreDisplayText(decoded) > scoreDisplayText(text) ? decoded : text;
}

export function normalizeVietnameseList(values: unknown[] | undefined | null): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeVietnameseDisplay(value)).filter(Boolean);
}
