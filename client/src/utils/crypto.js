// client/src/utils/crypto.js
// Hardened WebCrypto AES-256-GCM helpers used across the dashboard and legacy flows.

const AES_ALGORITHM = 'AES-GCM';
const IV_BYTE_LENGTH = 12; // 96-bit IV required by GCM
const AUTH_TAG_BYTE_LENGTH = 16; // WebCrypto appends a 128-bit auth tag

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const cryptoApi = globalThis.crypto ?? (typeof window !== 'undefined' ? window.crypto : undefined);

function ensureWebCrypto() {
  if (!cryptoApi?.subtle) {
    throw new Error('WebCrypto API is not available in this environment');
  }
  return cryptoApi;
}

function base64ToUint8Array(base64) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new Error('Invalid base64 string');
  }
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function looksLikeBase64(value) {
  if (typeof value !== 'string') return false;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value)) return false;
  try {
    atob(value);
    return true;
  } catch {
    return false;
  }
}

function looksLikeHex(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-fA-F]+$/.test(value) &&
    value.length % 2 === 0
  );
}

function nodeBufferJsonToBase64(objOrStr) {
  try {
    const parsed = typeof objOrStr === 'string' ? JSON.parse(objOrStr) : objOrStr;
    if (parsed && Array.isArray(parsed.data)) {
      return uint8ArrayToBase64(new Uint8Array(parsed.data));
    }
  } catch (error) {
    // ignore
  }
  return null;
}

function hexToBase64(hex) {
  if (!looksLikeHex(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return uint8ArrayToBase64(bytes);
}

function normalizeToBase64(input) {
  if (input === null || input === undefined) return null;
  if (looksLikeBase64(input)) return input;

  const fromNodeJson = nodeBufferJsonToBase64(input);
  if (fromNodeJson) return fromNodeJson;

  const fromHex = hexToBase64(input);
  if (fromHex) return fromHex;

  if (input instanceof Uint8Array) return uint8ArrayToBase64(input);
  if (input instanceof ArrayBuffer) return uint8ArrayToBase64(new Uint8Array(input));

  return null;
}

async function importAesKey(base64Like, usages) {
  const cryptoRef = ensureWebCrypto();
  const base64 = normalizeToBase64(base64Like);
  if (!base64) {
    throw new Error('Vault key not convertible to base64 (expected base64, hex, Node Buffer JSON, or Uint8Array)');
  }

  const rawKey = base64ToUint8Array(base64);
  return cryptoRef.subtle.importKey(
    'raw',
    rawKey,
    { name: AES_ALGORITHM },
    false,
    usages
  );
}

export default async function decryptAesGcmBrowser(keyLike, ciphertextLike, ivLike, authTagLike) {
  try {
    const cryptoRef = ensureWebCrypto();

    const ciphertextBase64 = normalizeToBase64(ciphertextLike);
    const ivBase64 = normalizeToBase64(ivLike);
    const authTagBase64 = normalizeToBase64(authTagLike);

    if (!ciphertextBase64 || !ivBase64 || !authTagBase64) {
      throw new Error('Ciphertext, IV, or auth tag not convertible to base64');
    }

    const cryptoKey = await importAesKey(keyLike, ['decrypt']);

    const ciphertext = base64ToUint8Array(ciphertextBase64);
    const iv = base64ToUint8Array(ivBase64);
    const authTag = base64ToUint8Array(authTagBase64);

    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext, 0);
    combined.set(authTag, ciphertext.length);

    const decrypted = await cryptoRef.subtle.decrypt(
      { name: AES_ALGORITHM, iv },
      cryptoKey,
      combined
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt data: ${error.message || error}`);
  }
}

export async function encryptAesGcmBrowser(keyLike, plaintext) {
  const cryptoRef = ensureWebCrypto();
  const cryptoKey = await importAesKey(keyLike, ['encrypt']);
  const iv = cryptoRef.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const encryptedBuffer = await cryptoRef.subtle.encrypt(
    { name: AES_ALGORITHM, iv },
    cryptoKey,
    encoder.encode(plaintext)
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedBytes.slice(0, -AUTH_TAG_BYTE_LENGTH);
  const authTag = encryptedBytes.slice(-AUTH_TAG_BYTE_LENGTH);

  return {
    ciphertext: uint8ArrayToBase64(ciphertext),
    iv: uint8ArrayToBase64(iv),
    authTag: uint8ArrayToBase64(authTag),
  };
}

export async function importVaultKey(keyLike) {
  return importAesKey(keyLike, ['encrypt', 'decrypt']);
}

export async function encryptCredential(data, vaultKeyBase64) {
  const plaintext = JSON.stringify(data ?? {});
  const { ciphertext, iv, authTag } = await encryptAesGcmBrowser(vaultKeyBase64, plaintext);
  return {
    dataEnc: ciphertext,
    dataIv: iv,
    dataAuthTag: authTag,
  };
}

export async function decryptCredential(dataEnc, dataIv, dataAuthTag, vaultKeyBase64) {
  const plaintext = await decryptAesGcmBrowser(vaultKeyBase64, dataEnc, dataIv, dataAuthTag);
  try {
    return JSON.parse(plaintext);
  } catch (error) {
    console.warn('Decrypted credential payload is not valid JSON – returning raw string');
    return plaintext;
  }
}

export function calculatePasswordStrength(password) {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  return Math.min(4, Math.floor(score / 2));
}

export function generatePassword(length = 16, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  const cryptoRef = ensureWebCrypto();
  const randomValues = cryptoRef.getRandomValues(new Uint8Array(length));
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset.charAt(randomValues[i] % charset.length);
  }

  return password;
}
