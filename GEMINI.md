# Project: Christmas Tree Web Application

## Overview
This is a web-based interactive 3D Christmas Tree application. It uses **Three.js** for rendering and **MediaPipe Hands** for webcam-based hand tracking and gesture control. Users can interact with the tree (rotate, zoom/scatter) and trigger effects using specific hand poses.

## Tech Stack
*   **Frontend Framework:** Vanilla JavaScript (ES Modules).
*   **Build Tool:** Vite.
*   **3D Engine:** Three.js (with custom GLSL shaders).
*   **Computer Vision:** MediaPipe Hands (via CDN).
*   **Styling:** CSS (`style.css`).

## Key Features
*   **Procedural Tree:** Generated using particle systems for foliage, ornaments, and a star.
*   **Custom Shaders:**
    *   **Foliage/Ornaments:** Twinkling effects and a "Scatter" effect that disperses particles when the tree is zoomed in.
    *   **Star:** Procedural signed-distance field (SDF) shader for a glassy 5-pointed star.
*   **Gesture Control:**
    *   **Navigation:** Hand movement rotates the tree; pinch/distance scales the tree.
    *   **"Fist" Pose:** Cycles through color themes (Colorful, Icy, Warm).
    *   **"Victory" (V-Sign) Pose:** Toggles the falling snow effect.
    *   **"Restore" Pose:** Resets the tree's rotation and scale.
*   **Snow System:** A particle-based snow effect that can be toggled.

## Architecture & Directory Structure
*   **`src/main.js`**: Application entry point. Sets up the DOM, Three.js scene, hand tracking loop, and event listeners.
*   **`src/webgl/`**: Contains 3D logic.
    *   `tree.js`: `ChristmasTree` class. Handles procedural generation, shader updates, and theme application.
    *   `scene.js`: Boilerplate Three.js setup (Scene, Camera, Renderer).
    *   `snow.js`: `SnowSystem` class.
*   **`src/gesture/`**: Contains interaction logic.
    *   `hand-tracking.js`: Wrapper for the MediaPipe Hands library. Handles camera setup and landmark detection.
    *   `gesture-controller.jsx`: Logic to interpret raw landmarks into abstract gestures and continuous values (rotation/scale).

## Development
*   **Install Dependencies:** `npm install`
*   **Run Development Server:** `npm run dev` (Starts Vite on default port, usually 5173).
*   **Build:** `npm run build` (Standard Vite build).

## Coding Conventions
*   **Modules:** Use standard ES6 `import`/`export`.
*   **Graphics:** Prefer `THREE.BufferGeometry` and `ShaderMaterial` for performance with high particle counts.
*   **Async/Await:** Used for camera and library initialization.

## Agent Instructions & User Preferences
*   **Language:** The user prefers to interact in **Chinese** (Simplified). All responses, explanations, and conversation from the agent must be in Chinese.
*   **Tone:** Professional, helpful, and concise.
