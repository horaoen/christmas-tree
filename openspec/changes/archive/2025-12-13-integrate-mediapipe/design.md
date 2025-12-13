# Design: MediaPipe Integration

## Context
MediaPipe Hands 提供了轻量级、高性能的手部追踪。我们需要将其集成到现有的 Three.js 循环中，或者并行运行。

## Decisions
- **Decision**: 使用 `@mediapipe/tasks-vision` 的 `HandLandmarker` API。
- **Rationale**: 这是 MediaPipe 的最新官方 API，提供了更好的性能和易用性。
- **Flow**:
  1. `main.js` 初始化 `HandLandmarker`。
  2. 开启摄像头流。
  3. 在 `requestAnimationFrame` 中，每一帧将 video 元素传递给 `landmarker.detectForVideo()`。
  4. 结果（landmarks）暂时用于绘制调试图形，后续将广播给场景控制器。

## Open Questions
- 性能影响：同时运行 WebGL 渲染和 AI 推理可能会导致帧率下降。如果需要，可以考虑降低手势识别的频率（例如每秒 10-15 次，而不是 60 次）。目前先按每帧运行尝试。
