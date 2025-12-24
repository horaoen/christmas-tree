// Using MediaPipe Hands (Legacy API)

let hands = undefined;
let video = undefined;
let canvasCtx = undefined;
let externalCallback = null;

export async function createHandLandmarker(videoElement, canvasElement, onResultsCallback) {
    console.log("Initializing MediaPipe Hands...");
    video = videoElement;
    canvasCtx = canvasElement.getContext('2d');
    externalCallback = onResultsCallback;

    hands = new window.Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
    }});

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    console.log("MediaPipe Hands initialized.");
}

export async function setupCamera() {
    // Legacy CameraUtils can handle camera setup automatically, but we keep our manual setup
    // to match the existing flow in main.js
    console.log("Requesting camera access...");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Webcam not available.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        
        // Return a promise that resolves when video metadata is loaded
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
}

let isProcessing = false;

export async function detectHands() {
    if (isProcessing) return;
    if (hands && video && video.readyState >= 2) {
        isProcessing = true;
        try {
            await hands.send({image: video});
        } catch (e) {
            console.error("Detection error details:", e.message, e.stack);
            // Don't stop forever on glitch, but log it.
        } finally {
            isProcessing = false;
        }
    }
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, video.videoWidth, video.videoHeight);
    
    // Default colors
    let connectorColor = '#00FF00';
    let landmarkColor = '#FF0000';

    // Check for custom colors passed via results object (attached by controller)
    if (results.drawOptions) {
        if (results.drawOptions.connectorColor) connectorColor = results.drawOptions.connectorColor;
        if (results.drawOptions.landmarkColor) landmarkColor = results.drawOptions.landmarkColor;
    }

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS,
                           {color: connectorColor, lineWidth: 5});
            window.drawLandmarks(canvasCtx, landmarks,
                          {color: landmarkColor, lineWidth: 2});
        }
    }
    canvasCtx.restore();

    if (externalCallback) {
        externalCallback(results);
    }
}