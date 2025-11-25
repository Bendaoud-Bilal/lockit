import { useParams, useNavigate } from "react-router-dom";
import { useGetSendById } from "../../hooks/useSend";
import {
  ArrowLeft,
  FileText,
  Clock,
  Hash,
  Copy,
  Eye,
  CircleCheck,
  Download,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

const SendContent = () => {


  console.log("we are inside send content");
  

  const params = useParams();
  const sendId = params.sendId;
  console.log("send id = " , sendId);
  
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  //future use for limiting password attempts by default it is 1 now
  const [passwordTry, setPasswordTry] = useState(0);
  const [fileObject, setFileObject] = useState(null);

  const { send, isLoading, error } = useGetSendById(
    sendId || "",
    passwordInput
  );

  useEffect(() => {
    // This runs AFTER render, when send changes
    if (send?.type === "file" && send?.content && send?.extension) {
      try {
        console.log("Creating file from send data...");
        //@ts-ignore
        const uint8Array = new Uint8Array(send.content);
        const blob = new Blob([uint8Array]);
        const file = new File([blob], `download.${send.extension}`, {
          type: "application/octet-stream",
        });
        console.log("File created:", file.name, file.size);
        setFileObject(file);
      } catch (error) {
        console.log("Error creating file:", error);
        setFileObject(null);
      }
    } else {
      // Clear file object if send is not a file type
      setFileObject(null);
    }
  }, [send]); // Depend on stable identifiers and content reference

  // Create download URL for file
  // const downloadUrl = useMemo(() => {
  //   if (fileObject) {
  //     return URL.createObjectURL(fileObject);
  //   }
  //   return null;
  // }, [fileObject]);

  // Cleanup URL object on unmount or when downloadUrl changes
  // useEffect(() => {
  //   return () => {
  //     if (downloadUrl) {
  //       URL.revokeObjectURL(downloadUrl);
  //     }
  //   };
  // }, [downloadUrl]);

  const handleBack = () => {
    navigate("/send");
  };

  const handleCopyContent = () => {
    if (send?.content && send?.type !== "file") {
      if (typeof send.content === "string") {
        navigator.clipboard.writeText(send.content);
      }
      // You can add a toast notification here
      console.log("Content copied to clipboard!");
    }
  };

  const handleDownloadFile = () => {
    // if (downloadUrl && fileObject) {
    //   const link = document.createElement("a");
    //   link.href = downloadUrl;
    //   link.download = fileObject.name;
    //   document.body.appendChild(link);
    //   link.click();
    //   document.body.removeChild(link);
    // }
  };

  if (isLoading) {
    console.log("Showing loading spinner");
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading send...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("Error loading send:", error);
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error loading send content: {String(error)}
        </div>
        <button className="btn btn-dark" onClick={handleBack}>
          <ArrowLeft size={18} className="me-2" />
          Back to Sends
        </button>
      </div>
    );
  }

  if (!send) {
    console.log("No send data");
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          Send not found.
        </div>
        <button className="btn btn-dark" onClick={handleBack}>
          <ArrowLeft size={18} className="me-2" />
          Back to Sends
        </button>
      </div>
    );
  }

  // if (send && send.type === "file") {
  //       const file = createFile();
  //       setFileObject(file);
  //       console.log(file);
  // }

  // Only run when send identity changes (not on every content reference change)

  console.log("send access = ", send.currentAccessCount);

  return (
    <div
      className="container"
      style={{ width: "70%", minWidth: "35rem", marginTop: "2rem" }}
    >
      {/* Header with Back Button */}
      <div className="mb-4">
        <button className="btn btn-outline-dark mb-3" onClick={handleBack}>
          <ArrowLeft size={18} className="me-2" />
          Back to Sends
        </button>
      </div>

      {/* Send Details Card */}
      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white">
          <div className="d-flex align-items-center gap-2">
            <FileText size={24} />
            <h4 className="mb-0">{send.name}</h4>
            <span
              className={`badge ms-auto ${
                send.isActive ? "bg-success" : "bg-secondary"
              }`}
            >
              {send.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="card-body">
          {/* Metadata Section */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2 text-muted">
                <Hash size={18} />
                <div>
                  <small className="d-block">Accesses</small>
                  <strong className="text-dark">
                    {send.currentAccessCount || 0}
                    {send.maxAccessCount ? ` / ${send.maxAccessCount}` : ""}
                  </strong>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2 text-muted">
                <Clock size={18} />
                <div>
                  <small className="d-block">Time Remaining</small>
                  <strong className="text-dark">
                    {send.expiresAt
                      ? Math.max(
                          0,
                          Math.floor(
                            (new Date(send.expiresAt).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        ) + " days"
                      : "No Expiry"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2 text-muted">
                <FileText size={18} />
                <div>
                  <small className="d-block">Type</small>
                  <strong className="text-dark text-capitalize">
                    {send.type}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div className="mb-4">
            <small className="text-muted">
              Created on: {send.createdAt ? new Date(send.createdAt).toDateString() : "Unknown"}
            </small>
          </div>

          <hr />

          {/* Password Input (if required) */}
          {send.passwordProtected && !send.content && (
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                This send is password protected
              </label>
              <div
                className="input-group"
                style={{
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  placeholder="Enter password"
                  ref={passwordInputRef}
                  disabled={passwordTry >= 3}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    border: "0px",
                  }}
                >
                  <Eye size={"1rem"} />
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setPasswordInput(passwordInputRef.current?.value || "");
                    setPasswordTry(passwordTry + 1);
                  }}
                >
                  <CircleCheck size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Content Section */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Content</h5>
              {send.type === "file" ? (
                <button
                  className="btn btn-outline-dark btn-sm"
                  onClick={handleDownloadFile}
                  disabled={!send.content}
                >
                  <Download size={16} className="me-2" />
                  Download File
                </button>
              ) : (
                <button
                  className="btn btn-outline-dark btn-sm"
                  onClick={handleCopyContent}
                  disabled={!send.content}
                >
                  <Copy size={16} className="me-2" />
                  Copy Content
                </button>
              )}
            </div>

            <div
              className="p-3 bg-light border rounded"
              style={{
                minHeight: "200px",
                maxHeight: "400px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {send.content ? (
                send.type === "file" ? (
                  <div className="text-center">
                    <FileText size={64} className="text-muted mb-3" />
                    <p className="mb-2">
                      <strong>File ready for download</strong>
                    </p>
                    <p className="text-muted mb-3">
                      {fileObject?.name} (
                      {(fileObject?.size || 0) / 1024 > 1024
                        ? `${((fileObject?.size || 0) / (1024 * 1024)).toFixed(
                            2
                          )} MB`
                        : `${((fileObject?.size || 0) / 1024).toFixed(2)} KB`}
                      )
                    </p>
                    <button
                      className="btn btn-dark"
                      onClick={handleDownloadFile}
                    >
                      <Download size={18} className="me-2" />
                      Download
                    </button>
                  </div>
                ) : (
                  <code>{send.content}</code>
                )
              ) : (
                <p className="text-muted mb-0">
                  Enter password to view content
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendContent;
