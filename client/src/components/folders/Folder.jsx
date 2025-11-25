import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import EditDeleteModal from "./EditDeleteModal";

const Folder = ({
  folderID,
  folderName,
  passwordCount,
  onDelete,
  onEdit,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div
        key={folderID}
        className="card"
        style={{
          width: "100%",
          maxWidth: "280px",
          minHeight: "140px",
          border: "1px solid #e5e7eb",
          borderRadius: "0.75rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginBottom: "1rem"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div className="card-body" style={{ padding: "1.25rem", position: "relative" }}>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5
              className="card-title mb-0"
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#111827",
                cursor: "pointer"
              }}
              onClick={() => navigate(`/folders/${folderID}`)}
            >
              {folderName}
            </h5>
            <button
              style={{
                background: "none",
                border: "none",
                padding: "0.25rem",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                borderRadius: "0.25rem"
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <MoreVertical size={20} />
            </button>

            <EditDeleteModal
              folderId={folderID || 0}
              folderName={folderName}
              onEdit={onEdit}
              onDelete={onDelete}
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
          
          <div>
            <h2 
              className="mb-0" 
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                color: "#111827",
                lineHeight: "1"
              }}
            >
              {passwordCount}
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default Folder;