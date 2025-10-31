import React, { useState, useEffect, useRef } from 'react'
import { RefreshCcw, Paperclip, Globe, Shield, Star, Folder, Eye, EyeOff, Copy, Ellipsis, SquarePen, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import Show2FA from './Show2FA'
import { useLocation } from 'react-router-dom'
import { decryptCredentialForClient } from '../../utils/credentialHelpers';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios'
import ApiService from '../../services/apiService'


const PasswordCard = ({ credential }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [decryptedData, setDecryptedData] = useState(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isShow2FA, setIsShow2FA] = useState(false)
  const [isFavorite, setIsFavorite] = useState(credential.favorite);
  const credId = credential.id;
  const ownerIdFromCredential = credential.userId;
  const [passwordLength, setPasswordLength] = useState(0);
  const menuRef = useRef(null)
  const location = useLocation()
  const vaultKey = 'YsrxSVjMzoS8M252H++OCmcrSgRlyKAY5WSEETmSEbs=';
  const { user } = useAuth();
  const API_BASE_URL = 'http://localhost:5000/api';

  

  const isArchived = location.pathname === '/archive';
  const hasFolder = credential.folder?.name && credential.folder.name.trim() !== '';
  const userId = user?.id;



  const handleToggleFavorite = async (idParam, ownerIdParam) => {
    const idToUse = idParam ?? credId;
    const ownerToUse = userId ?? ownerIdParam ?? ownerIdFromCredential;
    if (!idToUse || !ownerToUse) return;

    const previous = isFavorite;
    const newState = !previous;
    setIsFavorite(newState);

    try {
      await ApiService.toggleFavorite(ownerToUse, idToUse);
      toast.success(newState ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
      // revert
      setIsFavorite(previous);
      toast.error('Failed to update favorite');
    }
  };

  useEffect(() => {
    const decryptData = async () => {
      if (!credential.dataEnc || !credential.dataIv || !credential.dataAuthTag || !vaultKey) {
        console.warn('Missing encryption data or vault key');
        return;
      }

      setIsDecrypting(true);
      
      try {
        const decrypted = await decryptCredentialForClient(credential, vaultKey);
        
    
  setDecryptedData(decrypted);
  setPasswordLength(decrypted?.password?.length ?? 0);
        
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
      toast.error('No password available')
    }
  }

  const handleToggle2FA = () => {
    setIsShow2FA(!isShow2FA)
  }


const handleDelete = async (idParam, ownerIdParam, state = 'soft') => {
  const idToUse = idParam ?? credId;
  const ownerToUse = userId ?? ownerIdParam ?? ownerIdFromCredential;

  if (!idToUse || !ownerToUse) return;


  try {
    await ApiService.deleteCredential(ownerToUse, idToUse, state);
    toast.success(state==='deleted' ? 'Password permanently deleted' : 'Password moved to archive');
    window.location.reload();
  } catch (error) {
    console.error('Error deleting password:', error);
    toast.error('Failed to delete password');
  }
};

  

  if (isDecrypting) {
    return (
      <div className="w-full bg-white hover:shadow-lg border border-gray-200 rounded-lg px-3 sm:px-4 py-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500">Décryptage...</p>
        </div>
      </div>
    );
  }
  if (!decryptedData && !isDecrypting) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg px-3 sm:px-4 py-4">
        <p className="text-red-600 text-sm">⚠️ Impossible de déchiffrer cette credential</p>
      </div>
    );
  }


  return (
    <>
      {isShow2FA && <Show2FA onClose={handleToggle2FA} />}
      
      <div className="w-full bg-white hover:shadow-lg border border-gray-200 rounded-lg px-3 sm:px-4 py-4 flex flex-col transition-shadow">
        <div className="flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex gap-x-3 items-start sm:items-center flex-1">
            <Globe className="w-5 flex-shrink-0" strokeWidth={1} />
            <div className="flex flex-col gap-y-2 min-w-0 flex-1">
              
              <div className="flex flex-wrap gap-x-2 gap-y-1.5 items-center">
                <span className="font-medium text-sm sm:text-base break-words">{credential.title}</span>
                <Star
                  className={`w-4 flex-shrink-0 cursor-pointer ${isFavorite ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-yellow-400'}`}
                  strokeWidth={2}
                  onClick={()=>handleToggleFavorite(credential.id, credential.userId)}
                />
                {credential.has2fa && (
                  <div 
                    className="flex justify-center items-center text-xs bg-gray-100 rounded-lg px-2 sm:px-3 gap-x-1 cursor-pointer"
                    onClick={handleToggle2FA}
                  >
                    <Shield className="w-3" strokeWidth={1} />
                    <span className="mt-[1px]">2FA</span>
                  </div>
                )}
                {passwordLength < 6 && (
                  <div className="flex justify-center items-center text-xs bg-red-100 rounded-lg px-2 sm:px-3 py-0.5">
                    <span className="text-red-600">Weak</span>
                  </div>
                )}
                 { passwordLength < 10 && passwordLength >=6 && (
                  <div className="flex justify-center items-center text-xs bg-orange-100 rounded-lg px-2 sm:px-3 py-0.5">
                    <span className="text-orange-600">medium</span>
                  </div>
                )}
                 {passwordLength >=10 && (
                  <div className="flex justify-center items-center text-xs bg-green-100 rounded-lg px-2 sm:px-3 py-0.5">
                    <span className="text-green-600">strong</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                {hasFolder && (
                  <div className="flex justify-center items-center text-xs bg-gray-100 rounded-lg px-2 sm:px-3 gap-x-1">
                    <Folder className="w-3" strokeWidth={1} />
                    <span>{credential.folder.name}</span>
                  </div>
                )}
                <div className="flex justify-center items-center text-xs bg-gray-100 rounded-lg px-2 sm:px-3 py-1">
                  <span>{credential.category}</span>
                </div>
                {decryptedData?.website && (
                  <div className="flex justify-center items-center text-xs px-1 sm:px-2">
                    <a 
                      href={decryptedData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 cursor-pointer truncate max-w-[150px] sm:max-w-none"
                    >
                      {decryptedData.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col sm:items-center md:items-end gap-2 sm:gap-y-1 flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              Last Update: {new Date(credential.updatedAt).toLocaleDateString()}
            </p>
            <div className="relative" ref={menuRef}>
              <Ellipsis
                className="w-5 sm:w-4 cursor-pointer"
                strokeWidth={1}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />

              {isMenuOpen && (
                <div className={isArchived ? 'absolute' : 'absolute bg-white left-0 sm:left-auto sm:right-0 sm:top-auto sm:mt-2 border border-gray-200 shadow-lg w-44 rounded-lg z-50'}>
                  
                  {credential.has2fa && !isArchived && (
                    <button 
                      onClick={handleToggle2FA}
                      className="w-full text-left text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2 py-1.5 items-center"
                    >
                      <Shield className="w-4" strokeWidth={2} />
                      <div>Show 2FA Code</div>
                    </button>
                  )}

                  {isArchived && (
                    <div className="absolute bg-white left-full top-0 ml-2 sm:left-auto sm:right-0 sm:top-auto sm:mt-2 border border-gray-200 shadow-lg w-36 rounded-lg z-50">
                      <button className="w-full text-left text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                        <RefreshCcw className="w-4" strokeWidth={2} />
                        <div>Restore</div>
                      </button>
                      <button
                      onClick={() => handleDelete(credId, userId, 'deleted')}
                      className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                        <p className="text-red-600">Delete</p>
                      </button>
                    </div>
                  )}

                  {!isArchived && (
                    <button className="w-full text-left text-sm text-gray-700 hover:bg-black pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                      <SquarePen className="w-4" strokeWidth={2} />
                      <div>Edit Item</div>
                    </button>
                  )}
                  
                  {!isArchived && credential.attachments && credential.attachments.length > 0 && (
                    <button className="w-full text-left text-sm text-gray-700 hover:bg-black pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                      <Paperclip className="w-4" strokeWidth={2} />
                      <div>View Attachments ({credential.attachments.length})</div>
                    </button>
                  )}

                  {!isArchived && (
                    <button 
                    onClick={() => handleDelete(credId, userId)}
                    className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                      <p className="text-red-600">Archive</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap text-sm gap-x-3 gap-y-2 mt-3 text-gray-500 items-center">
          <div className="flex items-center gap-x-2 sm:gap-x-3 flex-wrap sm:flex-nowrap">
            <span>Password:</span>
            <span className="text-sm font-mono">
              {showPassword ? (decryptedData?.password || 'N/A') : '••••••••'}
            </span>
          </div>
          <div className="flex gap-x-2 sm:gap-x-3">
            {showPassword ? (
              <EyeOff 
                className="w-4 cursor-pointer hover:text-gray-700 transition-colors" 
                onClick={() => setShowPassword(false)} 
              />
            ) : (
              <Eye 
                className="w-4 cursor-pointer hover:text-gray-700 transition-colors" 
                onClick={() => setShowPassword(true)} 
              />
            )}
            <Copy 
              className="w-4 cursor-pointer hover:text-gray-700 transition-colors" 
              onClick={handleCopy} 
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default PasswordCard;