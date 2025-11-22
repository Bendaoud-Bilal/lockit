/**
 * Client-side Encryption/Decryption Utilities for Lockit Password Manager
 * Uses Web Crypto API (browser-native) for AES-256-GCM encryption
 * 
 * Note: This module assumes the vault key is managed externally
 * (received from authentication/server after login)
 */

// Constants
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes (96 bits for GCM)

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer 
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
  try {
    // Log what we're trying to decode
    // console.log('Attempting to decode Base64:', base64);
    // console.log('Type:', typeof base64);
    // console.log('Length:', base64?.length);
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error('Base64 decode failed for:', base64);
    throw new Error(`Invalid Base64 string: ${error.message}`);
  }
}

/**
 * Generate a random initialization vector (IV)
 * @returns {Uint8Array}
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Import vault key from Base64 string (received from server/auth)
 * @param {string} base64Key - Base64 encoded vault key
 * @returns {Promise<CryptoKey>}
 */
export async function importVaultKey(base64Key) {
//   console.log('importVaultKey called with:', base64Key);
//   console.log('Type:', typeof base64Key);
//   console.log('Value:', JSON.stringify(base64Key));
  
  const keyBuffer = base64ToArrayBuffer(base64Key);
  
//   console.log('Key buffer length:', keyBuffer.byteLength, 'bytes');
  
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: ALGORITHM,
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt credential data
 * @param {Object} data - Plain credential data object
 * @param {string} vaultKeyBase64 - Base64 encoded vault key (from server/auth)
 * @returns {Promise<Object>} { dataEnc, dataIv, dataAuthTag } - All base64 encoded
 */
export async function encryptCredential(data, vaultKeyBase64) {
  try {
    // Import vault key
    const vaultKey = await importVaultKey(vaultKeyBase64);

    // Generate IV
    const iv = generateIV();

    // Convert data to JSON string then to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      vaultKey,
      dataBuffer
    );

    // Split encrypted data and auth tag
    // In AES-GCM, the last 16 bytes are the auth tag
    const encrypted = new Uint8Array(encryptedBuffer);
    const dataEnc = encrypted.slice(0, -16);
    const authTag = encrypted.slice(-16);

    return {
      dataEnc: arrayBufferToBase64(dataEnc),
      dataIv: arrayBufferToBase64(iv),
      dataAuthTag: arrayBufferToBase64(authTag)
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt credential data
 * @param {string} dataEnc - Base64 encoded encrypted data
 * @param {string} dataIv - Base64 encoded IV
 * @param {string} dataAuthTag - Base64 encoded auth tag
 * @param {string} vaultKeyBase64 - Base64 encoded vault key (from server/auth)
 * @returns {Promise<Object>} Decrypted credential data object
 */
export async function decryptCredential(dataEnc, dataIv, dataAuthTag, vaultKeyBase64) {
  try {
    // Import vault key
    const vaultKey = await importVaultKey(vaultKeyBase64);

    // Convert from Base64
    const iv = base64ToArrayBuffer(dataIv);
    const encrypted = base64ToArrayBuffer(dataEnc);
    const authTag = base64ToArrayBuffer(dataAuthTag);

    // Combine encrypted data and auth tag
    const encryptedWithTag = new Uint8Array(encrypted.byteLength + authTag.byteLength);
    encryptedWithTag.set(new Uint8Array(encrypted), 0);
    encryptedWithTag.set(new Uint8Array(authTag), encrypted.byteLength);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: new Uint8Array(iv)
      },
      vaultKey,
      encryptedWithTag
    );

    // Convert to string and parse JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Calculate password strength score
 * @param {string} password - Password to evaluate
 * @returns {number} Strength score (0-4)
 */
export function calculatePasswordStrength(password) {
  if (!password) return 0;

  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Return 0-4 scale
  return Math.min(4, Math.floor(score / 2));
}

/**
 * Generate a random password
 * @param {number} length - Password length (default: 16)
 * @param {Object} options - Character set options
 * @returns {string} Generated password
 */
export function generatePassword(length = 16, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (chars.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomValues[i] % chars.length);
  }

  return password;
}

export default {
  // Credential encryption/decryption (vault key comes from server/auth)
  importVaultKey,
  encryptCredential,
  decryptCredential,
  
  // Utilities
  calculatePasswordStrength,
  generatePassword
};
