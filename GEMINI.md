# Christmas Tree 3D Interaction Project

## Project Overview

This project is a web-based 3D visualization of a Christmas tree constructed from a particle system. It features interactive controls using real-time hand gesture recognition via the webcam. The goal is to create a visually engaging, festive experience where users can manipulate the tree (rotate, scale) using natural hand movements.

## Technology Stack

*   **Frontend Framework:** Vanilla JavaScript (ES6+) with Vite as the build tool.
*   **3D Rendering:** [Three.js](https://threejs.org/) (managed via npm).
*   **Computer Vision:** [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) (loaded via CDN).
*   **Styling:** CSS3.

## Architecture & Directory Structure

The source code is organized into distinct modules by responsibility:

*   **`src/main.js`**: Application entry point. Initializes the DOM, Scene, and Hand Tracking, and runs the main interaction loop.
*   **`src/webgl/`**: Contains all 3D rendering logic.
    *   `scene.js`: Sets up the Three.js scene, camera, renderer, and lighting.
    *   `tree.js`: Defines the `ChristmasTree` class, managing the particle system generation and animation state.
*   **`src/gesture/`**: Handles computer vision and input processing.
    *   `hand-tracking.js`: Wraps the MediaPipe Hands API. It handles camera access and emits raw landmark data.
    *   `gesture-controller.js`: Interprets raw landmarks into semantic commands (e.g., "rotate left", "scale up").
*   **`openspec/`**: Contains project specifications and design documents.

## Building and Running

### Prerequisites
*   Node.js (v16+ recommended)
*   npm

### Setup
1.  Install dependencies:
    ```bash
    npm install
    ```

### Development Server
Start the local development server with hot-reloading:
```bash
npm run dev
```
Open the URL provided by Vite (usually `http://localhost:5173`) in a browser. **Note:** You must allow camera access for the interaction to work.

## Development Conventions

### Coding Style
*   **Modules:** Use ES Modules (`import`/`export`) for all local project files.
*   **Globals:** MediaPipe libraries are loaded via CDN in `index.html` and accessed via `window` (e.g., `window.Hands`, `window.drawConnectors`).
*   **Async/Await:** Use `async/await` for asynchronous initialization (camera setup, model loading).

### Key Constraints
*   **Performance:** The particle system can be heavy. Ensure optimization (e.g., using `BufferGeometry`) to maintain high FPS.
*   **Camera Access:** The application requires a webcam. Error handling for denied permissions is implemented in `main.js`.
*   **Environment:** The app is designed to run in a browser environment supporting WebGL and `getUserMedia`.

### Git Workflow
*   Main branch tracks the stable version.
*   Feature branches are used for specific tasks (e.g., `feature/particle-effects`, `feature/gesture-refinement`).

## Agent Workflow (OpenSpec)

**CRITICAL:** This project uses the `openspec` workflow for all significant changes.

*   **Instruction File:** Agents MUST read and follow **`openspec/AGENTS.md`** before planning or proposing any changes.
*   **Specs vs Changes:** The current state of the system is documented in `openspec/specs/`. Proposed changes live in `openspec/changes/`.
*   **Protocol:** Do not start implementation without creating a proposal and task list as defined in the OpenSpec instructions.

## Current Implementation Status
*   **Visuals:** Basic spiral particle tree implemented.
*   **Input:** Hand tracking active using MediaPipe (Legacy `Hands` solution).
*   **Interaction:** Basic rotation and scaling mapped to gestures.