import { TOTP } from 'otpauth';

/**
 * Génère un code TOTP à partir d'un secret
 * @param {string} secret - Le secret en base32
 * @returns {string} Le code TOTP à 6 chiffres
 */



export const generateTOTP = (secret) => {
 const isBase32 = (str) => /^[A-Z2-7]+=*$/.test(str.replace(/\s+/g, '').toUpperCase());

  if (!secret ) {
    throw new Error('Secret is required');
  }
  else if(!isBase32(secret)){
    throw new Error('Secret should be base32 encoded')

  }

  try {
    const totp = new TOTP({
      secret: secret,
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    });

    const code = totp.generate();
    return code;
  } catch (error) {
    console.error('Error generating TOTP:', error);
    throw error;
  }
};

/**
 * Calcule le temps restant avant le prochain code
 * @returns {number} Secondes restantes (0-29)
 */
export const getTimeRemaining = () => {
  const now = Math.floor(Date.now() / 1000);
  return 30 - (now % 30);
};

/**
 * Calcule le compteur actuel (nombre de périodes de 30s depuis epoch)
 * @returns {number} Le compteur actuel
 */
export const getCurrentCounter = () => {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor(now / 30);
};