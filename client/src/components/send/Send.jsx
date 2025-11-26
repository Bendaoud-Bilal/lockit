import SendItem from "./SendItem";
import CreateSend from "./CreateSend";
import SendReceiver from "./SendReceiver";
import { Plus, Upload } from "lucide-react";
import {
  useSendList,
  useCreateSend,
  useDeleteSend,
  useCreateSendForReceiver,
} from "../../hooks/useSend";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

const Send = () => {
  const {user} = useAuth();
  const userId = user?.id;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false);

  const { sends: Sends, isLoading, error } = useSendList(userId);
  const { createSend } = useCreateSend(userId);
  const { deleteSend } = useDeleteSend(userId);
  const { createSendForReceiver } = useCreateSendForReceiver(userId);

  const handleOnCopyLink = (sendId) => {
    console.log("Copy link for send ID:", sendId);
  };

  const handleOnEnVisible = (sendId) => {
    console.log("Call action for send ID:", sendId);
  };

  const handleOnDelete = async (sendId) => {
    deleteSend(sendId);
  };

  const handleCreateSend = async (sendData) => {
    console.log("send object = ", sendData);
    createSend(sendData);
    setIsCreateModalOpen(false);
  };

  const handleOnReceiveData = (Data) => {
    console.log("Received data:", Data);
    if (Data.method === "sendData") {
    }
  };

  return (
    <div className="w-full max-w-[60%] min-w-[35rem] mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-3xl font-bold text-gray-900">Send</h2>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsReceiverModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Upload size={18} />
            Receiver
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus size={18} />
            New Send
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Securely share sensitive information with expiration and access controls
      </p>

      {isLoading && (
        <div className="text-center my-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg" role="alert">
          Error loading sends. Please try again.
        </div>
      )}

      {!isLoading &&
        !error &&
        Sends.map((send) => (
          <SendItem
            key={send.id}
            sendId={send.id}
            title={send.name}
            status={send.isActive ? "Active" : "Inactive"}
            accesses={send.currentAccessCount || 0}
            max={send.maxAccessCount || null}
            expireAt={send.expiresAt ? new Date(send.expiresAt) : undefined}
            direction={send.direction}
            createdDate={send.createdAt ? new Date(send.createdAt).toDateString() : ""}
            onCopyLink={() => handleOnCopyLink(send.id)}
            onInvisibleClicked={() => handleOnEnVisible(send.id)}
            onDelete={() => handleOnDelete(send.id)}
          />
        ))}
      
      <CreateSend 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSend}
        userId={userId}
      />
      <SendReceiver 
        isOpen={isReceiverModalOpen}
        onClose={() => setIsReceiverModalOpen(false)}
        onReceiveData={handleOnReceiveData}
      />
    </div>
  );
};

export default Send;