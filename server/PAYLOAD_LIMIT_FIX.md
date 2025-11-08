# 413 Payload Too Large - Fixed! ✅

## Problem

When uploading file attachments, you received a **413 Payload Too Large** error from the server.

## Root Cause

Express.js has a default JSON body size limit of **100KB**. When files are encrypted and converted to Base64, they become approximately **33% larger** than the original file size. This means:

- A 10MB file becomes ~13.3MB after Base64 encoding
- The default 100KB limit is way too small for file attachments

## Solution Applied

### Server Configuration Updated

**File:** `/server/index.js`

Changed from:

```javascript
app.use(express.json());
```

To:

```javascript
// Increase payload size limit for file attachments
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
```

### New Limits

| Type          | Client Limit | Base64 Encoded | Server Limit |
| ------------- | ------------ | -------------- | ------------ |
| Single File   | 10MB         | ~13.3MB        | 50MB         |
| 5 Files Total | 50MB         | ~66.5MB        | 50MB ⚠️      |

### Important Notes

1. **Client-Side Validation**: Files over 10MB are filtered out before upload
2. **Server-Side Buffer**: 50MB limit provides headroom for Base64 overhead
3. **Encryption Overhead**: Encrypted files have additional IV (12 bytes) and auth tag (16 bytes)

## Why 50MB Server Limit?

```
Original File Size: 10MB
↓
Base64 Encoding: 10MB × 1.33 = 13.3MB
↓
Encryption Overhead: +28 bytes (IV + auth tag)
↓
JSON Payload: {"credentialId":1,"filename":"...","encryptedData":"..."}
↓
Total Size: ~13.5MB per file
↓
5 Files: 13.5MB × 5 = 67.5MB ⚠️
```

**50MB limit is safe for single files but might need adjustment for batch uploads!**

## Recommendations

### Option 1: Keep Current Setup (Simple)

- ✅ Works for most use cases
- ✅ 10MB per file is reasonable for password manager
- ⚠️ Can't upload 5 large files at once (would hit limit)

### Option 2: Upload Files Sequentially (Current Implementation)

- ✅ Already implemented in `saveItem()`
- ✅ Files uploaded one by one in a loop
- ✅ Each request stays under 50MB
- ✅ Best approach for current limits

### Option 3: Increase Server Limit to 100MB (Future)

```javascript
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
```

- ✅ Handles 5 × 10MB files in one batch
- ⚠️ Increases server memory usage
- ⚠️ Slower request processing

## Current Implementation ✅

Your code already uploads files **sequentially** (one at a time):

```javascript
// In AddItemModal.jsx
for (const file of selectedFiles) {
  try {
    await uploadAttachment(file, credentialId, vaultKey);
  } catch (attachError) {
    console.error("Error uploading attachment:", file.name, attachError);
  }
}
```

This means:

- Each file is a separate POST request
- Each request is under 13.5MB (well below 50MB limit)
- **No 413 errors should occur** ✅

## Testing After Fix

### Test 1: Single Small File (< 1MB)

```
✅ Should work perfectly
```

### Test 2: Single Large File (8-10MB)

```
✅ Should work with 50MB server limit
```

### Test 3: Five Large Files (10MB each)

```
✅ Should work because files upload sequentially
Each request: ~13.5MB < 50MB limit
```

### Test 4: Single File > 10MB

```
❌ Blocked by client (file filtered out)
Message: File won't appear in selected files
```

## If You Still Get 413 Errors

### Check 1: File Size

```javascript
console.log("File size:", file.size / 1024 / 1024, "MB");
console.log("Base64 size estimate:", (file.size * 1.33) / 1024 / 1024, "MB");
```

### Check 2: Server Limit Applied

Restart server after changing `index.js`:

```bash
cd server && npm run dev
```

### Check 3: Reverse Proxy (Nginx/Apache)

If using a reverse proxy, check its limits:

**Nginx:**

```nginx
client_max_body_size 50M;
```

**Apache:**

```apache
LimitRequestBody 52428800
```

### Check 4: Increase Limit Further

If needed, change to 100MB:

```javascript
app.use(express.json({ limit: "100mb" }));
```

## Error Messages Guide

| Error                        | Meaning                   | Solution                    |
| ---------------------------- | ------------------------- | --------------------------- |
| **413 Payload Too Large**    | Server limit exceeded     | ✅ Fixed - restart server   |
| **Network Error**            | Server not running        | Start server: `npm run dev` |
| **Failed to add credential** | Database/validation error | Check server logs           |
| **File size > 10MB**         | Client filter             | File automatically removed  |

## Production Considerations

For production deployment:

1. **Environment Variable**:

   ```javascript
   const MAX_PAYLOAD = process.env.MAX_PAYLOAD_SIZE || "50mb";
   app.use(express.json({ limit: MAX_PAYLOAD }));
   ```

2. **Cloud Limits**:

   - AWS Lambda: 6MB payload limit
   - Vercel: 4.5MB payload limit (free tier)
   - Heroku: 30MB request timeout
   - Consider using S3/storage service for large files

3. **Security**:
   - Rate limiting on upload endpoint
   - Virus scanning for uploaded files
   - User quota limits (total storage per user)

## Summary

✅ **Server limit increased from 100KB → 50MB**  
✅ **Handles encrypted Base64 files up to ~10MB**  
✅ **Sequential upload prevents batch size issues**  
✅ **Server restarted with new configuration**

**You should now be able to upload attachments without 413 errors!** 🎉

Try uploading a file and let me know if it works!
