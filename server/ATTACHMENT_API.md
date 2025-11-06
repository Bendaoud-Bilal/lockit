# Attachment API Documentation

## Overview

The Attachment API provides secure encrypted file storage for vault credentials. All files are encrypted client-side using AES-256-GCM before being uploaded to the server.

## Base URL

```
http://localhost:3000/api/vault
```

---

## Endpoints

### 1. Create Attachment

Upload an encrypted file attachment to a credential.

**Endpoint:** `POST /attachments`

**Request Body:**

```json
{
  "credentialId": 1,
  "filename": "document.pdf",
  "fileSize": 102400,
  "mimeType": "application/pdf",
  "encryptedData": "base64_encrypted_file_data...",
  "dataIv": "base64_initialization_vector...",
  "dataAuthTag": "base64_authentication_tag..."
}
```

**Response (201 Created):**

```json
{
  "message": "Attachment added successfully",
  "attachment": {
    "id": 1,
    "credentialId": 1,
    "filename": "document.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "encryptedData": "base64_encrypted_file_data...",
    "dataIv": "base64_initialization_vector...",
    "dataAuthTag": "base64_authentication_tag...",
    "createdAt": "2025-10-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `404 Not Found`: Credential not found
- `500 Internal Server Error`: Server error

---

### 2. Get Attachments for Credential

Retrieve all attachments associated with a specific credential.

**Endpoint:** `GET /attachments/credential/:credentialId`

**Parameters:**

- `credentialId` (path): The ID of the credential

**Response (200 OK):**

```json
{
  "attachments": [
    {
      "id": 1,
      "credentialId": 1,
      "filename": "document.pdf",
      "fileSize": 102400,
      "mimeType": "application/pdf",
      "encryptedData": "base64_encrypted_file_data...",
      "dataIv": "base64_initialization_vector...",
      "dataAuthTag": "base64_authentication_tag...",
      "createdAt": "2025-10-28T12:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Attachment

Retrieve a specific attachment by ID.

**Endpoint:** `GET /attachments/:id`

**Parameters:**

- `id` (path): The attachment ID

**Response (200 OK):**

```json
{
  "attachment": {
    "id": 1,
    "credentialId": 1,
    "filename": "document.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "encryptedData": "base64_encrypted_file_data...",
    "dataIv": "base64_initialization_vector...",
    "dataAuthTag": "base64_authentication_tag...",
    "createdAt": "2025-10-28T12:00:00.000Z",
    "credential": {
      "id": 1,
      "userId": 1,
      "title": "Work Email"
    }
  }
}
```

**Error Responses:**

- `404 Not Found`: Attachment not found

---

### 4. Delete Attachment

Delete an attachment permanently.

**Endpoint:** `DELETE /attachments/:id`

**Parameters:**

- `id` (path): The attachment ID

**Response (200 OK):**

```json
{
  "message": "Attachment deleted successfully"
}
```

**Error Responses:**

- `404 Not Found`: Attachment not found
- `500 Internal Server Error`: Server error

---

## Client-Side Encryption Flow

### Upload Process

1. **Select File**: User selects file through UI
2. **Read File**: Convert file to ArrayBuffer
3. **Encrypt**:
   - Generate random 12-byte IV
   - Encrypt file data using AES-256-GCM
   - Extract authentication tag (last 16 bytes)
4. **Encode**: Convert encrypted data, IV, and tag to Base64
5. **Upload**: Send to server via POST request

### Download Process

1. **Fetch**: GET request to retrieve encrypted attachment
2. **Decode**: Convert Base64 strings to Uint8Array
3. **Decrypt**:
   - Combine encrypted data and auth tag
   - Decrypt using AES-256-GCM with stored IV
4. **Download**: Create Blob and trigger browser download

---

## Security Notes

### Encryption

- **Algorithm**: AES-256-GCM
- **Key**: 256-bit vault key (stored in sessionStorage)
- **IV**: 96-bit random value (unique per file)
- **Auth Tag**: 128-bit authentication tag

### Best Practices

- Files are encrypted client-side before upload
- Server never has access to unencrypted file data
- Vault key never leaves the client
- Maximum file size: 10MB (enforced client-side)
- Maximum 5 attachments per credential

### Client Implementation Example

```javascript
// Encrypt file
const encryptFile = async (file, vaultKey) => {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const keyData = Uint8Array.from(atob(vaultKey), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    data
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);

  return {
    encryptedData: btoa(String.fromCharCode(...ciphertext)),
    dataIv: btoa(String.fromCharCode(...iv)),
    dataAuthTag: btoa(String.fromCharCode(...authTag)),
  };
};
```

---

## Database Schema

```prisma
model Attachment {
  id           Int        @id @default(autoincrement())
  credentialId Int        @map("credential_id")
  credential   Credential @relation(fields: [credentialId], references: [id], onDelete: Cascade)

  filename  String
  fileSize  Int    @map("file_size")
  mimeType  String? @map("mime_type")

  // Encrypted File Data
  encryptedData String @map("encrypted_data") // Base64 encoded
  dataIv        String @map("data_iv")
  dataAuthTag   String @map("data_auth_tag")

  createdAt DateTime @default(now()) @map("created_at")

  @@map("attachments")
}
```

---

## Testing

### Test Upload

```bash
curl -X POST http://localhost:3000/api/vault/attachments \
  -H "Content-Type: application/json" \
  -d '{
    "credentialId": 1,
    "filename": "test.txt",
    "fileSize": 1024,
    "mimeType": "text/plain",
    "encryptedData": "SGVsbG8gV29ybGQ=",
    "dataIv": "cmFuZG9taXY=",
    "dataAuthTag": "YXV0aHRhZw=="
  }'
```

### Test Get Attachments

```bash
curl http://localhost:3000/api/vault/attachments/credential/1
```

### Test Delete

```bash
curl -X DELETE http://localhost:3000/api/vault/attachments/1
```
