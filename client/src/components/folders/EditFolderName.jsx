import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";

const EditFolderName = ({
  isOpen,
  onClose,
  onSave,
  initialFolderName = "",
  folderId,
  existingFolders = []
}) => {
  const [folderName, setFolderName] = useState(initialFolderName);
  const [error, setError] = useState("");

  // Reset to initial value when modal opens
  useEffect(() => {
    if (isOpen) {
      setFolderName(initialFolderName);
      setError("");
    }
  }, [isOpen, initialFolderName]);

  const validateAndSave = () => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError("Folder name cannot be empty");
      return;
    }
    
    if (trimmedName === initialFolderName) {
      onClose();
      return;
    }
    
    const isDuplicate = existingFolders.some(
      folder => folder.id !== folderId && 
                folder.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      setError("A folder with this name already exists");
      return;
    }
    
    onSave(trimmedName);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 pb-2">
            <div className="flex justify-between items-center">
              <h5 className="text-xl font-semibold m-0">
                Edit Folder
              </h5>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className="px-6 pb-6">
            <label 
              htmlFor={`folderName-${folderId}`}
              className="block mb-2 font-semibold text-sm text-gray-700"
            >
              Folder Name
            </label>
            <input
              id={`folderName-${folderId}`}
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  validateAndSave();
                } else if (e.key === "Escape") {
                  onClose();
                }
              }}
              className={`w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                error ? "border border-red-500" : "border-none"
              }`}
              autoFocus
            />
            {error && (
              <div className="mt-2 text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={validateAndSave}
              className="px-6 py-2.5 bg-black text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditFolderName;