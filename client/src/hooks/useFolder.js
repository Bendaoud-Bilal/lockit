import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import link from "../services/link";

// Hook for fetching folders list
export const useFolderList = (userId) => {
  const {
    data: folders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["folders", userId],
    queryFn: async () => {
      const response = await link.Get("/api/folder/" + userId + "/all");
      
      // Handle different response structures
      const folders = response?.folders || response?.data || response || [];
      
      return folders;
    },
    enabled: !!userId, // Only run query if userId exists
  });

  return {
    folders,
    isLoading,
    error,
    refetch,
  };
};

// Hook for searching folders by name
export const useSearchFolder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (searchQuery) => {
      if (searchQuery === "") {
        const folders = await link.Get("/api/folder/", 
          {name: searchQuery}
        );
        
        // Normalize immediately
        const foldersArray = folders?.folders || folders?.data || folders || [];
        return foldersArray.map(folder => ({
          ...folder,
          passwordCount: folder.passwordCount ?? 0
        }));
      } else {
        const folders = await link.Get("/api/folder/search", 
          {name: searchQuery}
        );
        
        // Normalize immediately
        const foldersArray = folders?.folders || folders?.data || folders || [];
        return foldersArray.map(folder => ({
          ...folder,
          passwordCount: folder.passwordCount ?? 0
        }));
      }
    },
    onSuccess: (data) => {
      // Update the folders cache with search results (already normalized)
      queryClient.setQueryData(["folders"], data);
    },
  });

  return {
    searchFolders: mutation.mutate,
    isSearching: mutation.isPending,
    searchResults: mutation.data,
  };
};

// Hook for creating a folder
export const useCreateFolder = (userId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (folderName) => {

      
      const newFolder = await link.Post("/api/folder", { 
        name: folderName, 
        userId: userId 
      });
      return newFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  return {
    createFolder: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

// Hook for fetching a folder by ID
export const useGetFolderById = (folderId) => {
  const {
    data: folder = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["folder", folderId],
    queryFn: async () => {
      const folder = await link.Get("/api/folder/" + folderId);
      return folder;
    },
  });
  return {
    folder,
    isLoading,
    error,
    refetch,
  };
};

// Hook for updating a folder
export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ folderId, newFolderName }) => {
      return await link.Put("/api/folder/" + folderId, { 
        name: newFolderName 
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  return {
    updateFolder: mutation.mutate,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

// Hook for deleting a folder
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (folderId) => {
      return await link.Delete("/api/folder/" + folderId);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  return {
    deleteFolder: mutation.mutate,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

export const useAddCredentialToFolder = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ folderId, credentialId }) => {
      return await link.Post("/api/folder/Credential", { 
        folderId, 
        credentialId 
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
  return {
    addCredentialToFolder: mutation.mutate,
    isAdding: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

export const useRemoveCredentialFromFolder = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ folderId, credentialId }) => {
      return await link.Delete("/api/folder/Credentials", { 
        folderId, 
        credentialId 
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
  return {
    removeCredentialFromFolder: mutation.mutate,
    isRemoving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

export const useGetCredentialsInFolder = (folderId) => {
  const {
    data: credentials = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["credentialsInFolder", folderId],
    queryFn: async () => {
      const credentials = await link.Get("/api/folder/Credentials/" + folderId);
      return credentials;
    },
  });
  return {
    credentials,
    isLoading,
    error,
    refetch,
  };
};