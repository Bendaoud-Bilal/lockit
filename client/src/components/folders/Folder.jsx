import { useNavigate } from "react-router-dom";
import EditDeleteModal from "./EditDeleteModal";

const folder = ({
  folderID,
  folderName,
  passwordCount,
  onDelete,
  onEdit,
}) => {
  const modalId = `editDeleteModal-${folderID || 0}`;
  const navigate = useNavigate();

  return (
    <>
      <div
        key={folderID}
        className="card mb-3"
        style={{ maxWidth: "300px", minHeight: "30px" }}
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5
              className="card-title"
              style={{
                cursor: "pointer",
              }}
              onClick={() => navigate(`/folders/${folderID}`)}
            >
              {folderName}
            </h5>
            <h5
              className="card-title"
              style={{ cursor: "pointer" }}
              data-bs-toggle="modal"
              data-bs-target={`#${modalId}`}
            >
              {"..."}
            </h5>
          </div>
          <h5 className="card-title">{passwordCount}</h5>
          <p className="card-text">Passwords</p>
        </div>
      </div>
      <EditDeleteModal
        folderId={folderID || 0}
        folderName={folderName}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

export default folder;
