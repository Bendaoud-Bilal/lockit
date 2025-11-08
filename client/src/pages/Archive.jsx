import React, { useState, useEffect } from 'react';
import { Archive as ArchiveIcon } from 'lucide-react';
import FilterAddBar from '../components/vault/FilterAddBar';
import PasswordCard from '../components/vault/PasswordCard';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/apiService';

function Archive({onCredentialsChange}) {
  const [passwords, setPasswords] = useState([]);
  const [isEmpty, setIsEmpty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const userId = user?.id;

  const fetchDeletedPasswords = async () => {
      try {
        const res = await ApiService.getArchiveCredentials(userId);
        setPasswords(res.credentials);

        if (onCredentialsChange) {
        onCredentialsChange();
      }
      } catch (error) {
        console.error('Erreur lors du chargement des archives:', error);
        setPasswords([]);
      }
    };

  useEffect(() => {
    if (!userId) return;
    fetchDeletedPasswords();
  }, [userId]);

  useEffect(() => {
    setIsEmpty(passwords.length === 0);
  }, [passwords]);

  const filteredPasswords = passwords.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    localStorage.setItem('archiveCount', passwords.length);
  }, [passwords.length]);

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <FilterAddBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="w-full flex justify-center mt-5 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="w-full flex justify-center mt-8">
            <div className="w-[70%] bg-white border-2 border-gray-200 rounded-lg px-3 py-8 flex flex-col h-44">
              <div className="flex justify-center items-center flex-col gap-y-4">
                <ArchiveIcon className="w-36" strokeWidth={2} />
                <span className="text-lg">No archived passwords found</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-y-4 mt-10 max-h-[calc(100vh-12rem)]">
            {filteredPasswords.map((p) => (
              <div key={p.id} className="w-[70%]">
                <PasswordCard credential={p} onCredentialDeleted={fetchDeletedPasswords} onCredentialUpdated={fetchDeletedPasswords}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Archive;
