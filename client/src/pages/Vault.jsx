import React, { useEffect, useState } from 'react';
import FilterAddBar from '../components/vault/FilterAddBar';
import PasswordCard from '../components/vault/PasswordCard';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/apiService';

const Vault = ({ activeFilter }) => {
  const API_BASE_URL = 'http://localhost:5000/api';
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = user?.id;
  console.log('Vault component userId:', userId);

  // Define fetchCredentials OUTSIDE of useEffect so it can be reused
  const fetchCredentials = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await ApiService.getUserCredentials(userId);
      const creds = res.credentials || [];
      setPasswords(creds);
    } catch (err) {
      console.error('Axios error', err);
      setError(err.response?.data?.error || err.message || 'Network error');
      setPasswords([]);
    } finally {
      setLoading(false);
    }
  };

  // Single useEffect to fetch on mount/userId change
  useEffect(() => {
    if (!userId) return;
    
    console.log('active filter changed:', activeFilter);
    fetchCredentials();
  }, [userId]); // Only depend on userId, not activeFilter

  const filteredPasswords = passwords.filter((item) => {
    const itemFilter = item.filter || item.category || 'all-items';
    const itemTitle = item.title || item.name || '';

    const matchFilter =
      activeFilter === 'all-items' ||
      itemFilter.toLowerCase() === activeFilter.toLowerCase();

    const matchSearch = itemTitle
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

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
        onCredentialAdded={fetchCredentials} // Now accessible!
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
            <div key={p.id} className="w-[70%]">
              <PasswordCard credential={p} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Vault;