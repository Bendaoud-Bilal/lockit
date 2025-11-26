import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useReceiveSend } from "../hooks/useSend";
import { 
    FileText, 
    Clock, 
    Hash, 
    Copy, 
    Eye, 
    EyeOff,
    Download, 
    Lock,
    AlertCircle,
    CheckCircle
} from "lucide-react";

const ReceiveSend = () => {
    const { sendId } = useParams();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [hasAttemptedAccess, setHasAttemptedAccess] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const { send, isLoading, error, refetch } = useReceiveSend(
        sendId,
        hasAttemptedAccess ? password : null
    );

    // Auto-fetch if not password protected
    useEffect(() => {
        if (sendId && !hasAttemptedAccess && send && !send.passwordProtected) {
            setHasAttemptedAccess(true);
        }
    }, [sendId, send, hasAttemptedAccess]);

    const handleAccessWithPassword = () => {
        if (!password) {
            alert("Please enter a password");
            return;
        }
        setHasAttemptedAccess(true);
        refetch();
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

    const calculateTimeRemaining = () => {
        if (!send?.expiresAt) return "No Expiry";
        const now = new Date().getTime();
        const expiry = new Date(send.expiresAt).getTime();
        const diff = expiry - now;
        
        if (diff <= 0) return "Expired";
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return "Less than 1 hour";
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-black border-r-transparent mb-4" />
                    <p className="text-gray-600">Loading send...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertCircle size={32} />
                        <h2 className="text-2xl font-bold">Access Denied</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        {error.message || error.error || "Failed to load send. It may have expired, been deleted, or reached its access limit."}
                    </p>
                </div>
            </div>
        );
    }

    if (!send) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4 text-yellow-600">
                        <AlertCircle size={32} />
                        <h2 className="text-2xl font-bold">Not Found</h2>
                    </div>
                    <p className="text-gray-600">This send does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    // Password protected and no content yet
    if (send.passwordProtected && !send.content) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock size={32} className="text-black" />
                        <h2 className="text-2xl font-bold">Password Protected</h2>
                    </div>
                    
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">{send.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <FileText size={16} />
                                <span className="capitalize">{send.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{calculateTimeRemaining()}</span>
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
                                onKeyPress={(e) => e.key === 'Enter' && handleAccessWithPassword()}
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
                        >
                            Access Content
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Content is available
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-black text-white p-6">
                        <div className="flex items-center gap-3">
                            <FileText size={28} />
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold">{send.name}</h1>
                                <p className="text-gray-300 text-sm mt-1">
                                    Shared securely via LockIt
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Hash size={20} />
                                <div>
                                    <small className="block text-xs text-gray-500">Accesses</small>
                                    <strong className="text-gray-900">
                                        {send.currentAccessCount || 0}
                                        {send.maxAccessCount ? ` / ${send.maxAccessCount}` : ""}
                                    </strong>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={20} />
                                <div>
                                    <small className="block text-xs text-gray-500">Time Remaining</small>
                                    <strong className="text-gray-900">{calculateTimeRemaining()}</strong>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <FileText size={20} />
                                <div>
                                    <small className="block text-xs text-gray-500">Type</small>
                                    <strong className="text-gray-900 capitalize">{send.type}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Content</h2>
                            {send.type === "file" ? (
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

                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px] max-h-[500px] overflow-y-auto">
                            {send.type === "file" ? (
                                <div className="text-center py-8">
                                    <FileText size={64} className="text-gray-400 mb-4 mx-auto" />
                                    <p className="text-lg font-semibold mb-2">{send.filename}</p>
                                    <p className="text-gray-500 mb-6">
                                        {send.content?.length ? 
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
                            ) : (
                                <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                                    {send.content}
                                </pre>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                            ⚠️ This content will be available for {calculateTimeRemaining().toLowerCase()} 
                            {send.maxAccessCount && ` or ${send.maxAccessCount - (send.currentAccessCount || 0)} more access${send.maxAccessCount - (send.currentAccessCount || 0) !== 1 ? 'es' : ''}`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiveSend;