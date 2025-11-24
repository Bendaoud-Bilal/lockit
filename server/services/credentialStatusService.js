/**
 * Determines if a credential should be marked as compromised based on its strength.
 * @param {number | null | undefined} passwordStrength - The calculated password strength (e.g., 0-100).
 * @returns {boolean} - True if compromised (strength < 30), false otherwise.
 */
export function checkCompromised(passwordStrength) {
  // Ensure strength is a number before comparison
  const strengthScore = Number(passwordStrength);
  if (isNaN(strengthScore)) {
    // Default to not compromised if strength is not a valid number
    return false; 
  }
  return strengthScore < 30;
}

/**
 * Checks if the given encrypted password data is already used by another active credential for the same user.
 * @param {object} prisma - The Prisma Client instance.
 * @param {number} userId - The ID of the user owning the credential.
 * @param {object} encryptedData - Object containing { dataEnc, dataIv, dataAuthTag }.
 * @param {number | undefined} currentCredentialId - The ID of the credential being updated (undefined if creating).
 * @returns {Promise<boolean>} - True if the password is reused, false otherwise.
 */
export async function checkReuse(prisma, userId, encryptedData, currentCredentialId) {
  const { dataEnc, dataIv, dataAuthTag } = encryptedData;

  // Basic validation
  if (!userId || !dataEnc || !dataIv || !dataAuthTag) {
    console.warn('Cannot check password reuse: Missing userId or encrypted data fields.');
    return false; // Cannot perform check, assume not reused
  }

  // Construct the query to find other credentials with the same encrypted data
  const whereClause = {
    userId: Number(userId),
    dataEnc: dataEnc,
    dataIv: dataIv,
    dataAuthTag: dataAuthTag,
    state: 'active', // Only compare against active credentials
  };

  // If we are updating an existing credential, exclude it from the search
  if (currentCredentialId !== undefined) {
    whereClause.id = { not: Number(currentCredentialId) };
  }

  try {
    const count = await prisma.credential.count({
      where: whereClause,
    });
    return count > 0; // If count > 0, the password is reused
  } catch (error) {
    console.error('Prisma error during password reuse check:', error);
    // In case of error, default to false to avoid incorrectly flagging reuse
    return false; 
  }
}
