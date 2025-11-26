import { FileText, EyeOff, Trash2, Clock, Link, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useRtcWS from "../../hooks/useRtcWS";
import WebRTC from "../../util/Rtc";
import { useGetEncryptedSendById } from "../../hooks/useSend";
import { v4 as uuidv4 } from "uuid";

const SendItem = ({
  sendId,
  title,
  status,
  accesses,
  max,
  expireAt,
  createdDate,
  direction,
  onCopyLink,
  onInvisibleClicked,
  onDelete,
}) => {
  const navigate = useNavigate();
  const Direction = "sender";
  const [Invisible, setInvisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [Offer, SetOffer] = useState(null);
  const [IsCreatingOffer, SetIsCreatingOffer] = useState(false);
  const sessionId = sendId;
  const rtcHook = useRtcWS(sessionId);
  const { send, isLoading, error } = useGetEncryptedSendById(sendId);

  const sendSend = (Send, rtcObj) => {
    if (Send) {
      console.log("encrypted send in sender  = ", send);
      rtcObj?.sendSend({
        contentAuthTag: Send.contentAuthTag,
        method: "sendData",
        contentIv: Send.contentIv,
        createdAt: Send.createdAt,
        deletedAt: Send.deletedAt,
        maxAccessCount: Send.maxAccessCount,
        expiresAt: Send.expiresAt,
        encryptedContent: Send.encryptedContent,
        name: Send.name,
        type: Send.type,
        filename: Send.filename,
        isActive: Send.isActive,
        passwordProtected: Send.passwordProtected,
      });
    }
  };

  const handleChannelOpened = (rtcObj) => {
    console.log("send = ", send);
    console.log("is loading = ", isLoading);
    console.log("error = ", error);

    rtcObj.OnChannelOpen(() => {
      console.log("hello ");
      if (!isLoading && !error && send) {
        sendSend(send, rtcObj);
        rtcObj.CloseConnection();
      }
    });
  };

  const handleCreateOffer = async () => {
    const rtcObj = new WebRTC(Direction);
    handleChannelOpened(rtcObj);
    SetIsCreatingOffer(true);
    try {
      rtcObj?.CreateOffer(Direction, async (offer) => {
        SetOffer(offer);
        SetIsCreatingOffer(false);
        rtcHook.sendOffer(offer);
      });

      rtcHook.SetOnOpenConnectionRequest((user) => {
        console.log(`🔗 Receiver ${user} connected`);
        handleOpenConnection(user, rtcObj);
      });

      console.log(rtcObj?.GetChannelState());
    } catch (error) {
      console.error("Error creating offer:", error);
      SetIsCreatingOffer(false);
    }
  };

  const handleOpenConnection = async (user, rtcObj) => {
    rtcHook.getAnswer(user, async (AnswerSdp) => {
      console.log("✅ Received answer from receiver");
      const answer = {
        sdp: AnswerSdp,
        type: "answer",
      };
      await rtcObj?.OpenConnection(answer);
      console.log("🔌 Connection established");
      console.log(rtcObj?.GetChannelState());
    });
  };

  const handleOnCopyLink = () => {
    if (onCopyLink) {
      const id = uuidv4();
      rtcHook.setSessionId(id);
      navigator.clipboard.writeText(id).catch((err) => {
        console.error("Failed to copy link:", err);
      });
      onCopyLink();
      handleCreateOffer();
    }
  };

  const handleOnEnVisible = () => {
    setInvisible(!Invisible);
    onInvisibleClicked && onInvisibleClicked();
  };

  const handleUpdateAccessesCount = async () => {
    if (direction === "received") {
      //@ts-ignore
      const res = await window.api.send.updateAccessCount(sendId, accesses + 1);
    } else {
      //@ts-ignore
      // const res = await window.api.send.updateAccessCount(sendId, accesses + 1);
    }
  };

  const handleTitleClick = async () => {
    if (max && accesses >= max) {
      return;
    }
    handleUpdateAccessesCount();
    navigate(`/send/${sendId}`);
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 min-w-[20rem]">
        <div className="flex justify-between items-start">
          {/* Left Section */}
          <div className="flex gap-3 flex-grow">
            {/* Icon */}
            <div className="mt-1">
              <FileText size={20} className="text-gray-500" />
            </div>

            {/* Content */}
            <div className="flex-grow">
              {/* Title and Badge */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h5
                  className="text-lg font-semibold mb-0 cursor-pointer transition-colors duration-200 hover:text-blue-600"
                  style={{ color: isHovered ? "#2563eb" : "inherit" }}
                  onClick={handleTitleClick}
                >
                  {title}
                </h5>
                <span
                  className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full transition-transform duration-200"
                  style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
                >
                  {status}
                </span>
              </div>

              {/* Metadata */}
              <div className="flex gap-3 mb-2 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <span>
                    {accesses} accesses {max ? `/ ${max} max` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {expireAt
                      ? expireAt.getTime() > Date.now()
                        ? Math.ceil((expireAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " days"
                        : "Expired"
                      : "No Expiry"}
                  </span>
                </div>
              </div>

              {/* Created Date */}
              <p className="text-sm text-gray-500 mb-0">{createdDate}</p>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div
            className="flex gap-2 ml-3 transition-opacity duration-300"
            style={{ opacity: isHovered ? 1 : 0.7 }}
          >
            {/* Copy Link Button */}
            <button
              onClick={handleOnCopyLink}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-all duration-200 hover:scale-105"
              title="Copy Link"
            >
              <Link size={16} />
              <span className="hidden sm:inline">Copy Link</span>
            </button>

            {/* Eye Off Icon Button */}
            <button
              onClick={handleOnEnVisible}
              className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105"
              title="View"
            >
              {Invisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="flex items-center justify-center p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-105"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendItem;