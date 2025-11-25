import { FileText, Save } from "lucide-react";
import React, { use, useRef, useState } from "react";
import { useCreateSendForReceiver } from "../../hooks/useSend";
import WebRTC from "../../util/Rtc";
import useRtcWS from "../../hooks/useRtcWS";



const SendReceiver = ({ onReceiveData }) => {
  const userId = 1; // You can make this dynamic later
  const { createSendForReceiver, isCreating, isError, isSuccess } =
    useCreateSendForReceiver(userId);
  const [Link, setLink] = React.useState("");
  const [IsGettingData, setIsGettingData] = React.useState(false);

  const Direction = "receiver";

  const [Answer, SetAnswer] = useState(null);

  const [IsCreatingAnswer, SetIsCreatingAnswer] = useState(false);
  const [IsChannelOpen, SetIsChannelOpen] = useState(false);

  //const [rtcObj, setRtcObj] = useState<WebRTC | null>(null);

  // Use the hook - it manages the instance internally
  const rtcHook = useRtcWS(Link, true);

  // Initialize WebRTC only once
  // if (!rtcObj) {
  //   setRtcObj(new WebRTC(Direction));
  // }

  // Set up the callback when component mounts

  const handleCreateAnswer = async (rtcObj) => {
    rtcHook.setSessionId(Link);
    rtcHook.SendOpenConnectionRequest();
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
    // Logic to handle receiving using the Link
    if (!Link) {
      alert("Please enter a valid link.");
      return;
    }

    console.log("Receiving with link:", Link);
    setIsGettingData(true);
    const rtcObj = new WebRTC(Direction);
    await handleCreateAnswer(rtcObj);
    //rtcObj?.SendMessage("Hello from Receiver!");
  };

  const modalId = `sendReceiverModal`;
  return (
    <div
      className="modal fade"
      id={modalId}
      tabIndex={-1}
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div
          className="modal-content"
          style={{ width: "25rem", height: "16rem", padding: "0" }}
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
              onClick={handleReceive}
              className="btn btn-dark"
              disabled={IsGettingData}
            >
              {IsGettingData ? "Receiving..." : "Receive"}
            </button>
            <button
              type="button"
              className="btn btn-white border-dark"
              data-bs-dismiss="modal"
              disabled={IsGettingData}
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
