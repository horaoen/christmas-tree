# 🎄 3D 圣诞树互动应用

一个基于 Three.js 和 MediaPipe Hands 的 3D 交互式圣诞树。支持手势控制、动态特效与多主题切换。

## ✨ 核心特性

*   **手势交互**：支持旋转、缩放、主题切换（握拳）及雪景开关（耶）。
*   **粒子系统**：基于着色器（GLSL）实现的程序化树体、装饰与五角星。
*   **实时追踪**：通过网络摄像头实现毫秒级手势识别。
*   **动态雪景**：可随时开启的粒子落雪效果。

## 🛠 技术栈

*   **引擎**: Three.js (WebGL)
*   **手势**: MediaPipe Hands
*   **构建**: Vite
*   **逻辑**: 原生 JavaScript (ES Modules)

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```
