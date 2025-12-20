import './style.css';
import * as THREE from 'three';
import { setupScene } from './webgl/scene.js';
import { createHandLandmarker, setupCamera, detectHands } from './gesture/hand-tracking.js';
import { GestureController } from './gesture/gesture-controller.jsx';

// Setup DOM
const app = document.querySelector('#app');
const threeCanvas = document.createElement('canvas');
threeCanvas.id = 'three-canvas';
app.appendChild(threeCanvas);

// Setup Scene
const { scene, camera, renderer, christmasTree, snowSystem } = setupScene(threeCanvas);

// Raycaster for interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    const hitOrnament = christmasTree.ornamentManager.handlePick(intersects);
    
    // 如果点击的是当前已经选中的挂件，则取消选中（Toggle 行为）
    if (hitOrnament && christmasTree.ornamentManager.selectedOrnament === hitOrnament) {
        christmasTree.ornamentManager.select(null);
    } else {
        christmasTree.ornamentManager.select(hitOrnament);
    }
});

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    const hitOrnament = christmasTree.ornamentManager.handlePick(intersects);
    christmasTree.ornamentManager.highlight(hitOrnament);
    
    // 改变鼠标指针样式 (直接设置 body 以避免 canvas 层级遮挡)
    document.body.style.cursor = hitOrnament ? 'pointer' : 'default';
});

// Setup Gesture Controller
const gestureController = new GestureController();

gestureController.addEventListener('gesture', (event) => {
    if (event.detail.pose === 'one_finger') {
        christmasTree.setTheme('PinkWhite');
        christmasTree.reset();
    } else if (event.detail.pose === 'two_fingers') {
        christmasTree.setTheme('Classic');
        christmasTree.reset();
    }
});

// Keyboard Controls for Debugging/Ease of Use
window.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        christmasTree.setTheme('PinkWhite');
        christmasTree.reset();
    } else if (event.key === '2') {
        christmasTree.setTheme('Classic');
        christmasTree.reset();
    } else if (event.key === 'v') {
        snowSystem.toggle();
    } else if (event.key === 'r') {
        christmasTree.reset();
    }
});

// Setup Hand Tracking Elements
const videoElement = document.getElementById('webcam');
const landmarksCanvas = document.getElementById('landmarks-canvas');
const landmarksCtx = landmarksCanvas.getContext('2d');

let lastVideoTime = -1;

async function initHandTracking() {
    await createHandLandmarker(videoElement, landmarksCanvas, (results) => {
        const { rotation, scale } = gestureController.process(results);
        if (rotation !== 0) {
            christmasTree.updateTargetRotation(rotation);
        }
        if (scale !== null) {
            christmasTree.updateTargetScale(scale);
        }
    });

    await setupCamera();
    videoElement.play();

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

// Error Handling
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