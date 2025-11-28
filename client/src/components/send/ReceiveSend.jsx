import { useState } from "react";
import { useReceiveSend } from "../../hooks/useSend";
import { 
    FileText, 
    Copy, 
    Eye, 
    EyeOff,
    Download, 
    Lock,
    AlertCircle,
    CheckCircle,
    Upload,
    X
} from "lucide-react";

const ReceiveSend = ({ isOpen, onClose }) => {
    const [sendFile, setSendFile] = useState(null);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const { send, isLoading, error, loadSend } = useReceiveSend(sendFile, password);

    // Reset state when modal closes
    const handleClose = () => {
        setSendFile(null);
        setPassword("");
        setShowPassword(false);
        setCopied(false);
        onClose();
    };

    const handleFileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    if (!file.name.endsWith('.lockit')) {
      alert('Please upload a valid .lockit send file');
      return;
    }
    // Reset everything for new file
    setSendFile(file);
    setPassword("");
    setShowPassword(false);
    setCopied(false);
    // The useEffect in useReceiveSend will automatically load it
  }
};

    const handleAccessWithPassword = () => {
        if (!password) {
            alert("Please enter a password");
            return;
        }
        loadSend();
    };

    const handleCopyContent = () => {
        if (send?.content && send?.type !== "file") {
            navigator.clipboard.writeText(send.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadFile = () => {
        if (send?.type === "file" && send?.content) {
            try {
                const uint8Array = new Uint8Array(send.content);
                const blob = new Blob([uint8Array]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = send.filename || `download.${send.extension || 'bin'}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Download failed:", error);
                alert("Failed to download file");
            }
        }
    };

    if (!isOpen) return null;

    // Initial upload screen
    const renderUploadScreen = () => (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Upload size={32} className="text-black" />
                    <h2 className="text-2xl font-bold">Receive Send</h2>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </div>
            
            <p className="text-gray-600 mb-6">
                Upload a <strong>.lockit</strong> send file to access its encrypted content.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-black transition-colors cursor-pointer">
                <input
                    type="file"
                    accept=".lockit"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="send-file-upload"
                />
                <label htmlFor="send-file-upload" className="cursor-pointer">
                    <Upload size={48} className="text-gray-400 mb-4 mx-auto" />
                    <p className="text-gray-600 mb-2">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                        .lockit files only
                    </p>
                </label>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>What is a .lockit file?</strong><br />
                    It's an encrypted send file created with LockIt. The sender should have shared this file with you.
                </p>
            </div>
        </div>
    );

    // Loading screen
    const renderLoadingScreen = () => (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-black border-r-transparent mb-4" />
                <p className="text-gray-600">Loading send...</p>
            </div>
        </div>
    );

    // Error screen
    const renderErrorScreen = () => (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle size={32} />
                    <h2 className="text-2xl font-bold">Error</h2>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
                onClick={() => {
                    setSendFile(null);
                    setPassword("");
                }}
                className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
                Try Another File
            </button>
        </div>
    );

    // Password protected screen
    const renderPasswordScreen = () => (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Lock size={32} className="text-black" />
                    <h2 className="text-2xl font-bold">Password Protected</h2>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>
            </div>
            
            <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">{send?.name || 'Send'}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <FileText size={16} />
                        <span className="capitalize">{send?.type || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <p className="text-gray-600 mb-4">
                This send is password protected. Enter the password to access the content.
            </p>

            <div className="space-y-3">
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      className="w-full p-3 pr-12 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
      placeholder="Enter password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAccessWithPassword();
        }
      }}
    />
    <button
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      onClick={() => setShowPassword(!showPassword)}
      type="button"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
  <button
    className="w-full p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
    onClick={handleAccessWithPassword}
    disabled={!password}
  >
    Access Content
  </button>
  <button
    onClick={() => {
      setSendFile(null);
      setPassword("");
    }}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
  >
    Upload Different File
  </button>
</div>
        </div>
    );

    // Content available screen
    const renderContentScreen = () => (
  <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="bg-black text-white p-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <FileText size={28} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{send?.name || 'Send'}</h1>
          <p className="text-gray-300 text-sm mt-1">
            Shared securely via LockIt
          </p>
        </div>
        <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
          Decrypted
        </span>
        <button
          onClick={handleClose}
          className="text-gray-300 hover:text-white transition-colors ml-2"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>
    </div>

    {/* Metadata */}
    <div className="p-6 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <FileText size={20} />
          <div>
            <small className="block text-xs text-gray-500">Type</small>
            <strong className="text-gray-900 capitalize">{send?.type || 'Unknown'}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Lock size={20} />
          <div>
            <small className="block text-xs text-gray-500">Protection</small>
            <strong className="text-gray-900">
              {send?.passwordProtected ? "Password Protected" : "Not Protected"}
            </strong>
          </div>
        </div>
      </div>
    </div>

    {/* Content Section */}
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Content</h2>
        {send?.type === "file" ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            onClick={handleDownloadFile}
          >
            <Download size={18} />
            Download File
          </button>
        ) : (
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={handleCopyContent}
          >
            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
        {send?.type === "file" ? (
          <div className="text-center py-8">
            <FileText size={64} className="text-gray-400 mb-4 mx-auto" />
            <p className="text-lg font-semibold mb-2">{send?.filename || 'File'}</p>
            <p className="text-gray-500 mb-6">
              {send?.content?.length ? 
                `${(send.content.length / 1024).toFixed(2)} KB` : 
                'File ready for download'}
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto"
              onClick={handleDownloadFile}
            >
              <Download size={20} />
              Download
            </button>
          </div>
        ) : (send?.type === "credential" && send?.credentialData ? (
  <div className="space-y-4">
    {/* Title */}
    {send.credentialData.title && (
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
        <p className="text-sm font-mono mt-1">{send.credentialData.title}</p>
      </div>
    )}
    
    {/* Category */}
    {send.credentialData.category && (
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
        <p className="text-sm font-mono mt-1 capitalize">
          {send.credentialData.category === 'credit_card' 
            ? 'Credit Card' 
            : send.credentialData.category === 'note' || send.credentialData.category === 'secure_note'
            ? 'Note'
            : send.credentialData.category}
        </p>
      </div>
    )}
    
    {/* Login fields */}
    {(send.credentialData.category === 'login' || send.credentialData.category === 'Login') && (
      <>
        {send.credentialData.username && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.username}</p>
          </div>
        )}
        {send.credentialData.email && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.email}</p>
          </div>
        )}
        {send.credentialData.password && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.password}</p>
          </div>
        )}
        {send.credentialData.website && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Website</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.website}</p>
          </div>
        )}
      </>
    )}
    
    {/* Credit Card fields */}
    {(send.credentialData.category === 'credit_card' || send.credentialData.category === 'Credit Card') && (
      <>
        {send.credentialData.cardholderName && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Cardholder Name</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.cardholderName}</p>
          </div>
        )}
        {send.credentialData.cardNumber && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Card Number</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.cardNumber}</p>
          </div>
        )}
        {(send.credentialData.expiryMonth || send.credentialData.expiryYear) && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Expiry Date</label>
            <p className="text-sm font-mono mt-1">
              {send.credentialData.expiryMonth && send.credentialData.expiryYear
                ? `${send.credentialData.expiryMonth}/${send.credentialData.expiryYear}`
                : send.credentialData.expiryMonth || send.credentialData.expiryYear}
            </p>
          </div>
        )}
        {send.credentialData.cvv && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">CVV</label>
            <p className="text-sm font-mono mt-1">{send.credentialData.cvv}</p>
          </div>
        )}
      </>
    )}
    
    {/* Secure Note fields */}
    {(send.credentialData.category === 'note' || send.credentialData.category === 'Note' || send.credentialData.category === 'secure_note') && (
      <>
        {send.credentialData.content && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Content</label>
            <p className="text-sm font-mono mt-1 whitespace-pre-wrap">{send.credentialData.content}</p>
          </div>
        )}
      </>
    )}
    
    {/* Common notes field - show for all categories */}
    {send.credentialData.notes && (
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
        <p className="text-sm font-mono mt-1 whitespace-pre-wrap">{send.credentialData.notes}</p>
      </div>
    )}
    
    {/* If no fields, show a message */}
    {!send.credentialData.title && 
     !send.credentialData.username && !send.credentialData.email &&
     !send.credentialData.password && !send.credentialData.website && 
     !send.credentialData.cardholderName && !send.credentialData.cardNumber &&
     !send.credentialData.content && !send.credentialData.notes && (
      <p className="text-gray-500 text-center py-4">No credential data available</p>
    )}
  </div>
) : send?.type === "credential" ? (
  // Fallback: try to display raw content as JSON
  <div className="space-y-4">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
      <p className="text-sm text-yellow-800">
        Unable to parse credential data. Showing raw content:
      </p>
    </div>
    <pre className="text-sm whitespace-pre-wrap break-words font-mono bg-white p-3 rounded border">
      {send?.content || 'No content available'}
    </pre>
  </div>
) : (
  <pre className="text-sm whitespace-pre-wrap break-words font-mono">
    {send?.content || 'No content'}
  </pre>
))}
      </div>
    </div>

    {/* Footer */}
    <div className="p-6 bg-gray-50 border-t border-gray-200">
      <p className="text-sm text-gray-600 text-center mb-4">
        ⚠️ This is an encrypted file package. The sender has shared this content with you.
      </p>
      <button
        onClick={() => {
          setSendFile(null);
          setPassword("");
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Open Another Send File
      </button>
    </div>
  </div>
);

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div onClick={(e) => e.stopPropagation()}>
                    {!sendFile && renderUploadScreen()}
                    {isLoading && renderLoadingScreen()}
                    {error && renderErrorScreen()}
                    {send?.needsPassword && renderPasswordScreen()}
                    {send && !send.needsPassword && renderContentScreen()}
                </div>
            </div>
        </>
    );
};

export default ReceiveSend;