export class GestureController {
    constructor() {
        this.lastHandX = null;
        this.smoothedPinchDistance = null;

        this.gestureCooldown = 500; // milliseconds
        this.navigationCooldown = 800; // Slower for discrete switching
        this.lastGestureTime = {
            fist: 0,
            victory: 0,
            photo_next: 0,
            photo_prev: 0
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
            // Optionally reset gesture times or indicate no hands
            return { rotation: 0, scale: null };
        }

        const landmarks = results.multiHandLandmarks;
        const handednesses = results.multiHandedness || [];
        let rotationDelta = 0;
        let scaleFactor = null;
        let activePose = null;

        const now = performance.now(); // Get current time for debouncing

        for (let i = 0; i < landmarks.length; i++) {
            const handLandmarks = landmarks[i];
            const detectedPose = this.detectPose(handLandmarks);
            const handInfo = handednesses[i];

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

                        // 0. Navigation Logic (L-Shape Handedness)
                        // Left Hand -> photo_next
                        // Right Hand -> photo_prev
                        if (activePose === 'l_shape' && handInfo) {
                            const label = handInfo.label; // "Left" or "Right"
                            let navGesture = null;
                            if (label === 'Left') navGesture = 'photo_next';
                            if (label === 'Right') navGesture = 'photo_prev';

                            if (navGesture && now - (this.lastGestureTime[navGesture] || 0) > this.navigationCooldown) {
                                this.dispatchEvent(new CustomEvent('gesture', { detail: { pose: navGesture } }));
                                this.lastGestureTime[navGesture] = now;
                            }
                        }

                        // Trigger Event (if cooldown allows)
                        // Only standard gestures if not l_shape (or we can allow both, but l_shape is nav mode)
                        if (activePose !== 'l_shape' && now - (this.lastGestureTime[detectedPose] || 0) > this.gestureCooldown) {
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
    // Uses distance to wrist to be rotation invariant
    _isFingerCurled(landmarks, tipIdx, pipIdx, mcpIdx) {
        const wrist = landmarks[0];
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx]; // Use PIP for better accuracy

        // Calculate squared distances to wrist
        const distTipSq = (tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2;
        const distPipSq = (pip.x - wrist.x) ** 2 + (pip.y - wrist.y) ** 2;

        // If tip is closer to wrist than PIP is, it's definitely curled.
        // We add a small buffer (1.1x) to handle loose curls.
        return distTipSq < (distPipSq * 1.2);
    }

    // Special check for thumb (it behaves differently)
    _isThumbCurled(landmarks) {
        const wrist = landmarks[0];
        const tip = landmarks[4];
        const ip = landmarks[3];
        const mcp = landmarks[2];
        const pinkyMcp = landmarks[17];

        // 1. Distance Check: Tip to PinkyMCP
        // If thumb tip is close to pinky base, it's curled/tucked.
        const distTipPinkySq = (tip.x - pinkyMcp.x) ** 2 + (tip.y - pinkyMcp.y) ** 2;
        const distMcpPinkySq = (mcp.x - pinkyMcp.x) ** 2 + (mcp.y - pinkyMcp.y) ** 2;
        
        // If tip is closer to pinky base than MCP is, it's curled
        if (distTipPinkySq < distMcpPinkySq) return true;

        // 2. Vector Alignment Check (optional, for "L" shape accuracy)
        // Ensure thumb is pointing away from fingers? 
        // For now, simple distance check is usually robust for "Fist" vs "Open".
        return false;
    }

    // Detects specific poses like "one_finger" or "two_fingers"
    detectPose(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;

        // Check finger states
        const indexCurled = this._isFingerCurled(landmarks, 8, 7, 6);
        const middleCurled = this._isFingerCurled(landmarks, 12, 11, 10);
        const ringCurled = this._isFingerCurled(landmarks, 16, 15, 14);
        const pinkyCurled = this._isFingerCurled(landmarks, 20, 19, 18);
        const thumbCurled = this._isThumbCurled(landmarks); 

        // Debug Log (Throttled or situational)
        console.log(`I:${!indexCurled} M:${!middleCurled} R:${!ringCurled} P:${!pinkyCurled} T:${!thumbCurled}`);

        // Extended fingers
        const indexExtended = !indexCurled;
        const middleExtended = !middleCurled;
        const ringExtended = !ringCurled;
        const pinkyExtended = !pinkyCurled;
        const thumbExtended = !thumbCurled;

        // "L Shape" (Index & Thumb) -> Photo Navigation Mode
        // Index & Thumb Extended, others Curled
        if (indexExtended && thumbExtended && middleCurled && ringCurled && pinkyCurled) {
            return "l_shape";
        }

        // "One Finger" (Index only) -> Switch to PinkWhite
        // Strict check: Index UP, Thumb/Middle/Ring/Pinky DOWN
        if (indexExtended && thumbCurled && middleCurled && ringCurled && pinkyCurled) {
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