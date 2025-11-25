import React from "react";
import { Save } from "lucide-react";
import { useState } from "react";



const AddFolder = ({ onSave }) => {
  const [folderName, setFolderName] = useState("");
  return (
    <div
      className="modal fade"
      id={"addFolderModal"}
      tabIndex={-1}
      aria-labelledby={`addFolderModalLabel`}
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div
          className="modal-content"
          style={{ width: "25rem", height: "16rem", padding: "0" }}
        >
          <div className="modal-header">
            <h5 className="modal-title" id={`addFolderModalLabel`}>
              Add Folder
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="folderName" className="form-label">
                Folder Name
              </label>
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="form-control"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(folderName)}
              data-bs-dismiss="modal"
              className="btn btn-dark"
            >
              <Save size={18} className="me-2" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFolder;
