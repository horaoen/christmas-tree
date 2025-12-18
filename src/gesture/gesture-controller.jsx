export class GestureController {
    constructor() {
        this.targetRotationY = 0;
        this.targetScale = 1;
        this.lastHandX = null;
        this.pinchReferenceDistance = null;
        this.smoothedPinchDistance = null;

        this.gestureCooldown = 500; // milliseconds
        this.lastGestureTime = {
            fist: 0,
            victory: 0
        };
        this.listeners = {};
    }

    addEventListener(type, callback) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
    }

    removeEventListener(type, callback) {
        if (!this.listeners[type]) return;
        this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }

    dispatchEvent(event) {
        if (!this.listeners[event.type]) return;
        this.listeners[event.type].forEach(callback => callback(event));
    }

    process(results) {
        if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.lastHandX = null;
            this.pinchReferenceDistance = null;
            // Optionally reset gesture times or indicate no hands
            return { rotation: 0, scale: null };
        }

        const landmarks = results.multiHandLandmarks;
        let rotationDelta = 0;
        let scaleFactor = null;
        let activePose = null;

        const now = performance.now(); // Get current time for debouncing

        for (const handLandmarks of landmarks) {
            // Detect pose for each hand
            const detectedPose = this.detectPose(handLandmarks);

            if (detectedPose) {
                activePose = detectedPose;
                if (now - (this.lastGestureTime[detectedPose] || 0) > this.gestureCooldown) {
                    this.dispatchEvent(new CustomEvent('gesture', { detail: { pose: detectedPose } }));
                    this.lastGestureTime[detectedPose] = now;
                }
            }
        }

        // 1. Rotation Logic (using the first hand found or average of all)
        // Calculate average X of all hands
        let totalX = 0;
        for (const hand of landmarks) {
            // Landmark 9 is the middle finger knuckle, a stable central point
            totalX += hand[9].x;
        }
        const avgX = totalX / landmarks.length;

        if (this.lastHandX !== null) {
            const deltaX = avgX - this.lastHandX;
            // Sensitivity factor: how much hand movement translates to rotation
            rotationDelta = deltaX * 5;
        }
        this.lastHandX = avgX;

        // 2. Scale Logic (Absolute Normalized Pinch)
        // Only active if NO specific pose is detected to avoid conflicts
        if (landmarks.length > 0 && !activePose) {
            const hand = landmarks[0];
            const wrist = hand[0];
            const middleMcp = hand[9];
            const thumbTip = hand[4];
            const indexTip = hand[8];

            // 1. Calculate Hand Scale (Reference size independent of Z-distance)
            const handSize = Math.sqrt(
                Math.pow(middleMcp.x - wrist.x, 2) +
                Math.pow(middleMcp.y - wrist.y, 2)
            );

            // 2. Calculate "Openness" (Distance from Wrist to Index Tip)
            // This is robust for "Fist" (curled) vs "Open Hand" (extended)
            const openness = Math.sqrt(
                Math.pow(indexTip.x - wrist.x, 2) +
                Math.pow(indexTip.y - wrist.y, 2)
            );

            // 3. Normalize Openness
            // Fist: Ratio is roughly 0.5 - 0.7
            // Open: Ratio is roughly 1.5 - 1.9
            // We shift it so 0.6 becomes 0.0 (Closed) for easier mapping later
            const rawNormalizedPinch = (openness / Math.max(handSize, 0.001)) - 0.6;

            // 4. Smooth it (EMA)
            if (this.smoothedPinchDistance === null) {
                this.smoothedPinchDistance = rawNormalizedPinch;
            } else {
                // Lower alpha = more smoothing (0.2 is very silky, 0.5 is responsive)
                this.smoothedPinchDistance = this.smoothedPinchDistance * 0.8 + rawNormalizedPinch * 0.2;
            }

            scaleFactor = this.smoothedPinchDistance;
        } else {
            // When pose is active or hand lost, hold the last value or reset?
            // Resetting to null allows the tree code to decide (or hold).
            // But for absolute mapping, we just stop sending updates.
            scaleFactor = null;
            // We don't need to reset smoothedPinchDistance explicitly unless we want to restart smoothing on re-entry
            // keeping it creates a smoother re-entry if hand comes back quickly
        }

        return { rotation: rotationDelta, scale: scaleFactor };
    }

    // Helper to determine if a finger is curled
    _isFingerCurled(landmarks, tipIdx, pipIdx, mcpIdx) {
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx];
        const mcp = landmarks[mcpIdx];

        const curlThreshold = 0.03;
        return (tip.y > pip.y + curlThreshold) && (pip.y > mcp.y + curlThreshold);
    }

    // Detects specific poses like "one_finger" or "two_fingers"
    detectPose(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;

        // Check finger states
        const indexCurled = this._isFingerCurled(landmarks, 8, 7, 6);
        const middleCurled = this._isFingerCurled(landmarks, 12, 11, 10);
        const ringCurled = this._isFingerCurled(landmarks, 16, 15, 14);
        const pinkyCurled = this._isFingerCurled(landmarks, 20, 19, 18);
        const thumbCurled = this._isFingerCurled(landmarks, 4, 3, 2); // Simple thumb check

        // Extended fingers
        const indexExtended = !indexCurled;
        const middleExtended = !middleCurled;
        const ringExtended = !ringCurled;
        const pinkyExtended = !pinkyCurled;

        // "One Finger" (Index only) -> Switch to PinkWhite
        // Strict check: Index UP, Middle/Ring/Pinky DOWN
        if (indexExtended && middleCurled && ringCurled && pinkyCurled) {
            return "one_finger";
        }

        // "Two Fingers" (Victory/Peace) -> Switch to Classic
        // Strict check: Index & Middle UP, Ring/Pinky DOWN
        if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
            return "two_fingers";
        }

        return null;
    }
}