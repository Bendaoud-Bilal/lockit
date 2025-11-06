// server/services/hibpService.js
import axios from 'axios';

const HIBP_API_BASE = 'https://haveibeenpwned.com/api/v3';
const USER_AGENT = 'Lockit-Password-Manager'; // Replace with your app name

// Configure axios instance
const hibpClient = axios.create({
  baseURL: HIBP_API_BASE,
  headers: {
    'User-Agent': USER_AGENT,
  },
  timeout: 10000,
});

/**
 * Normalize service/website name for HIBP API
 * Examples:
 *   "linkedin.com" → "LinkedIn"
 *   "google mail" → "Google"
 *   "Facebook Login" → "Facebook"
 */
function normalizeServiceName(name) {
  if (!name) return null;
  
  // Remove common suffixes
  let normalized = name
    .toLowerCase()
    .replace(/\.(com|net|org|io|co|uk)$/i, '')
    .replace(/\s+(login|account|password|auth|authentication)/gi, '')
    .trim();
  
  // Capitalize first letter
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  
  return normalized;
}

/**
 * Get all breaches from HIBP
 * Returns array of breach objects
 */
export async function getAllBreaches() {
  try {
    const response = await hibpClient.get('/breaches');
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('HIBP API rate limit exceeded');
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    console.error('Error fetching breaches from HIBP:', error.message);
    throw error;
  }
}

/**
 * Get breaches for a specific domain/service
 * @param {string} domain - Domain name (e.g., "Adobe", "LinkedIn")
 */
export async function getBreachByName(domain) {
  try {
    const response = await hibpClient.get(`/breach/${domain}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No breach found for this domain
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw error;
  }
}

/**
 * Check if an email appears in any breaches
 * NOTE: Requires HIBP API key for this endpoint
 * @param {string} email - Email address to check
 */
export async function checkEmailBreaches(email) {
  try {
    const apiKey = process.env.HIBP_API_KEY;
    
    if (!apiKey) {
      console.warn('HIBP_API_KEY not set. Email breach check skipped.');
      return [];
    }

    const response = await hibpClient.get(`/breachedaccount/${encodeURIComponent(email)}`, {
      headers: {
        'hibp-api-key': apiKey,
      },
      params: {
        truncateResponse: false,
      },
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return []; // No breaches found - good news!
    }
    if (error.response?.status === 401) {
      console.error('Invalid HIBP API key');
      return [];
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw error;
  }
}

/**
 * Map HIBP breach severity
 * DataClasses length determines severity
 */
function calculateSeverity(dataClasses) {
  if (!dataClasses || dataClasses.length === 0) return 'low';
  
  const criticalData = ['Passwords', 'Credit cards', 'Banking details', 'Social security numbers'];
  const highData = ['Email addresses', 'Password hints', 'Security questions'];
  
  const hasCritical = dataClasses.some(dc => 
    criticalData.some(cd => dc.toLowerCase().includes(cd.toLowerCase()))
  );
  
  const hasHigh = dataClasses.some(dc => 
    highData.some(hd => dc.toLowerCase().includes(hd.toLowerCase()))
  );
  
  if (hasCritical) return 'critical';
  if (hasHigh) return 'high';
  if (dataClasses.length > 3) return 'medium';
  return 'low';
}

/**
 * Normalize HIBP breach response to our DB schema
 * @param {Object} hibpBreach - Raw HIBP breach object
 * @param {string} userEmail - User's email that was affected
 * @param {number} credentialId - Optional credential ID
 */
export function normalizeBreachData(hibpBreach, userEmail, credentialId = null) {
  return {
    affectedEmail: userEmail,
    breachSource: hibpBreach.Name, // "LinkedIn", "Adobe"
    breachDate: hibpBreach.BreachDate ? new Date(hibpBreach.BreachDate) : null,
    affectedData: hibpBreach.DataClasses 
      ? hibpBreach.DataClasses.join(', ') 
      : hibpBreach.Description?.substring(0, 200) || 'Unknown',
    severity: calculateSeverity(hibpBreach.DataClasses),
    status: 'pending', // ✅ Always start as 'pending' (unviewed)
    credentialId,
  };
}

/**
 * Find matching breaches for user's credentials
 * @param {Array} credentials - Array of credential objects with title and data
 * @param {string} userEmail - User's email address
 */
export async function findBreachesForCredentials(credentials, userEmail) {
  const allBreaches = await getAllBreaches();
  const matchedBreaches = [];
  const processedServices = new Set(); // Avoid duplicates
  
  for (const credential of credentials) {
    const serviceName = normalizeServiceName(credential.title);
    
    if (!serviceName || processedServices.has(serviceName.toLowerCase())) {
      continue;
    }
    
    processedServices.add(serviceName.toLowerCase());
    
    // Find matching breaches
    const matchingBreaches = allBreaches.filter(breach => 
      breach.Name.toLowerCase() === serviceName.toLowerCase() ||
      breach.Domain?.toLowerCase().includes(serviceName.toLowerCase())
    );
    
    for (const breach of matchingBreaches) {
      matchedBreaches.push({
        ...normalizeBreachData(breach, userEmail, credential.id),
        userId: credential.userId,
      });
    }
    
    // Rate limiting: Wait 100ms between checks
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return matchedBreaches;
}

export { normalizeServiceName };