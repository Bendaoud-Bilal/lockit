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
  };

  const handleOnReceiveData = (Data) => {
    console.log("Received data:", Data);
    if (Data.method === "sendData") {
    }
  };

  return (
    <div
      className="container"
      style={{ width: "60%", minWidth: "35rem", marginTop: "2rem" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h2>Send</h2>

        <div>
          <button
            type="button"
            className="btn btn-white me-2 border-dark"
            data-bs-toggle="modal"
            data-bs-target="#sendReceiverModal"
            style={{
              marginRight: "1rem",
            }}
          >
            <Upload size={18} className="me-2" />
            Receiver
          </button>
          <button
            type="button"
            className="btn btn-dark"
            data-bs-toggle="modal"
            data-bs-target="#createSendModal"
          >
            <Plus size={18} className="me-2" />
            New Send
          </button>
        </div>
      </div>

      <p>
        Securely share sensitive information with expiration and access controls
      </p>

      {isLoading && (
        <div className="text-center my-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
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
            isActive={send.isActive}
            onCopyLink={() => handleOnCopyLink(send.id)}
            onInvisibleClicked={() => handleOnEnVisible(send.id)}
            onDelete={() => handleOnDelete(send.id)}
          />
        ))}
      <CreateSend onSave={handleCreateSend} userId={userId} />
      <SendReceiver onReceiveData={handleOnReceiveData} />
    </div>
  );
};

export default Send;
