// client/src/utils/crypto.js
// Hardened WebCrypto AES-256-GCM helpers
// - accepts base64, hex, or Node Buffer JSON inputs for key/ct/iv/tag
// - returns plaintext string on decrypt
// - returns { ciphertext, iv, authTag } (base64) on encrypt

function base64ToUint8Array(base64) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    throw new Error('Invalid base64 string');
  }
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function looksLikeBase64(s){
  if (typeof s !== 'string') return false;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(s)) return false;
  try { atob(s); return true; } catch { return false; }
}

function looksLikeHex(s){
  return typeof s === 'string' && /^[0-9a-fA-F]+$/.test(s) && (s.length % 2 === 0);
}

function nodeBufferJsonToBase64(objOrStr){
  try {
    const o = typeof objOrStr === 'string' ? JSON.parse(objOrStr) : objOrStr;
    if (o && Array.isArray(o.data)) {
      const bytes = new Uint8Array(o.data);
      return uint8ArrayToBase64(bytes);
    }
  } catch (e){}
  return null;
}

function hexToBase64(hex){
  if (!looksLikeHex(hex)) return null;
  const bytes = new Uint8Array(hex.length/2);
  for (let i=0;i<bytes.length;i++) bytes[i] = parseInt(hex.substr(i*2,2),16);
  return uint8ArrayToBase64(bytes);
}

function normalizeToBase64(input){
  // Accepts: base64 string, hex string, Node Buffer JSON string/object, Uint8Array, ArrayBuffer
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

// Default decrypt function (export default)
export default async function decryptAesGcmBrowser(keyRawBase64Like, ciphertextBase64Like, ivBase64Like, authTagBase64Like) {
  try {
    const keyRawBase64 = normalizeToBase64(keyRawBase64Like);
    const ciphertextBase64 = normalizeToBase64(ciphertextBase64Like);
    const ivBase64 = normalizeToBase64(ivBase64Like);
    const authTagBase64 = normalizeToBase64(authTagBase64Like);

    if (!keyRawBase64) throw new Error('vault key not convertible to base64 (expected base64, hex, or Node Buffer JSON)');
    if (!ciphertextBase64 || !ivBase64 || !authTagBase64) throw new Error('ciphertext/iv/authTag not convertible to base64');

    const keyRaw = base64ToUint8Array(keyRawBase64);
    const iv = base64ToUint8Array(ivBase64);
    const ciphertext = base64ToUint8Array(ciphertextBase64);
    const authTag = base64ToUint8Array(authTagBase64);

    // Combine ciphertext + authTag
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext, 0);
    combined.set(authTag, ciphertext.length);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyRaw,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      combined
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data: ' + (error.message || error));
  }
}

// Optional: encryption helper
export async function encryptAesGcmBrowser(keyRawBase64Like, plaintext) {
  const keyRawBase64 = normalizeToBase64(keyRawBase64Like);
  if (!keyRawBase64) throw new Error('Invalid key format for encryption');

  const keyRaw = base64ToUint8Array(keyRawBase64);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyRaw,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(plaintext)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);

  return {
    ciphertext: uint8ArrayToBase64(ciphertext),
    iv: uint8ArrayToBase64(iv),
    authTag: uint8ArrayToBase64(authTag)
  };
}
