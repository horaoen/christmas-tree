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

        const now = performance.now(); // Get current time for debouncing

        for (const handLandmarks of landmarks) {
            // Detect pose for each hand
            const detectedPose = this.detectPose(handLandmarks);

            if (detectedPose) {
                // Special handling for restore: shorter cooldown to allow reliable triggering
                const cooldown = detectedPose === 'restore' ? 200 : this.gestureCooldown;

                if (now - (this.lastGestureTime[detectedPose] || 0) > cooldown) {
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

        // 2. Scale Logic (Single Hand Pinch)
        // Using Thumb tip (4) and Index finger tip (8)
        if (landmarks.length > 0) {
            const hand = landmarks[0];
            const thumbTip = hand[4];
            const indexTip = hand[8];

            const dx = thumbTip.x - indexTip.x;
            const dy = thumbTip.y - indexTip.y;
            // Raw Pinch distance
            const rawDistance = Math.sqrt(dx * dx + dy * dy);

            // Apply Exponential Moving Average (EMA) for smoothness
            // Alpha 0.5 offers a balance between responsiveness and jitter reduction
            if (this.pinchReferenceDistance === null) {
                this.pinchReferenceDistance = rawDistance;
                this.smoothedPinchDistance = rawDistance;

            } else {
                this.smoothedPinchDistance = this.smoothedPinchDistance * 0.5 + rawDistance * 0.5;
            }

            // Invert the ratio so bringing fingers together shrinks the tree
            const pinchRatio = this.pinchReferenceDistance / Math.max(this.smoothedPinchDistance, 0.001);
            scaleFactor = pinchRatio;
        } else {
            this.pinchReferenceDistance = null;
            this.smoothedPinchDistance = null;
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

    // Detects specific poses like "fist" or "victory"
    detectPose(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;

        // Check for Fist
        const indexCurled = this._isFingerCurled(landmarks, 8, 7, 6);
        const middleCurled = this._isFingerCurled(landmarks, 12, 11, 10);
        const ringCurled = this._isFingerCurled(landmarks, 16, 15, 14);
        const pinkyCurled = this._isFingerCurled(landmarks, 20, 19, 18);

        if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
            return "fist";
        }

        const indexExtended = !indexCurled;
        const middleExtended = !middleCurled;

        // Check for Restore (Index and Middle close together)
        if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const distance = Math.sqrt(
                Math.pow(indexTip.x - middleTip.x, 2) +
                Math.pow(indexTip.y - middleTip.y, 2)
            );

            // If fingers are touching (or very close) - Relaxed threshold
            if (distance < 0.08) {
                return "restore";
            }

            // Check for Victory (V-sign) - ONLY if not Restore
            const thumbTip = landmarks[4];
            const thumbMcp = landmarks[2];
            const thumbExtendedThreshold = 0.1;
            const thumbDistance = Math.sqrt(
                Math.pow(thumbTip.x - thumbMcp.x, 2) +
                Math.pow(thumbTip.y - thumbMcp.y, 2) +
                Math.pow(thumbTip.z - thumbMcp.z, 2)
            );
            if (thumbDistance < thumbExtendedThreshold) {
                return "victory";
            }
        }

        return null;
    }
}