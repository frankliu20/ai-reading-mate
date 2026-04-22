// 豆包 (火山方舟 / Volces Ark) 的存储 key
export const STORAGE_KEY = 'pra:ark_api_key';
export const MODEL_STORAGE_KEY = 'pra:ark_model';

// 默认模型（用户可在设置里改）
export const DEFAULT_ARK_MODEL = 'doubao-seed-1-8-251228';

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  // 兼容老 key（如果之前存过 anthropic 的，不再使用，但不主动删，让用户在设置里覆盖）
  return localStorage.getItem(STORAGE_KEY);
}

export function getStoredModel(): string {
  if (typeof window === 'undefined') return DEFAULT_ARK_MODEL;
  return localStorage.getItem(MODEL_STORAGE_KEY)?.trim() || DEFAULT_ARK_MODEL;
}

