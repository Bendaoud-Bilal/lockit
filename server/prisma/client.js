import { PrismaClient } from '@prisma/client';
import { checkCompromised, checkReuse } from '../services/credentialStatusService.js';

const basePrisma = new PrismaClient();

// --- PRISMA CLIENT EXTENSION FOR CREDENTIALS ---
const prisma = basePrisma.$extends({
  query: {
    credential: {
      async create({ args, query }) {
        return handleCredentialOperation(args, query, 'create');
      },
      async update({ args, query }) {
        return handleCredentialOperation(args, query, 'update');
      },
    },
  },
});

// Helper function to handle credential operations
async function handleCredentialOperation(args, query, action) {
  const credentialData = args.data;

  // --- 1. Call Compromised Check Service ---
  if (credentialData.passwordStrength !== undefined) {
    credentialData.compromised = checkCompromised(credentialData.passwordStrength);
  } else if (credentialData.hasPassword === true) {
    console.warn(`Credential ID ${args.where?.id || '(new)'} is missing passwordStrength. 'compromised' status might be inaccurate.`);
    // credentialData.compromised = true; // Or your preferred default
  } else {
    credentialData.compromised = false;
  }

  // --- 2. Call Reuse Check Service ---
  if (credentialData.userId && credentialData.dataEnc && credentialData.dataIv && credentialData.dataAuthTag) {
    const encryptedData = {
      dataEnc: credentialData.dataEnc,
      dataIv: credentialData.dataIv,
      dataAuthTag: credentialData.dataAuthTag,
    };
    const currentCredentialId = action === 'update' ? args.where?.id : undefined;
    
    credentialData.passwordReused = await checkReuse(
      basePrisma, // Use the base client for queries inside the extension
      credentialData.userId,
      encryptedData,
      currentCredentialId
    );
  } else if (credentialData.hasPassword === true) {
    console.warn(`Credential ID ${args.where?.id || '(new)'} is missing encrypted data. 'passwordReused' check skipped.`);
    credentialData.passwordReused = false;
  } else {
    credentialData.passwordReused = false;
  }

  // Update args with modified data
  args.data = credentialData;

  // Execute the query with modified data
  return query(args);
}

// --- END PRISMA CLIENT EXTENSION ---

// Export the extended prisma instance
export default prisma;