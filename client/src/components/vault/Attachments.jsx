import React, { useRef, useState, useEffect } from 'react'
import { Plus, Paperclip, Upload, X, Download } from 'lucide-react'
import axios from 'axios'

const Attachments = ({ credentialId, vaultKey, selectedFiles, setSelectedFiles }) => {
  const fileInputRef = useRef(null)
  const [savedAttachments, setSavedAttachments] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch existing attachments when component mounts
  useEffect(() => {
    if (credentialId) {
      fetchAttachments()
    }
  }, [credentialId])

  const fetchAttachments = async () => {
    if (!credentialId) return

    try {
      setIsLoading(true)
      const response = await axios.get(`http://localhost:5000/api/vault/attachments/credential/${credentialId}`)
      setSavedAttachments(response.data.attachments || [])
    } catch (error) {
      console.error('Error fetching attachments:', error)
      if (error.response) {
        console.error('Server error:', error.response.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAttachment = async (attachmentId) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      setIsLoading(true)
      await axios.delete(`http://localhost:5000/api/vault/attachments/${attachmentId}`)
      
      // Refresh list
      await fetchAttachments()
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Failed to delete attachment')
    } finally {
      setIsLoading(false)
    }
  }

  const decryptAndDownload = async (attachment) => {
    try {
      setIsLoading(true)

      // Convert base64 strings to Uint8Array
      const encryptedData = Uint8Array.from(atob(attachment.encryptedData), c => c.charCodeAt(0))
      const iv = Uint8Array.from(atob(attachment.dataIv), c => c.charCodeAt(0))
      const authTag = Uint8Array.from(atob(attachment.dataAuthTag), c => c.charCodeAt(0))

      // Combine encrypted data and auth tag
      const combined = new Uint8Array(encryptedData.length + authTag.length)
      combined.set(encryptedData)
      combined.set(authTag, encryptedData.length)

      // Import key
      const keyData = Uint8Array.from(atob(vaultKey), c => c.charCodeAt(0))
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      )

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        cryptoKey,
        combined
      )

      // Create blob and download
      const blob = new Blob([decryptedBuffer], { type: attachment.mimeType || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading attachment:', error)
      alert('Failed to decrypt and download file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDivClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    // Filter files to max 10MB each
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024)
    
    // Add new files to existing ones, respecting the 5 file limit
    setSelectedFiles(prevFiles => {
      const combined = [...prevFiles, ...validFiles]
      const limited = combined.slice(0, 5)
      console.log('Selected files:', limited)
      return limited
    })
    
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    // Filter files to max 10MB each
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024)
    
    // Add new files to existing ones, respecting the 5 file limit
    setSelectedFiles(prevFiles => {
      const combined = [...prevFiles, ...validFiles]
      const limited = combined.slice(0, 5)
      console.log('Dropped files:', limited)
      return limited
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
        <div className='flex items-center gap-2'>
            <Paperclip className='w-5 '/>
            <p className="text-lg text-black">Attachments</p>
        </div>

        {/* Info message */}
        {!credentialId && selectedFiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              ✓ {selectedFiles.length} file(s) selected. Click "Save Item" to save the credential and attachments together.
            </p>
          </div>
        )}
        
        {/* Upload Area */}
        <div 
          onClick={handleDivClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`flex flex-col items-center justify-center gap-3 border rounded-lg p-4 hover:border-gray-400 border-dashed cursor-pointer transition-colors ${
          selectedFiles.length >= 5 ? 'hidden' : ''} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Upload className='w-12 h-12 text-gray-400'/>
            <p className="text-md text-gray-600">Drag & Drop here or click to browse </p>
            <p className="text-sm text-center text-gray-600">Max 10MB per File, up to 5 files </p>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
        </div>

        {/* Selected Files (to be uploaded when credential is saved) */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Files Ready to Upload ({selectedFiles.length}/5):
              </p>
              {!credentialId && (
                <span className="text-xs text-gray-500 italic">
                  Will be saved with credential
                </span>
              )}
            </div>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved Attachments */}
        {savedAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Saved Attachments ({savedAttachments.length}):</p>
            {savedAttachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.fileSize / 1024).toFixed(2)} KB • {new Date(attachment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decryptAndDownload(attachment)}
                    disabled={isLoading || !vaultKey}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAttachment(attachment.id)}
                    disabled={isLoading}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">Processing...</p>
          </div>
        )}
    </div>
  )
}

export default Attachments