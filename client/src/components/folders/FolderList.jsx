import React, { useState } from "react";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalState, setEditModalState] = useState({});

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
    setEditModalState(prev => ({ ...prev, [folderId]: false }));
  };

  const handleDelete = async (folderId) => {
    deleteFolder(folderId);
  };

  const handleAddFolder = async (folderName) => {
    createFolder(folderName);
    setIsAddModalOpen(false);
  };

  const openEditModal = (folderId) => {
    setEditModalState(prev => ({ ...prev, [folderId]: true }));
  };

  const closeEditModal = (folderId) => {
    setEditModalState(prev => ({ ...prev, [folderId]: false }));
  };

  return (
    <>
      <div className="w-full h-screen bg-white flex flex-col">
        <div className="w-full flex items-center gap-3 h-16 bg-white border-b border-gray-100 px-4">
          <SearchBar onSearch={handleSearch} />
          
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center bg-black text-white gap-x-2 rounded-md py-1 px-3 ml-2 hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4" strokeWidth={1} />
            <span className="hidden sm:inline">Add Folder</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-8 md:px-12 flex-1 overflow-y-auto">
          {(isLoading || isSearching) && (
            <div className="text-center my-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {!isLoading && !isSearching && !error && displayFolders.length === 0 ? (
            <EmptyFolder />
          ) : (
            !isLoading &&
            !isSearching &&
            !error && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6 mt-4">
                {displayFolders.map((folder) => (
                  <div key={folder.id}>
                    <Folder
                      folderID={folder.id}
                      folderName={folder.name}
                      passwordCount={folder.passwordCount || 0}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onOpenEdit={() => openEditModal(folder.id)}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      
      <AddFolder 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddFolder}
        existingFolders={displayFolders}
      />
      
      {/* Render all EditFolderName modals */}
      {displayFolders.map((folder) => (
        <EditFolderName
          key={`edit-modal-${folder.id}`}
          isOpen={editModalState[folder.id] || false}
          onClose={() => closeEditModal(folder.id)}
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