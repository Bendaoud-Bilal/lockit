# Attachment Workflow - Client Side

## Overview

The attachment system now allows users to select files BEFORE saving the credential. When the user clicks "Save Item", both the credential and all selected attachments are saved together in one action.

---

## User Flow

### 1. **Fill Credential Form**

- User fills in credential details (title, username, password, etc.)
- Navigate through tabs: General, Security, Attachments

### 2. **Select Attachments (Optional)**

- Go to "Attachments" tab
- Drag & drop files or click to browse
- Can select up to 5 files (max 10MB each)
- Files show in amber-colored "Files Ready to Upload" section
- Blue info banner shows: "✓ X file(s) selected. Click 'Save Item' to save the credential and attachments together."

### 3. **Save Everything Together**

- Click "Save Item" button (shows "Save Item & Upload X" if files are selected)
- **What Happens:**
  1. Form validation runs
  2. Credential data is encrypted
  3. Credential is saved to server → receives credential ID
  4. Each selected file is encrypted client-side
  5. Each encrypted file is uploaded to server with the credential ID
  6. Success message: "Credential and X attachment(s) saved successfully!"
  7. Selected files are cleared
  8. Credential ID is saved to state

### 4. **View/Manage Saved Attachments**

- After saving, attachments appear in green "Saved Attachments" section
- Can download (decrypt) files
- Can delete files
- Can add more attachments later

---

## Component Architecture

### **AddItemModal (Parent Component)**

**State:**

```javascript
const [selectedFiles, setSelectedFiles] = useState([]); // Files waiting to be uploaded
const [savedCredentialId, setSavedCredentialId] = useState(null); // ID after save
```

**Key Functions:**

- `saveItem()` - Main save function:

  1. Validates form
  2. Encrypts credential
  3. Saves credential to API
  4. Loops through selectedFiles
  5. Calls `uploadAttachment()` for each file
  6. Clears selectedFiles
  7. Shows success message

- `uploadAttachment(file, credentialId, vaultKey)` - Encrypts and uploads a single file:
  1. Reads file as ArrayBuffer
  2. Encrypts using AES-256-GCM
  3. Splits into ciphertext + authTag
  4. Converts to Base64
  5. POSTs to `/api/vault/attachments`

**Props Passed to Attachments:**

```javascript
<Attachments
  credentialId={savedCredentialId} // null initially, set after save
  vaultKey={sessionStorage.getItem("vaultKey")}
  selectedFiles={selectedFiles} // Shared state
  setSelectedFiles={setSelectedFiles} // Shared setter
/>
```

---

### **Attachments (Child Component)**

**Props Received:**

```javascript
{
  credentialId, vaultKey, selectedFiles, setSelectedFiles;
}
```

**State:**

```javascript
const [savedAttachments, setSavedAttachments] = useState([]); // Server attachments
const [isLoading, setIsLoading] = useState(false);
```

**Responsibilities:**

- File selection (drag-drop, click)
- Display selected files (amber cards)
- Display saved attachments (green cards)
- Download & decrypt files
- Delete saved attachments
- Fetch attachments from server (when credentialId exists)

**Does NOT Handle:**

- Encryption of new files ❌ (handled by parent)
- Uploading new files ❌ (handled by parent)

---

## Data Flow

```
User selects file
     ↓
Attachments component updates selectedFiles state (shared with parent)
     ↓
selectedFiles shown in amber "Files Ready to Upload" section
     ↓
User clicks "Save Item" button
     ↓
AddItemModal.saveItem() runs:
     ├─ Validate form
     ├─ Encrypt credential
     ├─ POST credential → get credentialId
     └─ For each selectedFile:
          ├─ Encrypt file (AES-256-GCM)
          ├─ POST to /api/vault/attachments
          └─ Log result
     ↓
Success! Clear selectedFiles, show alert
     ↓
Attachments component automatically fetches saved attachments (useEffect)
     ↓
Green "Saved Attachments" section appears
```

---

## UI States

### **Before Save (No Credential ID)**

- ✅ Can select files
- ✅ Files show in amber "Files Ready to Upload"
- ✅ Blue banner: "✓ X file(s) selected. Click 'Save Item'..."
- ✅ Save button shows: "Save Item & Upload X"
- ❌ No green "Saved Attachments" section

### **After Save (Has Credential ID)**

- ✅ Can select MORE files
- ✅ Green "Saved Attachments" section appears
- ✅ Can download saved files
- ✅ Can delete saved files
- ✅ Save button returns to "Save Item"

---

## Security

### **Client-Side Encryption (Before Upload)**

```javascript
// 1. Read file
const arrayBuffer = await file.arrayBuffer();
const data = new Uint8Array(arrayBuffer);

// 2. Import vault key
const keyData = Uint8Array.from(atob(vaultKey), (c) => c.charCodeAt(0));
const cryptoKey = await crypto.subtle.importKey(
  "raw",
  keyData,
  { name: "AES-GCM" },
  false,
  ["encrypt"]
);

// 3. Generate random IV
const iv = crypto.getRandomValues(new Uint8Array(12));

// 4. Encrypt
const encryptedBuffer = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv, tagLength: 128 },
  cryptoKey,
  data
);

// 5. Split ciphertext and authTag
const encryptedArray = new Uint8Array(encryptedBuffer);
const ciphertext = encryptedArray.slice(0, -16);
const authTag = encryptedArray.slice(-16);

// 6. Convert to Base64
const encryptedData = btoa(String.fromCharCode(...ciphertext));
const dataIv = btoa(String.fromCharCode(...iv));
const dataAuthTag = btoa(String.fromCharCode(...authTag));
```

### **Upload Payload**

```javascript
{
  credentialId: 1,
  filename: "document.pdf",
  fileSize: 102400,
  mimeType: "application/pdf",
  encryptedData: "base64...",
  dataIv: "base64...",
  dataAuthTag: "base64..."
}
```

---

## Validation & Limits

- **Max File Size:** 10MB (enforced in file selection)
- **Max Files:** 5 per credential
- **File Types:** All types accepted
- **Required:** credentialId (must save credential first)
- **Required:** vaultKey (from sessionStorage)

---

## Error Handling

### **Upload Errors**

- Network error → Alert user
- Server error → Show error.response.data.error
- Encryption error → Log to console, continue with next file

### **Download Errors**

- Decryption fails → Alert "Failed to decrypt and download file"
- Missing vault key → Button disabled

### **Delete Errors**

- Confirmation required
- Server error → Alert "Failed to delete attachment"

---

## API Endpoints Used

| Method | Endpoint                                | Purpose               | When Called                                      |
| ------ | --------------------------------------- | --------------------- | ------------------------------------------------ |
| POST   | `/api/vault/attachments`                | Upload encrypted file | After credential is saved, for each selectedFile |
| GET    | `/api/vault/attachments/credential/:id` | Fetch all attachments | When credentialId becomes available (useEffect)  |
| DELETE | `/api/vault/attachments/:id`            | Delete attachment     | User clicks delete icon                          |

---

## Future Enhancements

- [ ] Progress bar for large file uploads
- [ ] Thumbnail previews for images
- [ ] Batch download (zip all attachments)
- [ ] File type icons
- [ ] Better error recovery (retry failed uploads)
- [ ] Cancel upload mid-process
- [ ] Edit attachment (replace file)

---

## Testing Checklist

- [ ] Select 1 file → Save → Verify uploaded
- [ ] Select 5 files → Save → Verify all uploaded
- [ ] Try to select 6th file → Should be blocked
- [ ] Select file > 10MB → Should be filtered out
- [ ] Save credential without attachments → Works
- [ ] Add attachments to existing credential → Works
- [ ] Download saved attachment → Decrypts correctly
- [ ] Delete attachment → Removes from list
- [ ] Drag & drop files → Works
- [ ] Click to browse → Works
- [ ] Remove file before saving → Removed from list

---

## Troubleshooting

**Problem:** "Cannot upload: Missing credential ID or vault key"

- **Solution:** This message shouldn't appear with new flow. If it does, check saveItem() logic.

**Problem:** Files don't upload after clicking "Save Item"

- **Check:** Console logs for errors
- **Check:** selectedFiles state is populated
- **Check:** Server is running
- **Check:** credentialId was returned from credential save

**Problem:** "Failed to decrypt and download file"

- **Check:** vaultKey in sessionStorage matches encryption key
- **Check:** File was encrypted with same algorithm
- **Check:** Browser supports Web Crypto API

**Problem:** Upload works but files don't appear

- **Check:** fetchAttachments() is being called
- **Check:** credentialId is set correctly
- **Check:** Server returned saved attachments
