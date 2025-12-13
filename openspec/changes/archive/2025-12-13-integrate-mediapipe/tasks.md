## 1. Implementation
- [x] 1.1 Install MediaPipe dependency (`npm install @mediapipe/tasks-vision`) - *Switched to @mediapipe/hands CDN due to build issues*.
- [x] 1.2 Download the MediaPipe Hands task model file (or configure CDN loading).
- [x] 1.3 Implement `src/gesture/hand-tracking.js` to initialize `Hands`.
- [x] 1.4 Add a video element (hidden) and a canvas element (for debug drawing) to `index.html`.
- [x] 1.5 Implement camera feed setup in `src/gesture/hand-tracking.js` (`getUserMedia`).
- [x] 1.6 Implement the detection loop (`detectForVideo`) and basic drawing on the debug canvas.
- [x] 1.7 Integrate `setupHandTracking` into `src/main.js`.
- [x] 1.8 Verify hand tracking works by seeing landmarks drawn on the screen.