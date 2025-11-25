import React, { useState, useEffect, useRef } from "react";
import { Save } from "lucide-react";

const AddFolder = ({ onSave, existingFolders = [] }) => {
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");
  const closeButtonRef = useRef(null);
  
  // Reset form when modal is opened
  useEffect(() => {
    const modalElement = document.getElementById('addFolderModal');
    
    const handleModalShow = () => {
      setFolderName("");
      setError("");
    };
    
    if (modalElement) {
      modalElement.addEventListener('show.bs.modal', handleModalShow);
      return () => {
        modalElement.removeEventListener('show.bs.modal', handleModalShow);
      };
    }
  }, []);

  const validateAndSave = () => {
    // Trim whitespace
    const trimmedName = folderName.trim();
    
    // Check if empty
    if (!trimmedName) {
      setError("Folder name cannot be empty");
      return;
    }
    
    // Check if duplicate (case-insensitive)
    const isDuplicate = existingFolders.some(
      folder => folder.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      setError("A folder with this name already exists");
      return;
    }
    
    // If validation passes, save and close
    onSave(trimmedName);
    setFolderName("");
    setError("");
    
    // Close modal by clicking the close button
    if (closeButtonRef.current) {
      closeButtonRef.current.click();
    }
  };
  
  return (
    <div
      className="modal fade"
      id="addFolderModal"
      tabIndex={-1}
      aria-labelledby="addFolderModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div 
          className="modal-content" 
          style={{ 
            borderRadius: "1rem", 
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}
        >
          <div style={{ padding: "1.5rem", paddingBottom: "0.5rem", border: "none" }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>
                Add Folder
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeButtonRef}
              />
            </div>
          </div>
          
          <div style={{ padding: "0 1.5rem 1.5rem" }}>
            <label 
              htmlFor="folderName" 
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                color: "#374151"
              }}
            >
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError(""); // Clear error on input change
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  validateAndSave();
                }
              }}
              placeholder="Enter folder name"
              className="form-control"
              style={{
                padding: "0.75rem",
                backgroundColor: "#f3f4f6",
                border: error ? "1px solid #ef4444" : "none",
                borderRadius: "0.5rem",
                fontSize: "0.875rem"
              }}
            />
            {error && (
              <div 
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  color: "#ef4444"
                }}
              >
                {error}
              </div>
            )}
          </div>
          
          <div 
            style={{
              padding: "1rem 1.5rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              borderTop: "none"
            }}
          >
            <button
              type="button"
              className="btn"
              data-bs-dismiss="modal"
              style={{
                padding: "0.625rem 1.5rem",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: "#374151"
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={validateAndSave}
              className="btn"
              style={{
                padding: "0.625rem 1.5rem",
                backgroundColor: "#000",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFolder;