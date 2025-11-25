import SearchBar from "./SearchBar";
import Folder from "./Folder";
import useCurrent_SearchFolderQueryStore from "../../stores/SearchFolder";
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
import { useState, useEffect } from "react";


const FolderList = () => {


  const { user } = useAuth();
  const userId = user?.id;

  const { folders: Folders, isLoading, error } = useFolderList(userId);
  const { searchFolders, searchResults, isSearching } = useSearchFolder();
  const { createFolder } = useCreateFolder(userId);
  const { updateFolder } = useUpdateFolder();
  const { deleteFolder } = useDeleteFolder();

  const [displayFolders, setDisplayFolders] = useState([]);

  // Update displayed folders when Folders data changes
  useEffect(() => {
    if (!error && !isLoading && Folders && Folders.length > 0) {
      setDisplayFolders(Folders);
    }
  }, [Folders, error, isLoading]);

  // Update displayed folders when search results change
  useEffect(() => {
    if (searchResults) {
      const results = searchResults?.folders || searchResults?.data || searchResults || [];
      setDisplayFolders(Array.isArray(results) ? results : []);
    }
  }, [searchResults]);

  const handleSearch = async () => {
    const searchQuery =
      useCurrent_SearchFolderQueryStore.getState().SearchFolderText || "";
    
    if (searchQuery !== "") {
      searchFolders(searchQuery);
    } else {
      setDisplayFolders(Folders || []);
    }
  };

  const handleEdit = async (folderId, newFolderName) => {
    updateFolder({ folderId, newFolderName });
  };

  const handleDelete = async (folderId) => {
    deleteFolder(folderId);
  };

  const handleAddFolder = async (folderName) => {
    console.log("user id= " , user.id);
    createFolder(folderName);
  };



  return (
    <>
      <div className="container-fluid" style={{marginTop:"2rem"}}>
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

        {(isLoading || isSearching) && (
          <div className="text-center my-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

       

        {!isLoading && !isSearching && !error && displayFolders.length === 0 ? (
          <EmptyFolder />
        ) : (
          !isLoading &&
          !isSearching &&
          !error && (
            <div style={{ marginTop: "3rem" }}>
              {displayFolders.map((folder, index) => (
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
export default FolderList;
