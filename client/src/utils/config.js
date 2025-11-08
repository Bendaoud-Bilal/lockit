// Application Configuration
export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  API_TIMEOUT: 30000, // 30 seconds

  // Security Configuration
  SECURITY: {
    // Auto-lock timeout in milliseconds
    INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes

    // Password requirements
    PASSWORD_MIN_LENGTH: 16,
    PASSWORD_REQUIREMENTS: {
      minLength: 16,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },

    // Recovery key format
    RECOVERY_KEY_LENGTH: 16,
    RECOVERY_KEY_GROUPS: 4,
    RECOVERY_KEY_GROUP_SIZE: 4,

    // KDF parameters (Key Derivation Function)
    KDF_ALGORITHM: "argon2id",
    ARGON2_ITERATIONS: 3,
    ARGON2_MEMORY: 65536, // 64MB in KB
    ARGON2_PARALLELISM: 4,

    // Vault encryption
    VAULT_KEY_KDF_ITERATIONS: 100000,
  },

  // UI Configuration
  UI: {
    TOAST_DURATION: 3000, // 3 seconds
    MODAL_ANIMATION_DURATION: 200, // milliseconds
    DEBOUNCE_DELAY: 300, // milliseconds for search/input debouncing
  },

  // Storage Configuration
  STORAGE: {
    // Local storage keys (for non-sensitive data only)
    THEME_KEY: "lockit_theme",
    LANGUAGE_KEY: "lockit_language",
    // Note: NEVER store auth tokens or vault keys in localStorage
  },

  // Feature Flags
  FEATURES: {
    ENABLE_BIOMETRIC_AUTH: false, // Future feature
    ENABLE_SYNC: false, // Future feature
    ENABLE_SHARING: true,
    ENABLE_TOTP: true,
    ENABLE_ATTACHMENTS: true,
  },

  // Validation Patterns
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME_REGEX: /^[a-zA-Z0-9_-]{3,20}$/,
    RECOVERY_KEY_REGEX: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
  },

  // Vault Item Categories
  CATEGORIES: {
    LOGIN: "login",
    CREDIT_CARD: "credit_card",
    SECURE_NOTE: "secure_note",
    IDENTITY: "identity",
  },

  // Error Messages
  ERRORS: {
    NETWORK_ERROR: "Network error. Please check your connection.",
    AUTH_FAILED: "Authentication failed. Please check your credentials.",
    SESSION_EXPIRED: "Your session has expired. Please unlock your vault.",
    INVALID_RECOVERY_KEY: "Invalid recovery key format.",
    PASSWORD_WEAK: "Password does not meet security requirements.",
    PASSWORDS_MISMATCH: "Passwords do not match.",
  },
};

// Helper functions
export const validatePassword = (password) => {
  const { PASSWORD_REQUIREMENTS } = APP_CONFIG.SECURITY;

  return {
    isValid:
      password.length >= PASSWORD_REQUIREMENTS.minLength &&
      (!PASSWORD_REQUIREMENTS.requireUppercase || /[A-Z]/.test(password)) &&
      (!PASSWORD_REQUIREMENTS.requireLowercase || /[a-z]/.test(password)) &&
      (!PASSWORD_REQUIREMENTS.requireNumbers || /[0-9]/.test(password)) &&
      (!PASSWORD_REQUIREMENTS.requireSpecialChars ||
        /[!@#$%^&*(),.?":{}|<>]/.test(password)),
    requirements: {
      minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  };
};

export const validateEmail = (email) => {
  return APP_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
};

export const validateUsername = (username) => {
  return APP_CONFIG.VALIDATION.USERNAME_REGEX.test(username);
};

export const validateRecoveryKey = (key) => {
  return APP_CONFIG.VALIDATION.RECOVERY_KEY_REGEX.test(key);
};

export const formatRecoveryKey = (input) => {
  // Remove non-alphanumeric characters and convert to uppercase
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Take first 16 characters
  const truncated = cleaned.substring(
    0,
    APP_CONFIG.SECURITY.RECOVERY_KEY_LENGTH
  );

  // Split into groups of 4
  const groups = truncated.match(/.{1,4}/g) || [];

  // Join with hyphens
  return groups.join("-");
};

export default APP_CONFIG;
