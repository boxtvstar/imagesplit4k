
const STORAGE_KEY = 'gemini_api_key_secure';
const SALT = 'this_is_money_upscaler_secret';

// 간단한 난독화 (클라이언트 사이드 보안)
export const encryptKey = (key: string): string => {
  return btoa(SALT + key + SALT);
};

export const decryptKey = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    return decoded.replace(new RegExp(SALT, 'g'), '');
  } catch (e) {
    return '';
  }
};

export const saveApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, encryptKey(key));
};

export const getApiKey = (): string => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return '';
  return decryptKey(encrypted);
};

export const clearApiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
};
