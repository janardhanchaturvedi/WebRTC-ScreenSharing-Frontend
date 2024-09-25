import { useEffect, useState } from "react"

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
    }, []);

    const initiateConn = async () => {

        if (!socket) {
            alert("Socket not found");
            return;
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }

        const pc = new RTCPeerConnection();
        setPC(pc);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        pc.onnegotiationneeded = async () => {
            console.error("onnegotiateion needed");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        }
            
        getCameraStreamAndSend(pc);
    }

    const getCameraStreamAndSend = async (pc: RTCPeerConnection) => {
        // Get the camera stream
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Create video element for the camera stream preview
        const cameraVideo = document.createElement('video');
        cameraVideo.srcObject = cameraStream;
        cameraVideo.autoplay = true;  // Automatically play the video
        cameraVideo.controls = true;  // Allow controls (optional)
        cameraVideo.style.width = "300px"; // Set video size
        document.body.appendChild(cameraVideo); // Append camera preview to body
    
        // Add camera stream tracks to the peer connection
        cameraStream.getTracks().forEach((track) => {
            console.log("Camera track added:", track);
            pc?.addTrack(track, cameraStream);
        });
    
        // Get screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    
        // Create video element for the screen share preview
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideo.autoplay = true;  // Automatically play the video
        screenVideo.controls = true;  // Allow controls (optional)
        screenVideo.style.width = "300px"; // Set video size
        document.body.appendChild(screenVideo); // Append screen share preview to body
    
        // Add screen share stream tracks to the peer connection
        screenStream.getTracks().forEach((track) => {
            console.log("Screen share track added:", track);
            pc?.addTrack(track, screenStream);
        });
    };

    return <div>
        Sender
        <button onClick={initiateConn}> Send data </button>
    </div>
}