# Lockit Vault API Documentation

Base URL: `http://localhost:5000/api/vault`

---

## 📋 **CREDENTIALS**

### **1. Create Credential**

**POST** `/credentials`

Create a new encrypted credential in the vault.

**Request Body:**

```json
{
  "userId": 1,
  "folderId": 2,
  "category": "login",
  "title": "GitHub Account",
  "icon": "github.svg",
  "dataEnc": "encrypted_base64_string",
  "dataIv": "iv_base64_string",
  "dataAuthTag": "authtag_base64_string",
  "hasPassword": true,
  "passwordStrength": 4
}
```

**Response (201):**

```json
{
  "message": "Credential added successfully",
  "credential": {
    "id": 1,
    "userId": 1,
    "folderId": 2,
    "category": "login",
    "title": "GitHub Account",
    "icon": "github.svg",
    "dataEnc": "...",
    "dataIv": "...",
    "dataAuthTag": "...",
    "hasPassword": true,
    "passwordStrength": 4,
    "favorite": false,
    "state": "active",
    "createdAt": "2025-10-26T10:00:00.000Z",
    "updatedAt": "2025-10-26T10:00:00.000Z",
    "folder": {
      "id": 2,
      "name": "Work"
    }
  }
}
```

---

### **2. Get All Credentials**

**GET** `/credentials/user/:userId`

Get all credentials for a specific user.

**Query Parameters:**

- `folderId` (optional) - Filter by folder
- `category` (optional) - Filter by category (login, credit_card, secure_note, identity)
- `favorite` (optional) - Filter favorites (true/false)
- `state` (optional) - Filter by state (active/deleted) - default: active

**Example:**

```
GET /api/vault/credentials/user/1?category=login&favorite=true
```

**Response (200):**

```json
{
  "credentials": [
    {
      "id": 1,
      "userId": 1,
      "title": "GitHub Account",
      "category": "login",
      "icon": "github.svg",
      "favorite": true,
      "dataEnc": "...",
      "dataIv": "...",
      "dataAuthTag": "...",
      "hasPassword": true,
      "passwordStrength": 4,
      "passwordReused": false,
      "compromised": false,
      "has2fa": false,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "folder": {
        "id": 2,
        "name": "Work"
      },
      "totpSecrets": [],
      "attachments": []
    }
  ]
}
```

---

### **3. Get Single Credential**

**GET** `/credentials/:id?userId=1`

Get a specific credential by ID (with ownership verification).

**Response (200):**

```json
{
  "credential": {
    "id": 1,
    "userId": 1,
    "title": "GitHub Account",
    "dataEnc": "...",
    "dataIv": "...",
    "dataAuthTag": "...",
    "folder": { ... },
    "totpSecrets": [],
    "attachments": [],
    "breachAlerts": []
  }
}
```

**Response (404):**

```json
{
  "error": "Credential not found"
}
```

---

### **4. Update Credential**

**PUT** `/credentials/:id`

Update an existing credential.

**Request Body:**

```json
{
  "userId": 1,
  "title": "GitHub Personal Account",
  "icon": "github-updated.svg",
  "folderId": 3,
  "favorite": true,
  "dataEnc": "new_encrypted_data",
  "dataIv": "new_iv",
  "dataAuthTag": "new_auth_tag",
  "passwordStrength": 5
}
```

**Response (200):**

```json
{
  "message": "Credential updated successfully",
  "credential": { ... }
}
```

---

### **5. Delete Credential**

**DELETE** `/credentials/:id?userId=1`

Delete a credential (soft delete by default).

**Query Parameters:**

- `userId` (required) - For ownership verification
- `permanent` (optional) - Set to "true" for permanent deletion

**Soft Delete (default):**

```
DELETE /api/vault/credentials/1?userId=1
```

**Response:**

```json
{
  "message": "Credential moved to trash"
}
```

**Permanent Delete:**

```
DELETE /api/vault/credentials/1?userId=1&permanent=true
```

**Response:**

```json
{
  "message": "Credential permanently deleted"
}
```

---

### **6. Toggle Favorite**

**PATCH** `/credentials/:id/favorite`

Toggle favorite status of a credential.

**Request Body:**

```json
{
  "userId": 1
}
```

**Response (200):**

```json
{
  "message": "Favorite status updated",
  "favorite": true
}
```

---

## 📁 **FOLDERS**

### **7. Create Folder**

**POST** `/folders`

Create a new folder.

**Request Body:**

```json
{
  "userId": 1,
  "name": "Work"
}
```

**Response (201):**

```json
{
  "message": "Folder created successfully",
  "folder": {
    "id": 1,
    "userId": 1,
    "name": "Work",
    "createdAt": "2025-10-26T10:00:00.000Z",
    "updatedAt": "2025-10-26T10:00:00.000Z"
  }
}
```

**Response (409) - Duplicate:**

```json
{
  "error": "Folder with this name already exists"
}
```

---

### **8. Get All Folders**

**GET** `/folders/user/:userId`

Get all folders for a user with credential counts.

**Response (200):**

```json
{
  "folders": [
    {
      "id": 1,
      "userId": 1,
      "name": "Work",
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "_count": {
        "credentials": 5
      }
    },
    {
      "id": 2,
      "name": "Personal",
      "_count": {
        "credentials": 12
      }
    }
  ]
}
```

---

### **9. Update Folder**

**PUT** `/folders/:id`

Update folder name.

**Request Body:**

```json
{
  "userId": 1,
  "name": "Work Projects"
}
```

**Response (200):**

```json
{
  "message": "Folder updated successfully",
  "folder": { ... }
}
```

---

### **10. Delete Folder**

**DELETE** `/folders/:id?userId=1`

Delete a folder (credentials are moved to "No Folder").

**Response (200):**

```json
{
  "message": "Folder deleted successfully"
}
```

---

## 📊 **STATISTICS**

### **11. Get Vault Statistics**

**GET** `/stats/:userId`

Get comprehensive vault statistics for a user.

**Response (200):**

```json
{
  "totalCredentials": 25,
  "favoriteCount": 5,
  "compromisedCount": 2,
  "weakPasswordCount": 3,
  "reusedPasswordCount": 4,
  "byCategory": [
    {
      "category": "login",
      "_count": 15
    },
    {
      "category": "credit_card",
      "_count": 5
    },
    {
      "category": "secure_note",
      "_count": 3
    },
    {
      "category": "identity",
      "_count": 2
    }
  ]
}
```

---

## 🧪 **TEST ROUTE**

### **12. Health Check**

**GET** `/status`

Check if the vault API is operational.

**Response (200):**

```json
{
  "status": "Vault is operational"
}
```

---

## 📝 **Request/Response Examples**

### **Complete Flow: Adding a Login Credential**

**Step 1: Encrypt data on client**

```javascript
const formData = {
  username: "john@example.com",
  password: "MySecurePassword123!",
  website: "https://github.com",
};

const vaultKey = sessionStorage.getItem("vaultKey");
const encrypted = await encryptCredential(formData, vaultKey);
// Returns: { dataEnc, dataIv, dataAuthTag }
```

**Step 2: Send to API**

```javascript
const response = await fetch("http://localhost:5000/api/vault/credentials", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    userId: 1,
    category: "login",
    title: "GitHub Account",
    icon: "github.svg",
    folderId: 2,
    dataEnc: encrypted.dataEnc,
    dataIv: encrypted.dataIv,
    dataAuthTag: encrypted.dataAuthTag,
    hasPassword: true,
    passwordStrength: 4,
  }),
});

const result = await response.json();
console.log(result.credential);
```

**Step 3: Retrieve and decrypt**

```javascript
// Get credential
const response = await fetch(
  "http://localhost:5000/api/vault/credentials/1?userId=1"
);
const { credential } = await response.json();

// Decrypt
const vaultKey = sessionStorage.getItem("vaultKey");
const decrypted = await decryptCredential(
  credential.dataEnc,
  credential.dataIv,
  credential.dataAuthTag,
  vaultKey
);

console.log(decrypted);
// { username: "john@example.com", password: "MySecurePassword123!", ... }
```

---

## 🔐 **Security Notes**

1. **Zero-Knowledge Architecture**: Server never sees unencrypted data
2. **Encrypted Fields**: `dataEnc`, `dataIv`, `dataAuthTag` store AES-256-GCM encrypted JSON
3. **Vault Key**: Must be obtained from authentication and kept in client session
4. **Ownership Verification**: All operations verify userId matches the resource owner
5. **Soft Deletes**: Credentials are marked as "deleted" by default, can be permanently deleted with `?permanent=true`

---

## 🛠️ **Error Handling**

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (missing required fields)
- **404**: Resource not found
- **409**: Conflict (e.g., duplicate folder name)
- **500**: Server error

Error response format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## 📌 **Categories**

Supported credential categories:

- `login` - Login credentials (username, password, website)
- `credit_card` - Credit card information
- `secure_note` - Encrypted notes
- `identity` - Personal identity information

---

## 🔄 **States**

Credential states:

- `active` - Normal, visible credentials
- `deleted` - Soft-deleted, in trash

---

## 💡 **Tips**

1. Always include `userId` for ownership verification
2. Use query parameters for filtering (category, folder, favorite)
3. Check `passwordStrength` (0-4) to identify weak passwords
4. Monitor `compromised` field for security alerts
5. Use soft delete to allow recovery
6. Batch operations can be done by calling endpoints in sequence
