import { useEffect } from "react"


export const Receiver = () => {
    
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        }
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        // Create elements for camera and screen sharing streams
        const cameraVideo = document.createElement('video');
        const screenVideo = document.createElement('video');
        cameraVideo.autoplay = true;
        screenVideo.autoplay = true;
        cameraVideo.controls = true;
        screenVideo.controls = true;

        // Append both video elements to the body (or a specific container)
        document.body.appendChild(cameraVideo);
        document.body.appendChild(screenVideo);

        // Create a PeerConnection
        const pc = new RTCPeerConnection();

        // Handle incoming media tracks
        pc.ontrack = (event) => {
            console.log('Received track:', event);
            const track = event.track;

            // Differentiating between the camera and screen sharing track
            if (track.kind === 'video') {
                // If no camera stream has been set, assign this as the camera
                if (!cameraVideo.srcObject) {
                    cameraVideo.srcObject = new MediaStream([track]);
                    console.log("Camera stream received.");
                } 
                // If camera is set, assume the next stream is screen sharing
                else if (!screenVideo.srcObject) {
                    screenVideo.srcObject = new MediaStream([track]);
                    console.log("Screen share stream received.");
                }
            }
        };


        // Handle incoming WebSocket messages (SDP and ICE candidates)
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                // Set remote description (from offer)
                pc.setRemoteDescription(message.sdp).then(() => {
                    // Create and send an answer
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                // Add ICE candidate
                pc.addIceCandidate(message.candidate);
            }
        };
    }


    return <div>
        
    </div>
}