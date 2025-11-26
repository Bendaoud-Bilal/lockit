import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import link from "../services/link";
import { APP_CONFIG } from "../utils/config";

// Browser-compatible encryption (from SendService)
const encryptContent = async (plainText, password) => {
  const encoder = new TextEncoder();
  
  // Derive key from password
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
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(plainText)
  );
  
  return {
    encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    contentIv: btoa(String.fromCharCode(...iv)),
    contentAuthTag: '' // GCM mode includes auth tag in encrypted data
  };
};

const decryptContent = async (encryptedContent, contentIv, password) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Derive key from password
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
  
  // Decode base64
  const iv = Uint8Array.from(atob(contentIv), c => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
  
  try {
    // Decrypt
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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sendData) => {
      let contentToEncrypt;
      let filename = null;

      // Handle different content types
      if (sendData.type === 'file' && sendData.content instanceof File) {
        filename = sendData.content.name;
        const arrayBuffer = await sendData.content.arrayBuffer();
        // Convert file to base64 for encryption
        const uint8Array = new Uint8Array(arrayBuffer);
        contentToEncrypt = btoa(String.fromCharCode(...uint8Array));
      } else {
        // Text or credential content
        contentToEncrypt = sendData.content;
      }

      // Encrypt content with password (or default if no password)
      const password = sendData.accessPassword || 'default-key';
      const encrypted = await encryptContent(contentToEncrypt, password);

      // Prepare data for relay server
      const relayData = {
        name: sendData.name,
        type: sendData.type,
        encryptedContent: encrypted.encryptedContent,
        contentIv: encrypted.contentIv,
        contentAuthTag: encrypted.contentAuthTag,
        passwordProtected: !!sendData.accessPassword,
        maxAccessCount: sendData.maxAccessCount || null,
        expiresAt: sendData.deleteAfterDays 
          ? new Date(Date.now() + sendData.deleteAfterDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
        filename: filename // Include filename for file sends
      };

      // Send to relay server
      const response = await fetch(`${APP_CONFIG.RELAY_SERVER_URL}/api/relay/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relayData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create send on relay server');
      }

      const result = await response.json();
      
      // Save metadata locally for the sender to track their sends
      saveSendMetadataLocally(userId, {
        id: result.id,
        name: sendData.name,
        type: sendData.type,
        direction: 'sent',
        passwordProtected: !!sendData.accessPassword,
        maxAccessCount: sendData.maxAccessCount,
        currentAccessCount: 0,
        expiresAt: sendData.deleteAfterDays 
          ? new Date(Date.now() + sendData.deleteAfterDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sends", userId] });
    }
  });

  return {
    createSend: mutation.mutate,
    isCreating: mutation.isPending,
    sendData: mutation.data,
  };
};

export const useReceiveSend = (sendId, password = null) => {
  const { data: send, isLoading, error, refetch } = useQuery({
    queryKey: ["receive-send", sendId, password],
    queryFn: async () => {
      const params = password ? `?password=${encodeURIComponent(password)}` : '';
      
      // Fetch from relay server
      const response = await fetch(
        `${APP_CONFIG.RELAY_SERVER_URL}/api/relay/send/${sendId}${params}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retrieve send');
      }

      const data = await response.json();
      
      // If password protected and no content yet, return metadata only
      if (data.passwordProtected && !data.encryptedContent) {
        return data;
      }

      // Decrypt content if available
      if (data.encryptedContent) {
        try {
          const decryptedContent = await decryptContent(
            data.encryptedContent,
            data.contentIv,
            password || 'default-key'
          );

          // Handle file vs text content
          if (data.type === 'file') {
            // Convert base64 back to byte array
            const binaryString = atob(decryptedContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return {
              ...data,
              content: Array.from(bytes), // Convert to regular array for React state
              filename: data.name || 'download',
              extension: data.name?.split('.').pop() || 'bin'
            };
          } else {
            // Text or credential
            return {
              ...data,
              content: decryptedContent
            };
          }
        } catch (decryptError) {
          throw new Error("Invalid password or corrupted content");
        }
      }
      
      return data;
    },
    enabled: !!sendId,
    retry: false,
  });

  return { send, isLoading, error, refetch };
};

export const useSendList = (userId) => {
  const {
    data: sends = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sends", userId],
    queryFn: async () => {
      // Get sends from local storage (metadata only)
      const key = `sends_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    },
  });

  return {
    sends,
    isLoading,
    error,
  };
};

export const useDeleteSend = (userId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sendId) => {
      // Delete from relay server
      const response = await fetch(
        `${APP_CONFIG.RELAY_SERVER_URL}/api/relay/send/${sendId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete send');
      }

      // Remove from local storage
      const key = `sends_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const sends = JSON.parse(stored);
        const filtered = sends.filter(s => s.id !== sendId);
        localStorage.setItem(key, JSON.stringify(filtered));
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sends", userId] });
    },
  });

  return {
    deleteSend: mutation.mutate,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
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