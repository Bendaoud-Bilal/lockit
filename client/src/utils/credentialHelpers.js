/**
 * Client-side Helper functions for working with credentials
 * 
 * Note: Vault key is assumed to be a Base64 string received from the server
 * after successful authentication. Store it in sessionStorage or context.
 */

import {
  encryptCredential,
  decryptCredential,
  calculatePasswordStrength
} from './crypto';

/**
 * Prepare credential data for sending to server (encrypts sensitive data)
 * @param {Object} credentialData - Raw credential data from form
 * @param {string} vaultKeyBase64 - Base64 encoded vault key from server/session
 * @returns {Promise<Object>} Encrypted credential object ready for API
 */
export async function prepareCredentialForStorage(credentialData, vaultKeyBase64) {
  const { userId, title, category, icon, favorite, folderId, has2fa, passwordReused, compromised } = credentialData;
  
  // Extract the sensitive data that needs to be encrypted
  let sensitiveData = {};
  let hasPassword = false;
  let passwordStrength = null;

  switch (category) {
    case 'Login':
    case 'login':
      sensitiveData = {
        username: credentialData.username || '',
        email: credentialData.email || '',
        password: credentialData.password || '',
        website: credentialData.website || '',
        notes: credentialData.notes || ''
      };
      hasPassword = !!credentialData.password;
      if (hasPassword) {
        passwordStrength = calculatePasswordStrength(credentialData.password);
      }
      break;

    case 'Credit Card':
    case 'credit_card':
      sensitiveData = {
        cardholderName: credentialData.cardholderName || '',
        cardNumber: credentialData.cardNumber || '',
        expiryMonth: credentialData.expiryMonth || '',
        expiryYear: credentialData.expiryYear || '',
        cvv: credentialData.cvv || '',
        notes: credentialData.notes || ''
      };
      hasPassword = false;
      break;

    case 'Note':
    case 'secure_note':
      sensitiveData = {
        content: credentialData.content || '',
        notes: credentialData.notes || ''
      };
      hasPassword = false;
      break;

    case 'Identity':
    case 'identity':
      sensitiveData = {
        firstName: credentialData.firstName || '',
        lastName: credentialData.lastName || '',
        email: credentialData.email || '',
        phone: credentialData.phone || '',
        address: credentialData.address || '',
        notes: credentialData.notes || ''
      };
      hasPassword = false;
      break;

    default:
      throw new Error(`Unknown category: ${category}`);
  }

  // Encrypt the sensitive data
  const { dataEnc, dataIv, dataAuthTag } = await encryptCredential(sensitiveData, vaultKeyBase64);

  // Return object ready for API
  return {
    userId,
    title,
    // state,
    category: category.toLowerCase().replace(' ', '_'), // Normalize category
    icon: icon || null,
    favorite: favorite || false,
    folderId: folderId || null,
    has2fa: has2fa || false,
    dataEnc,
    dataIv,
    dataAuthTag,
    hasPassword,
    passwordReused: passwordReused || false,
    compromised: compromised || false,
    passwordStrength,
    passwordLastChanged: hasPassword ? new Date().toISOString() : null
  };
}

/**
 * Decrypt credential received from server
 * @param {Object} encryptedCredential - Credential object from API
 * @param {string} vaultKeyBase64 - Base64 encoded vault key from server/session
 * @returns {Promise<Object>} Decrypted credential with all data
 */
export async function decryptCredentialForClient(encryptedCredential, vaultKeyBase64) {
  try {
    // Decrypt the sensitive data
    const decryptedData = await decryptCredential(
      encryptedCredential.dataEnc,
      encryptedCredential.dataIv,
      encryptedCredential.dataAuthTag,
      vaultKeyBase64
    );

    // Combine with non-encrypted fields
    return {
      userId: encryptedCredential.userId,
      id: encryptedCredential.id,
      title: encryptedCredential.title,
      // state: encryptedCredential.state,
      category: encryptedCredential.category,
      icon: encryptedCredential.icon,
      favorite: encryptedCredential.favorite,
      folderId: encryptedCredential.folderId,
      has2fa: encryptedCredential.has2fa,
      hasPassword: encryptedCredential.hasPassword,
      passwordStrength: encryptedCredential.passwordStrength,
      passwordReused: encryptedCredential.passwordReused,
      passwordLastChanged: encryptedCredential.passwordLastChanged,
      compromised: encryptedCredential.compromised,
      createdAt: encryptedCredential.createdAt,
      updatedAt: encryptedCredential.updatedAt,
      state: encryptedCredential.state,
      // Decrypted data
      ...decryptedData
    };
  } catch (error) {
    console.error('Failed to decrypt credential:', error);
    throw new Error('Failed to decrypt credential. Your vault key may be invalid.');
  }
}

/**
 * Decrypt multiple credentials
 * @param {Array} encryptedCredentials - Array of encrypted credentials from API
 * @param {string} vaultKeyBase64 - Base64 encoded vault key from server/session
 * @returns {Promise<Array>} Array of decrypted credentials
 */
export async function decryptCredentials(encryptedCredentials, vaultKeyBase64) {
  const decryptedPromises = encryptedCredentials.map(credential => 
    decryptCredentialForClient(credential, vaultKeyBase64)
  );
  
  try {
    return await Promise.all(decryptedPromises);
  } catch (error) {
    console.error('Failed to decrypt some credentials:', error);
    throw error;
  }
}

/**
 * Prepare credential update data
 * @param {Object} updates - Fields to update
 * @param {Object} existingCredential - Current decrypted credential
 * @param {string} vaultKeyBase64 - Base64 encoded vault key from server/session
 * @returns {Promise<Object>} Encrypted update object
 */
export async function prepareCredentialUpdate(updates, existingCredential, vaultKeyBase64) {
  // Merge updates with existing decrypted data
  const mergedData = { ...existingCredential, ...updates };

  // Prepare for storage (will re-encrypt)
  return await prepareCredentialForStorage(mergedData, vaultKeyBase64);
}

/**
 * Filter credentials by search query
 * @param {Array} credentials - Array of decrypted credentials
 * @param {string} searchQuery - Search text
 * @returns {Array} Filtered credentials
 */
export function filterCredentials(credentials, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return credentials;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return credentials.filter(credential => {
    // Search in title
    if (credential.title?.toLowerCase().includes(query)) return true;

    // Search in category-specific fields
    switch (credential.category) {
      case 'login':
        return (
          credential.username?.toLowerCase().includes(query) ||
          credential.email?.toLowerCase().includes(query) ||
          credential.website?.toLowerCase().includes(query) ||
          credential.notes?.toLowerCase().includes(query)
        );

      case 'credit_card':
        return (
          credential.cardholderName?.toLowerCase().includes(query) ||
          credential.cardNumber?.includes(query) ||
          credential.notes?.toLowerCase().includes(query)
        );

      case 'secure_note':
        return (
          credential.content?.toLowerCase().includes(query) ||
          credential.notes?.toLowerCase().includes(query)
        );

      case 'identity':
        return (
          credential.firstName?.toLowerCase().includes(query) ||
          credential.lastName?.toLowerCase().includes(query) ||
          credential.email?.toLowerCase().includes(query) ||
          credential.notes?.toLowerCase().includes(query)
        );

      default:
        return false;
    }
  });
}

/**
 * Group credentials by folder
 * @param {Array} credentials - Array of credentials
 * @param {Array} folders - Array of folders
 * @returns {Object} Grouped credentials { folderId: [credentials] }
 */
export function groupCredentialsByFolder(credentials, folders) {
  const grouped = {
    null: [] // For credentials without a folder
  };

  // Initialize groups for each folder
  folders.forEach(folder => {
    grouped[folder.id] = [];
  });

  // Group credentials
  credentials.forEach(credential => {
    const folderId = credential.folderId || null;
    if (!grouped[folderId]) {
      grouped[folderId] = [];
    }
    grouped[folderId].push(credential);
  });

  return grouped;
}

/**
 * Sort credentials by different criteria
 * @param {Array} credentials - Array of credentials
 * @param {string} sortBy - Sort criteria (title, created, updated, favorite)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted credentials
 */
export function sortCredentials(credentials, sortBy = 'title', order = 'asc') {
  const sorted = [...credentials];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'created':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      case 'updated':
        comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
        break;
      case 'favorite':
        comparison = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        break;
      default:
        comparison = 0;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get credentials with weak passwords
 * @param {Array} credentials - Array of decrypted credentials
 * @returns {Array} Credentials with weak passwords (strength < 3)
 */
export function getWeakPasswordCredentials(credentials) {
  return credentials.filter(
    credential => credential.hasPassword && Number(credential.passwordStrength ?? 0) < 60
  );
}

/**
 * Get credentials with reused passwords
 * @param {Array} credentials - Array of decrypted credentials
 * @returns {Array} Credentials with reused passwords
 */
export function getReusedPasswordCredentials(credentials) {
  return credentials.filter(credential => credential.passwordReused);
}

/**
 * Detect password reuse across all credentials
 * @param {Array} credentials - Array of decrypted credentials
 * @returns {Array} Updated credentials with passwordReused flag
 */
export function detectPasswordReuse(credentials) {
  const passwordMap = new Map(); // Map password -> array of credential IDs
  
  // First pass: build password map
  credentials.forEach(credential => {
    if (credential.hasPassword && credential.password) {
      if (!passwordMap.has(credential.password)) {
        passwordMap.set(credential.password, []);
      }
      passwordMap.get(credential.password).push(credential.id);
    }
  });
  
  // Second pass: mark reused passwords
  return credentials.map(credential => {
    if (credential.hasPassword && credential.password) {
      const usageCount = passwordMap.get(credential.password)?.length || 0;
      return {
        ...credential,
        passwordReused: usageCount > 1
      };
    }
    return {
      ...credential,
      passwordReused: false
    };
  });
}

/**
 * Check if a specific password is reused
 * @param {string} password - Password to check
 * @param {Array} allPasswords - Array of all passwords to check against
 * @param {string} excludePassword - Optional password to exclude from check (for edit mode)
 * @returns {boolean} True if password is reused
 */
export function isPasswordReused(password, allPasswords, excludePassword = null) {
  if (!password) return false;
  
  const passwordsToCheck = excludePassword 
    ? allPasswords.filter(pwd => pwd !== excludePassword)
    : allPasswords;
  
  return passwordsToCheck.includes(password);
}

/**
 * Get compromised credentials
 * @param {Array} credentials - Array of decrypted credentials
 * @returns {Array} Compromised credentials
 */
export function getCompromisedCredentials(credentials) {
  return credentials.filter(credential => credential.compromised);
}

/**
 * Get favorite credentials
 * @param {Array} credentials - Array of decrypted credentials
 * @returns {Array} Favorite credentials
 */
export function getFavoriteCredentials(credentials) {
  return credentials.filter(credential => credential.favorite);
}

/**
 * Validate credential data before submission
 * @param {Object} credentialData - Credential data to validate
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export function validateCredential(credentialData) {
  const errors = [];

  // Title is required
  if (!credentialData.title || credentialData.title.trim() === '') {
    errors.push('Title is required');
  }

  // Category is required
  if (!credentialData.category) {
    errors.push('Category is required');
  }

  // Category-specific validation
  switch (credentialData.category) {
    case 'Login':
    case 'login':
      if (!credentialData.username && !credentialData.email) {
        errors.push('Either username or email is required for login credentials');
      }
      break;

    case 'Credit Card':
    case 'credit_card':
      if (!credentialData.cardNumber || credentialData.cardNumber.trim() === '') {
        errors.push('Card number is required for credit card credentials');
      }
      if (!credentialData.cardholderName || credentialData.cardholderName.trim() === '') {
        errors.push('Cardholder name is required for credit card credentials');
      }
      break;

    case 'Note':
    case 'secure_note':
      if (!credentialData.content || credentialData.content.trim() === '') {
        errors.push('Content is required for secure notes');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  prepareCredentialForStorage,
  decryptCredentialForClient,
  decryptCredentials,
  prepareCredentialUpdate,
  filterCredentials,
  groupCredentialsByFolder,
  sortCredentials,
  getWeakPasswordCredentials,
  getReusedPasswordCredentials,
  detectPasswordReuse,
  isPasswordReused,
  getCompromisedCredentials,
  getFavoriteCredentials,
  validateCredential
};
