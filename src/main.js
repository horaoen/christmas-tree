import './style.css';
import { setupScene } from './webgl/scene.js';
import { createHandLandmarker, setupCamera, detectHands } from './gesture/hand-tracking.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <h1>3D 粒子圣诞树</h1>
`;
const threeCanvas = document.createElement('canvas');
threeCanvas.id = 'three-canvas';
app.appendChild(threeCanvas);

const { scene, camera, renderer, christmasTree } = setupScene(threeCanvas);

const videoElement = document.getElementById('webcam');
const landmarksCanvas = document.getElementById('landmarks-canvas');
const landmarksCtx = landmarksCanvas.getContext('2d');

let lastVideoTime = -1;

async function initHandTracking() {
    await createHandLandmarker(videoElement, landmarksCanvas);
    await setupCamera();
    videoElement.play();

    // Set canvas dimensions immediately after camera setup (which waits for metadata)
    landmarksCanvas.width = videoElement.videoWidth;
    landmarksCanvas.height = videoElement.videoHeight;

    detectHandsContinuously();
}

async function detectHandsContinuously() {
    if (videoElement.currentTime !== lastVideoTime) {
        await detectHands();
        lastVideoTime = videoElement.currentTime;
    }
    requestAnimationFrame(detectHandsContinuously);
}

initHandTracking();

window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.zIndex = '1000';
    errorDiv.innerText = `Error: ${message} at ${source}:${lineno}:${colno}`;
    document.body.appendChild(errorDiv);
};
