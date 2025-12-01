import prisma from "../services/prisma.service.js";
import * as cryptoService from "../services/crypto.service.js";
import { ApiError } from "../utils/ApiError.js";

/*
  Zero-Knowledge Contract Reminder:
  - Server stores only encrypted vault-key blobs and must not retain plaintext
    vault keys.
  - When changing authentication (password change), the client MUST provide
    a re-wrapped encrypted vault-key blob encrypted under the new password.
  - This controller enforces that contract: it does not attempt to decrypt or
    regenerate the user's vault key on behalf of the client.
*/

export async function updateProfile(req, res, next) {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;

    // Verify user owns this profile
    if (req.user.id !== parseInt(userId)) {
      throw new ApiError(403, "Unauthorized");
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { username, email },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
}

export async function changeMasterPassword(req, res, next) {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    // For zero-knowledge, client must provide the re-wrapped encrypted vault key
    const {
      encryptedVaultKey: clientEncryptedVaultKey,
      vaultKeyIv: clientVaultKeyIv,
      vaultKeyAuthTag: clientVaultKeyAuthTag,
      vaultSalt: clientVaultSalt,
    } = req.body;

    if (req.user.id !== parseInt(userId)) {
      throw new ApiError(403, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    // Verify current password
    const isValid = await cryptoService.verifyPassword(
      currentPassword,
      user.masterPasswordHash,
      user.salt
    );

    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Verify client provided re-wrapped blob
    if (!clientEncryptedVaultKey || !clientVaultKeyIv || !clientVaultKeyAuthTag || !clientVaultSalt) {
      throw new ApiError(400, "Missing re-encrypted vault key blob from client");
    }

    const newSalt = cryptoService.generateSalt();
    const newPasswordHash = await cryptoService.hashPassword(newPassword, newSalt);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        masterPasswordHash: newPasswordHash,
        salt: newSalt,
        encryptedVaultKey: clientEncryptedVaultKey,
        vaultKeyIv: clientVaultKeyIv,
        vaultKeyAuthTag: clientVaultKeyAuthTag,
        vaultSalt: clientVaultSalt,
      },
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
}

export async function verifyPassword(req, res, next) {
  try {
    const { userId } = req.params;
    const { masterPassword } = req.body;

    if (req.user.id !== parseInt(userId)) {
      throw new ApiError(403, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    const isValid = await cryptoService.verifyPassword(
      masterPassword,
      user.masterPasswordHash,
      user.salt
    );

    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function updateLastLogin(req, res, next) {
  try {
    const { userId } = req.params;

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { lastLogin: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function generateRecoveryKey(req, res, next) {
  try {
    const { userId } = req.params;
    const { masterPassword, recoveryKey } = req.body;
    // Optional: client may include a recovery-wrapped vault blob so the
    // recovery key can directly decrypt the vault (Dual‑wrap)
    const {
      encryptedVaultKeyRecovery: clientEncryptedVaultKey,
      vaultKeyRecoveryIv: clientVaultKeyIv,
      vaultKeyRecoveryAuthTag: clientVaultKeyAuthTag,
      vaultRecoverySalt: clientVaultSalt,
      recoveryKdfIterations: clientKdfIterations,
    } = req.body;

    if (req.user.id !== parseInt(userId)) {
      throw new ApiError(403, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    // Verify master password
    const isValid = await cryptoService.verifyPassword(
      masterPassword,
      user.masterPasswordHash,
      user.salt
    );

    if (!isValid) {
      throw new ApiError(401, "Invalid master password");
    }

    // Revoke old recovery keys and create new one
    const salt = cryptoService.generateSalt();
    const keyHash = await cryptoService.hashRecoveryKey(recoveryKey, salt);

    await prisma.$transaction(async (tx) => {
      // Revoke all active keys
      await tx.recoveryKey.updateMany({
        where: {
          userId: parseInt(userId),
          status: "active",
        },
        data: {
          status: "revoked",
          revokedAt: new Date(),
        },
      });

      // Create new key
      await tx.recoveryKey.create({
        data: {
          userId: parseInt(userId),
          keyHash,
          salt,
          status: "active",
          encryptedVaultKey: clientEncryptedVaultKey || null,
          vaultKeyIv: clientVaultKeyIv || null,
          vaultKeyAuthTag: clientVaultKeyAuthTag || null,
          vaultSalt: clientVaultSalt || null,
          kdfIterations: clientKdfIterations || 100000,
        },
      });
    });

    res.json({
      success: true,
      message: "Recovery key generated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryKeys(req, res, next) {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId)) {
      throw new ApiError(403, "Unauthorized");
    }

    const keys = await prisma.recoveryKey.findMany({
      where: { userId: parseInt(userId) },
      select: {
        id: true,
        status: true,
        createdAt: true,
        usedAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, recoveryKeys: keys });
  } catch (error) {
    next(error);
  }
}
