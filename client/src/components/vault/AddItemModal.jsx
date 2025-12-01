import { useState, useEffect, useContext, use } from "react"
import { 
  X, 
  Globe, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ChevronDown, 
  Plus,
  Mail,
  Lock,
  Shield,
  Wrench,
  Database,
  Layers,
  Cloud,
  GitBranch,
  Target,
  Wallet,
  Camera,
  Music,
  Video,
  ImageIcon,
  FileText,
  Folder,
  Trash2,
} from "lucide-react"
import Attachments from "./Attachments"
import IconPicker from "./IconPicker"
import { prepareCredentialForStorage, decryptCredentialForClient } from '../../utils/credentialHelpers';
import { calculatePasswordStrength as scorePassword } from '../../utils/crypto';
import APP_CONFIG from "../../utils/config";
import { checkPasswordCompromised, isExposedPassword } from '../../utils/pwnedPassword';
import axios from "axios"
import { notifyCredentialsMutated } from '../../utils/credentialEvents';
import { useAuth } from '../../context/AuthContext';
import { useFolderList, useAddCredentialToFolder, useRemoveCredentialFromFolder } from "../../hooks/useFolder"
import apiService from "../../services/apiService"
import toast from "react-hot-toast"


const AddItemModal = ({
  show,
  setShow,
  onCredentialAdded,
  credentialToEdit = null,
  attachmentsOnly = false,
  listPasswords = [],
  setListPasswords
}) => {
  const API_BASE_URL = APP_CONFIG.API_BASE_URL;
  const [activeTab, setActiveTab] = useState(attachmentsOnly ? "attachments" : "general")
  const [showPassword, setShowPassword] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [vKey, setVKey] = useState(null);
  const { user, vaultKey } = useAuth();
  const userId = user?.id;
  const isEditMode = !!credentialToEdit;
  
  // Fetch folders
  const { folders, isLoading: foldersLoading } = useFolderList(userId);
  const { addCredentialToFolder } = useAddCredentialToFolder();
  const { removeCredentialFromFolder } = useRemoveCredentialFromFolder();
  
  // Store original password when editing to detect changes
  const [originalPassword] = useState(credentialToEdit?.password || "");
  const [originalPasswordReused] = useState(credentialToEdit?.passwordReused || false);
  const [originalCompromised] = useState(credentialToEdit?.compromised || false);
  
  // Helper function to normalize category names
  const normalizeCategory = (category) => {
    if (!category) return "Login";
    const categoryMap = {
      'login': 'Login',
      'credit_card': 'Credit Card',
      'note': 'Note',
      'secure_note': 'Note',
    };
    return categoryMap[category.toLowerCase()] || category;
  };
  
  useEffect(() => {
    setVKey(vaultKey);
  }, [vaultKey]);

  
  // Update folder field when editing and folders are loaded
  useEffect(() => {
    if (isEditMode && credentialToEdit && folders && folders.length > 0) {
      // Check if credential has a folder
      if (credentialToEdit.folder?.name) {
        // Verify the folder exists in the loaded folders list
        const folderExists = folders.some(f => f.name === credentialToEdit.folder.name);
        if (folderExists && formData.folder !== credentialToEdit.folder.name) {
          setFormData(prev => ({ ...prev, folder: credentialToEdit.folder.name }));
        }
      } else if (credentialToEdit.folderId) {
        // If we only have folderId, find the folder by ID
        const folder = folders.find(f => f.id === credentialToEdit.folderId);
        if (folder && formData.folder !== folder.name) {
          setFormData(prev => ({ ...prev, folder: folder.name }));
        }
      }
    }
  }, [isEditMode, credentialToEdit, folders, foldersLoading]);
  

  const [showIcon, setShowIcon] = useState(false)
  const [errors, setErrors] = useState({})
  const [savedCredentialId, setSavedCredentialId] = useState(credentialToEdit?.id || null) // Store saved credential ID
  const [selectedFiles, setSelectedFiles] = useState([]) // Store files to be uploaded
  const [formData, setFormData] = useState({
    userId: credentialToEdit?.userId || userId,
    title: credentialToEdit?.title || "",
    category: normalizeCategory(credentialToEdit?.category) || "Login",
    folder: credentialToEdit?.folder?.name || "",
    // Login fields
    username: credentialToEdit?.username || "",
    email: credentialToEdit?.email || "",
    password: credentialToEdit?.password || "",  // Password is now part of formData
    passwordReused: (credentialToEdit?.passwordReused) ? credentialToEdit?.passwordReused : false,
    compromised: credentialToEdit?.compromised || false,
    website: credentialToEdit?.website || "",
    // Credit Card fields
    cardholderName: credentialToEdit?.cardholderName || "",
    cardNumber: credentialToEdit?.cardNumber || "",
    expiryMonth: credentialToEdit?.expiryMonth || "",
    expiryYear: credentialToEdit?.expiryYear || "",
    cvv: credentialToEdit?.cvv || "",
    // Secure Note fields
    content: credentialToEdit?.content || "",
    // Common field
    notes: credentialToEdit?.notes || "",
    icon: credentialToEdit?.icon || "globe",
    
  })

  // Icon mapping
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

  // Get the current icon component
  const CurrentIcon = iconMap[formData.icon] || Globe

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Title is required for all categories
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // Category-specific validation
    if (formData.category === "Login") {
      // Login requires at least username or email
      if (!formData.username.trim() && !formData.email.trim()) {
        newErrors.username = "Username or Email is required";
        newErrors.email = "Username or Email is required";
      }
      
      // Email format validation if provided
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }

      // Password is required for Login
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
      }

      // Website URL validation if provided
      if (formData.website.trim() && !/^https?:\/\/.+/.test(formData.website)) {
        newErrors.website = "Invalid URL format (must start with http:// or https://)";
      }
    }

    if (formData.category === "Credit Card") {
      // Cardholder name is required
      if (!formData.cardholderName.trim()) {
        newErrors.cardholderName = "Cardholder name is required";
      }

      // Card number is required and must be 13-19 digits
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (!cardNumber) {
        newErrors.cardNumber = "Card number is required";
      } else if (!/^\d{13,19}$/.test(cardNumber)) {
        newErrors.cardNumber = "Card number must be 13-19 digits";
      }

      // Expiry month validation (01-12)
      if (!formData.expiryMonth) {
        newErrors.expiryMonth = "Expiry month is required";
      } else if (!/^(0[1-9]|1[0-2])$/.test(formData.expiryMonth)) {
        newErrors.expiryMonth = "Invalid month (01-12)";
      }

      // Expiry year validation (current year or future)
      const currentYear = new Date().getFullYear();
      if (!formData.expiryYear) {
        newErrors.expiryYear = "Expiry year is required";
      } else if (!/^\d{4}$/.test(formData.expiryYear)) {
        newErrors.expiryYear = "Year must be 4 digits";
      } else if (parseInt(formData.expiryYear) < currentYear) {
        newErrors.expiryYear = "Card is expired";
      }

      // CVV validation (3-4 digits)
      if (!formData.cvv) {
        newErrors.cvv = "CVV is required";
      } else if (!/^\d{3,4}$/.test(formData.cvv)) {
        newErrors.cvv = "CVV must be 3-4 digits";
      }
    }

    if (formData.category === "Note") {
      // Content is required for Secure Note
      if (!formData.content.trim()) {
        newErrors.content = "Content is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveItem = async () => { 
    let credentialId = null;
    try {
      // Validate form before saving
      if (!validateForm()) {
        // alert('Please fix the errors in the form');
        return;
      }
      // Keep vault key only in memory (do not persist plaintext vaultKey)
    
      if (!vaultKey) {
        throw new Error('No vault key found. Please login first.');
      }
  
    // Check if password is reused and compromised before encryption
    let updatedFormData = { ...formData };
    
    // Find the folder ID from folder name
    const selectedFolder = formData.folder 
      ? folders?.find(f => f.name === formData.folder) 
      : null;
    
    // Add folderId to the credential data
    updatedFormData.folderId = selectedFolder?.id || null;
    
    // Only check password reuse/compromise if password has changed or it's a new credential
    const passwordHasChanged = !isEditMode || formData.password !== originalPassword;
    
    if (formData.category === "Login" && formData.password) {
      if (passwordHasChanged) {
        // Filter out the current credential's original password if in edit mode
        const otherPasswords = isEditMode && originalPassword 
          ? listPasswords.filter(pwd => pwd !== originalPassword)
          : listPasswords;
        
        // Check if password exists in other credentials
        const isReused = otherPasswords.includes(formData.password);
        updatedFormData.passwordReused = isReused;

        const passwordScore = passwordStrength.score;
        const isUltraWeak = passwordScore > 0 && passwordScore < 35;
        const inExposedWordlist = isExposedPassword(formData.password);
        let compromisedFlag = isUltraWeak || inExposedWordlist;

        if (inExposedWordlist) {
          toast.error('This password appears on a highly exposed wordlist. Please choose another one.', {
            duration: 5000
          });
        }

        // Check if password has been compromised in data breaches (online lookup) if needed
        try {
          if (!compromisedFlag) {
            const { compromised, occurrences } = await checkPasswordCompromised(formData.password);
            compromisedFlag = compromised;
            if (compromised) {
              toast.error(`This password has been found in ${occurrences.toLocaleString()} data breaches! Consider changing it.`, {
                duration: 5000
              });
            }
          }
          updatedFormData.compromised = compromisedFlag;
        } catch (error) {
          console.error('Error checking password compromise:', error);
          updatedFormData.compromised = compromisedFlag;
        }
      } else {
        // Password hasn't changed, keep original values
        updatedFormData.passwordReused = originalPasswordReused;
        updatedFormData.compromised = originalCompromised;
      }
    } else {
      updatedFormData.passwordReused = false;
      updatedFormData.compromised = false;
    }
  
    // Encrypt and prepare for API
    const encryptedCredential = await prepareCredentialForStorage(updatedFormData, vKey);

    // const decryptedCredential = await decryptCredentialForClient(encryptedCredential, vKey);

    // Save or update credential
    let response;
    if (isEditMode) {
      response = await apiService.updateCredential(credentialToEdit.id, encryptedCredential);
    } else {
      response = await apiService.addCredential(encryptedCredential);
    }

    // Get the credential ID (from response or from edit mode)
    // const credentialId = response.data.credential?.id || credentialToEdit?.id;
    
    const credentialId = response.credential?.id || credentialToEdit?.id;
    
    // Handle folder assignment
    if (selectedFolder && credentialId) {
      try {
        // Check if we need to update folder assignment (for edit mode)
        const originalFolderId = credentialToEdit?.folderId || credentialToEdit?.folder?.id;
        
        if (isEditMode && originalFolderId && originalFolderId !== selectedFolder.id) {
          // Remove from old folder first
          await removeCredentialFromFolder({ 
            folderId: originalFolderId, 
            credentialId 
          });
        }
        
        // Add to new folder (or add for first time)
        if (!isEditMode || originalFolderId !== selectedFolder.id) {
          await addCredentialToFolder({ 
            folderId: selectedFolder.id, 
            credentialId 
          });
        }
      } catch (folderError) {
        console.error('Error managing folder assignment:', folderError);
        toast.error('Credential saved but folder assignment failed');
      }
    } else if (isEditMode && !selectedFolder && credentialToEdit?.folderId) {
      // Remove from folder if folder was cleared
      try {
        await removeCredentialFromFolder({ 
          folderId: credentialToEdit.folderId, 
          credentialId 
        });
      } catch (folderError) {
        console.error('Error removing from folder:', folderError);
      }
    }
    
    // Upload attachments if any were selected
    if (selectedFiles.length > 0 && credentialId) {
      let successCount = 0
      let failCount = 0
      
      for (const file of selectedFiles) {
        try {
          await uploadAttachment(file, credentialId, vKey)
          successCount++
        } catch (attachError) {
          failCount++
          console.error(`✗ Error uploading attachment: ${file.name}`, attachError)
          if (attachError.response) {
            console.error('Server response:', attachError.response.data)
            console.error('Status code:', attachError.response.status)
          }
        }
      }
      
      // Clear selected files after upload
      setSelectedFiles([])
      
      if (failCount > 0) {
        toast.success(`Credential ${isEditMode ? 'updated' : 'saved'}! ${successCount} attachment(s) uploaded successfully, ${failCount} failed.`)
      } else {
        toast.success(`Credential ${isEditMode ? 'updated' : 'saved'} with ${successCount} attachment(s) successfully!`)
      }
    } else if (isEditMode) {
      toast.success('Credential updated successfully!')
    } else if (credentialId) {
      setSavedCredentialId(credentialId)
      toast.success('Credential saved successfully!')
    }
    
    setShow(false);
    notifyCredentialsMutated({ source: 'AddItemModal', credentialId });
    if (onCredentialAdded) {
      onCredentialAdded(); // Trigger refetch in Vault
    }
    
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error('This title is already in use.');
    }
  }
  // Function to encrypt and upload a file
  const uploadAttachment = async (file, credentialId, vaultKey) => {
    try {
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)

      // Convert base64 vault key to CryptoKey
      const keyData = Uint8Array.from(atob(vaultKey), c => c.charCodeAt(0))
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      )

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // Encrypt
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        cryptoKey,
        data
      )

      // Split encrypted data and auth tag
      const encryptedArray = new Uint8Array(encryptedBuffer)
      const ciphertext = encryptedArray.slice(0, -16)
      const authTag = encryptedArray.slice(-16)

      // Convert to Base64 using chunked approach (avoids call stack overflow)
      const encryptedData = {
        encryptedData: arrayBufferToBase64(ciphertext),
        dataIv: arrayBufferToBase64(iv),
        dataAuthTag: arrayBufferToBase64(authTag),
      }

      // Calculate payload size
      const payloadSize = JSON.stringify({
        credentialId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        ...encryptedData,
      }).length

      // Upload to server
      const response = await axios.post(`${API_BASE_URL}/api/vault/attachments`, {
        credentialId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        ...encryptedData,
      })
      
      return response.data.attachment
    } catch (error) {
      console.error(`[Upload] Error for ${file.name}:`, error)
      if (error.response?.status === 413) {
        throw new Error(`File too large: ${file.name}. Try a smaller file.`)
      }
      throw error
    }
  }

  const category = [
    {id : 1, name: "Login"},
    {id : 2, name: "Credit Card"},
    {id : 3, name: "Note"},
  ]

  
  const getPasswordStrengthMeta = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "text-gray-500", score: 0 };

    const score = scorePassword(pwd);
    let label = "Weak";
    let color = "text-red-600";
    let strengthBars = 1;

    if (score >= 80) {
      label = "Strong";
      color = "text-green-600";
      strengthBars = 4;
    } else if (score >= 60) {
      label = "Good";
      color = "text-emerald-600";
      strengthBars = 3;
    } else if (score >= 40) {
      label = "Medium";
      color = "text-yellow-600";
      strengthBars = 2;
    }

    return { strength: strengthBars, label, color, score };
  }

  const passwordStrength = getPasswordStrengthMeta(formData.password)

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let newPassword = ""
    for (let i = 0; i < 16; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password: newPassword })
  }

  const closeModal = () => {
    setShow(false)
  }

  // Helper function to convert Uint8Array to Base64 efficiently (avoids stack overflow)
  const arrayBufferToBase64 = (buffer) => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    // Process in chunks to avoid call stack issues
    const chunkSize = 8192
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len))
      binary += String.fromCharCode.apply(null, chunk)
    }
    return btoa(binary)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode && attachmentsOnly ? 'View Attachments' : isEditMode ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button type="button" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all" onClick={closeModal}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {!attachmentsOnly && <div className="px-6 pt-4 ">
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab("general")}
              type="button"
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "general" 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              General
            </button>
            {/* <button type="button"
            disabled={formData.category !== 'Login'}
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "security" 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Security
            </button> */}
            <button type="button"
              onClick={() => setActiveTab("attachments")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "attachments" 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Attachments
            </button>
          </div>
        </div> }
        

        {/* Form Content - Scrollable */}
        {activeTab === "general" &&
        
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Title, Category, Icon Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                placeholder="Enter title"
                className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                  errors.title ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Category</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isEditMode}
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                    isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  {category.map((cat) => (
                  <option key={cat.id}>{cat.name}</option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1 italic">Category cannot be changed when editing</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Icon</label>
              <button type="button" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 font-medium text-gray-700"
                onClick={() => setShowIcon(!showIcon)}  >
                <CurrentIcon className="w-4 h-4" />
                Change Icon
              </button>
            </div>
          </div>

          {/* Folder */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Folder</label>
            <div className="relative">
              <select
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                disabled={foldersLoading}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">No Folder</option>
                {folders && folders.length > 0 ? (
                  folders.map((folder) => (
                    <option key={folder.id} value={folder.name}>
                      {folder.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No folders available</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Login Category Fields */}
          {formData.category === "Login" && (
            <>
              {/* Username and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    placeholder="Enter username"
                    className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                      errors.username ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="Enter email"
                    className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Enter password"
                    className={`w-full px-3 py-2.5 pr-20 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                      errors.password ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button 
                      onClick={generatePassword} 
                      className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">
                        Strength: <span className={`${passwordStrength.color}`}>{passwordStrength.label}</span>
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.strength 
                              ? passwordStrength.strength <= 1 
                                ? 'bg-red-600' 
                                : passwordStrength.strength === 2 
                                ? 'bg-yellow-500' 
                                : 'bg-green-600'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => {
                    setFormData({ ...formData, website: e.target.value });
                    if (errors.website) setErrors({ ...errors, website: '' });
                  }}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none placeholder:text-gray-400 ${
                    errors.website ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {/* Credit Card Category Fields */}
          {formData.category === "Credit Card" && (
            <>
              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Cardholder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={(e) => {
                    setFormData({ ...formData, cardholderName: e.target.value });
                    if (errors.cardholderName) setErrors({ ...errors, cardholderName: '' });
                  }}
                  placeholder="Enter cardholder name"
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                    errors.cardholderName ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, cardNumber: e.target.value });
                    if (errors.cardNumber) setErrors({ ...errors, cardNumber: '' });
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
              </div>

              {/* Expiry and CVV Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Expiry Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.expiryMonth}
                    onChange={(e) => {
                      setFormData({ ...formData, expiryMonth: e.target.value });
                      if (errors.expiryMonth) setErrors({ ...errors, expiryMonth: '' });
                    }}
                    placeholder="MM"
                    maxLength="2"
                    className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                      errors.expiryMonth ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.expiryMonth && <p className="text-red-500 text-xs mt-1">{errors.expiryMonth}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Expiry Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.expiryYear}
                    onChange={(e) => {
                      setFormData({ ...formData, expiryYear: e.target.value });
                      if (errors.expiryYear) setErrors({ ...errors, expiryYear: '' });
                    }}
                    placeholder="YYYY"
                    maxLength="4"
                    className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                      errors.expiryYear ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.expiryYear && <p className="text-red-500 text-xs mt-1">{errors.expiryYear}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCVV ? "text" : "password"}
                      value={formData.cvv}
                      onChange={(e) => {
                        setFormData({ ...formData, cvv: e.target.value });
                        if (errors.cvv) setErrors({ ...errors, cvv: '' });
                      }}
                      placeholder="123"
                      maxLength="4"
                      className={`w-full px-3 py-2.5 pr-10 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none ${
                        errors.cvv ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    <button
                      onClick={() => setShowCVV(!showCVV)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      {showCVV ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {/* Secure Note Category Fields */}
          {formData.category === "Note" && (
            <>
              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    if (errors.content) setErrors({ ...errors, content: '' });
                  }}
                  placeholder="Enter your secure note content..."
                  rows={6}
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400 ${
                    errors.content ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          )}
        </div>
        }

        {/* {activeTab === "security" && 
        // <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
        //   <p className="text-lg text-black">Two-Factor Authentification</p>
        //   <div className="flex flex-col items-center justify-center gap-3 border rounded-lg p-4 ">
        //     <img src={icon} alt="" className="w-12 h-12" />
            
              
        //     <p className="text-md text-gray-600">No Two-Factor authentification configured </p>
            
        //     <button className="px-4 py-2 bg-black flex text-white rounded-lg hover:bg-gray-800 transition-all">
        //       <Plus className="w-4 fill-white mr-2" strokeWidth={3}/>
        //       Add TOTP
        //     </button>

        //   </div>
        // </div>

        <Security />

        } */}

        {activeTab === "attachments" && 
        <Attachments 
          credentialId={savedCredentialId} 
          vaultKey={vKey}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
        }

        {/* Footer Actions */}
         <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <button type="button" className="px-5 py-2.5 text-sm text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-all" onClick={closeModal}>
              Cancel
            </button>
            {selectedFiles.length > 0 && (
              <span className="text-xs text-gray-600 italic">
                +{selectedFiles.length} attachment{selectedFiles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button type="submit" className="px-5 py-2.5 text-sm bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg" onClick={() => {saveItem()}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            {isEditMode 
              ? `Update Item${selectedFiles.length > 0 ? ` & Upload ${selectedFiles.length}` : ''}`
              : `Save Item${selectedFiles.length > 0 ? ` & Upload ${selectedFiles.length}` : ''}`
            }
          </button>
        </div>
        
      </div>

      {showIcon && <IconPicker showIcon= {showIcon} setShowIcon={setShowIcon} formData={formData} setFormData={setFormData} />}
    </div>
  )
}

export default AddItemModal
