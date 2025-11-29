import { FileText, EyeOff, Trash2, Clock, Link, Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useRtcWS from "../../hooks/useRtcWS";
import WebRTC from "../../util/Rtc";
import { useGetEncryptedSendById , useUpdateSendAccessCount } from "../../hooks/useSend";
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
  isActive,
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

  const [IsOpeningConnection , SetIsOpeningConnection] = useState(false);

  const [IsSendingData , SetIsSendingData ] = useState(false);

  const [IsDataBeenSent , SetIsDataBeenSent] = useState(false);

  const sessionId = sendId;

  // const [rtcObj, setRtcObj] = useState<WebRTC | null>(null);

  // Use the hook - it manages the instance internally
  const rtcHook = useRtcWS(sessionId);

  const { send, isLoading, error } = useGetEncryptedSendById(sendId);
  const {updateAccessCount} = useUpdateSendAccessCount(sendId)

  // useEffect(() => {
  //   rtcObj?.OnChannelOpen(() => {
  //     rtcObj?.SendMessage("Hello from Sender!");
  //   });
  // }, [rtcHook]);

  // Initialize WebRTC only once
  // if (!rtcObj) {
  //   setRtcObj(new WebRTC(Direction));
  // }

  //  const [Message, SetMessage] = useStat>("");

  // Set up the callback when component mounts

  const sendSend = (Send, rtcObj) => {
    if (Send) {
      console.log("encrypted send in sender  = ", send);
      rtcObj?.sendSend(
        {
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
      }
    );     
    }
  };

  const handleChannelOpened = (rtcObj) => {
    console.log("send = ", send);
    console.log("is loading = ", isLoading);
    console.log("error = ", error);

    rtcObj.OnChannelOpen(() => {
      console.log("sending data... ");
      if (!isLoading && !error && send) {
        sendSend(send, rtcObj);
        //rtcObj.CloseConnection();
      }
    });
  };

  const handleCreateOffer = async () => {
    // Each Copy Link creates a NEW WebRTC instance for a NEW receiver
    const rtcObj = new WebRTC(Direction);

    // Set up event callbacks for UI updates
    rtcObj.SetOnSendingData(() => {
      SetIsSendingData(true);
      SetIsOpeningConnection(false);
      // Show toast: Sending data
      console.log("📤 Sending data...");
    });

    rtcObj.SetOnDataReceived(() => {
      SetIsDataBeenSent(true);
      SetIsSendingData(false);
      SetIsOpeningConnection(false);
      // Show toast: Data sent successfully
      console.log("✅ Data sent successfully!");
      rtcObj.CloseConnection();
    });

    // Set up what happens when channel opens (callback for later)
    handleChannelOpened(rtcObj);

    SetIsCreatingOffer(true);
    try {
      rtcObj?.CreateOffer(
        Direction,
        async (offer) => {
          SetOffer(offer);
          SetIsCreatingOffer(false);
          rtcHook.sendOffer(offer);
        }
      );

      // REPLACE the callback - this new receiver needs this new rtcObj
      // When this specific receiver connects, handle it with THIS rtcObj
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
    rtcHook.getAnswer(
      user,
      // Callback when answer is received from this receiver
      async (AnswerSdp) => {
        console.log("✅ Received answer from receiver");
        const answer = {
          sdp: AnswerSdp,
          type: "answer",
        };
        await rtcObj?.OpenConnection(answer);

        //rtcHook.disconnect();
        console.log("🔌 Connection established");
        console.log(rtcObj?.GetChannelState());

      }
    );
  };

  const handleOnCopyLink = () => {

    if (onCopyLink) {

      const id = uuidv4();
      rtcHook.connect();
      rtcHook.setSessionId(id);
      // Copy the link to clipboard
      navigator.clipboard.writeText(id).catch((err) => {
        console.error("Failed to copy link:", err);
      });
      SetIsOpeningConnection(true);

      onCopyLink();
      handleCreateOffer();
    }
  };

  const handleOnEnVisible = () => {
    setInvisible(!Invisible);
    onInvisibleClicked && onInvisibleClicked();
  };

  const handleUpdateAccessesCount = async () => {
    // Logic to update accesses count can be added here
    console.log("direction = " , direction);
    
    if (direction === "received") {
      updateAccessCount();
    } else {
      //@ts-ignore
      // const res = await window.api.send.updateAccessCount(sendId, accesses + 1);
    }
  };

  const handleTitleClick = async () => {
    if (max && accesses >= max) {
      return; // Prevent navigation if max accesses reached
    }
    if(!isActive)
    {
      return; // Prevent navigation if send is inactive
    }
    handleUpdateAccessesCount();
    navigate(`/send/${sendId}`);
  };

  return (
    <div
      className="card shadow-sm mb-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: "all 0.3s ease",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 8px 16px rgba(0, 0, 0, 0.15)"
          : "0 2px 4px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
      }}
    >
      <div className="card-body" style={{ minWidth: "20rem" }}>
        {/* Connection Status Toast */}
        {IsOpeningConnection && (
          <div className="alert alert-info py-2 mb-2" role="alert">
            📡 Opening connection...
          </div>
        )}
        {IsSendingData && (
          <div className="alert alert-warning py-2 mb-2" role="alert">
            📤 Sending data...
          </div>
        )}
        {IsDataBeenSent && (
          <div className="alert alert-success py-2 mb-2" role="alert">
            ✅ Data sent successfully!
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-start">
          {/* Left Section */}
          <div className="d-flex gap-3 flex-grow-1">
            {/* Icon */}
            <div className="mt-1">
              <FileText size={20} className="text-secondary" />
            </div>

            {/* Content */}
            <div className="flex-grow-1">
              {/* Title and Badge */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <h5
                  className="card-title mb-0 fw-semibold"
                  style={{
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                    color: isHovered ? "#0d6efd" : "inherit",
                  }}
                  onClick={handleTitleClick}
                >
                  {title}
                </h5>
                <span
                  className="badge bg-dark rounded-pill"
                  style={{
                    transition: "all 0.2s ease",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {status}
                </span>
              </div>

              {/* Metadata */}
              <div className="d-flex gap-3 mb-2 small text-muted">
                <div className="d-flex align-items-center gap-1">
                  <span>#</span>
                  <span>
                    {accesses} accesses {max ? `/ ${max} max` : ""}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {expireAt
                      ? expireAt.getTime() > Date.now()
                        ? Math.ceil(
                            (expireAt.getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          ) + " days"
                        : "Expired"
                      : "No Expiry"}
                  </span>
                </div>
              </div>

              {/* Created Date */}
              <p className="card-text small text-muted mb-0">{createdDate}</p>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div
            className="d-flex gap-2 ms-3"
            style={{
              transition: "opacity 0.3s ease",
              opacity: isHovered ? 1 : 0.7,
            }}
          >
            {/* Copy Link Button */}
            <button
              onClick={handleOnCopyLink}
              className="btn btn-outline-secondary btn-sm"
              title="Copy Link"
              style={{
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Link size={16} />
              <span className="d-none d-sm-inline">Copy Link</span>
            </button>

            {/* Eye Off Icon Button */}
            <button
              onClick={handleOnEnVisible}
              className="btn btn-outline-secondary btn-sm"
              title="View"
              style={{
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {Invisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="btn btn-outline-danger btn-sm"
              title="Delete"
              style={{
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
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
