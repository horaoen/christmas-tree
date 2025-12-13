export class GestureController {
    constructor() {
        this.targetRotationY = 0;
        this.targetScale = 1;
        this.lastHandX = null;
        this.baseDistance = null;
    }

    process(results) {
        if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.lastHandX = null;
            this.baseDistance = null;
            return { rotation: 0, scale: null };
        }

        const landmarks = results.multiHandLandmarks;
        let rotationDelta = 0;
        let scaleFactor = null;

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
            // Negative sign because moving hand left (decreasing X) should rotate tree left (around Y)
            // But let's test direction. Usually dragging left rotates scene right? 
            // Let's stick to direct mapping: move hand left -> tree rotates left.
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
            // Pinch distance
            const distance = Math.sqrt(dx*dx + dy*dy);

            // Threshold to start scaling? 
            // Or just map distance changes.
            if (this.baseDistance !== null) {
                // Stabilize: ignore very small changes to prevent jitter
                if (Math.abs(distance - this.baseDistance) > 0.01) {
                    scaleFactor = distance / this.baseDistance;
                }
            }
            // Use a rolling base distance to make it relative to recent pose, 
            // or just update it. Updating it every frame makes scaleFactor ~1.0 unless moving fast.
            // Better: update baseDistance only when scaleFactor is applied?
            // Actually, for "pinch to zoom", usually you grab and drag. 
            // Without a "grab" state, relative scaling is tricky.
            // Simple approach: Map pinch distance directly to a scale factor relative to INITIAL pinch?
            // No, that locks user.
            
            // Let's use continuous update but only when change is significant.
            this.baseDistance = distance;
        } else {
            this.baseDistance = null;
        }
        
        return { rotation: rotationDelta, scale: scaleFactor };
    }
}
