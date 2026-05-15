export type SafeErrorContext = 'ai' | 'auth' | 'drive' | 'network' | 'generic';

export const SAFE_ERROR_MESSAGES = {
  generic: 'Đang có lỗi. Vui lòng thử lại sau.',
  ai: 'Đang có lỗi khi xử lý. Vui lòng thử lại sau.',
  auth: 'Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.',
  drive: 'Đang có lỗi khi lấy tệp từ Google Drive. Vui lòng thử lại sau.',
  network: 'Đang có lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.',
} as const;

const SENSITIVE_ERROR_PATTERNS = [
  'api key',
  'api_key',
  'authorization',
  'backend',
  'bearer',
  'client_email',
  'credential',
  'credentials',
  'exception',
  'fastapi',
  'firebase',
  'gemini',
  'internal server',
  'missing',
  'openai',
  'private_key',
  'project_id',
  'render',
  'secret',
  'service account',
  'service_account',
  'stack',
  'token',
  'traceback',
  'uvicorn',
];

const NETWORK_ERROR_PATTERNS = [
  'abort',
  'aborted',
  'failed to fetch',
  'fetch',
  'network',
  'timeout',
  'timed out',
  'quá thời gian',
];

const AUTH_ERROR_PATTERNS = [
  '401',
  '403',
  'auth',
  'đăng nhập',
  'dang nhap',
  'forbidden',
  'login',
  'unauthorized',
];

function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function includesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

export function isRedirectingToGoogle(error: unknown): boolean {
  const message = getRawErrorMessage(error).toLowerCase();
  return message.includes('đang chuyển tới google') || message.includes('dang chuyen toi google');
}

export function isLoginRequiredError(error: unknown): boolean {
  return includesAny(getRawErrorMessage(error).toLowerCase(), AUTH_ERROR_PATTERNS);
}

export function isSensitiveErrorMessage(message: string): boolean {
  return includesAny(message.toLowerCase(), SENSITIVE_ERROR_PATTERNS);
}

export function sanitizeApiErrorMessage(message: string, fallback: string = SAFE_ERROR_MESSAGES.generic): string {
  if (!message.trim()) return fallback;

  const normalized = message.toLowerCase();

  if (includesAny(normalized, NETWORK_ERROR_PATTERNS)) {
    return SAFE_ERROR_MESSAGES.network;
  }

  if (isSensitiveErrorMessage(message)) {
    return fallback;
  }

  return message;
}

export function getSafeErrorMessage(error: unknown, context: SafeErrorContext = 'generic'): string {
  const message = getRawErrorMessage(error);
  const normalized = message.toLowerCase();

  if (includesAny(normalized, NETWORK_ERROR_PATTERNS)) {
    return SAFE_ERROR_MESSAGES.network;
  }

  if (context === 'auth' || (context === 'drive' && includesAny(normalized, AUTH_ERROR_PATTERNS))) {
    return SAFE_ERROR_MESSAGES.auth;
  }

  if (context === 'drive') {
    return SAFE_ERROR_MESSAGES.drive;
  }

  const fallback = SAFE_ERROR_MESSAGES[context] || SAFE_ERROR_MESSAGES.generic;

  if (!message.trim() || isSensitiveErrorMessage(message)) {
    return fallback;
  }

  return message;
}
