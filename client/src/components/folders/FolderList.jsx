import React from "react";
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
import EditFolderName from "./EditFolderName";

const FolderList = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const { folders: Folders, isLoading, error } = useFolderList(userId);
  const { searchFolders, searchResults, isSearching } = useSearchFolder();
  const { createFolder } = useCreateFolder(userId);
  const { updateFolder } = useUpdateFolder();
  const { deleteFolder } = useDeleteFolder();

  const folderCountMap = React.useMemo(() => {
    const map = {};
    (Folders || []).forEach(folder => {
      map[folder.id] = folder.passwordCount || 0;
    });
    return map;
  }, [Folders]);

  const displayFolders = React.useMemo(() => {
    if (searchResults) {
      const results = searchResults?.folders || searchResults?.data || searchResults || [];
      return results.map(folder => ({
        ...folder,
        passwordCount: folderCountMap[folder.id] ?? 0
      }));
    }
    return Folders || [];
  }, [searchResults, Folders, folderCountMap]);

  const handleSearch = async () => {
    const searchQuery =
      useCurrent_SearchFolderQueryStore.getState().SearchFolderText || "";

    if (searchQuery !== "") {
      searchFolders(searchQuery);
    } else {
      searchFolders("");
    }
  };

  const handleEdit = async (folderId, newFolderName) => {
    updateFolder({ folderId, newFolderName });
  };

  const handleDelete = async (folderId) => {
    deleteFolder(folderId);
  };

  const handleAddFolder = async (folderName) => {
    createFolder(folderName);
  };

  return (
    <>
      <div className="w-full h-screen bg-white flex flex-col">
        <div className="w-full flex items-center gap-3 h-16 bg-white border-b border-gray-100 px-4">
          <SearchBar onSearch={handleSearch} />
          
          <button
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#addFolderModal"
            className="flex items-center bg-black text-white gap-x-2 rounded-md py-1 px-3 ml-2"
          >
            <Plus className="w-4" strokeWidth={1} />
            <span className="hidden sm:inline">Add Folder</span>
          </button>
        </div>

        {/* Content area */}
        <div style={{ padding: "2rem 3rem", flex: 1, overflowY: "auto" }}>
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "1.5rem",
                  marginTop: "1rem"
                }}
              >
                {displayFolders.map((folder) => (
                  <div key={folder.id}>
                    <Folder
                      folderID={folder.id}
                      folderName={folder.name}
                      passwordCount={folder.passwordCount || 0}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      
      <AddFolder onSave={handleAddFolder} existingFolders={displayFolders} />
      
      {/* Render all EditFolderName modals here at the top level */}
      {displayFolders.map((folder) => (
        <EditFolderName
          key={`edit-modal-${folder.id}`}
          onSave={(newName) => handleEdit(folder.id, newName)}
          folderId={folder.id}
          initialFolderName={folder.name}
          existingFolders={displayFolders}
        />
      ))}
    </>
  );
};

export default FolderList;