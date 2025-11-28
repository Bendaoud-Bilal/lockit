class WebRTC {
    
    constructor(type)
    {
        this._RtcType = type;
        // Add STUN server configuration for connections between different instances
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        this._LocalConnection = new RTCPeerConnection(configuration);
        this._SendChannel = null;
        this._SDP = "";
        this._Offer = null;
        this._OnChannelOpen = null;
        this._OnGetSend = null;
        this.IsSendingData = false;
        this.IsDataBeenSent = false;
        this.IsChannelOpened = false;
        
        // Event callbacks for UI updates
        this._OnOpeningConnection = null;
        this._OnSendingData = null;
        this._OnDataReceived = null;
    }

    handleOnGetMessage = (data) => {
        
        const Data = JSON.parse(data); 
        console.log("we received a data = " , data);

        if(Data.method==="sendData" && this._OnGetSend)
        {
            console.log("we get a send = " , data);
            this._OnGetSend(Data);
            this.IsDataBeenSent = true;
            
            // Trigger data received callback
            if (this._OnDataReceived) {
                this._OnDataReceived();
            }
            
            this.sendSend({method: "SendDataReceived"});
        }

        else if(Data.method==="SendingData" )
        {
            this.IsSendingData = true;
            
            // Trigger sending data callback
            if (this._OnSendingData) {
                this._OnSendingData();
            }
        }

        else if(Data.method==="SendDataReceived")
        {
            this.IsDataBeenSent = true;
            
            // Trigger data received callback for sender
            if (this._OnDataReceived) {
                this._OnDataReceived();
            }
        }

        else{
            console.log("we received a message : " , data);
            
        }

    }

    StartForSender = () => {
        // Create the data channel for sender
        this._SendChannel = this._LocalConnection.createDataChannel("sendChannel");
        
        // DEBUG: Log channel state after creation
        console.log("🔍 Data channel created, readyState:", this._SendChannel.readyState);
        
        //offer:string|null
        //getting icecandidate (sdp) info
        this._LocalConnection.onicecandidate = () =>  {
        console.log(" NEW ice candidate!! on this._LocalConnection reprinting SDP " )
        this._SDP += (JSON.stringify(this._LocalConnection.localDescription))
        }
        
      
        //handling channel events
        this._SendChannel.onmessage =e =>  {
            this.handleOnGetMessage(e.data);
        }
        
        this._SendChannel.onopen = () => {
            this.IsChannelOpened = true;
            console.log("✅ Sender channel open!!!!");
            
            // Trigger sending data callback when channel opens
            if (this._OnSendingData) {
                this._OnSendingData();
            }
            
            // Send notification to receiver that we're sending data
            this.sendSend({method: "SendingData"});
            
            if (this._OnChannelOpen) {
                this._OnChannelOpen();
            }
        };
        this._SendChannel.onclose = () => console.log("❌ Channel closed!!!!!!");
        this._SendChannel.onerror = (error) => console.log("❌ Channel error:", error);

    }


    StartForReceiver = async () => {
        //offer:string|null
        //need to set setRemoteDescription first
        

        //getting icecandidate (sdp) info
        this._LocalConnection.onicecandidate = () =>  {
        console.log(" NEW ice candidate!! on this._LocalConnection reprinting SDP " )
        this._SDP += (JSON.stringify(this._LocalConnection.localDescription))
        }
        
       
        this._LocalConnection.ondatachannel=(e)=>{
            this._SendChannel=e.channel;
            
            //handling channel events - MUST be set AFTER receiving the channel
            this._SendChannel.onmessage = (e) =>  {
                this.handleOnGetMessage(e.data);
            }
            this._SendChannel.onopen = () => {
                this.IsChannelOpened = true;
                console.log("Receiver channel open!!!!");
               
            };
            this._SendChannel.onclose = () => console.log("closed!!!!!!");
        }

    }


    GetSDP = () => {
        return this._SDP;
    }
    

    CreateOffer = async (type, onSdpComplete) =>
    {
        if(type==="receiver")
        {
            return null;
        }
        
        // DEBUG: Check connection state before creating offer
        console.log("🔍 CreateOffer called - Connection state:", this._LocalConnection.connectionState);
        console.log("🔍 Connection signaling state:", this._LocalConnection.signalingState);
        
        this._RtcType = type;
        
        this.StartForSender();
        
        
        const offer = await this._LocalConnection.createOffer();
                    
        // Set local description (this starts ICE gathering)
        await this._LocalConnection.setLocalDescription(offer);
        
        // Set up 5-minute timeout (300,000 ms)
        const timeoutId = setTimeout(() => {
            console.warn("⚠️ ICE gathering timeout - 5 minutes elapsed");
            console.log("Final iceGatheringState =", this._LocalConnection.iceGatheringState);
            // Unsubscribe from event
            this._LocalConnection.onicegatheringstatechange = null;
        }, 300000);
        
        // Wait for ICE gathering to complete
        this._LocalConnection.onicegatheringstatechange = async() => {
            if (this._LocalConnection.iceGatheringState === "complete" ) {
                // Clear the timeout
                clearTimeout(timeoutId);
                
                // Get the final SDP with all ICE candidates
                this._Offer = this._LocalConnection.localDescription;
                
                console.log("✅ Offer created with all ICE candidates");
                console.log("iceGatheringState = ", this._LocalConnection.iceGatheringState);
                
                // Call callback with complete SDP
                this._LocalConnection.localDescription && onSdpComplete(this._LocalConnection.localDescription);
                
                // Unsubscribe from event
                this._LocalConnection.onicegatheringstatechange = null;
            }
        };
    }


    CreateAnswer = async (type, offer, onSdpComplete) =>
    {   
       
        if(type==="sender")
        {
            return null;
        }

       // console.log("inside create answer");
        

        this._RtcType = type;
        await this._LocalConnection.setRemoteDescription(offer);
        
        this.StartForReceiver();
        
        // Create the answer
        const answer = await this._LocalConnection.createAnswer();
        
        // Set local description (this starts ICE gathering)
        await this._LocalConnection.setLocalDescription(answer);
        
        // Set up 5-minute timeout (300,000 ms)
        const timeoutId = setTimeout(() => {
            console.warn("⚠️ ICE gathering timeout - 5 minutes elapsed");
            console.log("Final iceGatheringState =", this._LocalConnection.iceGatheringState);
            // Unsubscribe from event
            this._LocalConnection.onicegatheringstatechange = null;
        }, 300000);
        
        // Wait for ICE gathering to complete
        this._LocalConnection.onicegatheringstatechange = async() => {
            if (this._LocalConnection.iceGatheringState === "complete" ) {
                // Clear the timeout
                clearTimeout(timeoutId);
                
                // Get the final SDP with all ICE candidates
                this._Offer = this._LocalConnection.localDescription;
                
                console.log("✅ Answer created with all ICE candidates");
                console.log("iceGatheringState = ", this._LocalConnection.iceGatheringState);
                
                // Call callback with complete SDP
                this._LocalConnection.localDescription && onSdpComplete(this._LocalConnection.localDescription);
                
                // Unsubscribe from event
                this._LocalConnection.onicegatheringstatechange = null;
            }
        };
    }

    OpenConnection = async (answer) => {


        console.log("answer = ",answer);
        console.log("this._RtcType = " , this._RtcType);
        
        // Trigger opening connection callback
        if (this._OnOpeningConnection) {
            this._OnOpeningConnection();
        }

        if(this._RtcType==="sender")
        {
            await this._LocalConnection.setRemoteDescription(answer);
            console.log("done - remote description set");
            console.log("connection state = " , this._LocalConnection.connectionState);
            console.log("channel state = " , this._SendChannel.readyState);
            
        }
        else
        {
            return;
        }
        
    }
    
    GetOffer = () => {
        return this._Offer;
    }

    IsChannelOpen = () => {
        if (!this._SendChannel) {
            console.warn("Channel not initialized yet");
            return false;
        }
        return this._SendChannel.readyState === "open";
    }

    IsSenderChannelOpen = () => {
        if (this._RtcType !== "sender") {
            console.warn("IsSenderChannelOpen called but this is not a sender");
            return false;
        }
        if (!this._SendChannel) {
            console.warn("Sender channel not initialized yet");
            return false;
        }
        const isOpen = this._SendChannel.readyState === "open";
        console.log("Sender channel state:", this._SendChannel.readyState, "| Is open:", isOpen);
        return isOpen;
    }

    IsReceiverChannelOpen = () => {
        if (this._RtcType !== "receiver") {
            console.warn("IsReceiverChannelOpen called but this is not a receiver");
            return false;
        }
        if (!this._SendChannel) {
            console.warn("Receiver channel not initialized yet (waiting for ondatachannel)");
            return false;
        }
        const isOpen = this._SendChannel.readyState === "open";
        console.log("Receiver channel state:", this._SendChannel.readyState, "| Is open:", isOpen);
        return isOpen;
    }

    GetChannelState = () => {
        if (!this._SendChannel) {
            return `Type: ${this._RtcType}, Channel state: not initialized`;
        }
        return `Type: ${this._RtcType}, Channel state: ${this._SendChannel.readyState}`;
    }

    OnChannelOpen = (callback) => {
        this._OnChannelOpen = callback;
    }

    SendMessage = (msg) =>
    {
        if (!this._SendChannel) {
            console.error("Cannot send message: Channel not initialized");
            return;
        }
        if (this._SendChannel.readyState !== "open") {
            console.error("Cannot send message: Data channel is not open. Current state:", this._SendChannel.readyState);
            return;
        }
        this._SendChannel.send(msg);
        console.log("Message sent:", msg);
    }

    sendSend(msg)
    {
        if (!this._SendChannel) {
            console.error("Cannot send message: Channel not initialized");
            return;
        }
        if (this._SendChannel.readyState !== "open") {
            console.error("Cannot send message: Data channel is not open. Current state:", this._SendChannel.readyState);
            return;
        }
        console.log("in rtc ibj Message sent:", msg);
        this.IsSendingData = true;
        this._SendChannel.send(
            JSON.stringify(msg)
        );
    }

    setOnGetSendCallback(callback)
    {
       // console.log("we get a send  = " , data);
        
        this._OnGetSend = callback;
    }


    CloseConnection = () =>
    {
        if (this._SendChannel) {
            this._SendChannel.close();
            console.log("Data channel closed");
        }
        this._LocalConnection.close();
        console.log("Peer connection closed");
    }

    SetIsSendingData = (r)=>
    {
        this.IsSendingData = r;
    }

    SetIsDataBeenSent = (r)=>
    {
        this.IsDataBeenSent = r;
    }


    GetIsSendingData = ()=>
    {
        return this.IsSendingData;
    }

    GetIsChannelOpened = ()=>
    {
        return this.IsChannelOpened;
    }

    GetIsDataBeenSent = ()=>
    {
        return this.IsDataBeenSent;
    }

    // Event callback setters
    SetOnOpeningConnection = (callback) => {
        this._OnOpeningConnection = callback;
    }

    SetOnSendingData = (callback) => {
        this._OnSendingData = callback;
    }

    SetOnDataReceived = (callback) => {
        this._OnDataReceived = callback;
    }

}
    

export default WebRTC