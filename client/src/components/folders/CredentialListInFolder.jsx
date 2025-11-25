import { useGetCredentialsInFolder, useGetFolderById } from "../../hooks/useFolder";
import PasswordCard from "../vault/PasswordCard";
import { useParams } from "react-router-dom";

const CredentialListInFolder = () => {
  const params = useParams();
  const folderId = params.folderId;
  console.log("folder id = ", folderId);

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
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
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
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col" style={{ padding: "2rem 3rem" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2
          style={{
            fontSize: "1.875rem",
            fontWeight: "700",
            margin: 0,
            color: "#111827"
          }}
        >
          {folder.name}
        </h2>
      </div>
      
      {credentials.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "#6b7280",
            backgroundColor: "#f9fafb",
            borderRadius: "0.75rem",
            border: "1px solid #e5e7eb",
            marginTop: "2rem"
          }}
        >
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