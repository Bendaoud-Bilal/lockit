// client/src/utils/kdf.js
// Derive a 32-byte AES key from password + salt using PBKDF2 (WebCrypto).
// Returns base64 string of raw key (32 bytes).
export default async function deriveKeyPBKDF2ToBase64(password, saltBase64, iterations = 200000) {
  if (typeof password !== 'string' || !password.length) throw new Error('Password required');
  if (typeof saltBase64 !== 'string' || !saltBase64.length) throw new Error('saltBase64 required');

  const enc = new TextEncoder();
  const pwKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // decode salt base64 to Uint8Array safely
  let salt;
  try {
    const binary = atob(saltBase64);
    salt = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) salt[i] = binary.charCodeAt(i);
  } catch (e) {
    throw new Error('Invalid saltBase64');
  }

  const derivedKey = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can export raw
    ['encrypt', 'decrypt']
  );

  const raw = await window.crypto.subtle.exportKey('raw', derivedKey); // ArrayBuffer length 32

  // convert raw to base64
  const bytes = new Uint8Array(raw);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
