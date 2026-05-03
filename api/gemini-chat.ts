import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

/**
 * Collect API keys from env variables without VITE_ prefix for security.
 */
function collectGeminiApiKeys(): string[] {
  const raw = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_1,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY,
  ];
  const out: string[] = [];
  for (const k of raw) {
    if (typeof k !== 'string') continue;
    const t = k.trim();
    if (t.length >= 12) out.push(t);
  }
  return [...new Set(out)];
}

const apiKeys = collectGeminiApiKeys();
let currentKeyIndex = 0;

function isGeminiApiKeyInvalidError(error: unknown): boolean {
  const s = error instanceof Error ? error.message : String(error);
  return (
    s.includes('API_KEY_INVALID') ||
    s.includes('API key not valid') ||
    (s.includes('400') && s.includes('INVALID_ARGUMENT'))
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: { message: 'Method Not Allowed' } });
    return;
  }

  if (apiKeys.length === 0) {
    res.status(500).json({ error: { message: 'GEMINI_API_KEY not configured on server' } });
    return;
  }

  const { model, contents, config } = req.body;

  if (!model || !contents) {
    res.status(400).json({ error: { message: 'Missing model or contents in request body' } });
    return;
  }

  let lastError: unknown = null;
  const originalIndex = currentKeyIndex;
  
  // CHIẾN LƯỢC: Thử tất cả các key với model gốc. 
  // Nếu tất cả các key đều bị 429 và model gốc không phải là 1.5-flash, thử lại với 1.5-flash (vì 1.5-flash có quota rộng nhất).
  const modelsToTry = [model];
  if (model !== 'gemini-1.5-flash') {
    modelsToTry.push('gemini-1.5-flash');
  }

  for (const targetModel of modelsToTry) {
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      try {
        const key = apiKeys[currentKeyIndex];
        const ai = new GoogleGenAI({ apiKey: key });
        
        const response = await ai.models.generateContent({ model: targetModel, contents, config });
        // Return only the text to ensure consistency and avoid serialization issues with SDK objects
        res.status(200).json({ text: response.text });
        return;
      } catch (error) {
        lastError = error;
        const errMsg = error instanceof Error ? error.message : String(error);
        
        if (isGeminiApiKeyInvalidError(error)) {
           console.warn(`[Gemini Proxy] Key ${currentKeyIndex + 1}/${apiKeys.length} invalid or revoked.`);
        } else {
           console.warn(`[Gemini Proxy] Model ${targetModel} with Key ${currentKeyIndex + 1} failed:`, errMsg);
        }

        // Nếu lỗi không phải là 429 (ví dụ 400 Bad Request), có thể không cần thử key tiếp theo cho model này
        // Nhưng cứ thử để chắc chắn.
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      }
    }
    
    // Nếu đã thử hết các key cho model hiện tại mà vẫn lỗi, và model tiếp theo là 1.5-flash, ta sẽ tiếp tục vòng lặp model.
    console.warn(`[Gemini Proxy] All keys failed for model ${targetModel}. Checking fallback...`);
  }

  const msg = lastError instanceof Error ? lastError.message : 'All Gemini keys and models failed in proxy';
  res.status(500).json({ error: { message: msg } });
}
