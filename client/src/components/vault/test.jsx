import React, { useState, useEffect, useRef } from 'react'
import { Paperclip, Globe, Shield, Star, Folder, Eye, EyeOff, Copy, SquarePen, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { decryptCredentialForClient } from '../../utils/credentialHelpers';

// ✅ Recevoir l'objet credential complet
const PasswordCard = ({ credential }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [decryptedData, setDecryptedData] = useState(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()
  const vaultKey = 'YsrxSVjMzoS8M252H++OCmcrSgRlyKAY5WSEETmSEbs=';

  const isArchived = location.pathname === '/archive';
  const hasFolder = credential.folder?.name && credential.folder.name.trim() !== '';

  console.log('PasswordCard credential:', credential);

  useEffect(() => {
    const decryptData = async () => {
      if (!credential.dataEnc || !credential.dataIv || !credential.dataAuthTag || !vaultKey) {
        console.warn('Missing encryption data or vault key');
        return;
      }

      setIsDecrypting(true);
      
      try {
        // ✅ Passer l'objet credential complet (déjà au bon format)
        const decrypted = await decryptCredentialForClient(credential, vaultKey);
        
        console.log('=== DECRYPTED DATA ===');
        console.log('Full object:', decrypted);
        console.log('Password:', decrypted.password);
        console.log('Username:', decrypted.username);
        console.log('Email:', decrypted.email);
        console.log('All keys:', Object.keys(decrypted));
        
        setDecryptedData(decrypted);
        
      } catch (error) {
        console.error('Failed to decrypt credential data:', error);
        toast.error('Impossible de déchiffrer les données');
        setDecryptedData(null);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptData();
  }, [credential, vaultKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleCopy = () => {
    if (decryptedData?.password) {
      navigator.clipboard.writeText(decryptedData.password)
      toast.success('Password copied')
    } else {
      console.log('No password available. DecryptedData:', decryptedData);
      toast.error('No password available')
    }
  }

  // Loading
  if (isDecrypting) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Error
  if (!decryptedData && !isDecrypting) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <p className="text-red-600 text-sm">⚠️ Impossible de déchiffrer cette credential</p>
      </div>
    );
  }

  return (
    <div className="password-card p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{credential.title}</h3>
          {credential.favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
          {credential.has2fa && <Shield className="w-4 h-4 text-blue-500" />}
        </div>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{credential.category}</span>
      </div>

      {/* Folder */}
      {hasFolder && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Folder className="w-3 h-3" />
          <span>{credential.folder.name}</span>
        </div>
      )}

      {/* Decrypted Data */}
      {decryptedData && (
        <div className="space-y-2 text-sm">
          {/* Username */}
          {decryptedData.username && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">Username:</span>
              <span className="font-mono text-sm">{decryptedData.username}</span>
            </div>
          )}

          {/* Email */}
          {decryptedData.email && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">Email:</span>
              <span className="font-mono text-sm">{decryptedData.email}</span>
            </div>
          )}

          {/* Password */}
          {decryptedData.password && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">Password:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {showPassword ? decryptedData.password : '••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Website */}
          {decryptedData.website && (
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">Website:</span>
              <a 
                href={decryptedData.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                <Globe className="w-3 h-3" />
                {decryptedData.website}
              </a>
            </div>
          )}

          {/* Notes */}
          {decryptedData.notes && (
            <div className="mt-2 pt-2 border-t">
              <span className="text-gray-600 text-xs">Notes:</span>
              <p className="text-xs text-gray-500 mt-1">{decryptedData.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Attachments */}
      {credential.attachments && credential.attachments.length > 0 && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <Paperclip className="w-3 h-3" />
          <span>{credential.attachments.length} attachment{credential.attachments.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2 pt-2 border-t">
        <button className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600">
          <SquarePen className="w-4 h-4 inline mr-1" />
          Modifier
        </button>
        {!isArchived && (
          <button className="text-sm px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            <Archive className="w-4 h-4 inline mr-1" />
            Archiver
          </button>
        )}
      </div>
    </div>
  );
}

export default PasswordCard