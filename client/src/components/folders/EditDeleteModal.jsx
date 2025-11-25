import { Edit } from "lucide-react";
import EditFolderName from "./EditFolderName";



const EditDeleteModal = ({
  folderId,
  folderName,
  onEdit,
  onDelete,
}) => {
  const modalId = `editDeleteModal-${folderId}`;
  const editFolderModalId = `editFolderModal-${folderId}`;

  const handleDelete = () => {
    onDelete(folderId);
  };

  const handleSave = (newFolderName) => {
    onEdit(folderId, newFolderName);
  };

  return (
    <>
      <div
        className="modal fade"
        id={modalId}
        tabIndex={-1}
        aria-labelledby={`${modalId}Label`}
        aria-hidden="true"
        style={{
          padding: "0",
        }}
      >
        <div className="modal-dialog">
          <div className="modal-content" style={{ width: "15rem" }}>
            <div className="modal-body">
              <Edit size={"1rem"} />
              <button
                type="button"
                className="btn"
                data-bs-toggle="modal"
                data-bs-target={`#${editFolderModalId}`}
                style={{
                  width: "80%",
                  textAlign: "left",
                }}
              >
                Edit item
              </button>
              <hr
                style={{
                  marginTop: "0",
                  marginBottom: "0",
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={handleDelete}
                data-bs-dismiss="modal"
                style={{
                  backgroundColor: "transparent",
                  color: "red",
                  marginTop: "0",
                  marginBottom: "0",
                  padding: "0rem",
                  paddingTop: "0.5rem",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <EditFolderName
        onSave={handleSave}
        folderId={folderId}
        initialFolderName={folderName}
      />
    </>
  );
};

export default EditDeleteModal;
