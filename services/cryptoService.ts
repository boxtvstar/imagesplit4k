
const ENCRYPTION_KEY_NAME = 'gemini_api_key_enc';
const SALT = 'this-is-money-app-salt-2025';

async function getDerivedKey() {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('static-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export const saveEncryptedKey = async (plainKey: string) => {
  const key = await getDerivedKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainKey)
  );

  const storageObj = {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  };
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(storageObj));
};

export const getDecryptedKey = async (): Promise<string | null> => {
  const stored = localStorage.getItem(ENCRYPTION_KEY_NAME);
  if (!stored) return null;

  try {
    const { iv, data } = JSON.parse(stored);
    const key = await getDerivedKey();
    const ivArray = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
    const dataArray = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      dataArray
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('Decryption failed', e);
    return null;
  }
};

export const removeKey = () => {
  localStorage.removeItem(ENCRYPTION_KEY_NAME);
};
