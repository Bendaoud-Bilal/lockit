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
  const params = useParams();
  const sendId = params.sendId;
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTry, setPasswordTry] = useState(0);
  const [fileObject, setFileObject] = useState(null);

  const { send, isLoading, error } = useGetSendById(sendId || "", passwordInput);

  useEffect(() => {
    if (send?.type === "file" && send?.content && send?.extension) {
      try {
        const uint8Array = new Uint8Array(send.content);
        const blob = new Blob([uint8Array]);
        const file = new File([blob], `download.${send.extension}`, {
          type: "application/octet-stream",
        });
        setFileObject(file);
      } catch (error) {
        console.log("Error creating file:", error);
        setFileObject(null);
      }
    } else {
      setFileObject(null);
    }
  }, [send]);

  const handleBack = () => {
    navigate("/send");
  };

  const handleCopyContent = () => {
    if (send?.content && send?.type !== "file") {
      if (typeof send.content === "string") {
        navigator.clipboard.writeText(send.content);
      }
      console.log("Content copied to clipboard!");
    }
  };

  const handleDownloadFile = () => {
    // Download logic here
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[70%] min-w-[35rem] mx-auto mt-8 px-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-3">Loading send...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[70%] min-w-[35rem] mx-auto mt-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg" role="alert">
          Error loading send content: {String(error)}
        </div>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors" onClick={handleBack}>
          <ArrowLeft size={18} />
          Back to Sends
        </button>
      </div>
    );
  }

  if (!send) {
    return (
      <div className="w-full max-w-[70%] min-w-[35rem] mx-auto mt-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg" role="alert">
          Send not found.
        </div>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors" onClick={handleBack}>
          <ArrowLeft size={18} />
          Back to Sends
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[70%] min-w-[35rem] mx-auto mt-8 px-4">
      {/* Header with Back Button */}
      <div className="mb-4">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors mb-3" onClick={handleBack}>
          <ArrowLeft size={18} />
          Back to Sends
        </button>
      </div>

      {/* Send Details Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-black text-white p-4">
          <div className="flex items-center gap-2">
            <FileText size={24} />
            <h4 className="text-xl font-semibold mb-0">{send.name}</h4>
            <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${send.isActive ? "bg-green-500" : "bg-gray-500"}`}>
              {send.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Hash size={18} />
              <div>
                <small className="block text-sm">Accesses</small>
                <strong className="text-gray-900">
                  {send.currentAccessCount || 0}
                  {send.maxAccessCount ? ` / ${send.maxAccessCount}` : ""}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={18} />
              <div>
                <small className="block text-sm">Time Remaining</small>
                <strong className="text-gray-900">
                  {send.expiresAt
                    ? Math.max(0, Math.floor((new Date(send.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days"
                    : "No Expiry"}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <FileText size={18} />
              <div>
                <small className="block text-sm">Type</small>
                <strong className="text-gray-900 capitalize">{send.type}</strong>
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div className="mb-4">
            <small className="text-gray-500">
              Created on: {send.createdAt ? new Date(send.createdAt).toDateString() : "Unknown"}
            </small>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Password Input (if required) */}
          {send.passwordProtected && !send.content && (
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 text-sm font-medium">
                This send is password protected
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="flex-1 p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
                  id="password"
                  placeholder="Enter password"
                  ref={passwordInputRef}
                  disabled={passwordTry >= 3}
                />
                <button
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye size={16} />
                </button>
                <button
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-lg font-semibold mb-0">Content</h5>
              {send.type === "file" ? (
                <button
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-900 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={handleDownloadFile}
                  disabled={!send.content}
                >
                  <Download size={16} />
                  Download File
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-900 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={handleCopyContent}
                  disabled={!send.content}
                >
                  <Copy size={16} />
                  Copy Content
                </button>
              )}
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">
              {send.content ? (
                send.type === "file" ? (
                  <div className="text-center">
                    <FileText size={64} className="text-gray-400 mb-3 mx-auto" />
                    <p className="mb-2 font-semibold">File ready for download</p>
                    <p className="text-gray-500 mb-3">
                      {fileObject?.name} (
                      {(fileObject?.size || 0) / 1024 > 1024
                        ? `${((fileObject?.size || 0) / (1024 * 1024)).toFixed(2)} MB`
                        : `${((fileObject?.size || 0) / 1024).toFixed(2)} KB`}
                      )
                    </p>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto"
                      onClick={handleDownloadFile}
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>
                ) : (
                  <code className="text-sm">{send.content}</code>
                )
              ) : (
                <p className="text-gray-500 mb-0">Enter password to view content</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendContent;