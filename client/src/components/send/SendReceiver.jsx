import { FileText, Save } from "lucide-react";
import React, { use, useEffect, useRef, useState } from "react";
import { useCreateSendForReceiver } from "../../hooks/useSend";
import WebRTC from "../../util/Rtc";
import useRtcWS from "../../hooks/useRtcWS";
import { useAuth } from "../../context/AuthContext";



const SendReceiver = ({ onReceiveData }) => {
  const{ user} = useAuth(); // You can make this dynamic later
  const userId = user?.id;
  const { createSendForReceiver, isCreating, isError, isSuccess } =
    useCreateSendForReceiver(userId);
  const [Link, setLink] = React.useState("");
  const [IsGettingData, setIsGettingData] = React.useState(false);
  const Direction = "receiver";
  const [Answer, SetAnswer] = useState(null);
  const [IsCreatingAnswer, SetIsCreatingAnswer] = useState(false);

  const [IsOpeningConnection , SetIsOpeningConnection] = useState(false);

  const [IsSendingData , SetIsSendingData ] = useState(false);

  const [IsDataBeenSent , SetIsDataBeenSent] = useState(false);

  const [IsMessaging , SetIsMessaging] = useState(false);

  const timeoutRef = useRef(null);

  //const [rtcObj, setRtcObj] = useState<WebRTC | null>(null);

  // Use the hook - it manages the instance internally
  const rtcHook = useRtcWS(Link, true);

  // Reset state when modal opens, cleanup when closes
  useEffect(() => {
    console.log("inside use effect");
    
    const modalElement = document.getElementById('sendReceiverModal');
    
    const handleModalShown = () => {
      rtcHook.connect();
      console.log("🟢 Modal opened - resetting state");
      setLink("");
      setIsGettingData(false);
      SetAnswer(null);
      SetIsCreatingAnswer(false);
      SetIsOpeningConnection(false);
      SetIsSendingData(false);
      SetIsDataBeenSent(false);
      SetIsMessaging(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleModalHidden = () => {
      console.log("🔴 Modal closed - cleaning up");
      rtcHook.disconnect();
    };

    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', handleModalShown);
      modalElement.addEventListener('hidden.bs.modal', handleModalHidden);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('shown.bs.modal', handleModalShown);
        modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      rtcHook.disconnect();
    };
  }, []);
  
  // Initialize WebRTC only once
  // if (!rtcObj) {
  //   setRtcObj(new WebRTC(Direction));
  // }

  // Set up the callback when component mounts

  const handleCreateAnswer = async (rtcObj) => {
    rtcHook.setSessionId(Link);
    rtcHook.SendOpenConnectionRequest();
    
    // Set up event callbacks for UI updates

    rtcObj.SetOnSendingData(() => {
      SetIsSendingData(true);
      SetIsOpeningConnection(false)
      console.log("📥 Receiving data...");
    });

    rtcObj.SetOnDataReceived(() => {

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      SetIsMessaging(false);
      SetIsDataBeenSent(true);
      SetIsSendingData(false);
      SetIsOpeningConnection(false);
      setIsGettingData(false);
      console.log("✅ Data received successfully!");
      rtcObj?.sendSend({  
        method: "SendDataReceived"
      });

      // Close the modal
      const modalElement = document.getElementById('sendReceiverModal');
      if (modalElement) {
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    });
    
    rtcObj?.setOnGetSendCallback((send) => {
      createSendForReceiver(send);
      // rtcObj.CloseConnection();
    });
    rtcHook.getOffer(
      // after getting offer this callback will be called
      async (offerSdp) => {
        console.log("we get the offer");
        SetIsCreatingAnswer(true);
        try {
          const offer  = {
            sdp: offerSdp,
            type: "offer",
          };
          rtcObj?.CreateAnswer(
            Direction,
            offer,
            async (answer) => {
              SetAnswer(answer);
              SetIsCreatingAnswer(false);
              rtcHook.sendAnswer(answer);
              rtcHook.disconnect();

              console.log(
                "receiver connection status = ",
                rtcObj?.GetChannelState()
              );
            }
          );
        } catch (error) {
          console.error("Error creating answer:", error);
          SetIsCreatingAnswer(false);
        }
      }
    );
  };

  // const { createSendForReceiver , isSuccess , isError , isCreating } = useCreateSendForReceiver(userId);

  const handleReceive = async () => {
    console.log("🔵 handleReceive called!");
    console.log("IsMessaging:", IsMessaging);
    console.log("Link:", Link);
    
    // Logic to handle receiving using the Link
    if (!Link) {
      alert("Please enter a valid link.");
      return;
    }
    rtcHook.connect();
    SetIsOpeningConnection(true);
    SetIsMessaging(true);

    // Set timeout to reset IsMessaging after 1 minute if data not received
    timeoutRef.current = setTimeout(() => {
      console.warn("⏱️ Timeout: No data received within 1 minute");
      SetIsMessaging(false);
      SetIsOpeningConnection(false);
      SetIsSendingData(false);
      setIsGettingData(false);
      alert("Connection timeout. Please try again.");
    }, 60000); // 60000ms = 1 minute

    console.log("Receiving with link:", Link);
    // Create fresh RTC object for each receive
    const rtcObj = new WebRTC(Direction);
    await handleCreateAnswer(rtcObj);
    //rtcObj?.SendMessage("Hello from Receiver!");
  };

  const modalId = `sendReceiverModal`;
  
  console.log("🟢 SendReceiver render - IsMessaging:", IsMessaging);
  
  return (
    <div
      className="modal fade"
      id={modalId}
      tabIndex={-1}
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog">
        <div
          className="modal-content"
          style={{ width: "25rem", minHeight: "16rem", padding: "0" }}
        >
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Receive
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* Connection Status Toast */}
            {IsOpeningConnection && (
              <div className="alert alert-info py-2 mb-2" role="alert">
                📡 Opening connection...
              </div>
            )}
            {IsSendingData && (
              <div className="alert alert-warning py-2 mb-2" role="alert">
                📥 Receiving data...
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="Link" className="form-label">
                {"Link"}
              </label>
              <input
                id="Link"
                type="text"
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter Link here"
                className="form-control"
              />
            </div>
          </div>
          <div className="modal-footer">
             <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔴 RECEIVE BUTTON CLICKED!");
                handleReceive();
              }}
              className="btn btn-dark"
              disabled={IsMessaging}
            >
              {IsMessaging? "Receiving":"Receive"}
            </button>
            <button
              type="button"
              className="btn btn-white border-dark"
              data-bs-dismiss="modal"
              onClick={() => console.log("🟡 Cancel clicked")}
              disabled={IsMessaging}
            >
              Cancel
            </button>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendReceiver;