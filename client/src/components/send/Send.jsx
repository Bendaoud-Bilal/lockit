import SendItem from "./SendItem";
import CreateSend from "./CreateSend";
import { Plus } from "lucide-react";
import { useSendList, useCreateSend, useDeleteSend } from "../../hooks/useSend";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";

const Send = () => {
    const { user } = useAuth();
    const userId = user?.id;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const { sends, isLoading, error } = useSendList(userId);
    const { createSend, sendData, isCreating } = useCreateSend(userId);
    const { deleteSend } = useDeleteSend(userId);

    const handleCopyLink = (sendId) => {
    // For desktop app, use hash routing
    const shareLink = `${window.location.origin}/#/receive/${sendId}`;
    navigator.clipboard.writeText(shareLink)
        .then(() => {
            setCopiedId(sendId);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(err => {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy link");
        });
};

const handleCreateSend = async (formData) => {
    createSend(formData, {
        onSuccess: (data) => {
            setIsCreateModalOpen(false);
            toast.success("Send created successfully!");
            
            // Auto-copy link with desktop app URL
            if (data?.id) {
                const link = `${window.location.origin}/#/receive/${data.id}`;
                navigator.clipboard.writeText(link);
                toast.success("Link copied to clipboard!");
            }
        },
        onError: () => {
            toast.error("Failed to create send");
        }
    });
};

    const handleDelete = async (sendId) => {
        if (window.confirm("Are you sure you want to delete this send?")) {
            deleteSend(sendId, {
                onSuccess: () => {
                    toast.success("Send deleted successfully");
                },
                onError: () => {
                    toast.error("Failed to delete send");
                }
            });
        }
    };

    return (
        <div className="w-full max-w-[60%] min-w-[35rem] mx-auto mt-8 px-4">
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-3xl font-bold text-gray-900">Send</h2>
                <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    disabled={isCreating}
                >
                    <Plus size={18} />
                    New Send
                </button>
            </div>

            <p className="text-gray-600 mb-6">
                Securely share sensitive information with expiration and access controls
            </p>

            {isLoading && (
                <div className="text-center my-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                    <p className="mt-3 text-gray-600">Loading sends...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4" role="alert">
                    Error loading sends. Please try again.
                </div>
            )}

            {!isLoading && !error && sends.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-4">No sends yet</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Create your first send
                    </button>
                </div>
            )}

            {!isLoading && !error && sends.map((send) => (
                <SendItem
                    key={send.id}
                    sendId={send.id}
                    title={send.name}
                    status={send.isActive ? "Active" : "Inactive"}
                    accesses={send.currentAccessCount || 0}
                    max={send.maxAccessCount || null}
                    expireAt={send.expiresAt ? new Date(send.expiresAt) : undefined}
                    createdDate={send.createdAt ? new Date(send.createdAt).toDateString() : ""}
                    onCopyLink={() => handleCopyLink(send.id)}
                    onDelete={() => handleDelete(send.id)}
                    isCopied={copiedId === send.id}
                />
            ))}

            <CreateSend
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateSend}
                userId={userId}
            />
        </div>
    );
};

export default Send;