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
 * Get user's vault key from database
 * @param {number} userId - User ID
 * @returns {string} - Vault key (hex string)
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
export async function createEncryptedTotpItem(userId,credentialId, secret, serviceName, accountName, issuer = null) {
  try {
    if ( !secret || !serviceName) {
      throw new ApiError(400, "Credential ID, secret, and service name are required");
    }

    // Get user's vault key
    const vaultKey = await getUserVaultKey(userId);

    // Encrypt the secret
    const encrypted = encryptTotpSecret(secret, vaultKey);

    // Save to database
    const totpSecret = await prisma.totpSecret.create({
      data: {
        credentialId,
        serviceName,
        accountName,
        issuer: issuer || serviceName, // Use serviceName as default issuer
        encryptedSecret: encrypted.encryptedSecret,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
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
    const updateCredential=await prisma.credential.update({
      where:{
        id:credentialId
      },
      data:{
        has2fa: true
      }
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
 * Get and decrypt TOTP secret
 * @param {number} totpId - TOTP entry ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Object} - TOTP entry with decrypted secret
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

    // Get user's vault key
    const vaultKey = await getUserVaultKey(userId);

    // Decrypt the secret
    const decryptedSecret = decryptTotpSecret(
      totpSecret.secretIv,
      totpSecret.encryptedSecret,
      totpSecret.secretAuthTag,
      vaultKey
    );

    return {
      id: totpSecret.id,
      credentialId: totpSecret.credentialId,
      serviceName: totpSecret.serviceName,
      accountName: totpSecret.accountName,
      issuer: totpSecret.issuer,
      secret: decryptedSecret,
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
        credential: {
          userId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = [];
    for (const item of totpSecrets) {
      const decrypted = decryptTotpSecret(
        item.secretIv,
        item.encryptedSecret,
        item.secretAuthTag,
        await getUserVaultKey(userId)
      );

      result.push({
        id: item.id,
        serviceName: item.serviceName,
        accountName: item.accountName,
        secret: decrypted, 
      });
    }

    return result;
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

    // Check ownership
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

