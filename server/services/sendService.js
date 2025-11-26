// services/sendService.js - Browser-compatible version

import { APP_CONFIG } from '../../client/src/utils/config'; 
const RELAY_SERVER = APP_CONFIG.RELAY_SERVER_URL;

class SendService {
  /**
   * Encrypt content in browser using Web Crypto API
   */
  static async encryptContent(plainText, password) {
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
  }

  /**
   * Decrypt content in browser using Web Crypto API
   */
  static async decryptContent(encryptedContent, contentIv, password) {
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
  }

  /**
   * Create a send via relay server
   */
  static async createSendViaRelay(sendData) {
    try {
      let encryptedData;
      
      if (sendData.type === 'file') {
        // Handle file
        const arrayBuffer = await sendData.content.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        encryptedData = await this.encryptContent(base64, sendData.accessPassword);
      } else {
        // Handle text/credential
        encryptedData = await this.encryptContent(sendData.content, sendData.accessPassword);
      }

      // Send encrypted data to relay
      const response = await fetch(`${RELAY_SERVER}/api/relay/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sendData.name,
          type: sendData.type,
          encryptedContent: encryptedData.encryptedContent,
          contentIv: encryptedData.contentIv,
          contentAuthTag: encryptedData.contentAuthTag,
          passwordProtected: !!sendData.accessPassword,
          maxAccessCount: sendData.maxAccessCount,
          expiresAt: sendData.deleteAfterDays 
            ? new Date(Date.now() + sendData.deleteAfterDays * 24 * 60 * 60 * 1000).toISOString()
            : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create send via relay');
      }

      const result = await response.json();
      
      // Store send metadata locally
      this.saveSendMetadataLocally(sendData.userId, {
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
    } catch (error) {
      console.error('Relay send creation failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve a send from relay server
   */
  static async receiveSendViaRelay(sendId, password = null) {
    try {
      const params = password ? `?password=${encodeURIComponent(password)}` : '';
      const response = await fetch(`${RELAY_SERVER}/api/relay/send/${sendId}${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retrieve send');
      }

      const send = await response.json();

      // If password protected and no content yet, return metadata
      if (send.passwordProtected && !send.encryptedContent) {
        return send;
      }

      // Decrypt content locally
      if (send.encryptedContent) {
        const decrypted = await this.decryptContent(
          send.encryptedContent,
          send.contentIv,
          password || 'default-key'
        );

        return {
          ...send,
          content: send.type === 'file' 
            ? Uint8Array.from(atob(decrypted), c => c.charCodeAt(0))
            : decrypted
        };
      }

      return send;
    } catch (error) {
      console.error('Relay send retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Delete a send from relay
   */
  static async deleteSendViaRelay(sendId) {
    try {
      const response = await fetch(`${RELAY_SERVER}/api/relay/send/${sendId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete send');
      }

      return await response.json();
    } catch (error) {
      console.error('Relay send deletion failed:', error);
      throw error;
    }
  }
  
  /**
   * Save send metadata locally for tracking
   */
  static saveSendMetadataLocally(userId, sendMetadata) {
    const key = `sends_${userId}`;
    const existing = localStorage.getItem(key);
    const sends = existing ? JSON.parse(existing) : [];
    sends.push(sendMetadata);
    localStorage.setItem(key, JSON.stringify(sends));
  }
}

export default SendService;