const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const crypto = require('crypto');

const prisma = new PrismaClient();

function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

async function hashPassword(password, salt) {
  const saltBuffer = Buffer.from(salt, 'base64');
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    salt: saltBuffer,
  });
}

function generateVaultKey(masterPassword, vaultSalt) {
  const plainKey = crypto.randomBytes(32).toString('base64');
  const iv = crypto.randomBytes(12);
  // Use PBKDF2 to derive the wrapping key for compatibility with the
  // client-side PBKDF2-based unwrap implementation (100k iterations).
  const wrappingKey = crypto.pbkdf2Sync(
    masterPassword,
    Buffer.from(vaultSalt, 'base64'),
    100000,
    32,
    'sha256'
  );

  const cipher = crypto.createCipheriv('aes-256-gcm', wrappingKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainKey, 'base64'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    plainKey,
    encryptedKey: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

function hashRecoveryKey(recoveryKey, salt) {
  return crypto
    .pbkdf2Sync(recoveryKey, Buffer.from(salt, 'base64'), 100000, 64, 'sha512')
    .toString('base64');
}

function encryptCredentialPayload(payload, vaultKeyBase64) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(vaultKeyBase64, 'base64'),
    iv
  );
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    dataEnc: ciphertext.toString('base64'),
    dataIv: iv.toString('base64'),
    dataAuthTag: authTag.toString('base64'),
  };
}

async function main() {

  // Clean existing data
  await prisma.breachAlert.deleteMany({});
  await prisma.recoveryKey.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test user with secure defaults
  const masterPassword = 'TestPassword123!';
  const masterSalt = generateSalt();
  const vaultSalt = generateSalt();
  const recoverySalt = generateSalt();

  const masterPasswordHash = await hashPassword(masterPassword, masterSalt);
  const vaultKeyData = generateVaultKey(masterPassword, vaultSalt);
  const recoveryKeyPlain = 'TEST-RECOVERY-KEY-123456';
  const recoveryKeyHash = hashRecoveryKey(recoveryKeyPlain, recoverySalt);

  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'john.doe@gmail.com',
      masterPasswordHash,
      salt: masterSalt,
      kdfAlgorithm: 'argon2id',
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

  await prisma.recoveryKey.create({
    data: {
      userId: user.id,
      keyHash: recoveryKeyHash,
      salt: recoverySalt,
      status: 'active',
    },
  });

  // Create folders
  const workFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'Work',
    },
  });

  const personalFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'Personal',
    },
  });
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

  const credentialBlueprints = [
    {
      title: 'LinkedIn',
      icon: 'globe',
      folderId: workFolder.id,
      favorite: false,
      passwordStrength: 25,
      passwordReused: false,
      compromised: false,
      passwordLastChanged: new Date(),
      has2fa: false,
      payload: {
        username: 'john.doe',
        email: 'john.doe@gmail.com',
        password: 'WeakLinkedin#1',
        website: 'https://www.linkedin.com',
        notes: 'Needs stronger password',
      },
    },
    {
      title: 'GitHub',
      icon: 'gitbranch',
      folderId: workFolder.id,
      favorite: true,
      passwordStrength: 75,
      passwordReused: true,
      compromised: false,
      passwordLastChanged: new Date(),
      has2fa: true,
      payload: {
        username: 'john-github',
        email: 'john.doe@gmail.com',
        password: 'ReusedPassword!2024',
        website: 'https://github.com',
        notes: 'Reused with Slack – update soon',
      },
    },
    {
      title: 'Twitter',
      icon: 'target',
      folderId: personalFolder.id,
      favorite: false,
      passwordStrength: 60,
      passwordReused: false,
      compromised: true,
      passwordLastChanged: new Date(),
      has2fa: false,
      payload: {
        username: 'johnnyTweets',
        email: 'john.doe@gmail.com',
        password: 'CompromisedPass123!',
        website: 'https://twitter.com',
        notes: 'Reported in latest breach',
      },
    },
    {
      title: 'Facebook',
      icon: 'globe',
      folderId: personalFolder.id,
      favorite: false,
      passwordStrength: 65,
      passwordReused: false,
      compromised: false,
      passwordLastChanged: twoYearsAgo,
      has2fa: false,
      payload: {
        username: 'john.doe',
        email: 'john.doe@gmail.com',
        password: 'OldFacebookPass!2019',
        website: 'https://facebook.com',
        notes: 'Password not changed in over 2 years',
      },
    },
    {
      title: 'Gmail',
      icon: 'mail',
      folderId: workFolder.id,
      favorite: true,
      passwordStrength: 95,
      passwordReused: false,
      compromised: false,
      passwordLastChanged: new Date(),
      has2fa: true,
      payload: {
        username: 'john.doe',
        email: 'john.doe@gmail.com',
        password: 'Sup3rStrongGmail!2025',
        website: 'https://mail.google.com',
        notes: 'Primary email account',
      },
    },
    {
      title: 'Amazon',
      icon: 'wallet',
      folderId: personalFolder.id,
      favorite: false,
      passwordStrength: 85,
      passwordReused: false,
      compromised: false,
      passwordLastChanged: new Date(),
      has2fa: true,
      payload: {
        username: 'johnshopper',
        email: 'john.doe@gmail.com',
        password: 'ShoppingSecure#2025',
        website: 'https://amazon.com',
        notes: '2FA enabled via authenticator app',
      },
    },
  ];

  const credentials = [];

  for (const blueprint of credentialBlueprints) {
    const encrypted = encryptCredentialPayload(blueprint.payload, vaultKeyData.plainKey);
    const credential = await prisma.credential.create({
      data: {
        userId: user.id,
        folderId: blueprint.folderId,
        category: 'login',
        title: blueprint.title,
        icon: blueprint.icon,
        favorite: blueprint.favorite,
        dataEnc: encrypted.dataEnc,
        dataIv: encrypted.dataIv,
        dataAuthTag: encrypted.dataAuthTag,
        hasPassword: true,
        passwordStrength: blueprint.passwordStrength,
        passwordReused: blueprint.passwordReused,
        passwordLastChanged: blueprint.passwordLastChanged,
        compromised: blueprint.compromised,
        has2fa: blueprint.has2fa,
      },
    });
    credentials.push(credential);
  }

  const breachAlerts = await Promise.all([
    prisma.breachAlert.create({
      data: {
        userId: user.id,
        credentialId: credentials[0].id,
        affectedEmail: 'john.doe@gmail.com',
        breachSource: 'LinkedIn',
        breachDate: new Date('2024-01-15T00:00:00Z'),
        affectedData: '700 million user records exposed including emails and passwords',
        severity: 'critical',
        status: 'pending',
      },
    }),
    prisma.breachAlert.create({
      data: {
        userId: user.id,
        credentialId: null,
        affectedEmail: 'johndoe@work.com',
        breachSource: 'Adobe',
        breachDate: new Date('2023-12-10T00:00:00Z'),
        affectedData: 'Security breach affecting 38 million users',
        severity: 'high',
        status: 'resolved',
      },
    }),
  ]);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });