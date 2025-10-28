# Multiple Attachments Upload Fix

## Problem

When uploading multiple attachments to a single credential, you received "maximum call size exceeded" error, even though files were being uploaded sequentially.

## Root Cause Analysis

### Issue 1: Server Payload Limit Too Small

- Previous limit: **50MB**
- Actual need: **~65-70MB** for 5 files
- Why: Base64 encoding increases file size by 33%

**Calculation:**

```
5 files × 10MB each = 50MB original
50MB × 1.33 (Base64) = 66.5MB encoded
66.5MB > 50MB limit ❌
```

### Issue 2: Large Individual Files

Even a single 10MB file can exceed 50MB after encryption:

```
10MB file
→ Encrypt with AES-256-GCM
→ Convert to Base64 (×1.33)
→ Wrap in JSON payload
= ~13.5MB per file
```

## Solution Applied

### 1. Increased Server Limit to 100MB ✅

**File:** `/server/index.js`

```javascript
// OLD: 50MB limit
app.use(express.json({ limit: "50mb" }));

// NEW: 100MB limit (safe for 5 × 10MB files)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
```

### 2. Enhanced Error Handling & Logging ✅

**File:** `/client/src/components/vault/AddItemModal.jsx`

**Added:**

- Success/fail counter for multiple file uploads
- Detailed logging for each file upload
- File size logging (original and encrypted)
- Payload size calculation
- Better error messages with status codes
- Special handling for 413 errors

**Benefits:**

- Know exactly which files succeeded/failed
- See file sizes before upload
- Debug payload size issues
- Better user feedback

## New Limits & Capacity

| Item              | Original | Encrypted | Limit | Status   |
| ----------------- | -------- | --------- | ----- | -------- |
| Single file (max) | 10MB     | ~13.5MB   | 100MB | ✅ Safe  |
| 5 files total     | 50MB     | ~67MB     | 100MB | ✅ Safe  |
| 7 files total     | 70MB     | ~93.5MB   | 100MB | ✅ Safe  |
| 8 files total     | 80MB     | ~106MB    | 100MB | ⚠️ Tight |

**Recommendation:** Keep 5 file limit client-side for safety margin.

## Upload Flow (Updated)

### Before (No Logging)

```
Click "Save Item"
→ Save credential
→ Upload files...
→ Success/Fail (unclear which)
```

### After (Detailed Logging)

```
Click "Save Item"
→ Save credential
→ Upload file 1: photo.jpg (2.5 MB)
   ✓ Encrypted + Base64: 3.3 MB
   ✓ Successfully uploaded
→ Upload file 2: document.pdf (8.2 MB)
   ✓ Encrypted + Base64: 10.9 MB
   ✓ Successfully uploaded
→ Upload file 3: video.mp4 (9.8 MB)
   ✓ Encrypted + Base64: 13.1 MB
   ✓ Successfully uploaded
→ Alert: "Credential and 3 attachment(s) saved successfully!"
```

### If Some Fail

```
→ Upload file 4: large.zip (12 MB)
   ✗ Error: File too large
→ Alert: "Credential saved! 3 attachment(s) uploaded successfully, 1 failed."
```

## Console Output Examples

### Successful Upload

```javascript
[Upload] Starting encryption for: photo.jpg
[Upload] Original size: 2.48 MB
[Upload] Encrypted + Base64 size: 3.30 MB
[Upload] Server response: { attachment: { id: 1, filename: "photo.jpg", ... } }
✓ Successfully uploaded: photo.jpg
```

### Failed Upload (413)

```javascript
[Upload] Starting encryption for: huge-file.zip
[Upload] Original size: 15.23 MB
[Upload] Encrypted + Base64 size: 20.31 MB
[Upload] Error for huge-file.zip: AxiosError { status: 413 }
Server response: { error: "Payload Too Large" }
Status code: 413
✗ Error uploading attachment: huge-file.zip
```

## Testing Checklist

- [x] Upload 1 small file (< 1MB) → ✅ Works
- [x] Upload 1 large file (~10MB) → ✅ Works
- [x] Upload 5 medium files (~5MB each) → ✅ Works
- [x] Upload 5 large files (~10MB each) → ✅ Works (with 100MB limit)
- [ ] Upload file > 10MB → Should be blocked by client
- [ ] Upload 8+ files → Might hit limit, check logs

## If You Still Get Errors

### Error: "maximum call size exceeded"

**Check 1: File sizes in console**

```javascript
// Look for this in console:
[Upload] Original size: X.XX MB
[Upload] Encrypted + Base64 size: Y.YY MB
```

- If Y.YY > 100, file is too large for current limit

**Check 2: Total payload size**

```javascript
// Add all encrypted sizes:
File 1: 13.2 MB
File 2: 12.8 MB
File 3: 11.5 MB
File 4: 10.9 MB
File 5: 13.1 MB
Total: 61.5 MB ✅ (< 100MB)
```

**Check 3: Server restarted?**

```bash
# Server must be restarted after changing index.js
cd server
npm run dev
# Look for: "Server running on http://localhost:5000"
```

**Solution 1: Increase limit to 150MB**

```javascript
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
```

**Solution 2: Reduce client file size limit**

```javascript
// In Attachments.jsx
const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024); // 5MB
```

**Solution 3: Reduce max file count**

```javascript
// In Attachments.jsx
const limited = combined.slice(0, 3); // Max 3 files instead of 5
```

## Production Recommendations

### For Production Deployment:

1. **Use Chunked Upload for Large Files**

   - Split files into chunks (1MB each)
   - Upload chunks sequentially
   - Reassemble on server
   - Allows unlimited file sizes

2. **Use Cloud Storage (S3, Azure Blob)**

   - Generate pre-signed upload URLs
   - Upload directly to storage
   - Store only reference in database
   - Bypasses payload limits entirely

3. **Add Progress Indicators**

   - Show upload progress per file
   - Overall progress bar
   - Cancel/retry functionality

4. **Implement Compression**
   - Compress before encryption
   - Can reduce size by 50-70%
   - Trade-off: processing time

## Summary

✅ **Server limit increased: 50MB → 100MB**  
✅ **Handles up to 5 × 10MB files (~67MB total)**  
✅ **Enhanced logging and error handling**  
✅ **Better user feedback (success/fail counts)**  
✅ **Server restarted with new configuration**

**You should now be able to upload multiple attachments without errors!** 🎉

Monitor the console logs to see exactly what's happening with each file upload.
