import { useGetCredentialsInFolder , useGetFolderById  } from "../../hooks/useFolder";
import PasswordCard from "../vault/PasswordCard";
import { useParams } from "react-router-dom";

const CredentialListInFolder = () => {
  
  const params = useParams();
  const folderId = params.folderId;
  console.log("folder id = "  , folderId);
  
  const { folder,
    isLoading : FolderIsLoading,
    error: FolderError,
    refetch, } = useGetFolderById(folderId);
  const { credentials, isLoading, error } = useGetCredentialsInFolder(folderId);



  if (FolderIsLoading) {
    return ( <div className="text-center my-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>)
  }

  if (FolderError) {
    return <div>Error: {FolderError.message}</div>;
  }

  


  if (isLoading) {
    return ( <div className="text-center my-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>)
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  
  return (    
  <div
      className="container"
      style={{ width: "60%", minWidth: "35rem", marginTop: "2rem" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h2>{folder.name}</h2>
      </div>
      {credentials.length === 0 ? (
        <p>No credentials found in this folder.</p>
      ) : (
        <div style={{ marginTop: "3rem" }}>
          
          {credentials.map((credential) => (
            <div key={credential.id}>
              <PasswordCard credential={credential} />
            </div>
          ))
          }
        </div>
      )}
    </div>
  );

};

export default CredentialListInFolder;
