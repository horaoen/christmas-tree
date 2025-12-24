import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GestureController } from './gesture-controller.jsx';

describe('GestureController', () => {
    let controller;

    beforeEach(() => {
        controller = new GestureController();
    });

    it('should initialize correctly', () => {
        expect(controller.listeners).toEqual({});
        expect(controller.gestureCooldown).toBe(500);
    });

    it('should add and remove event listeners', () => {
        const callback = vi.fn();
        controller.addEventListener('gesture', callback);
        expect(controller.listeners['gesture']).toContain(callback);

        controller.removeEventListener('gesture', callback);
        expect(controller.listeners['gesture']).not.toContain(callback);
    });

    it('should dispatch events', () => {
        const callback = vi.fn();
        controller.addEventListener('gesture', callback);
        
        const event = new CustomEvent('gesture', { detail: { pose: 'test' } });
        controller.dispatchEvent(event);
        
        expect(callback).toHaveBeenCalledWith(event);
    });

    it('should detect "one_finger" pose', () => {
        // Mock landmarks for "one finger" (Index UP, others DOWN)
        // Simple Y-check: Smaller Y is "higher" on screen usually (top-left origin).
        // _isFingerCurled uses: tip.y > pip.y (meaning tip is lower than pip -> curled down)
        
        // Wrist at 0,0
        // Index: Tip(0, -10), PIP(0, -5), MCP(0, 0) -> Extended (Tip < PIP)
        // Middle: Tip(0, 10), PIP(0, 5), MCP(0, 0) -> Curled (Tip > PIP)
        
        const landmarks = Array(21).fill({ x: 0, y: 0 }); // Default
        
        // Helper to set finger
        const setFinger = (tip, pip, mcp, isExtended) => {
            if (isExtended) {
                landmarks[tip] = { x: 0, y: -0.5 }; // Up
                landmarks[pip] = { x: 0, y: -0.3 };
                landmarks[mcp] = { x: 0, y: 0 };
            } else {
                landmarks[tip] = { x: 0, y: 0.5 }; // Down
                landmarks[pip] = { x: 0, y: 0.3 };
                landmarks[mcp] = { x: 0, y: 0 };
            }
        };

        // One Finger: Index Extended, Others Curled
        setFinger(8, 7, 6, true);   // Index
        setFinger(12, 11, 10, false); // Middle
        setFinger(16, 15, 14, false); // Ring
        setFinger(20, 19, 18, false); // Pinky
        setFinger(4, 3, 2, false);    // Thumb

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('one_finger');
    });

    it('should detect "two_fingers" pose', () => {
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 

        const setFinger = (tip, pip, mcp, isExtended) => {
            if (isExtended) {
                landmarks[tip] = { x: 0, y: -0.5 };
                landmarks[pip] = { x: 0, y: -0.3 };
                landmarks[mcp] = { x: 0, y: 0 };
            } else {
                landmarks[tip] = { x: 0, y: 0.5 };
                landmarks[pip] = { x: 0, y: 0.3 };
                landmarks[mcp] = { x: 0, y: 0 };
            }
        };

        // Two Fingers: Index & Middle Extended
        setFinger(8, 7, 6, true);
        setFinger(12, 11, 10, true);
        setFinger(16, 15, 14, false);
        setFinger(20, 19, 18, false);
        setFinger(4, 3, 2, false);

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('two_fingers');
    });

    it('should process rotation from hand movement', () => {
        // Frame 1: Hand at X=0.5
        const res1 = controller.process({
            multiHandLandmarks: [[...Array(21).fill({x: 0.5, y:0.5})]]
        });
        
        // Frame 2: Hand at X=0.6
        const res2 = controller.process({
            multiHandLandmarks: [[...Array(21).fill({x: 0.6, y:0.5})]]
        });

        // Delta X = 0.1
        // Rotation = Delta * 5 = 0.5
        expect(res2.rotation).toBeCloseTo(0.5);
    });
});
