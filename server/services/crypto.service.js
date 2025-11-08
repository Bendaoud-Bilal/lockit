import argon2 from "argon2";
import crypto from "crypto";

export function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString("base64");
}

export async function hashPassword(password, salt) {
  const saltBuffer = Buffer.from(salt, "base64");
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
    salt: saltBuffer,
    raw: false,
  });
}

export async function verifyPassword(password, hash, salt) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function generateVaultKey(masterPassword, vaultSalt) {
  const key = crypto.randomBytes(32).toString("base64");
  const iv = crypto.randomBytes(12);

  // Encrypt the vault key with master password
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    crypto.scryptSync(masterPassword, Buffer.from(vaultSalt, "base64"), 32),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(key, "base64"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    plainKey: key,
    encryptedKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export async function decryptVaultKey(
  encryptedKey,
  iv,
  authTag,
  masterPassword,
  vaultSalt
) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    crypto.scryptSync(masterPassword, Buffer.from(vaultSalt, "base64"), 32),
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedKey, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("base64");
}

export async function hashRecoveryKey(recoveryKey, salt) {
  return crypto
    .pbkdf2Sync(recoveryKey, Buffer.from(salt, "base64"), 100000, 64, "sha512")
    .toString("base64");
}

export async function verifyRecoveryKey(recoveryKey, hash, salt) {
  const computedHash = await hashRecoveryKey(recoveryKey, salt);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "base64"),
    Buffer.from(hash, "base64")
  );
}
