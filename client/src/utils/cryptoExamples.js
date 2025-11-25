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

  // Get vault key from session storage (stored after login)
  const vaultKey = sessionStorage.getItem('vaultKey');
  
  if (!vaultKey) {
    throw new Error('No vault key found. Please login first.');
  }

  // Encrypt and prepare for API
  const encryptedCredential = await prepareCredentialForStorage(formData, vaultKey);
  
  console.log('Encrypted credential ready for API:', encryptedCredential);
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
  console.log('Credential saved:', savedCredential);
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
  
  // Get vault key
  const vaultKey = sessionStorage.getItem('vaultKey');

  // Decrypt all credentials
  const decryptedCredentials = [];
  for (const encrypted of encryptedCredentials) {
    const decrypted = await decryptCredentialForClient(encrypted, vaultKey);
    decryptedCredentials.push(decrypted);
  }

  console.log('Decrypted credentials:', decryptedCredentials);
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
    // Load vault key from session storage on mount
    const key = sessionStorage.getItem('vaultKey');
    setVaultKey(key);
  }, []);

  const saveVaultKey = (key) => {
    sessionStorage.setItem('vaultKey', key);
    setVaultKey(key);
  };

  const clearVaultKey = () => {
    sessionStorage.removeItem('vaultKey');
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
