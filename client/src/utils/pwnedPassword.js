/**
 * Check if a password has been compromised using HaveIBeenPwned API
 * Uses k-anonymity to protect the password being checked
 * 
 * How it works:
 * 1. Hash the password with SHA-1
 * 2. Send only the first 5 characters of the hash to the API
 * 3. API returns all hashes starting with those 5 characters
 * 4. Check if our full hash appears in the results
 */

/**
 * Convert string to SHA-1 hash
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex encoded SHA-1 hash
 */
async function sha1(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Check if password has been compromised in known data breaches
 * @param {string} password - Password to check
 * @returns {Promise<{compromised: boolean, occurrences: number}>}
 */
export async function checkPasswordCompromised(password) {
  if (!password) {
    return { compromised: false, occurrences: 0 };
  }

  try {
    // Hash the password
    const hash = await sha1(password);
    
    // Take first 5 characters for k-anonymity
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Query HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true' // Additional privacy protection
      }
    });

    if (!response.ok) {
      console.warn('Failed to check password breach status');
      return { compromised: false, occurrences: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    // Check if our hash suffix appears in the results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          compromised: true,
          occurrences: parseInt(count.trim(), 10)
        };
      }
    }

    return { compromised: false, occurrences: 0 };
  } catch (error) {
    console.error('Error checking password compromise status:', error);
    // Don't block the user if the API is unavailable
    return { compromised: false, occurrences: 0 };
  }
}

/**
 * Check multiple passwords for compromise
 * @param {Array<string>} passwords - Array of passwords to check
 * @returns {Promise<Array<{password: string, compromised: boolean, occurrences: number}>>}
 */
export async function checkMultiplePasswords(passwords) {
  const results = await Promise.all(
    passwords.map(async (password) => {
      const result = await checkPasswordCompromised(password);
      return { password, ...result };
    })
  );
  return results;
}

/**
 * Common weak passwords list (subset - for quick offline check)
 */
const COMMON_WEAK_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'admin', 'welcome', 'login'
];

/**
 * Quick offline check for common weak passwords
 * @param {string} password - Password to check
 * @returns {boolean} True if password is in common weak list
 */
export function isCommonWeakPassword(password) {
  if (!password) return false;
  return COMMON_WEAK_PASSWORDS.includes(password.toLowerCase());
}

export default {
  checkPasswordCompromised,
  checkMultiplePasswords,
  isCommonWeakPassword
};
