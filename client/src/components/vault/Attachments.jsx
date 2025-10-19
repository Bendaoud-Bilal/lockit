import React, { useRef, useState } from 'react'
import { Plus, Paperclip, Upload } from 'lucide-react'

const Attachments = () => {
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])

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
        
        <div 
          onClick={handleDivClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`flex flex-col items-center justify-center gap-3 border rounded-lg p-4 hover:border-gray-400 border-dashed cursor-pointer transition-colors ${
          selectedFiles.length === 5 && 'hidden' }`}

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
            />
        </div>

        {/* Display selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Selected Files ({selectedFiles.length}/5):</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-600" />
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
    </div>
  )
}

export default Attachments