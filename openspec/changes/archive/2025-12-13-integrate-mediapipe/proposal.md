# Change: Integrate MediaPipe

## Why
为了实现手势控制圣诞树，我们需要首先集成 MediaPipe Hands 库，能够从摄像头获取实时的手部骨骼数据。

## What Changes
- 安装 `@mediapipe/tasks-vision` 依赖。
- 创建 `src/gesture/hand-tracking.js` 模块，封装 MediaPipe 逻辑。
- 实现摄像头视频流的获取与处理。
- 在页面上添加一个调试用的 Canvas，用于绘制识别到的手部骨骼。
- 将手势识别逻辑集成到主应用循环中。

## Impact
- **New Capability**: `gesture-recognition`
- **Affected Code**: `package.json`, `src/gesture/hand-tracking.js`, `src/main.js`, `index.html`
