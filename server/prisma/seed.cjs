const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.breachAlert.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Cleaned existing data');

  // Create test user
  const salt = await bcrypt.genSalt(10);
  const masterPasswordHash = await bcrypt.hash('TestPassword123!', salt);

  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'john.doe@gmail.com',
      masterPasswordHash,
      salt,
      kdfAlgorithm: 'argon2id',
      argon2Iterations: 3,
      kdfMemory: 65536,
      kdfParallelism: 4,
      encryptedVaultKey: 'dummy_encrypted_key',
      vaultKeyIv: 'dummy_iv',
      vaultKeyAuthTag: 'dummy_auth_tag',
      vaultSalt: 'dummy_vault_salt',
      masterKeyKdfIterations: 100000,
    },
  });

  console.log('✅ Created test user:', user.username);

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

  console.log('✅ Created folders');

  // Create credentials with various security states
  const now = new Date();
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const twoYearsAgo = new Date(now.setFullYear(now.getFullYear() - 2));

  const credentials = await Promise.all([
    // Weak password
    prisma.credential.create({
      data: {
        userId: user.id,
        folderId: workFolder.id,
        category: 'login',
        title: 'LinkedIn',
        icon: '🔗',
        favorite: false,
        dataEnc: 'encrypted_linkedin_data',
        dataIv: 'iv_linkedin',
        dataAuthTag: 'auth_linkedin',
        hasPassword: true,
        passwordStrength: 25, // Weak
        passwordReused: false,
        passwordLastChanged: new Date(),
        compromised: false,
        has2fa: false,
      },
    }),

    // Reused password
    prisma.credential.create({
      data: {
        userId: user.id,
        folderId: workFolder.id,
        category: 'login',
        title: 'GitHub',
        icon: '💻',
        favorite: true,
        dataEnc: 'encrypted_github_data',
        dataIv: 'iv_github',
        dataAuthTag: 'auth_github',
        hasPassword: true,
        passwordStrength: 75,
        passwordReused: true, // Reused
        passwordLastChanged: new Date(),
        compromised: false,
        has2fa: true,
      },
    }),

    // Exposed/Compromised password
    prisma.credential.create({
      data: {
        userId: user.id,
        folderId: personalFolder.id,
        category: 'login',
        title: 'Twitter',
        icon: '🐦',
        favorite: false,
        dataEnc: 'encrypted_twitter_data',
        dataIv: 'iv_twitter',
        dataAuthTag: 'auth_twitter',
        hasPassword: true,
        passwordStrength: 60,
        passwordReused: false,
        passwordLastChanged: new Date(),
        compromised: true, // Exposed
        has2fa: false,
      },
    }),

    // Old password
    prisma.credential.create({
      data: {
        userId: user.id,
        folderId: personalFolder.id,
        category: 'login',
        title: 'Facebook',
        icon: '📘',
        favorite: false,
        dataEnc: 'encrypted_facebook_data',
        dataIv: 'iv_facebook',
        dataAuthTag: 'auth_facebook',
        hasPassword: true,
        passwordStrength: 65,
        passwordReused: false,
        passwordLastChanged: twoYearsAgo, // Old
        compromised: false,
        has2fa: false,
      },
    }),

    // Strong password (good example)
    prisma.credential.create({
      data: {
        userId: user.id,
        folderId: workFolder.id,
        category: 'login',
        title: 'Gmail',
        icon: '📧',
        favorite: true,
        dataEnc: 'encrypted_gmail_data',
        dataIv: 'iv_gmail',
        dataAuthTag: 'auth_gmail',
        hasPassword: true,
        passwordStrength: 95, // Strong
        passwordReused: false,
        passwordLastChanged: new Date(),
        compromised: false,
        has2fa: true,
      },
    }),

    // Another strong one
    prisma.credential.create({
      data: {
        userId: user.id,
        folderId: personalFolder.id,
        category: 'login',
        title: 'Amazon',
        icon: '🛒',
        favorite: false,
        dataEnc: 'encrypted_amazon_data',
        dataIv: 'iv_amazon',
        dataAuthTag: 'auth_amazon',
        hasPassword: true,
        passwordStrength: 85,
        passwordReused: false,
        passwordLastChanged: new Date(),
        compromised: false,
        has2fa: true,
      },
    }),
  ]);

  console.log('✅ Created', credentials.length, 'credentials');

  // Create breach alerts
  const breachAlerts = await Promise.all([
    prisma.breachAlert.create({
      data: {
        userId: user.id,
        credentialId: credentials[0].id, // LinkedIn
        affectedEmail: 'john.doe@gmail.com',
        breachSource: 'LinkedIn',
        breachDate: new Date('2024-01-15'),
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
        breachDate: new Date('2023-12-10'),
        affectedData: 'Security breach affecting 38 million users',
        severity: 'high',
        status: 'resolved',
      },
    }),
  ]);

  console.log('✅ Created', breachAlerts.length, 'breach alerts');

  console.log('🎉 Seeding completed successfully!');
  console.log('\nTest User Credentials:');
  console.log('  Username:', user.username);
  console.log('  Email:', user.email);
  console.log('  Password: TestPassword123!');
  console.log('  User ID:', user.id);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });