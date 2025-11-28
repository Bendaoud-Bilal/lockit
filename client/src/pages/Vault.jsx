import React, { useEffect, useState } from 'react';
import FilterAddBar from '../components/vault/FilterAddBar';
import PasswordCard from '../components/vault/PasswordCard';
import { decryptCredentialForClient } from '../utils/credentialHelpers';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/apiService';

const Vault = ({ activeFilter, onCredentialsChange }) => {
  const { user, vaultKey } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = user?.id;


  const [listPasswords, setListPasswords] = useState([])

const fetchCredentials = async (notifyParent = false) => {
  if (!userId) return;
  
  setLoading(true);
  setError(null);
  
  try {
    setListPasswords([]); // Clear previous passwords
    const res = await ApiService.getUserCredentials(userId);
    const creds = res.credentials || [];
    setPasswords(creds);

    for (const cred of creds) {
      if (cred.dataEnc && cred.dataIv && cred.dataAuthTag  && cred.hasPassword) {
        try {
          const decrypted = await decryptCredentialForClient(cred, vaultKey);
          if (decrypted?.password) {
            setListPasswords(prev => [...prev, decrypted.password]);
          }

        } catch (decryptionError) {
          console.error(`Error decrypting credential id ${cred.id}:`, decryptionError);
        }
      }
    }

    if (notifyParent && onCredentialsChange) {
      onCredentialsChange();
    }
  } catch (err) {
    console.error('Axios error', err);
    setError(err.response?.data?.error || err.message || 'Network error');
    setPasswords([]);
  } finally {
    setLoading(false);
  }
};

// Initial load - don't notify parent
useEffect(() => {
  if (!userId) return;
  setListPasswords([]); // Clear previous passwords
  fetchCredentials(false); // Don't notify on mount
}, [userId]);

  const filteredPasswords = passwords.filter((item) => {
  // Map activeFilter to actual category values
  const categoryMap = {
    'all-items': null, // Show all
    'favorites': null, // Handle separately
    'logins': 'login',
    'credit_card': 'credit_card',
    'secure-notes': 'note',
    'identities': 'identity',
  };

  // Search filter
  const itemTitle = item.title || item.name || '';
  const matchSearch = itemTitle
    .toLowerCase()
    .includes(searchQuery.toLowerCase());

  // Category filter
  let matchFilter = true;
  
  if (activeFilter === 'all-items') {
    matchFilter = true; // Show all items
  } else if (activeFilter === 'favorites') {
    matchFilter = item.favorite === true; // Only show favorites
  } else {
    // Match by category
    const expectedCategory = categoryMap[activeFilter];
    matchFilter = item.category === expectedCategory;
  }

  return matchFilter && matchSearch;
});

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Vault
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCredentials}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <FilterAddBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onCredentialAdded={() => fetchCredentials(true)}
        listPasswords={listPasswords}
      />
      
      <div className="w-full flex-1 overflow-y-scroll flex flex-col items-center mb-5 gap-y-4 mt-10">
        {filteredPasswords.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-gray-500 text-lg">
              {searchQuery || activeFilter !== 'all-items'
                ? 'no results!'
                : 'Your vault is empty. Add your first password!'}
            </p>
          </div>
        ) : (
          filteredPasswords.map((p) => (
            <div key={p.id} className="w-[70%] ">
              
              <PasswordCard credential={p} onCredentialDeleted={() => fetchCredentials(true)} onCredentialUpdated={() => fetchCredentials(true)} listPasswords={listPasswords} setListPasswords={setListPasswords}/>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Vault;