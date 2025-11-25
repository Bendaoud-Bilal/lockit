import SearchBar from "./SearchBar";
import Folder from "./Folder";
import useCurrent_SearchFolderQueryStore from "../stores/SearchFolder";
import AddFolder from "./AddFolder";
import { Plus } from "lucide-react";
import EmptyFolder from "./EmptyFolder";
import {
  useFolderList,
  useSearchFolder,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from "../../hooks/useFolder";
import { useAuth } from "../../context/AuthContext";


const {user} = useAuth();
const userId = user.id;

const folderList = () => {
  const { folders: Folders, isLoading, error } = useFolderList(userId);
  const { searchFolders } = useSearchFolder();
  const { createFolder } = useCreateFolder();
  const { updateFolder } = useUpdateFolder();
  const { deleteFolder } = useDeleteFolder();

  const handleSearch = async () => {
    const searchQuery =
      useCurrent_SearchFolderQueryStore.getState().SearchFolderText || "";
    searchFolders(searchQuery);
  };

  const handleEdit = async (folderId, newFolderName) => {
    updateFolder({ folderId, newFolderName });
  };

  const handleDelete = async (folderId) => {
    deleteFolder(folderId);
  };

  const handleAddFolder = async (folderName) => {
    createFolder(folderName , userId);
  };

  return (
    <>
      <div className="container-fluid">
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <SearchBar onSearch={handleSearch} />
          </div>
          <button
            type="button"
            data-bs-dismiss="modal"
            className="btn btn-dark"
            data-bs-toggle="modal"
            data-bs-target="#addFolderModal"
          >
            <Plus size={18} className="me-2" />
            Add Folder
          </button>
        </div>

        {isLoading && (
          <div className="text-center my-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            Error loading folders. Please try again.
          </div>
        )}

        {!isLoading && !error && Folders.length === 0 ? (
          <EmptyFolder />
        ) : (
          !isLoading &&
          !error && (
            <div style={{ marginTop: "3rem" }}>
              {Folders.map((folder, index) => (
                <div
                  key={index}
                  className="col-xl-2 col-lg-3 col-md-4 col-sm-6"
                >
                  <Folder
                    folderID={folder.id}
                    folderName={folder.name}
                    passwordCount={folder.passwordCount}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <AddFolder onSave={handleAddFolder} />
    </>
  );
};
export default folderList;
