import { useGetCredentialsInFolder, useGetFolderById } from "../../hooks/useFolder";
import PasswordCard from "../vault/PasswordCard";
import { useParams } from "react-router-dom";

const CredentialListInFolder = () => {
  const params = useParams();
  const folderId = params.folderId;

  const {
    folder,
    isLoading: FolderIsLoading,
    error: FolderError,
    refetch,
  } = useGetFolderById(folderId);
  
  const { credentials, isLoading, error } = useGetCredentialsInFolder(folderId);

  if (FolderIsLoading) {
    return (
      <div className="text-center my-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (FolderError) {
    return <div>Error: {FolderError.message}</div>;
  }

  if (isLoading) {
    return (
      <div className="text-center my-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col p-8 md:px-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold m-0 text-gray-900">
          {folder.name}
        </h2>
      </div>
      
      {credentials.length === 0 ? (
        <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-300 mt-8">
          <p className="mb-0">No credentials found in this folder.</p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-y-4 mt-4">
          {credentials.map((credential) => (
            <div key={credential.id} className="w-[70%]">
              <PasswordCard credential={credential} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialListInFolder;