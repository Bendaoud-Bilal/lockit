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
const EXPOSED_PASSWORDS = [
  '123456', '123456789', 'qwerty', 'password', '12345', '12345678', '111111',
  '123123', '1234567890', '1234567', 'qwerty123', '000000', '1q2w3e', 'aa123456',
  'abc123', 'password1', '1234', 'qwertyuiop', '123321', 'password123',
  '1q2w3e4r5t', 'iloveyou', '654321', '666666', '987654321', '123', '123qwe',
  '7777777', '1qaz2wsx', '123abc', '112233', '987654321', 'qazwsx', '121212',
  'dragon', 'sunshine', 'princess', 'letmein', 'monkey', 'football', 'baseball',
  'shadow', 'superman', 'michael', 'whatever', 'trustno1', 'freedom', 'flower',
  'cheese', 'computer', 'asdfgh', 'jordan23', '11111', 'password!', 'zaq12wsx',
  'qwerty1', 'starwars', 'merlin', 'abcd1234', '98765', '888888', '12345a',
  'donald', 'qwert', 'pokemon', 'killer', '123456a', 'zaq1zaq1', 'ginger',
  'michelle', 'pepper', 'happy', 'whatever1', '777777', 'passw0rd', 'network',
  'welcome1', 'secret', 'aaa111', 'lovely', 'orange', 'tinkerbell', '212121',
  'a123456', 'test1', 'asdfghjkl', '1g2w3e4r', 'ninja', 'mustang', 'maggie',
  'matrix', 'samantha', 'charlie', 'cookie', 'internet', 'letmein1', 'george',
  'andrew', 'pepper', 'pepper123'
];

const EXPOSED_PASSWORD_SET = new Set(EXPOSED_PASSWORDS);

/**
 * Quick offline check for common weak passwords
 * @param {string} password - Password to check
 * @returns {boolean} True if password is in common weak list
 */
export function isCommonWeakPassword(password) {
  if (!password) return false;
  return EXPOSED_PASSWORD_SET.has(password.toLowerCase());
}

export function isExposedPassword(password) {
  if (!password) return false;
  return EXPOSED_PASSWORD_SET.has(password.toLowerCase());
}

export default {
  checkPasswordCompromised,
  checkMultiplePasswords,
  isCommonWeakPassword,
  isExposedPassword
};
