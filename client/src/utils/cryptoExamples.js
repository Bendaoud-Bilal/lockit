/**
 * USAGE EXAMPLES - Client-side Credential Encryption
 * 
 * This shows how to use the crypto utilities in your React components
 */

import { encryptCredential, decryptCredential } from './crypto';
import { prepareCredentialForStorage, decryptCredentialForClient } from './credentialHelpers';

/**
 * EXAMPLE 1: Saving a new credential from AddItemModal
 */
async function exampleSaveCredential() {
  // Form data from your AddItemModal
  const formData = {
    title: "GitHub",
    category: "Login",
    folder: "Work",
    icon: "github-icon",
    favorite: false,
    username: "johndoe",
    email: "john@example.com",
    password: "GitHubPass123!",
    website: "https://github.com",
    notes: "My main account"
  };

  // Get encrypted vault blob metadata from session storage and unwrap via AuthContext
  const blobJson = sessionStorage.getItem('lockit_encrypted_vault_blob');
  if (!blobJson) {
    throw new Error('No encrypted vault blob found. Please login first.');
  }
  const blob = JSON.parse(blobJson);
  // The real flow should use AuthContext.unlock(masterPassword) to derive the
  // plaintext vault key into memory. This example assumes `vaultKey` is available
  // in-memory (not persisted) after unlocking.
  const vaultKey = /* obtain in-memory vault key from AuthContext after unlock */ null;
  if (!vaultKey) {
    throw new Error('Vault is locked. Please unlock to obtain the vault key in memory.');
  }

  // Encrypt and prepare for API
  const encryptedCredential = await prepareCredentialForStorage(formData, vaultKey);
  /*
  {
    title: "GitHub",
    category: "login",
    icon: "github-icon",
    favorite: false,
    folderId: null,
    has2fa: false,
    dataEnc: "sdf89w7ef...",      // <- Encrypted data
    dataIv: "xyz789...",
    dataAuthTag: "abc456...",
    hasPassword: true,
    passwordStrength: 3,
    passwordLastChanged: "2025-10-24T..."
  }
  */

  // Send to your API
  const response = await fetch('/api/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    },
    body: JSON.stringify(encryptedCredential)
  });

  const savedCredential = await response.json();
}

/**
 * EXAMPLE 2: Loading and decrypting credentials in Vault page
 */
async function exampleLoadCredentials() {
  // Fetch encrypted credentials from API
  const response = await fetch('/api/credentials', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    }
  });

  const encryptedCredentials = await response.json();
  
  // In production, you should unlock the vault via AuthContext which will
  // derive the plaintext vault key into memory. Do NOT persist the plaintext
  // vault key in storage. Here we assume the vault has been unlocked and
  // `vaultKey` is available in memory (not persisted).
  const vaultKey = /* in-memory vault key from AuthContext.unlock(...) */ null;

  if (!vaultKey) throw new Error('Vault is locked. Unlock to get the in-memory vault key');

  // Decrypt all credentials
  const decryptedCredentials = [];
  for (const encrypted of encryptedCredentials) {
    const decrypted = await decryptCredentialForClient(encrypted, vaultKey);
    decryptedCredentials.push(decrypted);
  }
  /*
  [
    {
      id: 1,
      title: "GitHub",
      category: "login",
      username: "johndoe",        // <- Decrypted!
      email: "john@example.com",
      password: "GitHubPass123!",
      website: "https://github.com",
      notes: "My main account",
      // ... other fields
    },
    // ... more credentials
  ]
  */

  return decryptedCredentials;
}

/**
 * EXAMPLE 3: React component usage in AddItemModal
 */
function AddItemModalExample() {
  const handleSave = async () => {
    // Your form data
    const formData = {
      title: document.getElementById('title').value,
      category: document.getElementById('category').value,
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      website: document.getElementById('website').value,
      notes: document.getElementById('notes').value,
    };

    try {
      // Get vault key from session
      const vaultKey = sessionStorage.getItem('vaultKey');
      
      // Encrypt
      const encrypted = await prepareCredentialForStorage(formData, vaultKey);
      
      // Send to API
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(encrypted)
      });

      if (response.ok) {
        alert('Credential saved successfully!');
        // Close modal, refresh list, etc.
      }
    } catch (error) {
      console.error('Error saving credential:', error);
      alert('Failed to save credential');
    }
  };

  return `
    <button onclick="handleSave()">Save Item</button>
  `;
}

/**
 * EXAMPLE 4: React Hook for managing vault key
 */
function useVaultKey() {
  const [vaultKey, setVaultKey] = React.useState(null);

  React.useEffect(() => {
    // Vault key should NOT be loaded from sessionStorage. Instead load the
    // encrypted vault blob metadata (if any) and require the user to unlock
    // to derive the plaintext vault key into memory. This example leaves the
    // value null to emphasize that keys belong in memory only.
    const blob = sessionStorage.getItem('lockit_encrypted_vault_blob');
    // Do not set plaintext vault key from storage
  }, []);

  const saveVaultKey = (key) => {
    // Save only in memory. Do NOT persist plaintext vault key to sessionStorage/localStorage.
    setVaultKey(key);
  };

  const clearVaultKey = () => {
    // Do not persist vault key; remove any in-memory reference. Optionally remove encrypted blob metadata.
    sessionStorage.removeItem('lockit_encrypted_vault_blob');
    setVaultKey(null);
  };

  return { vaultKey, saveVaultKey, clearVaultKey };
}

/**
 * EXAMPLE 5: Complete flow in AddItemModal.jsx
 */
const AddItemModalUsage = `
// In your AddItemModal.jsx

import { prepareCredentialForStorage } from '../../utils/credentialHelpers';
import { generatePassword } from '../../utils/crypto';

const AddItemModal = ({ show, setShow }) => {
  const [formData, setFormData] = useState({...});

  const handleSave = async () => {
    try {
      // Get vault key from session
      const vaultKey = sessionStorage.getItem('vaultKey');
      
      if (!vaultKey) {
        alert('Please login first');
        return;
      }

      // Encrypt credential
      const encryptedData = await prepareCredentialForStorage(formData, vaultKey);
      
      // Send to API
  const response = await fetch('http://localhost:3000/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify(encryptedData)
      });

      if (response.ok) {
        alert('Credential saved successfully!');
        setShow(false);
        // Refresh credentials list
      } else {
        alert('Failed to save credential');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving credential: ' + error.message);
    }
  };

  return (
    // Your modal JSX
    <button onClick={handleSave}>Save Item</button>
  );
};
`;

export {
  exampleSaveCredential,
  exampleLoadCredentials,
  AddItemModalExample,
  useVaultKey,
  AddItemModalUsage
};
