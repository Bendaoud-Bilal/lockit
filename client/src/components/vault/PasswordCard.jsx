import React, { useState, useEffect, useRef } from 'react'
import { RefreshCcw, Paperclip, Globe, Shield, Star, Folder, Eye, EyeOff, Copy, Ellipsis, SquarePen, Archive, Mail, Lock, Wrench, Database, Layers, Cloud, GitBranch, Target, Wallet, Camera, Music, Video, ImageIcon, FileText, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Show2FA from './Show2FA'
import { useLocation } from 'react-router-dom'
import { decryptCredentialForClient } from '../../utils/credentialHelpers';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/apiService'
import apiService from '../../services/apiService'
import AddItemModal from './AddItemModal'
import { notifyCredentialsMutated } from '../../utils/credentialEvents';


const PasswordCard = ({ credential, onCredentialDeleted, onCredentialUpdated, listPasswords, setListPasswords }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [decryptedData, setDecryptedData] = useState(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isShow2FA, setIsShow2FA] = useState(false)
  const [isFavorite, setIsFavorite] = useState(credential.favorite)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const credId = credential.id
  const ownerIdFromCredential = credential.userId
  const [passwordScore, setPasswordScore] = useState(null)
  const menuRef = useRef(null)
  const location = useLocation()
  const { user, vaultKey } = useAuth()
  const isArchived = location.pathname === '/archive'
  const hasFolder = credential.folder?.name && credential.folder.name.trim() !== ''
  const userId = user?.id

  const iconMap = {
    globe: Globe,
    mail: Mail,
    lock: Lock,
    shield: Shield,
    wrench: Wrench,
    database: Database,
    layers: Layers,
    cloud: Cloud,
    gitbranch: GitBranch,
    target: Target,
    wallet: Wallet,
    camera: Camera,
    music: Music,
    video: Video,
    image: ImageIcon,
    filetext: FileText,
    folder: Folder,
    trash: Trash2,
  }

  const Icon = iconMap[credential.icon] || Globe

  const handleToggleFavorite = async (idParam, ownerIdParam) => {
    const idToUse = idParam ?? credId
    const ownerToUse = userId ?? ownerIdParam ?? ownerIdFromCredential
    if (!idToUse || !ownerToUse) return
    const previous = isFavorite
    const newState = !previous
    setIsFavorite(newState)
    try {
  await ApiService.toggleFavorite(ownerToUse, idToUse)
  notifyCredentialsMutated({ source: 'PasswordCard', kind: 'favorite', credentialId: idToUse })
  if (onCredentialUpdated) onCredentialUpdated()
    } catch {
      setIsFavorite(previous)
      toast.error('Failed to update favorite')
    }
  }

  const handleRestore = async (idParam, ownerIdParam) => {
    const idToUse = idParam ?? credId
    const ownerToUse = userId ?? ownerIdParam ?? ownerIdFromCredential
    if (!idToUse || !ownerToUse) return
    try {
      if(credential.has2fa){
        let response=await ApiService.getTotpId(idToUse);
        let totpId=response.data.id;
        await apiService.updateTotpState(totpId,"active");
            }
      await ApiService.restoreCredential(ownerToUse, idToUse)
      toast.success('credential restored')
  notifyCredentialsMutated({ source: 'PasswordCard', kind: 'restore', credentialId: idToUse })
      if (onCredentialUpdated) onCredentialUpdated()
    } catch {
      
      toast.error('Failed to restore')
    }
  }

  useEffect(() => {
    const decryptData = async () => {
      if (!credential.dataEnc || !credential.dataIv || !credential.dataAuthTag || !vaultKey) return
      setIsDecrypting(true)
      try {
        const decrypted = await decryptCredentialForClient(credential, vaultKey)
        setDecryptedData(decrypted)
        setPasswordScore(typeof decrypted?.passwordStrength === 'number' ? decrypted.passwordStrength : null)
      } catch {
        setDecryptedData(null)
        toast.error('Impossible de déchiffrer les données')
      } finally {
        setIsDecrypting(false)
      }
    }
    decryptData()
  }, [credential, vaultKey])

  const getPasswordBadge = (score) => {
    if (!credential.hasPassword || credential.category !== 'login' || typeof score !== 'number') {
      return null;
    }

    if (score >= 80) return { label: 'Strong', className: 'bg-green-100 text-green-700' };
    if (score >= 60) return { label: 'Good', className: 'bg-emerald-100 text-emerald-700' };
    if (score >= 40) return { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Weak', className: 'bg-red-100 text-red-700' };
  }

  const passwordBadge = getPasswordBadge(passwordScore);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleCopy = (field) => {
    if (!decryptedData) return
    if (field === 'content' && decryptedData.content) {
      navigator.clipboard.writeText(decryptedData.content)
      toast.success('Content copied')
      return
    }
    if (field === 'password' && decryptedData.password) {
      navigator.clipboard.writeText(decryptedData.password)
      toast.success('Password copied')
      return
    }
    if (field === 'cardNumber' && decryptedData.cardNumber) {
      navigator.clipboard.writeText(decryptedData.cardNumber)
      toast.success('Card Number copied')
      return
    }
    if (field === 'cvv' && decryptedData.cvv) {
      navigator.clipboard.writeText(decryptedData.cvv)
      toast.success('Cvv copied')
      return
    }
  }

  const handleToggle2FA = () => setIsShow2FA(!isShow2FA)

  const handleDelete = async (state = 'soft') => {
    try {
  
         if(credential.has2fa){
          const response= await ApiService.getTotpId(credId);
          const totpId=response.data.id;

        if(state ==='soft'){
          await ApiService.updateTotpState(totpId,"archived");
        }
        else{
          await ApiService.deleteTotpEntry(totpId);
        }
      }
      await ApiService.deleteCredential(userId, credId, state);
      
   
      toast.success(state === 'deleted' ? 'Item deleted' : 'Item moved to archive', {
        position: 'top-center'
      })
      notifyCredentialsMutated({ source: 'PasswordCard', kind: state === 'deleted' ? 'delete' : 'archive', credentialId: credId })
      if (onCredentialDeleted) onCredentialDeleted()
    } catch (error) {
      toast.error(error.message || 'Failed to delete password', {
        position: 'top-center'
      })
    } finally {
      setShowDeleteConfirm(false)
      setIsMenuOpen(false)
    }
  }

  if (isDecrypting)
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg px-3 py-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500">Décryptage...</p>
        </div>
      </div>
    )

  if (!decryptedData && !isDecrypting)
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-4">
        <p className="text-red-600 text-sm">⚠️ Impossible de déchiffrer cette credential</p>
      </div>
    )

  return (
    <>
      <div className="w-full hover:shadow-lg bg-white border border-gray-200 rounded-lg px-3 py-4 flex flex-col">
        <div className="flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex gap-x-3 items-center flex-1">
            <Icon className="w-5" strokeWidth={1} />
            <div className="flex flex-col gap-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap gap-x-2 gap-y-1.5 items-center">
                <span className="font-medium text-sm sm:text-base break-words">{credential.title}</span>
                <Star
                  className={`w-4 cursor-pointer ${isFavorite ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-yellow-400'}`}
                  strokeWidth={2}
                  onClick={() => handleToggleFavorite(credential.id, credential.userId)}
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
                {passwordBadge && (
                  <div className={`flex justify-center items-center text-xs rounded-lg px-2 sm:px-3 py-0.5 ${passwordBadge.className}`}>
                    <span className="capitalize">{passwordBadge.label}</span>
                  </div>
                )}
                {/* {credential.passwordReused && credential.category==='login' && (
                  <div className="flex justify-center items-center text-xs bg-yellow-100 rounded-lg px-2 sm:px-3 py-0.5">
                    <RefreshCcw className="w-3 mr-1" strokeWidth={2} />
                    <span className="text-yellow-700">Reused</span>
                  </div>
                )}
                {credential.compromised && credential.category==='login' && (
                  <div className="flex justify-center items-center text-xs bg-red-100 rounded-lg px-2 sm:px-3 py-0.5">
                    <Shield className="w-3 mr-1" strokeWidth={2} />
                    <span className="text-red-600">Compromised</span>
                  </div>
                )} */}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {hasFolder && (
                  <div className="flex items-center text-xs bg-gray-100 rounded-lg px-2 py-1">
                    <Folder className="w-3" strokeWidth={1} />
                    <span>{credential.folder.name}</span>
                  </div>
                )}
                <div className="flex items-center text-xs bg-gray-100 rounded-lg px-2 py-1">
                  <span>{credential.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex  flex-row sm:flex-row md:flex-col sm:items-center md:items-end gap-2 sm:gap-y-1 flex-shrink-0">
            <p className="text-sm  sm:text-sm text-gray-500 whitespace-nowrap">
              Last Update: {new Date(credential.updatedAt).toLocaleDateString()}
            </p>
            <div className="relative" ref={menuRef}>
              <Ellipsis
                className="w-5 sm:w-4  cursor-pointer"
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
                      <button onClick={()=>handleRestore(credential.id, user?.id)} className="w-full text-left text-sm text-gray-700 hover:bg-black rounded-t-lg pl-2 hover:text-white flex gap-x-2 py-1.5 items-center">
                        <RefreshCcw className="w-4" strokeWidth={2} />
                        <div>Restore</div>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                        <p className="text-red-600">Delete</p>
                      </button>
                    </div>
                  )}

                  {!isArchived && (
                    <button className="w-full text-left text-sm text-gray-700 hover:bg-black pl-2 hover:text-white flex gap-x-2 py-1.5 items-center" onClick={() => setShowEditModal(true)}>
                      <SquarePen className="w-4" strokeWidth={2} />
                      <div>Edit Item</div>
                    </button>
                  )}
                  
                  {!isArchived && credential.attachments && credential.attachments.length > 0 && (
                    <button className="w-full text-left text-sm text-gray-700 hover:bg-black pl-2 hover:text-white flex gap-x-2 py-1.5 items-center" onClick={() => setShowAttachments(true)}>
                      <Paperclip className="w-4" strokeWidth={2} />
                      <div>View Attachments ({credential.attachments.length})</div>
                    </button>
                  )}

                  {!isArchived && (
                    <button 
                      onClick={() => handleDelete('soft')}
                      className="w-full text-left pb-1.5 border-t border-gray-200 items-center pl-3 text-sm flex gap-x-2 hover:bg-red-100 rounded-b-lg pt-2">
                      <p className="text-red-600">Archive</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap text-sm gap-x-3 gap-y-2 mt-1 md:mt-3 text-gray-500 items-center">
          <div className="flex items-center gap-x-2 sm:gap-x-3 flex-wrap sm:flex-nowrap">
            {credential.category === 'login' && (
              <>
                <span>Password:</span>
                <span className="text-sm font-mono">
                  {showPassword ? (decryptedData?.password || 'N/A') : '••••••••'}
                </span>
              </>
            )}

            {credential.category === 'credit_card' && (
              <>
                <div className="flex items-center gap-x-2">
                  <span>Card Number :</span>
                  <span className="text-sm font-mono">
                    {showCardNumber ? (decryptedData?.cardNumber || 'N/A') : '••••••••'}
                  </span>
                  {showCardNumber ? (
                    <EyeOff className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowCardNumber(false)} />
                  ) : (
                    <Eye className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowCardNumber(true)} />
                  )}
                  <Copy className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleCopy('cardNumber')} />
                </div>

                <div className="flex items-center gap-x-2 ml-3">
                  <span>Cvv :</span>
                  <span className="text-sm font-mono">
                    {showCvv ? (decryptedData?.cvv || 'N/A') : '••••'}
                  </span>
                  {showCvv ? (
                    <EyeOff className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowCvv(false)} />
                  ) : (
                    <Eye className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowCvv(true)} />
                  )}
                  <Copy className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleCopy('cvv')} />
                </div>
              </>
            )}

            {credential.category === 'note' && (
              <>
              <div className={showPassword ? 'flex flex-col' : 'flex gap-x-2'}>
                <span className=''>Content :</span>
                <span className="text-sm font-mono">
                  {showPassword ? (decryptedData?.content || 'N/A') : '••••••••'}
                </span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-x-2 sm:gap-x-3">
            {credential.category === 'login' && (
              <>
                {showPassword ? (
                  <EyeOff className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowPassword(true)} />
                )}
                <Copy className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleCopy('password')} />
              </>
            )}

            {credential.category === 'note' && (
              <>
                {showPassword ? (
                  <EyeOff className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setShowPassword(true)} />
                )}
                <Copy className="w-4 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleCopy('content')} />
              </>
            )}
          </div>
        </div>

                      {isShow2FA && (
      <div className="mt-1 ml-2 mr-2">
        <Show2FA credentialId={credId} onHide={handleToggle2FA} />
      </div>
    )}
      </div>

      {showDeleteConfirm && isArchived && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Archive className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Permanently</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to permanently delete this item? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => handleDelete('deleted')}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && decryptedData && (
        <AddItemModal 
          show={showEditModal} 
          setShow={setShowEditModal} 
          credentialToEdit={decryptedData} 
          onCredentialAdded={onCredentialUpdated}
          listPasswords={listPasswords}
          setListPasswords={setListPasswords}
        />
      )}
      {showAttachments && (
        <AddItemModal 
          show={showAttachments} 
          setShow={setShowAttachments} 
          credentialToEdit={decryptedData} 
          attachmentsOnly={true}
          onCredentialAdded={onCredentialUpdated}
          listPasswords={listPasswords}
          setListPasswords={setListPasswords}
        />
      )}
    </>
  )
}

export default PasswordCard
