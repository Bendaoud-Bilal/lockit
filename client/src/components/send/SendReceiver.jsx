import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCreateSendForReceiver } from "../../hooks/useSend";
import WebRTC from "../../util/Rtc";
import useRtcWS from "../../hooks/useRtcWS";

const SendReceiver = ({ isOpen, onClose, onReceiveData }) => {
  const userId = 1;
  const { createSendForReceiver, isCreating, isError, isSuccess } =
    useCreateSendForReceiver(userId);
  const [Link, setLink] = useState("");
  const [IsGettingData, setIsGettingData] = useState(false);
  const Direction = "receiver";
  const [Answer, SetAnswer] = useState(null);
  const [IsCreatingAnswer, SetIsCreatingAnswer] = useState(false);
  const [IsChannelOpen, SetIsChannelOpen] = useState(false);
  const rtcHook = useRtcWS(Link, true);

  useEffect(() => {
    if (isOpen) {
      setLink("");
      setIsGettingData(false);
    }
  }, [isOpen]);

  const handleCreateAnswer = async (rtcObj) => {
    rtcHook.setSessionId(Link);
    rtcHook.SendOpenConnectionRequest();
    rtcObj?.setOnGetSendCallback((send) => {
      createSendForReceiver(send);
    });
    rtcHook.getOffer(async (offerSdp) => {
      console.log("we get the offer");
      SetIsCreatingAnswer(true);
      try {
        const offer = {
          sdp: offerSdp,
          type: "offer",
        };
        rtcObj?.CreateAnswer(Direction, offer, async (answer) => {
          SetAnswer(answer);
          SetIsCreatingAnswer(false);
          rtcHook.sendAnswer(answer);
          rtcHook.disconnect();
          console.log(
            "receiver connection status = ",
            rtcObj?.GetChannelState()
          );
        });
      } catch (error) {
        console.error("Error creating answer:", error);
        SetIsCreatingAnswer(false);
      }
    });
  };

  const handleReceive = async () => {
    if (!Link) {
      alert("Please enter a valid link.");
      return;
    }
    console.log("Receiving with link:", Link);
    setIsGettingData(true);
    const rtcObj = new WebRTC(Direction);
    await handleCreateAnswer(rtcObj);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h5 className="text-xl font-bold m-0">Receive</h5>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="mb-4">
              <label
                htmlFor="Link"
                className="block mb-2 font-semibold text-sm"
              >
                Link
              </label>
              <input
                id="Link"
                type="text"
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter Link here"
                className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={IsGettingData}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReceive}
              disabled={IsGettingData}
              className="px-6 py-2.5 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {IsGettingData ? "Receiving..." : "Receive"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default SendReceiver;
