# Client-Side Encryption Utilities

## Overview

These utilities provide **client-side encryption** for credentials in the Lockit password manager. All sensitive data is encrypted in the browser before being sent to the server, ensuring zero-knowledge security.

## Files

- **`crypto.js`** - Core encryption/decryption functions using Web Crypto API
- **`credentialHelpers.js`** - High-level helpers for working with credentials
- **`cryptoExamples.js`** - Usage examples and patterns

## How It Works

### 1. **Vault Key** (Received from Server)

After login, your server sends a Base64-encoded vault key. This key decrypts ALL your credentials.

```javascript
// Store vault key after login
sessionStorage.setItem("vaultKey", vaultKeyFromServer);
```

### 2. **Encrypting Credentials** (Before Saving)

```javascript
import { prepareCredentialForStorage } from "./utils/credentialHelpers";

// Your form data
const formData = {
  title: "GitHub",
  category: "Login",
  username: "johndoe",
  password: "MyPassword123!",
  website: "https://github.com",
  notes: "My account",
};

// Get vault key
const vaultKey = sessionStorage.getItem("vaultKey");

// Encrypt
const encrypted = await prepareCredentialForStorage(formData, vaultKey);

// Send to API
await fetch("/api/credentials", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(encrypted),
});
```

### 3. **Decrypting Credentials** (When Loading)

```javascript
import { decryptCredentialForClient } from "./utils/credentialHelpers";

// Fetch encrypted credentials from API
const response = await fetch("/api/credentials");
const encryptedCredentials = await response.json();

// Get vault key
const vaultKey = sessionStorage.getItem("vaultKey");

// Decrypt each credential
const decrypted = await decryptCredentialForClient(
  encryptedCredentials[0],
  vaultKey
);

console.log(decrypted);
// { id: 1, title: "GitHub", username: "johndoe", password: "MyPassword123!", ... }
```

## API Reference

### `encryptCredential(data, vaultKeyBase64)`

Encrypts a data object using AES-256-GCM.

**Parameters:**

- `data` (Object) - Plain data object to encrypt
- `vaultKeyBase64` (string) - Base64-encoded vault key

**Returns:** `Promise<Object>` - `{ dataEnc, dataIv, dataAuthTag }`

### `decryptCredential(dataEnc, dataIv, dataAuthTag, vaultKeyBase64)`

Decrypts encrypted data.

**Parameters:**

- `dataEnc` (string) - Base64 encrypted data
- `dataIv` (string) - Base64 IV
- `dataAuthTag` (string) - Base64 auth tag
- `vaultKeyBase64` (string) - Base64 vault key

**Returns:** `Promise<Object>` - Decrypted data object

### `prepareCredentialForStorage(credentialData, vaultKeyBase64)`

High-level function that encrypts credential and prepares it for API.

**Parameters:**

- `credentialData` (Object) - Form data with title, category, username, etc.
- `vaultKeyBase64` (string) - Base64 vault key

**Returns:** `Promise<Object>` - Encrypted credential ready for API

### `decryptCredentialForClient(encryptedCredential, vaultKeyBase64)`

High-level function that decrypts a credential from API.

**Parameters:**

- `encryptedCredential` (Object) - Credential from API with dataEnc, dataIv, dataAuthTag
- `vaultKeyBase64` (string) - Base64 vault key

**Returns:** `Promise<Object>` - Decrypted credential

### `calculatePasswordStrength(password)`

Calculates password strength score.

**Parameters:**

- `password` (string) - Password to evaluate

**Returns:** `number` - Strength score (0-4)

### `generatePassword(length, options)`

Generates a random password.

**Parameters:**

- `length` (number) - Password length (default: 16)
- `options` (Object) - `{ uppercase, lowercase, numbers, symbols }`

**Returns:** `string` - Generated password

## Usage in AddItemModal

```javascript
import { prepareCredentialForStorage } from '../../utils/credentialHelpers';
import { generatePassword, calculatePasswordStrength } from '../../utils/crypto';

const AddItemModal = ({ show, setShow }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "Login",
    username: "",
    password: "",
    // ...
  });

  // Generate password
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(16);
    setFormData({ ...formData, password: newPassword });
  };

  // Save credential
  const handleSave = async () => {
    const vaultKey = sessionStorage.getItem('vaultKey');

    const encrypted = await prepareCredentialForStorage(formData, vaultKey);

    const response = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted)
    });

    if (response.ok) {
      alert('Saved!');
      setShow(false);
    }
  };

  return (
    // Your modal JSX
  );
};
```

## Security Notes

✅ **Client-side encryption** - Data encrypted before leaving browser
✅ **AES-256-GCM** - Industry-standard authenticated encryption
✅ **Zero-knowledge** - Server cannot decrypt your data
✅ **Vault key from server** - Received after authentication
✅ **Session storage** - Vault key cleared on logout

## Supported Categories

- **Login** - username, email, password, website, notes
- **Credit Card** - cardholderName, cardNumber, expiryMonth, expiryYear, cvv, notes
- **Note** - content, notes
- **Identity** - firstName, lastName, email, phone, address, notes

## Next Steps

1. Get vault key from server after login
2. Store in `sessionStorage.setItem('vaultKey', key)`
3. Use `prepareCredentialForStorage()` before saving
4. Use `decryptCredentialForClient()` after loading
5. Clear vault key on logout: `sessionStorage.removeItem('vaultKey')`
