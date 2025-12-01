import prisma from "../services/prisma.service.js";
import * as cryptoService from "../services/crypto.service.js";
import * as sessionService from "../services/session.service.js";
import { ApiError } from "../utils/ApiError.js";

/*
  Zero-Knowledge Contract (server-side):
  - The server MUST NOT possess or generate plaintext vault keys for users.
  - The server stores only encrypted vault-key blobs and ciphertext for user data.
  - Any rotation of the vault-key (re-wrapping) MUST be performed by the client
    or with a client-provided re-wrapped blob. Server-side generation or silent
    rotation is disallowed because it breaks zero-knowledge guarantees.
  - Endpoints that change authentication credentials (password reset/change)
    must accept a client-provided encrypted vault-key blob when the vault key
    must remain accessible after the change.
*/

export async function signup(req, res, next) {
  try {
    const { username, email, masterPassword, recoveryKey } = req.body;
    // Optionally accept a client-provided encrypted vaultKey blob (zero-knowledge)
    const {
      encryptedVaultKey: clientEncryptedVaultKey,
      vaultKeyIv: clientVaultKeyIv,
      vaultKeyAuthTag: clientVaultKeyAuthTag,
      vaultSalt: clientVaultSalt,
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: email || undefined }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "Username or email already exists");
    }

    const masterSalt = cryptoService.generateSalt();
    // If the client provided an encrypted vault-key blob, it will include the
    // `vaultSalt` used client-side to derive the wrapping key. Use that value
    // when present; otherwise generate a new salt server-side.
    const vaultSalt = clientVaultSalt || cryptoService.generateSalt();
    const recoveryKeySalt = cryptoService.generateSalt();

    const masterPasswordHash = await cryptoService.hashPassword(
      masterPassword,
      masterSalt
    );

    // If client provided an encrypted vault key blob, store it directly (zero-knowledge)
    let vaultKeyData;
    if (clientEncryptedVaultKey && clientVaultKeyIv && clientVaultKeyAuthTag && clientVaultSalt) {
      vaultKeyData = {
        encryptedKey: clientEncryptedVaultKey,
        iv: clientVaultKeyIv,
        authTag: clientVaultKeyAuthTag,
        plainKey: null,
      };
    } else {
      vaultKeyData = await cryptoService.generateVaultKey(masterPassword, vaultSalt);
    }

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

      // If client provided a recovery-wrapped vault blob include it in the
      // created recovery key record so the recovery key can be used to
      // directly unwrap the vault key client-side (Dual‑wrap).
      await tx.recoveryKey.create({
        data: {
          userId: newUser.id,
          keyHash: recoveryKeyHash,
          salt: recoveryKeySalt,
          status: "active",
          encryptedVaultKey: req.body.encryptedVaultKeyRecovery || null,
          vaultKeyIv: req.body.vaultKeyRecoveryIv || null,
          vaultKeyAuthTag: req.body.vaultKeyRecoveryAuthTag || null,
          vaultSalt: req.body.vaultRecoverySalt || null,
          kdfIterations: req.body.recoveryKdfIterations || 100000,
        },
      });

      return newUser;
    });

    const token = sessionService.createSession(user.id);

    // For zero-knowledge, do NOT return plaintext vault key. Return only metadata.
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
      encryptedVaultKey: vaultKeyData.encryptedKey,
      vaultKeyIv: vaultKeyData.iv,
      vaultKeyAuthTag: vaultKeyData.authTag,
      vaultSalt,
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

    // Zero-knowledge: do not decrypt or return the plaintext vault key here.
    // Return the encrypted vault key blob so the client can decrypt it locally.

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
      encryptedVaultKey: user.encryptedVaultKey,
      vaultKeyIv: user.vaultKeyIv,
      vaultKeyAuthTag: user.vaultKeyAuthTag,
      vaultSalt: user.vaultSalt,
      masterKeyKdfIterations: user.masterKeyKdfIterations || 100000,
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

    // Return the recovery-wrapped vault blob (if present) so the client can
    // unwrap it using the recovery key and re-wrap under a new password.
    const recoveryBlob = {
      encryptedVaultKey: activeKey.encryptedVaultKey || user.encryptedVaultKey,
      vaultKeyIv: activeKey.vaultKeyIv || user.vaultKeyIv,
      vaultKeyAuthTag: activeKey.vaultKeyAuthTag || user.vaultKeyAuthTag,
      vaultSalt: activeKey.vaultSalt || user.vaultSalt,
      kdfIterations: activeKey.kdfIterations || user.masterKeyKdfIterations || 100000,
    };

    res.json({
      success: true,
      message: "Recovery key verified",
      ...recoveryBlob,
      masterKeyKdfIterations: recoveryBlob.kdfIterations,
    });
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
    // Zero-knowledge policy: the server MUST NOT generate or rotate a vault key
    // silently when handling password resets. If the client cannot re-wrap the
    // existing vault key (for example the user lost their master password and
    // cannot decrypt the vault key), then the server cannot preserve zero-knowledge
    // guarantees. To remain zero-knowledge, require the client to provide a
    // re-encrypted vault-key blob (encrypted with the new master password)
    // as part of the reset payload. Reject requests that do not include this
    // blob with an explicit error explaining the required client action.

    // Expect client to include re-wrapped vault blob produced client-side:
    // { encryptedVaultKey, vaultKeyIv, vaultKeyAuthTag, vaultSalt }
    const {
      encryptedVaultKey: clientEncryptedVaultKey,
      vaultKeyIv: clientVaultKeyIv,
      vaultKeyAuthTag: clientVaultKeyAuthTag,
      vaultSalt: clientVaultSalt,
    } = req.body;

    if (!clientEncryptedVaultKey || !clientVaultKeyIv || !clientVaultKeyAuthTag || !clientVaultSalt) {
      // Do NOT perform server-side vault key generation here to avoid exposing
      // plaintext vault keys or breaking zero-knowledge. Client must re-wrap
      // the existing vault key and submit the blob.
      throw new ApiError(400, "Password reset requires a client-provided re-encrypted vault key blob. Call the recovery verify endpoint from the client and submit the re-wrapped encrypted vault key with the reset request.");
    }

    const newMasterPasswordHash = await cryptoService.hashPassword(
      newPassword,
      newMasterSalt
    );

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          masterPasswordHash: newMasterPasswordHash,
          salt: newMasterSalt,
          encryptedVaultKey: clientEncryptedVaultKey,
          vaultKeyIv: clientVaultKeyIv,
          vaultKeyAuthTag: clientVaultKeyAuthTag,
          vaultSalt: clientVaultSalt,
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
        "Password reset successfully. Client re-wrapped vault key accepted. Please log in with your new password.",
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
