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
        const landmarks = Array(21).fill({ x: 0, y: 0 }); // Default
        
        // Helper to set finger
        const setFinger = (tip, pip, mcp, isExtended) => {
            if (isExtended) {
                landmarks[tip] = { x: 0, y: -0.8 }; 
                landmarks[pip] = { x: 0, y: -0.5 };
                landmarks[mcp] = { x: 0, y: -0.2 }; 
            } else {
                landmarks[tip] = { x: 0, y: -0.1 }; 
                landmarks[pip] = { x: 0, y: -0.15 };
                landmarks[mcp] = { x: 0, y: -0.2 }; 
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
                landmarks[tip] = { x: 0, y: -0.8 }; 
                landmarks[pip] = { x: 0, y: -0.5 };
                landmarks[mcp] = { x: 0, y: -0.2 }; 
            } else {
                landmarks[tip] = { x: 0, y: -0.1 }; 
                landmarks[pip] = { x: 0, y: -0.15 };
                landmarks[mcp] = { x: 0, y: -0.2 }; 
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

    it('should detect "l_shape" pose', () => {
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 

        const setFinger = (tip, pip, mcp, isExtended) => {
            if (isExtended) {
                landmarks[tip] = { x: 0, y: -0.8 }; 
                landmarks[pip] = { x: 0, y: -0.5 };
                landmarks[mcp] = { x: 0, y: -0.2 }; 
            } else {
                landmarks[tip] = { x: 0, y: -0.1 }; 
                landmarks[pip] = { x: 0, y: -0.15 };
                landmarks[mcp] = { x: 0, y: -0.2 }; 
            }
        };

        // L Shape: Index & Thumb Extended, Others Curled
        setFinger(8, 7, 6, true);  // Index
        setFinger(4, 3, 2, true);  // Thumb
        setFinger(12, 11, 10, false); // Middle
        setFinger(16, 15, 14, false); // Ring
        setFinger(20, 19, 18, false); // Pinky

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('l_shape');
    });

    it('should trigger photo_next/prev events when l_shape moves vertically', () => {
        const callback = vi.fn();
        controller.addEventListener('gesture', callback);

        const getLShape = (y) => {
            const landmarks = Array(21).fill({ x: 0.5, y: y }); // Wrist at y
            const setFinger = (tip, pip, mcp, isExtended) => {
                const mcpY = y - 0.2;
                if (isExtended) {
                    landmarks[tip] = { x: 0.5, y: y - 0.8 };
                    landmarks[pip] = { x: 0.5, y: y - 0.5 };
                    landmarks[mcp] = { x: 0.5, y: mcpY };
                } else {
                    landmarks[tip] = { x: 0.5, y: y - 0.1 };
                    landmarks[pip] = { x: 0.5, y: y - 0.15 };
                    landmarks[mcp] = { x: 0.5, y: mcpY };
                }
            };
            setFinger(8, 7, 6, true);  // Index
            setFinger(4, 3, 2, true);  // Thumb
            setFinger(12, 11, 10, false);
            setFinger(16, 15, 14, false);
            setFinger(20, 19, 18, false);
            return landmarks;
        };

        // 1. Initial Position (y=0.5)
        // We need to hold the pose for >200ms for stability
        vi.useFakeTimers();
        
        controller.process({ multiHandLandmarks: [getLShape(0.5)] });
        vi.advanceTimersByTime(400); // Pass stability threshold AND navigation cooldown
        controller.process({ multiHandLandmarks: [getLShape(0.5)] });

        // 2. Move Down (y=0.7) -> Should trigger photo_next
        controller.process({ multiHandLandmarks: [getLShape(0.7)] });
        
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({
            detail: { pose: 'photo_next' }
        }));

        callback.mockClear();

        // 3. Move Up (y=0.3) -> Should trigger photo_prev
        // Note: we might need to reset origin or check how implementation handles continuous movement
        controller.process({ multiHandLandmarks: [getLShape(0.3)] });
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({
            detail: { pose: 'photo_prev' }
        }));

        vi.useRealTimers();
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
