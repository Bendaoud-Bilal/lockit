import prisma from "../services/prisma.service.js";
import * as cryptoService from "../services/crypto.service.js";
import * as sessionService from "../services/session.service.js";
import { ApiError } from "../utils/ApiError.js";

export async function signup(req, res, next) {
  try {
    const { username, email, masterPassword, recoveryKey } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: email || undefined }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "Username or email already exists");
    }

    const masterSalt = cryptoService.generateSalt();
    const vaultSalt = cryptoService.generateSalt();
    const recoveryKeySalt = cryptoService.generateSalt();

    const masterPasswordHash = await cryptoService.hashPassword(
      masterPassword,
      masterSalt
    );

    const vaultKeyData = await cryptoService.generateVaultKey(
      masterPassword,
      vaultSalt
    );

    const recoveryKeyHash = await cryptoService.hashRecoveryKey(
      recoveryKey,
      recoveryKeySalt
    );

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          masterPasswordHash,
          salt: masterSalt,
          kdfAlgorithm: "argon2id",
          argon2Iterations: 3,
          kdfMemory: 65536,
          kdfParallelism: 4,
          encryptedVaultKey: vaultKeyData.encryptedKey,
          vaultKeyIv: vaultKeyData.iv,
          vaultKeyAuthTag: vaultKeyData.authTag,
          vaultSalt,
          masterKeyKdfIterations: 100000,
        },
      });

      await tx.recoveryKey.create({
        data: {
          userId: newUser.id,
          keyHash: recoveryKeyHash,
          salt: recoveryKeySalt,
          status: "active",
        },
      });

      return newUser;
    });

    const token = sessionService.createSession(user.id);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
      vaultKey: vaultKeyData.plainKey,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { usernameOrEmail, masterPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await cryptoService.verifyPassword(
      masterPassword,
      user.masterPasswordHash,
      user.salt
    );

    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const vaultKey = await cryptoService.decryptVaultKey(
      user.encryptedVaultKey,
      user.vaultKeyIv,
      user.vaultKeyAuthTag,
      masterPassword,
      user.vaultSalt
    );

    const token = sessionService.createSession(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
      vaultKey,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyRecoveryKey(req, res, next) {
  try {
    const { usernameOrEmail, recoveryKey } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      include: {
        recoveryKeys: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || user.recoveryKeys.length === 0) {
      throw new ApiError(400, "Invalid recovery key");
    }

    const activeKey = user.recoveryKeys[0];
    const isValid = await cryptoService.verifyRecoveryKey(
      recoveryKey,
      activeKey.keyHash,
      activeKey.salt
    );

    if (!isValid) {
      throw new ApiError(400, "Invalid recovery key");
    }

    res.json({ success: true, message: "Recovery key verified" });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { usernameOrEmail, recoveryKey, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      include: {
        recoveryKeys: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || user.recoveryKeys.length === 0) {
      throw new ApiError(400, "Invalid recovery key");
    }

    const activeKey = user.recoveryKeys[0];
    const isValid = await cryptoService.verifyRecoveryKey(
      recoveryKey,
      activeKey.keyHash,
      activeKey.salt
    );

    if (!isValid) {
      throw new ApiError(400, "Invalid recovery key");
    }

    const newMasterSalt = cryptoService.generateSalt();
    const newVaultSalt = cryptoService.generateSalt();

    const newMasterPasswordHash = await cryptoService.hashPassword(
      newPassword,
      newMasterSalt
    );

    const newVaultKeyData = await cryptoService.generateVaultKey(
      newPassword,
      newVaultSalt
    );

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          masterPasswordHash: newMasterPasswordHash,
          salt: newMasterSalt,
          encryptedVaultKey: newVaultKeyData.encryptedKey,
          vaultKeyIv: newVaultKeyData.iv,
          vaultKeyAuthTag: newVaultKeyData.authTag,
          vaultSalt: newVaultSalt,
        },
      });

      await tx.recoveryKey.update({
        where: { id: activeKey.id },
        data: {
          status: "used",
          usedAt: new Date(),
        },
      });
    });

    res.json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password and generate a new recovery key.",
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    sessionService.destroySession(req.sessionId);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}
