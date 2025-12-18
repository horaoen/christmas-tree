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
        this.lastPoseTimestamp = 0; 
        
        // Stabilizer: Track how long a pose has been held
        this.poseHistory = { pose: null, startTime: 0 };
        
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

            // Stability Check (Debounce)
            // A pose must be held for 200ms to be valid. 
            // This prevents accidental triggers during hand transitions (e.g. opening hand).
            if (detectedPose) {
                if (this.poseHistory.pose === detectedPose) {
                    // It's the same pose as last frame
                    const duration = now - this.poseHistory.startTime;
                    if (duration > 200) { // Threshold: 200ms
                        // Valid Stable Pose
                        activePose = detectedPose;
                        
                        // Trigger Event (if cooldown allows)
                        if (now - (this.lastGestureTime[detectedPose] || 0) > this.gestureCooldown) {
                            this.dispatchEvent(new CustomEvent('gesture', { detail: { pose: detectedPose } }));
                            this.lastGestureTime[detectedPose] = now;
                            this.lastPoseTimestamp = now;
                        }
                    }
                } else {
                    // New/Different pose detected, start timer
                    this.poseHistory = { pose: detectedPose, startTime: now };
                }
            } else {
                // No pose detected
                if (this.poseHistory.pose !== null) {
                    this.poseHistory = { pose: null, startTime: 0 };
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

        // 2. Scale Logic: "Total Hand Openness" (5-Finger Sum)
        // Solves conflict: Poses "1" and "2" have low total openness -> Base Scale.
        // Only a fully Open Hand has high total openness -> Zoom.
        if (landmarks.length > 0) {
            const hand = landmarks[0];
            const wrist = hand[0];
            const middleMcp = hand[9];

            // 1. Hand Size Reference
            const handSize = Math.sqrt(
                Math.pow(middleMcp.x - wrist.x, 2) +
                Math.pow(middleMcp.y - wrist.y, 2)
            );
            const safeHandSize = Math.max(handSize, 0.001);

            // 2. Calculate Sum of Distances (Wrist to All 5 Tips)
            let totalDist = 0;
            const tipIndices = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
            for (const idx of tipIndices) {
                const tip = hand[idx];
                totalDist += Math.sqrt(
                    Math.pow(tip.x - wrist.x, 2) +
                    Math.pow(tip.y - wrist.y, 2)
                );
            }

            // 3. Normalize Ratio
            // Ranges (approx): Fist ~3.0, "1" ~4.2, "2" ~5.4, Open ~9.0
            const ratio = totalDist / safeHandSize;

            // 4. Mapping with Deadzone
            // We want "1" and "2" to NOT trigger zoom, so we set threshold above ~5.5
            // Threshold 5.8 ensures only 3+ fingers extended triggers zoom.
            const zoomThreshold = 5.8; 
            
            // Normalize inputs above threshold
            // Input 5.8 -> 0.0
            // Input 9.0 -> ~3.2
            const activeOpenness = Math.max(0, ratio - zoomThreshold);

            // 5. Smoothing (Simple EMA for balance)
            if (this.smoothedPinchDistance === null) {
                this.smoothedPinchDistance = activeOpenness;
            } else {
                // Alpha 0.3: Responsive but smooth
                this.smoothedPinchDistance = this.smoothedPinchDistance * 0.7 + activeOpenness * 0.3;
            }

            scaleFactor = this.smoothedPinchDistance;
        } else {
            this.smoothedPinchDistance = null;
            scaleFactor = null;
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