import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';


class RtcWSConnection {

    constructor(SessionId, Suffix) { 
        this.ws = null;
        this.isConnected = false;
        this.sessionId = null;
        this.suffix = "offer";
        this.offerCallback = null;
        this.answerCallback = null;
        // Single callback - replaced each time for new receiver/offer
        this.openConnectionCallback = null;

        this.sessionId = SessionId;
        if(Suffix) {
            this.suffix = Suffix;
        }
        this.connect();
    }


    connect = () => {
    // Check if WebSocket is available
    if (typeof WebSocket === 'undefined') {
        console.log('❌ WebSocket is not supported in this environment', 'error');
        console.error('WebSocket is not available');
        return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('Already connected!', 'warning');
        return;
    }

    try {
        this.ws = new WebSocket('ws://localhost:3030');

        this.ws.onopen = () => {
            this.isConnected = true;
            console.log('WebSocket connected');
        };

        // Single message handler for all incoming messages
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Received message:', data);
                
                // Handle offer response
                if (data.method === 'offerResponse' && this.offerCallback) {
                    const offerData = data.Data;
                    const expectedUser = `${this.sessionId}:offer`;
                    if (data.UserName === expectedUser && offerData.sdp) {
                        this.offerCallback(offerData.sdp);
                        this.offerCallback = null; // Clear callback after use
                    }
                }
                
                // Handle answer response
                if (data.method === 'answerResponse' && this.answerCallback ) {
                    const answerData = data.Data;
                    console.log("we get answer with sdp = "+answerData.sdp);
                    
                    if (answerData.sdp) {
                        this.answerCallback(answerData.sdp);
                        this.answerCallback = null; // Clear callback after use
                    }
                }


                if (data.method === 'openRtcConnectionRequest') {
                    console.log("🔔 Received openRtcConnectionRequest from:", data.UserName);
                    
                    if (data.UserName && this.openConnectionCallback) {
                        console.log("✅ Calling connection callback");
                        this.openConnectionCallback(data.UserName);
                        // Clear after use - next Copy Link will set new callback
                        this.openConnectionCallback = null;
                    } 
                    else if (!this.openConnectionCallback) {
                        console.warn("⚠️ No callback registered for connection request");
                    }
                }




            } catch (e) {
                console.error("Error parsing message:", e);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            console.log('WebSocket closed');
        };
    } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`, 'error');
    }
}


getOffer = (onGetOffer) => {

    
    if (!this.checkConnection()) return;

   

    if ( !this.sessionId) {
        return;
    }
    
    // Store the callback to be called when response arrives
    this.offerCallback = onGetOffer || null;
    
    const user = `${this.sessionId}:offer`;

    const message = {
        method: 'getOffer',
        UserName: user
    };

    this.ws?.send(JSON.stringify(message));
    console.log('Requesting offer:', message);
}



deleteOffer = () => {

    
    
    
    const user = `${this.sessionId}:offer`;

    const message = {
        method: 'deleteOffer',
        UserName: user
    };

    this.ws?.send(JSON.stringify(message));
    console.log('deleting offer...');
}

getAnswer = (user, onGetAnswer) =>{
    if (!this.checkConnection()) return;


    if ( !this.sessionId) {
        return;
    }
    
    // Store the callback to be called when response arrives
    this.answerCallback = onGetAnswer || null;
    

    const message = {
        method: 'getAnswer',
        UserName: user
    };

    this.ws?.send(JSON.stringify(message));
    console.log('Requesting Answer:', message);
}


sendOffer = (Offer) =>{
    if (!this.checkConnection()) return;

    const user = `${this.sessionId}:offer`;
    if (!user) {
        console.log('❌ Please enter your username', 'error');
        return;
    }

    try {
        
        const message = {
            method: 'sendOffer',
            UserName: user,
            Data: Offer
        };

        this.ws?.send(JSON.stringify(message));
        
        console.log('Sent Offer:', message);
    } catch (error) {
       console.log(`❌ Invalid SDP JSON: ${error || ""}`, 'error');
    }
}

sendAnswer = (answer)=> {
    if (!this.checkConnection()) return;

    const user = `${this.sessionId}:${this.suffix}`;
    if (!user) {
        console.log('❌ Please enter your username', 'error');
        return;
    }

    try {
        const message = {
            method: 'sendAnswer',
            UserName: user,
            Data: answer
        };

        this.ws?.send(JSON.stringify(message));
        
        console.log('Sent answer:', message);
    } catch (error) {
       console.log(`❌ Invalid SDP JSON: ${error || ""}`, 'error');
    }
}


checkConnection = () =>{
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.log('❌ Not connected! Please connect first.', 'error');
        return false;
    }
    return true;
}


disconnect = () => {
    if (this.ws) {
        // Clean up all event handlers before closing
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        
        // Clean up callbacks
        this.offerCallback = null;
        this.answerCallback = null;
        this.openConnectionCallback = null;
        
        this.ws.close();
        this.ws = null;
        this.isConnected = false;
        console.log('✅ WebSocket disconnected and cleaned up');
    }
}


deleteAnswer=() =>{
    if (!this.checkConnection()) return;

    const user = `${this.sessionId}:answer`;
    if (!user) {
        console.log('❌ Please enter your username', 'error');
        return;
    }

    try {
        const message = {
            method: 'deleteAnswer',
            UserName: user,
        };

        this.ws?.send(JSON.stringify(message));
        
    } catch (error) {
       console.log(`❌ failed to delete the answer: ${error || ""}`, 'error');
    }
}


SendOpenConnectionRequest=() =>{
    if (!this.checkConnection()) return;

    const user = `${this.sessionId}:${this.suffix}`;
    if (!user) {
        console.log('❌ Please enter your username', 'error');
        return;
    }

    console.log("we are sending a SendOpenConnectionRequest");
    

    try {
        const message = {
            method: 'openRtcConnectionRequest',
            UserName: user,
        };

        this.ws?.send(JSON.stringify(message));
        
    } catch (error) {
       console.log(`❌ failed to delete the answer: ${error || ""}`, 'error');
    }
}


SetOnOpenConnectionRequest=(OnopenConnectionReq = null)=>{
    if (!this.checkConnection()) return;

    try {
        // Replace the callback - each Copy Link creates new offer for new receiver
        this.openConnectionCallback = OnopenConnectionReq;
        console.log(`✅ Set connection callback (replaced previous if any)`);
    } catch (error) {
       console.log(`❌ failed to set openConnectionRequest callback: ${error || ""}`, 'error');
    }
}

setSessionId=(sessionId)=>{
    this.sessionId = sessionId;
}

}

// React Hook to use the WebSocket connection
const useRtcWS = (sessionId, suffix) => {
    const connectionRef = useRef(null);

    const id =uuidv4();

    // Initialize connection only once
    if (!connectionRef.current) {

        if(suffix){
                connectionRef.current = new RtcWSConnection(sessionId , id);
        }
        else
        {
        connectionRef.current = new RtcWSConnection(sessionId);
        }
    }

   

    return connectionRef.current;
};

export default useRtcWS;