import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import apiService from '../services/apiService';

// Browser-compatible encryption
const encryptContent = async (plainText, password) => {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password || 'default-key'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('lockit-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(plainText)
  );
  
  return {
    encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    contentIv: btoa(String.fromCharCode(...iv)),
  };
};

const decryptContent = async (encryptedContent, contentIv, password) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password || 'default-key'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('lockit-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const iv = Uint8Array.from(atob(contentIv), c => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error("Invalid password or corrupted content");
  }
};

export const useCreateSend = (userId) => {
  const [isCreating, setIsCreating] = useState(false);

  const createSend = async (sendData, callbacks = {}) => {
  setIsCreating(true);
  
  try {
    let contentToEncrypt;
    let filename = null;
    let originalFileExtension = null;

    // Handle different content types
    if (sendData.type === 'credential') {
      contentToEncrypt = sendData.content;
    } else if (sendData.type === 'file' && sendData.content instanceof File) {
      filename = sendData.content.name;
      originalFileExtension = filename.split('.').pop();

      const maxSize = 25 * 1024 * 1024; // 25MB limit
      if (sendData.content.size > maxSize) {
        const errorMessage = `File size (${(sendData.content.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (25MB)`;
        setIsCreating(false);
        if (callbacks.onError) {
          callbacks.onError(new Error(errorMessage));
        }
        throw new Error(errorMessage);
      }

      const arrayBuffer = await sendData.content.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      contentToEncrypt = btoa(String.fromCharCode(...uint8Array));
    } else {
      contentToEncrypt = sendData.content;
    }

    // Encrypt content
    const password = sendData.accessPassword || 'default-key';
    const encrypted = await encryptContent(contentToEncrypt, password);

    // Create send package
    const sendId = uuidv4();
    const sendPackage = {
      version: '1.0',
      id: sendId,
      name: sendData.name,
      type: sendData.type,
      encryptedContent: encrypted.encryptedContent,
      contentIv: encrypted.contentIv,
      passwordProtected: !!sendData.accessPassword,
      createdAt: new Date().toISOString(),
      filename: filename,
      fileExtension: originalFileExtension
    };

    // ✅ FIX: Check localStorage for duplicates BEFORE trying backend
    const existingLocalSends = JSON.parse(localStorage.getItem(`sends_${sendData.userId}`) || '[]');
    const duplicateLocal = existingLocalSends.find(s => s.name === sendData.name);
    
    if (duplicateLocal) {
      const errorMessage = 'A send with this name already exists. Please use a different name.';
      setIsCreating(false);
      if (callbacks.onError) {
        callbacks.onError(new Error(errorMessage));
      }
      throw new Error(errorMessage);
    }

    // Save to backend
    try {
      await apiService.createSend({
        id: sendId,
        name: sendData.name,
        type: sendData.type,
        passwordProtected: !!sendData.accessPassword,
        encryptedPackage: sendPackage
      });
    } catch (apiError) {
      console.warn('Backend save failed, using localStorage fallback:', apiError);
      
      // ✅ FIX: Don't save to localStorage if it's a duplicate error
      if (apiError.message && apiError.message.includes('already exists')) {
        setIsCreating(false);
        if (callbacks.onError) {
          callbacks.onError(apiError);
        }
        throw apiError;
      }
      
      // Save to localStorage only if it's NOT a duplicate error
      saveSendMetadataLocally(sendData.userId, {
        id: sendId,
        name: sendData.name,
        type: sendData.type,
        passwordProtected: !!sendData.accessPassword,
        createdAt: sendPackage.createdAt,
        isFileBased: true,
        encryptedPackage: sendPackage
      });
    }

    // Convert to JSON and create file
    const jsonString = JSON.stringify(sendPackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const encryptedFile = new File(
      [blob], 
      `lockit-send-${sendData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.lockit`,
      { type: 'application/json' }
    );
    
    setIsCreating(false);
    if (callbacks.onSuccess) {
      callbacks.onSuccess({ id: sendId, file: encryptedFile });
    }
    
    return encryptedFile;
  } catch (error) {
    console.error('Send creation failed:', error);
    setIsCreating(false);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    throw error;
  }
};

return {
  createSend,
  isCreating,
};
};

export const useReceiveSend = (sendFile, password = null) => {
  const [send, setSend] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shouldDecrypt, setShouldDecrypt] = useState(false);

  // Auto-load when file changes (initial load without password)
  useEffect(() => {
    if (sendFile) {
      loadSendInitial();
    } else {
      // Clear state when no file
      setSend(null);
      setError(null);
      setShouldDecrypt(false);
    }
  }, [sendFile]);

  // Initial load - just to check if password is needed
  const loadSendInitial = async () => {
    if (!sendFile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fileText = await sendFile.text();
      const sendPackage = JSON.parse(fileText);
      
      if (!sendPackage.version || sendPackage.version !== '1.0') {
        throw new Error('Invalid or unsupported send file format');
      }
      
      // If password protected, just show the password screen
      if (sendPackage.passwordProtected) {
        setSend({
          ...sendPackage,
          content: null,
          needsPassword: true
        });
        setIsLoading(false);
        return;
      }

      // If not password protected, decrypt immediately
      await decryptAndSetContent(sendPackage, 'default-key');
      
    } catch (err) {
      console.error('Failed to load send:', err);
      setError(err.message || 'Failed to load send file');
      setSend(null);
      setIsLoading(false);
    }
  };

  // Manual decryption with password
  const loadSendWithPassword = async () => {
    if (!sendFile || !password) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fileText = await sendFile.text();
      const sendPackage = JSON.parse(fileText);
      
      await decryptAndSetContent(sendPackage, password);
      
    } catch (err) {
      console.error('Failed to decrypt send:', err);
      setError(err.message || 'Invalid password or corrupted content');
      setIsLoading(false);
    }
  };

  // Helper function to decrypt and set content
  const decryptAndSetContent = async (sendPackage, decryptPassword) => {
    try {
      const decryptedContent = await decryptContent(
        sendPackage.encryptedContent,
        sendPackage.contentIv,
        decryptPassword
      );
      
      // Handle file content
      if (sendPackage.type === 'file') {
        const binaryString = atob(decryptedContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        setSend({
          ...sendPackage,
          content: Array.from(bytes),
          filename: sendPackage.filename || `download.${sendPackage.fileExtension || 'bin'}`,
          extension: sendPackage.fileExtension || 'bin',
          needsPassword: false
        });
      } 
      // Handle credential content
      else if (sendPackage.type === 'credential') {
        try {
          const credentialData = JSON.parse(decryptedContent);
          setSend({
            ...sendPackage,
            content: decryptedContent,
            credentialData: credentialData,
            needsPassword: false
          });
        } catch (parseError) {
          console.warn('Failed to parse credential JSON, treating as text:', parseError);
          // If it's not JSON, treat as regular text
          setSend({
            ...sendPackage,
            content: decryptedContent,
            needsPassword: false
          });
        }
      }
      // Handle text content
      else {
        setSend({
          ...sendPackage,
          content: decryptedContent,
          needsPassword: false
        });
      }
      
      setIsLoading(false);
      
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      throw new Error("Invalid password or corrupted content");
    }
  };

  return { send, isLoading, error, loadSend: loadSendWithPassword };
};

export const useSendList = (userId) => {
  const [sends, setSends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSends = async () => {
    setIsLoading(true);
    try {
      // Try backend first
      const response = await apiService.getUserSends(userId);
      setSends(response.sends || []);
    } catch (error) {
      console.warn('Backend fetch failed, using localStorage:', error);
      // Fallback to localStorage
      const key = `sends_${userId}`;
      const stored = localStorage.getItem(key);
      const localSends = stored ? JSON.parse(stored) : [];
      setSends(localSends);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadSends();
    }
  }, [userId]);

  const reload = () => {
    if (userId) {
      loadSends();
    }
  };

  return {
    sends,
    isLoading,
    error: null,
    reload
  };
};

export const useGetSendById = (sendId, password = null) => {
  const [send, setSend] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSend = async () => {
      if (!sendId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try backend first
        const response = await apiService.getSendById(sendId);
        const sendPackage = response.send.encryptedPackage;

        // If password protected but no password provided
        if (sendPackage.passwordProtected && !password) {
          setSend({
            ...sendPackage,
            content: null,
            needsPassword: true
          });
          setIsLoading(false);
          return;
        }

        // Decrypt content
        try {
          const decryptedContent = await decryptContent(
            sendPackage.encryptedContent,
            sendPackage.contentIv,
            password || 'default-key'
          );

          if (sendPackage.type === 'file') {
            const binaryString = atob(decryptedContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            setSend({
              ...sendPackage,
              content: Array.from(bytes),
              filename: sendPackage.filename || `download.${sendPackage.fileExtension || 'bin'}`,
              extension: sendPackage.fileExtension || 'bin',
              needsPassword: false,
              isActive: true
            });
          } else {
            setSend({
              ...sendPackage,
              content: decryptedContent,
              needsPassword: false,
              isActive: true
            });
          }
        } catch (decryptError) {
          setError("Invalid password or corrupted content");
        }

        setIsLoading(false);
      } catch (apiError) {
        // Fallback to localStorage
        console.warn('Backend fetch failed, checking localStorage:', apiError);
        try {
          const storedSends = JSON.parse(localStorage.getItem('sends_global') || '[]');
          const foundSend = storedSends.find(s => s.id === sendId);

          if (!foundSend) {
            setError('Send not found');
            setIsLoading(false);
            return;
          }

          const sendPackage = foundSend.encryptedPackage;

          if (sendPackage.passwordProtected && !password) {
            setSend({
              ...sendPackage,
              content: null,
              needsPassword: true
            });
            setIsLoading(false);
            return;
          }

          const decryptedContent = await decryptContent(
            sendPackage.encryptedContent,
            sendPackage.contentIv,
            password || 'default-key'
          );

          if (sendPackage.type === 'file') {
            const binaryString = atob(decryptedContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            setSend({
              ...sendPackage,
              content: Array.from(bytes),
              filename: sendPackage.filename || `download.${sendPackage.fileExtension || 'bin'}`,
              extension: sendPackage.fileExtension || 'bin',
              needsPassword: false,
              isActive: true
            });
          } else {
            setSend({
              ...sendPackage,
              content: decryptedContent,
              needsPassword: false,
              isActive: true
            });
          }

          setIsLoading(false);
        } catch (localError) {
          setError('Failed to load send');
          setIsLoading(false);
        }
      }
    };

    loadSend();
  }, [sendId, password]);

  return { send, isLoading, error };
};

export const useDeleteSend = (userId) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteSend = async (sendId, callbacks = {}) => {
    setIsDeleting(true);
    
    try {
      // Try backend first
      try {
        await apiService.deleteSend(sendId);
      } catch (apiError) {
        console.warn('Backend delete failed, using localStorage:', apiError);
        // Fallback to localStorage
        const key = `sends_${userId}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
          const sends = JSON.parse(stored);
          const filtered = sends.filter(s => s.id !== sendId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
      
      setIsDeleting(false);
      if (callbacks.onSuccess) {
        callbacks.onSuccess();
      }
    } catch (error) {
      console.error('Failed to delete send:', error);
      setIsDeleting(false);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    }
  };

  return {
    deleteSend,
    isDeleting,
  };
};

// Helper function to save send metadata locally
const saveSendMetadataLocally = (userId, sendMetadata) => {
  const key = `sends_${userId}`;
  const existing = localStorage.getItem(key);
  const sends = existing ? JSON.parse(existing) : [];
  sends.push(sendMetadata);
  localStorage.setItem(key, JSON.stringify(sends));
};