import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const KEY_LEN = 32;

// FIXED: Remove curly braces from function name
export function decryptAesGcmBrowser(keyBuf, ciphertextB64, ivB64, authTagB64) {
  // Validation
  if (!Buffer.isBuffer(keyBuf)) {
    throw new Error('keyBuf must be a Buffer');
  }
  if (keyBuf.length !== KEY_LEN) {
    throw new Error(`Invalid key length: expected ${KEY_LEN} bytes for AES-256-GCM`);
  }

  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ciphertextB64, 'base64');
  const tag = Buffer.from(authTagB64, 'base64');

  if (iv.length !== IV_LEN) {
    throw new Error(`Invalid IV length: expected ${IV_LEN}, got ${iv.length}`);
  }
  if (tag.length !== AUTH_TAG_LEN) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LEN}, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGO, keyBuf, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString('utf8');
}

// You can also add encrypt function if needed
export function encryptAesGcmBrowser(keyBuf, plaintext) {
  if (!Buffer.isBuffer(keyBuf) || keyBuf.length !== KEY_LEN) {
    throw new Error(`Invalid key: must be ${KEY_LEN}-byte Buffer`);
  }

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, keyBuf, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}