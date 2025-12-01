/**
 * Client-side Cryptography Service
 *
 * IMPORTANT SECURITY NOTES:
 * - All encryption/decryption happens on the client side
 * - Master password NEVER leaves the client
 * - Vault key is derived from master password and NEVER stored
 * - Only encrypted data is sent to the server
 */

class CryptoService {
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  /**
   * Generate a random salt
   */
  generateSalt(length = 32) {
    const salt = window.crypto.getRandomValues(new Uint8Array(length));
    return this.arrayBufferToBase64(salt);
  }

  /**
   * Generate a random IV (Initialization Vector)
   */
  generateIV() {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    return this.arrayBufferToBase64(iv);
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    // Normalize base64: replace URL-safe chars and add padding if missing
    let b64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad === 2) b64 += "==";
    else if (pad === 3) b64 += "=";
    else if (pad === 1) {
      // invalid base64 length
      throw new Error("Invalid base64 string");
    }

    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Derive a key from master password using PBKDF2
   * This creates the master key hash for authentication
   */
  async deriveMasterKeyHash(masterPassword, salt, iterations = 100000) {
    try {
      const saltBuffer = this.base64ToArrayBuffer(salt);
      const passwordBuffer = this.encoder.encode(masterPassword);

      // Import password as key material
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      // Derive key using PBKDF2
      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: iterations,
          hash: "SHA-256",
        },
        keyMaterial,
        256 // 256 bits
      );

      return this.arrayBufferToBase64(derivedBits);
    } catch (error) {
      console.error("Error deriving master key hash:", error);
      throw new Error("Failed to derive master key hash");
    }
  }

  /**
   * Derive the vault encryption key from master password
   * This is used to encrypt/decrypt vault data
   */
  async deriveVaultKey(masterPassword, salt, iterations = 100000) {
    try {
      const saltBuffer = this.base64ToArrayBuffer(salt);
      const passwordBuffer = this.encoder.encode(masterPassword);

      // Import password as key material
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      // Derive AES-GCM key
      const vaultKey = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: iterations,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false, // Not extractable (stays in memory only)
        ["encrypt", "decrypt"]
      );

      return vaultKey;
    } catch (error) {
      console.error("Error deriving vault key:", error);
      throw new Error("Failed to derive vault key");
    }
  }

  /**
   * Wrap (encrypt) a base64-encoded vault key using a key derived from masterPassword.
   * Returns { encryptedKey, iv, authTag } all base64-encoded.
   */
  async wrapVaultKey(masterPassword, plainKeyBase64, vaultSalt, iterations = 100000) {
    try {
      const wrappingKey = await this.deriveVaultKey(masterPassword, vaultSalt, iterations);

      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const keyBytes = this.base64ToArrayBuffer(plainKeyBase64);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv, tagLength: 128 },
        wrappingKey,
        keyBytes
      );

      const encryptedBytes = new Uint8Array(encryptedBuffer);
      const ciphertext = encryptedBytes.slice(0, -16);
      const authTag = encryptedBytes.slice(-16);

      return {
        encryptedKey: this.arrayBufferToBase64(ciphertext.buffer),
        iv: this.arrayBufferToBase64(iv.buffer),
        authTag: this.arrayBufferToBase64(authTag.buffer),
      };
    } catch (error) {
      console.error("Error wrapping vault key:", error);
      throw new Error("Failed to wrap vault key");
    }
  }

  /**
   * Unwrap (decrypt) an encrypted vault key blob and return the plain vault key as base64 string.
   */
  async unwrapVaultKey(masterPassword, encryptedKeyBase64, ivBase64, authTagBase64, vaultSalt, iterations = 100000) {
    try {
      const wrappingKey = await this.deriveVaultKey(masterPassword, vaultSalt, iterations);

      const encrypted = this.base64ToArrayBuffer(encryptedKeyBase64);
      const iv = this.base64ToArrayBuffer(ivBase64);
      const authTag = this.base64ToArrayBuffer(authTagBase64);

      // Diagnostic: log lengths to help debug common issues
      try {
        console.debug("unwrapVaultKey inputs:", {
          encryptedBytes: new Uint8Array(encrypted).length,
          ivBytes: new Uint8Array(iv).length,
          authTagBytes: new Uint8Array(authTag).length,
        });
      } catch (e) {
        console.debug("unwrapVaultKey: failed to compute input lengths", e);
      }

      const combined = new Uint8Array(encrypted.byteLength + authTag.byteLength);
      combined.set(new Uint8Array(encrypted), 0);
      combined.set(new Uint8Array(authTag), encrypted.byteLength);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv), tagLength: 128 },
        wrappingKey,
        combined.buffer
      );

      return this.arrayBufferToBase64(decryptedBuffer);
    } catch (error) {
      console.error("Error unwrapping vault key:", error, {
        encrypted: encryptedKeyBase64,
        iv: ivBase64,
        authTag: authTagBase64,
        vaultSalt,
        iterations,
      });
      throw new Error("Failed to unwrap vault key");
    }
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(data, vaultKey) {
    try {
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Convert data to buffer
      const dataBuffer = this.encoder.encode(
        typeof data === "string" ? data : JSON.stringify(data)
      );

      // Encrypt
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128, // 128-bit authentication tag
        },
        vaultKey,
        dataBuffer
      );

      // Split encrypted data and auth tag
      const encryptedData = encryptedBuffer.slice(
        0,
        encryptedBuffer.byteLength - 16
      );
      const authTag = encryptedBuffer.slice(encryptedBuffer.byteLength - 16);

      return {
        dataEnc: this.arrayBufferToBase64(encryptedData),
        dataIv: this.arrayBufferToBase64(iv),
        dataAuthTag: this.arrayBufferToBase64(authTag),
      };
    } catch (error) {
      console.error("Error encrypting data:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(encryptedData, dataIv, dataAuthTag, vaultKey) {
    try {
      // Convert from Base64
      const encrypted = this.base64ToArrayBuffer(encryptedData);
      const iv = this.base64ToArrayBuffer(dataIv);
      const authTag = this.base64ToArrayBuffer(dataAuthTag);

      // Concatenate encrypted data and auth tag
      const combined = new Uint8Array(
        encrypted.byteLength + authTag.byteLength
      );
      combined.set(new Uint8Array(encrypted), 0);
      combined.set(new Uint8Array(authTag), encrypted.byteLength);

      // Decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128,
        },
        vaultKey,
        combined
      );

      const decryptedText = this.decoder.decode(decryptedBuffer);

      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decryptedText);
      } catch {
        return decryptedText;
      }
    } catch (error) {
      console.error("Error decrypting data:", error);
      throw new Error(
        "Failed to decrypt data - data may be corrupted or key is incorrect"
      );
    }
  }

  /**
   * Hash data using SHA-256
   */
  async hash(data) {
    try {
      const dataBuffer = this.encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        dataBuffer
      );
      return this.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      console.error("Error hashing data:", error);
      throw new Error("Failed to hash data");
    }
  }

  /**
   * Generate a secure random password
   */
  generatePassword(length = 20, options = {}) {
    const {
      uppercase = true,
      lowercase = true,
      numbers = true,
      special = true,
      excludeAmbiguous = true,
    } = options;

    let charset = "";
    if (uppercase)
      charset += excludeAmbiguous
        ? "ABCDEFGHJKLMNPQRSTUVWXYZ"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase)
      charset += excludeAmbiguous
        ? "abcdefghjkmnpqrstuvwxyz"
        : "abcdefghijklmnopqrstuvwxyz";
    if (numbers) charset += excludeAmbiguous ? "23456789" : "0123456789";
    if (special) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!charset) {
      throw new Error("At least one character type must be selected");
    }

    // Generate random password
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);

    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    return password;
  }

  /**
   * Calculate password strength (0-100)
   */
  calculatePasswordStrength(password) {
    if (!password) return 0;

    let score = 0;

    // Length scoring
    if (password.length >= 16) score += 30;
    else if (password.length >= 12) score += 20;
    else if (password.length >= 8) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // Bonus for mixed case
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 5;

    // Bonus for numbers and special chars together
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 5;

    return Math.min(100, score);
  }
}

// Export singleton instance
export default new CryptoService();
