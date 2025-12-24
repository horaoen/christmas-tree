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
        landmarks[17] = { x: 0.1, y: 0.2 }; // Pinky MCP
        
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
        landmarks[17] = { x: 0.1, y: 0.2 }; // Pinky MCP

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
        landmarks[17] = { x: 0.1, y: 0.2 }; // Pinky MCP

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

    it('should trigger photo_next with Left hand L-shape and photo_prev with Right hand', () => {
        const callback = vi.fn();
        controller.addEventListener('gesture', callback);
        vi.useFakeTimers();

        const landmarks = Array(21).fill({ x: 0, y: 0 });
        // Set L-shape
        const setLShape = () => {
             landmarks[17] = { x: 0.1, y: 0.2 }; // Pinky MCP
             
             // Index & Thumb Extended
             // Index Tip=8, PIP=7, MCP=6
             landmarks[8] = { x: 0, y: -0.8 }; 
             landmarks[7] = { x: 0, y: -0.5 };
             landmarks[6] = { x: 0, y: -0.2 }; 
             
             // Thumb Tip=4, MCP=2, IP=3
             landmarks[4] = { x: 0, y: -0.8 }; 
             landmarks[3] = { x: 0, y: -0.5 };
             landmarks[2] = { x: 0, y: -0.2 };
             
             // Others curled
             // Middle Tip=12, PIP=11
             landmarks[12] = { x: 0, y: -0.1 };
             landmarks[11] = { x: 0, y: -0.15 }; // Tip closer to wrist than PIP
             landmarks[10] = { x: 0, y: -0.2 };
             
             // Ring Tip=16, PIP=15
             landmarks[16] = { x: 0, y: -0.1 };
             landmarks[15] = { x: 0, y: -0.15 };
             landmarks[14] = { x: 0, y: -0.2 };
             
             // Pinky Tip=20, PIP=19
             landmarks[20] = { x: 0, y: -0.1 };
             landmarks[19] = { x: 0, y: -0.15 };
             landmarks[18] = { x: 0, y: -0.2 };
        };
        setLShape();

        // Warm up timer
        vi.advanceTimersByTime(1000);

        // 1. Left Hand -> Should trigger photo_next
        controller.process({ 
            multiHandLandmarks: [landmarks],
            multiHandedness: [{ label: 'Left' }]
        });
        
        // Advance time for stability check (200ms)
        vi.advanceTimersByTime(250);
        
        // Process again to trigger
        controller.process({ 
            multiHandLandmarks: [landmarks],
            multiHandedness: [{ label: 'Left' }]
        });

        expect(callback).toHaveBeenCalledWith(expect.objectContaining({
            detail: { pose: 'photo_next' }
        }));
        
        callback.mockClear();

        // 2. Cooldown check (Navigation cooldown is likely higher now, e.g. 500-1000ms)
        // Let's advance enough to clear cooldown
        vi.advanceTimersByTime(1000);

        // 3. Right Hand -> Should trigger photo_prev
        controller.process({ 
            multiHandLandmarks: [landmarks],
            multiHandedness: [{ label: 'Right' }]
        });
        
        // Need to stabilize new pose (even if same geometry, handedness changed implies new hand/pose context? 
        // Or controller might treat it as same pose if we don't reset. 
        // Let's assume we need to stabilize again or the hand swap is instant.)
        // Ideally, in real world, one hand leaves, another enters. 
        // Let's simulate "no hands" frame first to be clean.
        
        controller.process({ multiHandLandmarks: [] }); 
        vi.advanceTimersByTime(100);

        controller.process({ 
            multiHandLandmarks: [landmarks],
            multiHandedness: [{ label: 'Right' }]
        });
        vi.advanceTimersByTime(250);
        controller.process({ 
            multiHandLandmarks: [landmarks],
            multiHandedness: [{ label: 'Right' }]
        });

        expect(callback).toHaveBeenCalledWith(expect.objectContaining({
            detail: { pose: 'photo_prev' }
        }));

        vi.useRealTimers();
    });

    it('should detect horizontal L-shape (Gun gesture)', () => {
        // Mock landmarks for Horizontal L-shape
        // Index pointing RIGHT (x increases), Thumb pointing UP (y decreases)
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 
        
        // Wrist at 0,0
        // Pinky MCP (Base of palm reference for thumb)
        landmarks[17] = { x: 0.1, y: 0.2 }; 

        // Index (Horizontal Extended): MCP(0.1, 0), PIP(0.3, 0), Tip(0.5, 0)
        landmarks[6] = { x: 0.1, y: 0 };
        landmarks[7] = { x: 0.3, y: 0 };
        landmarks[8] = { x: 0.5, y: 0 };

        // Thumb (Vertical Extended): MCP(0.1, -0.1), Tip(0.1, -0.4)
        landmarks[2] = { x: 0.1, y: -0.1 };
        landmarks[3] = { x: 0.1, y: -0.2 };
        landmarks[4] = { x: 0.1, y: -0.4 }; 

        // Others Curled (Tip closer to wrist than PIP)
        [12, 16, 20].forEach(tip => {
            landmarks[tip] = { x: 0.1, y: 0.1 }; 
        });
        [10, 14, 18].forEach(pip => { // Use PIP indices for loop logic if consistent
             // Actually loop sets tip. Set PIP manually.
        });
        // Set PIPs for Middle, Ring, Pinky
        landmarks[11] = { x: 0.15, y: 0.15 }; // PIP further
        landmarks[15] = { x: 0.15, y: 0.25 };
        landmarks[19] = { x: 0.15, y: 0.35 };

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('l_shape');
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
