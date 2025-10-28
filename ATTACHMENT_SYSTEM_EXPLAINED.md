# Complete Attachment System Explanation

## 📚 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Encryption Process](#encryption-process)
5. [Upload Process](#upload-process)
6. [Download Process](#download-process)
7. [Code Walkthrough](#code-walkthrough)
8. [Security Features](#security-features)

---

## Overview

### What Does This System Do?

The attachment system allows users to **securely attach files to their vault credentials** (passwords, credit cards, notes). Files are:
- ✅ Encrypted **client-side** before leaving the browser
- ✅ Uploaded to server in encrypted form
- ✅ Downloaded and decrypted **only** in the browser
- ✅ Server **never** sees the original file content

### Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Client** | React + Web Crypto API | Encryption, UI, file handling |
| **Server** | Node.js + Express | File storage, API endpoints |
| **Database** | Prisma + SQLite | Metadata + encrypted data |
| **Encryption** | AES-256-GCM | Military-grade encryption |

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AddItemModal.jsx (Parent Component)              │  │
│  │  - Manages credential form                        │  │
│  │  - Handles "Save Item" button                     │  │
│  │  - Orchestrates credential + attachment save      │  │
│  └─────────────────┬─────────────────────────────────┘  │
│                    │                                     │
│  ┌─────────────────▼─────────────────────────────────┐  │
│  │  Attachments.jsx (Child Component)                │  │
│  │  - File selection (drag-drop, click)              │  │
│  │  - Display selected files                         │  │
│  │  - Display saved attachments                      │  │
│  │  - Download & decrypt files                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Web Crypto API                                    │  │
│  │  - AES-256-GCM encryption/decryption              │  │
│  │  - Random IV generation                           │  │
│  │  - Key derivation                                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (Encrypted Transport)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  routes/Vault.js                                   │  │
│  │  - POST /api/vault/attachments (upload)           │  │
│  │  - GET /api/vault/attachments/:id (get one)       │  │
│  │  - GET /api/vault/attachments/credential/:id      │  │
│  │  - DELETE /api/vault/attachments/:id              │  │
│  └─────────────────┬─────────────────────────────────┘  │
│                    │                                     │
│  ┌─────────────────▼─────────────────────────────────┐  │
│  │  controllers/attachment.js                         │  │
│  │  - addAttachment()                                 │  │
│  │  - getAttachments()                                │  │
│  │  - getAttachmentById()                             │  │
│  │  - deleteAttachment()                              │  │
│  └─────────────────┬─────────────────────────────────┘  │
│                    │                                     │
│  ┌─────────────────▼─────────────────────────────────┐  │
│  │  Prisma ORM                                        │  │
│  │  - Database operations                             │  │
│  │  - Schema validation                               │  │
│  └─────────────────┬─────────────────────────────────┘  │
└────────────────────┼─────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  SQLite DATABASE                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  attachments table                                 │  │
│  │  - id, credentialId, filename, fileSize           │  │
│  │  - encryptedData (Base64 ciphertext)              │  │
│  │  - dataIv (Base64 initialization vector)          │  │
│  │  - dataAuthTag (Base64 auth tag)                  │  │
│  │  - createdAt                                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Complete User Journey

#### 1️⃣ **User Opens Modal**
```
User clicks "Add Item" 
  → AddItemModal opens
  → User fills credential info (title, username, password, etc.)
  → User switches to "Attachments" tab
```

#### 2️⃣ **User Selects Files**
```
User drags PDF onto upload area (OR clicks to browse)
  → Attachments.jsx: handleDrop() or handleFileChange() triggered
  → File validation: Check size (< 10MB), count (< 5)
  → Files added to selectedFiles state (shared with parent)
  → Amber cards display "Files Ready to Upload"
```

#### 3️⃣ **User Clicks "Save Item"**
```
User clicks "Save Item & Upload 1" button
  → AddItemModal.jsx: saveItem() function executes
  → Step 1: Validate credential form
  → Step 2: Encrypt credential data
  → Step 3: POST credential to server
  → Step 4: Receive credentialId from server
  → Step 5: Loop through selectedFiles
     → For each file:
        → uploadAttachment(file, credentialId, vaultKey)
  → Step 6: Clear selectedFiles
  → Step 7: Show success message
```

#### 4️⃣ **File Upload Process (Per File)**
```
uploadAttachment() called with file
  → Step 1: Read file as ArrayBuffer
  → Step 2: Convert to Uint8Array
  → Step 3: Get vaultKey from sessionStorage
  → Step 4: Import vaultKey as CryptoKey
  → Step 5: Generate random 12-byte IV
  → Step 6: Encrypt file with AES-256-GCM
  → Step 7: Split encrypted result:
     - Ciphertext (encrypted file data)
     - Auth Tag (last 16 bytes for authentication)
  → Step 8: Convert to Base64 (chunked to avoid stack overflow)
  → Step 9: POST to /api/vault/attachments with:
     {
       credentialId: 1,
       filename: "document.pdf",
       fileSize: 461000,
       mimeType: "application/pdf",
       encryptedData: "base64...",
       dataIv: "base64...",
       dataAuthTag: "base64..."
     }
  → Step 10: Server saves to database
  → Step 11: Return success
```

#### 5️⃣ **View Saved Attachments**
```
After save, Attachments.jsx:
  → useEffect() detects credentialId changed
  → fetchAttachments() called
  → GET /api/vault/attachments/credential/{id}
  → Server returns list of encrypted attachments
  → Green cards display "Saved Attachments"
  → Each card shows: filename, size, date, download/delete buttons
```

#### 6️⃣ **Download & Decrypt File**
```
User clicks download icon
  → decryptAndDownload() function executes
  → Step 1: Get attachment metadata from server
  → Step 2: Convert Base64 strings to Uint8Array
     - encryptedData → Uint8Array
     - dataIv → Uint8Array
     - dataAuthTag → Uint8Array
  → Step 3: Combine ciphertext + authTag
  → Step 4: Get vaultKey from sessionStorage
  → Step 5: Import vaultKey as CryptoKey
  → Step 6: Decrypt using AES-256-GCM with IV
  → Step 7: Create Blob from decrypted data
  → Step 8: Create download URL
  → Step 9: Trigger browser download
  → Step 10: Clean up URL
```

---

## Encryption Process

### Step-by-Step Encryption Explained

#### **Input:** Original File
```javascript
File: document.pdf
Size: 461,000 bytes
Content: [Binary PDF data]
```

#### **Step 1: Read File**
```javascript
const arrayBuffer = await file.arrayBuffer()
// Converts File object to ArrayBuffer (raw bytes)

const data = new Uint8Array(arrayBuffer)
// Converts ArrayBuffer to Uint8Array for crypto operations
// data = [37, 80, 68, 70, ...] (461,000 numbers)
```

#### **Step 2: Prepare Encryption Key**
```javascript
const vaultKey = 'YsrxSVjMzoS8M252H++OCmcrSgRlyKAY5WSEETmSEbs='
// This is a Base64-encoded 32-byte (256-bit) key
// In production, this comes from user's master password

const keyData = Uint8Array.from(atob(vaultKey), c => c.charCodeAt(0))
// Decode Base64 to get raw 32 bytes
// keyData = [98, 202, 177, ...] (32 numbers)

const cryptoKey = await crypto.subtle.importKey(
  'raw',           // Key format
  keyData,         // Raw key bytes
  { name: 'AES-GCM' }, // Algorithm
  false,           // Not extractable (security)
  ['encrypt']      // Can be used for encryption
)
// Creates a CryptoKey object that Web Crypto API can use
```

#### **Step 3: Generate Random IV (Initialization Vector)**
```javascript
const iv = crypto.getRandomValues(new Uint8Array(12))
// Generates 12 random bytes (96 bits)
// iv = [142, 56, 201, 18, ...] (12 numbers)
// CRITICAL: Must be unique for each encryption!
// Same file encrypted twice will have different ciphertext
```

#### **Step 4: Encrypt**
```javascript
const encryptedBuffer = await crypto.subtle.encrypt(
  {
    name: 'AES-GCM',
    iv: iv,           // Initialization vector
    tagLength: 128    // Authentication tag: 128 bits = 16 bytes
  },
  cryptoKey,          // The key we imported
  data                // The file data to encrypt
)
// Returns: [encrypted_data + 16-byte_auth_tag]
// Size: 461,000 + 16 = 461,016 bytes
```

#### **Step 5: Split Encrypted Result**
```javascript
const encryptedArray = new Uint8Array(encryptedBuffer)
const ciphertext = encryptedArray.slice(0, -16)
// First 461,000 bytes = encrypted file data

const authTag = encryptedArray.slice(-16)
// Last 16 bytes = authentication tag (for integrity check)
```

#### **Step 6: Convert to Base64 (Chunked)**
```javascript
// WHY CHUNKED: Prevents "Maximum call stack size exceeded"
const arrayBufferToBase64 = (buffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192  // 8KB chunks
  
  // Process 8KB at a time instead of all at once
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    // Convert chunk to characters (safe: only 8,192 args)
    binary += String.fromCharCode.apply(null, chunk)
  }
  
  // Encode binary string to Base64
  return btoa(binary)
}

const encryptedData = arrayBufferToBase64(ciphertext)
// "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9Qcm9kdWNlci..." (Base64 string)

const dataIv = arrayBufferToBase64(iv)
// "jiY5kRI..." (Base64 string, 12 bytes)

const dataAuthTag = arrayBufferToBase64(authTag)
// "8xKp3..." (Base64 string, 16 bytes)
```

#### **Output:** Encrypted Package
```javascript
{
  encryptedData: "JVBERi0xLjQKJeLjz..." (~614,000 chars),
  dataIv: "jiY5kRI..." (16 chars),
  dataAuthTag: "8xKp3..." (24 chars)
}
```

### Why This Is Secure

1. **AES-256-GCM**: Military-grade encryption
   - AES: Advanced Encryption Standard (NSA approved)
   - 256: Key size in bits (2^256 possible keys = unbreakable)
   - GCM: Galois/Counter Mode (authenticated encryption)

2. **Unique IV**: Different ciphertext every time
   - Same file + same key = different encrypted output
   - Prevents pattern analysis

3. **Authentication Tag**: Tamper detection
   - Any modification to ciphertext → decryption fails
   - Prevents malicious alterations

4. **Zero-Knowledge**: Server never sees plaintext
   - Encryption happens in browser
   - Server stores only encrypted data
   - Even server admin can't decrypt files

---

## Upload Process

### Code Walkthrough: uploadAttachment()

```javascript
const uploadAttachment = async (file, credentialId, vaultKey) => {
  try {
    // LOG: Start
    console.log(`[Upload] Starting encryption for: ${file.name}`)
    console.log(`[Upload] Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    
    // ========================================
    // STEP 1: READ FILE
    // ========================================
    const arrayBuffer = await file.arrayBuffer()
    // Converts File → ArrayBuffer
    // Input: File object (from <input type="file">)
    // Output: ArrayBuffer (raw bytes)
    
    const data = new Uint8Array(arrayBuffer)
    // Converts ArrayBuffer → Uint8Array
    // Why: Web Crypto API needs Uint8Array
    
    // ========================================
    // STEP 2: IMPORT ENCRYPTION KEY
    // ========================================
    const keyData = Uint8Array.from(atob(vaultKey), c => c.charCodeAt(0))
    // Base64 string → byte array
    // 'YsrxSV...' → [98, 202, 177, ...]
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',               // Import raw bytes
      keyData,             // 32 bytes (256 bits)
      { name: 'AES-GCM' }, // Algorithm spec
      false,               // Not extractable (can't export key)
      ['encrypt']          // Usage: encryption only
    )
    // Creates CryptoKey object for Web Crypto API
    
    // ========================================
    // STEP 3: GENERATE RANDOM IV
    // ========================================
    const iv = crypto.getRandomValues(new Uint8Array(12))
    // Generates 12 cryptographically random bytes
    // CRITICAL: Must be unique per encryption
    // Used to randomize ciphertext
    
    // ========================================
    // STEP 4: ENCRYPT
    // ========================================
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',    // Algorithm
        iv: iv,              // 12-byte IV
        tagLength: 128       // 16-byte auth tag
      },
      cryptoKey,             // The key
      data                   // The data to encrypt
    )
    // Returns: ArrayBuffer with [ciphertext + authTag]
    
    // ========================================
    // STEP 5: SPLIT RESULT
    // ========================================
    const encryptedArray = new Uint8Array(encryptedBuffer)
    const ciphertext = encryptedArray.slice(0, -16)
    // Everything except last 16 bytes
    
    const authTag = encryptedArray.slice(-16)
    // Last 16 bytes (authentication tag)
    
    // ========================================
    // STEP 6: CONVERT TO BASE64
    // ========================================
    const encryptedData = {
      encryptedData: arrayBufferToBase64(ciphertext),
      dataIv: arrayBufferToBase64(iv),
      dataAuthTag: arrayBufferToBase64(authTag),
    }
    // Chunked conversion to avoid stack overflow
    // Each piece converted to Base64 string
    
    // ========================================
    // STEP 7: CALCULATE PAYLOAD SIZE
    // ========================================
    const payloadSize = JSON.stringify({
      credentialId,
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      ...encryptedData,
    }).length
    
    console.log(`[Upload] Encrypted + Base64 size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`)
    // Shows final payload size for debugging
    
    // ========================================
    // STEP 8: SEND TO SERVER
    // ========================================
    const response = await axios.post('http://localhost:5000/api/vault/attachments', {
      credentialId,           // Which credential this belongs to
      filename: file.name,    // Original filename
      fileSize: file.size,    // Original size (bytes)
      mimeType: file.type || 'application/octet-stream',
      ...encryptedData,       // Spreads: encryptedData, dataIv, dataAuthTag
    })
    
    console.log(`[Upload] Server response:`, response.data)
    return response.data.attachment
    
  } catch (error) {
    console.error(`[Upload] Error for ${file.name}:`, error)
    
    // Special handling for "Payload Too Large"
    if (error.response?.status === 413) {
      throw new Error(`File too large: ${file.name}. Try a smaller file.`)
    }
    
    throw error
  }
}
```

### Server-Side Handling

```javascript
// controllers/attachment.js
export const addAttachment = async (req, res) => {
  try {
    // Extract data from request
    const { 
      credentialId, 
      filename, 
      fileSize, 
      mimeType, 
      encryptedData,  // Base64 string
      dataIv,         // Base64 string
      dataAuthTag     // Base64 string
    } = req.body;

    console.log('Received attachment data:', { credentialId, filename, fileSize, mimeType });
    
    // Validate required fields
    if (!credentialId || !filename || !fileSize || !encryptedData || !dataIv || !dataAuthTag) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Verify credential exists
    const credential = await prisma.credential.findUnique({
      where: { id: parseInt(credentialId) }
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Create attachment record in database
    const attachment = await prisma.attachment.create({
      data: {
        credentialId: parseInt(credentialId),
        filename,
        fileSize: parseInt(fileSize),
        mimeType: mimeType || null,
        encryptedData,  // Stored as Base64 text
        dataIv,         // Stored as Base64 text
        dataAuthTag,    // Stored as Base64 text
      }
    });

    // Return success
    res.status(201).json({ 
      message: 'Attachment added successfully', 
      attachment 
    });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ 
      error: 'Failed to add attachment', 
      details: error.message 
    });
  }
};
```

---

## Download Process

### Code Walkthrough: decryptAndDownload()

```javascript
const decryptAndDownload = async (attachment) => {
  try {
    setIsLoading(true)
    
    // ========================================
    // STEP 1: CONVERT BASE64 TO BYTES
    // ========================================
    const encryptedData = Uint8Array.from(
      atob(attachment.encryptedData), 
      c => c.charCodeAt(0)
    )
    // Base64 string → byte array
    // "JVBERi0xLjQ..." → [37, 80, 68, 70, ...]
    
    const iv = Uint8Array.from(
      atob(attachment.dataIv), 
      c => c.charCodeAt(0)
    )
    // Base64 IV → byte array
    
    const authTag = Uint8Array.from(
      atob(attachment.dataAuthTag), 
      c => c.charCodeAt(0)
    )
    // Base64 auth tag → byte array
    
    // ========================================
    // STEP 2: COMBINE CIPHERTEXT + AUTH TAG
    // ========================================
    const combined = new Uint8Array(encryptedData.length + authTag.length)
    combined.set(encryptedData)           // Copy encrypted data
    combined.set(authTag, encryptedData.length)  // Append auth tag
    // Why: Web Crypto API expects them together
    
    // ========================================
    // STEP 3: IMPORT DECRYPTION KEY
    // ========================================
    const keyData = Uint8Array.from(atob(vaultKey), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']  // This time: decryption permission
    )
    
    // ========================================
    // STEP 4: DECRYPT
    // ========================================
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,           // Same IV used during encryption
        tagLength: 128    // 16-byte auth tag
      },
      cryptoKey,          // Same key used during encryption
      combined            // Ciphertext + auth tag
    )
    // Returns: ArrayBuffer with original file data
    // If tampered: throws error (auth tag verification fails)
    
    // ========================================
    // STEP 5: CREATE DOWNLOADABLE FILE
    // ========================================
    const blob = new Blob(
      [decryptedBuffer], 
      { type: attachment.mimeType || 'application/octet-stream' }
    )
    // Creates a Blob (file-like object) from decrypted data
    
    const url = URL.createObjectURL(blob)
    // Creates temporary URL: blob:http://localhost:3000/abc-123-def
    
    // ========================================
    // STEP 6: TRIGGER DOWNLOAD
    // ========================================
    const a = document.createElement('a')
    a.href = url
    a.download = attachment.filename  // Set download filename
    document.body.appendChild(a)
    a.click()  // Programmatically click link
    document.body.removeChild(a)
    
    // ========================================
    // STEP 7: CLEANUP
    // ========================================
    URL.revokeObjectURL(url)
    // Free memory (blob URL no longer needed)
    
  } catch (error) {
    console.error('Error downloading attachment:', error)
    alert('Failed to decrypt and download file')
  } finally {
    setIsLoading(false)
  }
}
```

---

## Security Features

### 1. **Zero-Knowledge Architecture**

```
┌──────────────┐
│ USER'S FILE  │  document.pdf (plaintext)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ BROWSER (Client)     │
│  ├─ Encrypt with     │
│  │  vault key        │
│  └─ Never sent to    │
│     server           │
└──────┬───────────────┘
       │ (encrypted)
       ▼
┌──────────────────────┐
│ SERVER               │
│  ├─ Stores encrypted │
│  │  data only        │
│  ├─ No vault key     │
│  └─ Can't decrypt    │
└──────┬───────────────┘
       │ (encrypted)
       ▼
┌──────────────────────┐
│ DATABASE             │
│  ├─ encryptedData    │
│  ├─ dataIv           │
│  └─ dataAuthTag      │
└──────────────────────┘

KEY POINT: Server admin can't access your files!
```

### 2. **End-to-End Encryption**

- **Encryption Point**: User's browser (before upload)
- **Decryption Point**: User's browser (after download)
- **In Transit**: Already encrypted (HTTPS adds second layer)
- **At Rest**: Encrypted in database
- **Result**: File is encrypted everywhere except user's device

### 3. **Authenticated Encryption (GCM)**

```javascript
// Regular encryption (insecure)
encrypt(data, key) → ciphertext
// Problem: Can't detect tampering

// Authenticated encryption (secure)
encrypt(data, key) → ciphertext + authTag
decrypt(ciphertext + authTag, key) → data or ERROR
// Benefit: Detects any modifications
```

**Example Attack Prevented:**
```
Hacker modifies encrypted file in database
  → Changes byte 500 from 0x42 to 0x99
  → User downloads file
  → Decryption attempts to verify auth tag
  → Auth tag doesn't match (tampering detected!)
  → Decryption FAILS with error ✅
  → User notified: "File corrupted or tampered"
```

### 4. **Key Management**

```javascript
// Vault Key Storage (session only)
sessionStorage.setItem('vaultKey', key)  // Cleared on browser close
// NOT localStorage (persists after close)
// NOT in code (visible in source)
// NOT sent to server (stays in browser)

// In Production:
// 1. User enters master password
// 2. Derive vault key using PBKDF2/Argon2
// 3. Store in sessionStorage
// 4. Use for encryption/decryption
// 5. Clear on logout
```

### 5. **Unique IVs**

```javascript
// Bad (same IV for all files)
const iv = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12])
encrypt(file1, key, iv) → ciphertext1
encrypt(file2, key, iv) → ciphertext2
// Problem: Pattern analysis possible

// Good (random IV per file)
const iv1 = crypto.getRandomValues(new Uint8Array(12))
const iv2 = crypto.getRandomValues(new Uint8Array(12))
encrypt(file1, key, iv1) → ciphertext1  ✅
encrypt(file2, key, iv2) → ciphertext2  ✅
// Benefit: No patterns, even for same file
```

---

## Summary

### What Happens in 30 Seconds

```
1. USER: Selects PDF file (461KB)
   ↓
2. BROWSER: "I'll encrypt this for you"
   - Reads file as bytes
   - Generates random IV
   - Encrypts with AES-256-GCM
   - Converts to Base64
   ↓
3. CLIENT: "Sending encrypted data to server"
   - POST /api/vault/attachments
   - Payload: { encryptedData, iv, authTag }
   ↓
4. SERVER: "I'll store this encrypted blob"
   - Validates request
   - Saves to database
   - Never decrypts (doesn't have key)
   ↓
5. DATABASE: "Stored safely"
   - Row created with encrypted data
   ↓
6. USER DOWNLOADS:
   - GET encrypted data from server
   - Decrypt in browser
   - Save original file
```

### Key Takeaways

✅ **Client-Side Encryption**: Files encrypted before leaving browser  
✅ **Zero-Knowledge**: Server can't decrypt files  
✅ **Authenticated**: Tamper detection with GCM mode  
✅ **Unique IVs**: Different encryption every time  
✅ **Chunked Base64**: Handles large files without stack overflow  
✅ **Secure Storage**: Session-only vault key  

**Your files are as secure as your master password!** 🔒
