import { PrismaClient } from '@prisma/client';
import { checkCompromised, checkReuse } from '../services/credentialStatusService.js';

const prisma = new PrismaClient();

// --- PRISMA MIDDLEWARE FOR CREDENTIALS ---
prisma.$use(async (params, next) => {
  // Intercept 'create' and 'update' operations on the 'Credential' model
  if (params.model === 'Credential' && (params.action === 'create' || params.action === 'update')) {
    
    // params.args.data contains the data being written
    const credentialData = params.args.data;
    
    // --- 1. Call Compromised Check Service ---
    // Ensure passwordStrength is present before calling
    if (credentialData.passwordStrength !== undefined) {
        credentialData.compromised = checkCompromised(credentialData.passwordStrength);
    } else if (credentialData.hasPassword === true) {
         // If it's a password credential but strength is missing, log a warning
         console.warn(`Credential ID ${params.args.where?.id || '(new)'} is missing passwordStrength. 'compromised' status might be inaccurate.`);
         // Decide on a default: perhaps assume compromised if strength is unknown?
         // credentialData.compromised = true; // Or false, depending on desired default
    } else {
         credentialData.compromised = false; // Not a password credential
    }

    // --- 2. Call Reuse Check Service ---
    // Check if necessary data is available for the reuse check
    if (credentialData.userId && credentialData.dataEnc && credentialData.dataIv && credentialData.dataAuthTag) {
      const encryptedData = {
        dataEnc: credentialData.dataEnc,
        dataIv: credentialData.dataIv,
        dataAuthTag: credentialData.dataAuthTag,
      };
      // Get the ID if it's an update operation
      const currentCredentialId = params.action === 'update' ? params.args.where?.id : undefined;
      
      // Call the service function (awaits the promise)
      credentialData.passwordReused = await checkReuse(prisma, credentialData.userId, encryptedData, currentCredentialId);

    } else if (credentialData.hasPassword === true) {
        // If it should have encrypted data but doesn't, log a warning
        console.warn(`Credential ID ${params.args.where?.id || '(new)'} is missing encrypted data. 'passwordReused' check skipped.`);
        // Default to false if check cannot be performed
        credentialData.passwordReused = false; 
    } else {
        credentialData.passwordReused = false; // Not a password credential
    }

    // Update the arguments that will be used in the actual Prisma operation
    params.args.data = credentialData;
  }

  // Continue the Prisma operation (either next middleware or the database action)
  return next(params);
});
// --- END PRISMA MIDDLEWARE ---

// Export the configured prisma instance
export default prisma;
