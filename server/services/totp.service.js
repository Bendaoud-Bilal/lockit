import crypto from "crypto";
import prisma from "./prisma.service.js";
import { ApiError } from "../utils/ApiError.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * Encrypt TOTP secret using user's vault key
 * @param {string} secret - Plain TOTP secret to encrypt
 * @param {string} vaultkey - User's vault key (base64 string)
 * @returns {Object} - Object containing iv, encryptedSecret, and authTag
 */

export function encryptTotpSecret(secret, vaultKeyBase64) {
  try {
    if (!secret) {
      throw new ApiError(400, "Secret is required for encryption");
    }

    if (!vaultKeyBase64) {
      throw new ApiError(400, "Vault key is required for encryption");
    }

    // Convert vault key from base64 to Buffer
    const keyBuffer = Buffer.from(vaultKeyBase64, "base64");

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    // Encrypt the secret
    let encrypted = cipher.update(secret, "utf-8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      encryptedSecret: encrypted,
      authTag: authTag.toString("hex"),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Encryption error: ${error.message}`);
  }
}

/**
 * Decrypt TOTP secret using user's vault key
 * @param {string} iv - Initialization vector (hex string)
 * @param {string} encryptedSecret - Encrypted secret (hex string)
 * @param {string} authTag - Authentication tag (hex string)
 * @param {string} vaultKey - vault key (base64 string)
 * @returns {string} - Decrypted secret
 */
export function decryptTotpSecret(iv, encryptedSecret, authTag, vaultKeyBase64) {
  try {
    if (!iv || !encryptedSecret || !authTag || !vaultKeyBase64) {
      throw new ApiError(400, "All decryption parameters are required");
    }

    // Convert hex strings to Buffers
    const ivBuffer = Buffer.from(iv, "hex");
    const vaultKey = Buffer.from(vaultKeyBase64, "base64");
    const authTagBuffer = Buffer.from(authTag, "hex");

    // Validate key length
    if (vaultKey.length !== 32) {
      throw new ApiError(400, "Invalid vault key length");
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, vaultKey, ivBuffer);

    // Set auth tag for GCM mode
    decipher.setAuthTag(authTagBuffer);

    // Decrypt
    let decrypted = decipher.update(encryptedSecret, "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Decryption error: ${error.message}`);
  }
}

/**
 * WARNING/DEPRECATED: This function DOES NOT return a plaintext vault key.
 * It returns the stored encrypted vault-key blob (`encryptedVaultKey`).
 *
 * Keep serverside code from attempting to decrypt or use this value as a
 * plaintext key. The server must never possess users' plaintext vault keys
 * in a zero-knowledge architecture. This helper exists only for legacy
 * compatibility and should not be used to perform server-side decryption.
 *
 * @param {number} userId - User ID
 * @returns {string} - Encrypted vault key blob (base64/hex string)
 */
export async function getUserVaultKey(userId) {
  try {
    if (!userId) {
      throw new ApiError(401, "User ID is required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptedVaultKey: true },
    });

    if (!user || !user.encryptedVaultKey) {
      throw new ApiError(404, "User vault key not found");
    }
    return user.encryptedVaultKey;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error fetching vault key: ${error.message}`);
  }
}

/**
 * Encrypt and save TOTP secret for a user
 * @param {number} credentialId - Credential ID
 * @param {string} secret - Plain TOTP secret
 * @param {string} serviceName - Service name (e.g., "Google", "GitHub")
 * @param {string} accountName - Account name (optional)
 * @param {string} issuer - Issuer of the TOTP (optional, defaults to serviceName)
 * @returns {Object} - Created TOTP entry (without decrypted secret)
 */
export async function createEncryptedTotpItem(userId, credentialId, payload, serviceName, accountName, issuer = null) {
  try {
    if (!payload || !serviceName) {
      throw new ApiError(400, "Credential ID, payload, and service name are required");
    }

    // Payload can be either { encryptedSecret, iv, authTag } provided by client
    // or { plainSecret } for legacy server-side encryption
    let encryptedSecret;
    let iv;
    let authTag;

    // Only accept client-provided encrypted blobs to maintain zero-knowledge
    // guarantees. Reject any attempt to submit plaintext `plainSecret`.
    if (payload.encryptedSecret && payload.iv && payload.authTag) {
      encryptedSecret = payload.encryptedSecret;
      iv = payload.iv;
      authTag = payload.authTag;
    } else if (payload.plainSecret) {
      throw new ApiError(400, "Plaintext TOTP secrets are not accepted. Please encrypt the secret client-side and submit the encrypted blob.");
    } else {
      throw new ApiError(400, "Invalid TOTP payload");
    }

    const totpSecret = await prisma.totpSecret.create({
      data: {
        credentialId,
        serviceName,
        accountName,
        issuer: issuer || serviceName,
        encryptedSecret,
        secretIv: iv,
        secretAuthTag: authTag,
      },
      select: {
        id: true,
        serviceName: true,
        accountName: true,
        issuer: true,
        algorithm: true,
        digits: true,
        period: true,
        state: true,
        createdAt: true,
      },
    });

    await prisma.credential.update({
      where: { id: credentialId },
      data: { has2fa: true },
    });

    return totpSecret;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error creating TOTP entry: ${error.message}`);
  }
}

/**
 * Get TOTP entry encrypted blob for client-side decryption
 * @param {number} credentialid - Credential ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Object} - TOTP entry with encryptedSecret, secretIv, secretAuthTag
 *
 * Note: Despite the historic name, this function does NOT perform server-side
 * decryption. It returns the encrypted blob so the client can decrypt locally
 * using the user's in-memory vault key (zero-knowledge).
 */
export async function getDecryptedSecret(credentialid, userId) {
  try {
    if (!credentialid || !userId) {
      throw new ApiError(400, "credential ID and User ID are required");
    }

    // Fetch TOTP entry with credential
    const totpSecret = await prisma.totpSecret.findUnique({
      where: { credentialId: credentialid },
      include: {
        credential: {
          select: { userId: true },
        },
      },
    });

    if (!totpSecret) {
      throw new ApiError(404, "TOTP entry not found");
    }

    // Authorization check
    if (totpSecret.credential.userId !== userId) {
      throw new ApiError(403, "Unauthorized access to TOTP entry");
    }

    // Return encrypted blob to client for local decryption (zero-knowledge)
    return {
      id: totpSecret.id,
      credentialId: totpSecret.credentialId,
      serviceName: totpSecret.serviceName,
      accountName: totpSecret.accountName,
      issuer: totpSecret.issuer,
      encryptedSecret: totpSecret.encryptedSecret,
      secretIv: totpSecret.secretIv,
      secretAuthTag: totpSecret.secretAuthTag,
      algorithm: totpSecret.algorithm,
      digits: totpSecret.digits,
      period: totpSecret.period,
      state: totpSecret.state,
      createdAt: totpSecret.createdAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error retrieving TOTP entry: ${error.message}`);
  }
}

/**
 * Get all TOTP entries for a user (without decrypted secrets)
 * @param {number} userId - User ID
 * @returns {Array} - Array of TOTP entries
 */
export async function getUserTotps(userId) {
  try {
    if (!userId) {
      throw new ApiError(401, "User ID is required");
    }
    const totpSecrets = await prisma.totpSecret.findMany({
      where: {
        credential: {userId :userId}
      },
    });
    // Return encrypted TOTP entries for client-side decryption
    return totpSecrets.map((item) => ({
      id: item.id,
      serviceName: item.serviceName,
      accountName: item.accountName,
      encryptedSecret: item.encryptedSecret,
      secretIv: item.secretIv,
      secretAuthTag: item.secretAuthTag,
      state: item.state,
    }));
  } catch (error) {
    throw new ApiError(500, `Error fetching TOTP entries: ${error.message}`);
  }
}


/**
 * Delete a TOTP entry
 * @param {number} totpId - TOTP entry ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Object} - Deleted TOTP entry
 */
export async function deleteTotp(totpId, userId) {
  try {
    if (!totpId || !userId) {
      throw new ApiError(400, "TOTP ID and User ID are required");
    }

    const totpSecret = await prisma.totpSecret.findUnique({
      where: { id: totpId },
      include: {
        credential: {
          select: { id:true,userId: true },
        },
      },
    });

      await prisma.credential.update({
      where:{id:totpSecret.credential.id},
      data:{
        has2fa:false
      },
    });

    if (!totpSecret) {
      throw new ApiError(404, "TOTP entry not found");
    }

    if (totpSecret.credential.userId !== userId) {
      throw new ApiError(403, "Unauthorized to delete this TOTP entry");
    }

    // Delete
    await prisma.totpSecret.delete({
      where: { id: totpId },
    });

    return { success: true, message: "TOTP entry deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error deleting TOTP entry: ${error.message}`);
  }
}

/**
 * Update TOTP entry state
 * @param {number} totpId - TOTP entry ID
 * @param {number} userId - User ID (for authorization)
 * @param {string} state - New state ('active' or 'archived')
 * @returns {Object} - Updated TOTP entry
 */
export async function updateTotpState(totpId, userId, state) {
  try {
    if (!totpId || !userId || !state) {
      throw new ApiError(400, "TOTP ID, User ID, and state are required");
    }

    if (!["active", "archived"].includes(state)) {
      throw new ApiError(400, "Invalid state. Must be 'active' or 'archived'");
    }

    // Check ownership
    const totpSecret = await prisma.totpSecret.findUnique({
      where: { id: totpId },
      include: {
        credential: {
          select: { userId: true },
        },
      },
    });

    if (!totpSecret) {
      throw new ApiError(404, "TOTP entry not found");
    }

    if (totpSecret.credential.userId !== userId) {
      throw new ApiError(403, "Unauthorized to update this TOTP entry");
    }

    // Update state
    const updated = await prisma.totpSecret.update({
      where: { id: totpId },
      data: { state },
      select: {
        id: true,
        credentialId: true,
        serviceName: true,
        accountName: true,
        issuer: true,
        state: true,
        createdAt: true,
      },
    });

    return updated;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error updating TOTP entry: ${error.message}`);
  }
}

