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

    it('should detect "one_finger" pose even if thumb is slightly extended but close', () => {
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 
        landmarks[0] = { x: 0, y: 0 };    // Wrist
        landmarks[9] = { x: 0, y: -0.2 }; // Middle MCP (HandSize = 0.2)
        landmarks[17] = { x: 0.1, y: 0.1 }; // Pinky MCP
        
        const setFinger = (tip, pip, mcp, x, y, isExtended) => {
            if (isExtended) {
                landmarks[mcp] = { x: x, y: y + 0.6 }; 
                landmarks[pip] = { x: x, y: y + 0.3 };
                landmarks[tip] = { x: x, y: y }; 
            } else {
                landmarks[mcp] = { x: x, y: y + 0.2 }; 
                landmarks[pip] = { x: x, y: y + 0.1 };
                landmarks[tip] = { x: x, y: y + 0.05 }; 
            }
        };

        // One Finger: Index Extended at y=-0.8
        setFinger(8, 7, 6, 0, -0.8, true);   
        // Thumb Extended but VERY CLOSE to index at x=0.05, y=-0.7
        setFinger(4, 3, 2, 0.05, -0.7, true); 
        
        setFinger(12, 11, 10, 0, 0, false); // Others curled
        setFinger(16, 15, 14, 0, 0, false);
        setFinger(20, 19, 18, 0, 0, false);

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('one_finger');
    });

    it('should detect "l_shape" pose with wide thumb-index gap', () => {
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 
        landmarks[0] = { x: 0, y: 0 };    // Wrist
        landmarks[9] = { x: 0, y: -0.2 }; // Middle MCP
        landmarks[17] = { x: 0.1, y: 0.1 };

        const setFinger = (tip, pip, mcp, x, y, isExtended) => {
            if (isExtended) {
                landmarks[mcp] = { x: x, y: y + 0.6 }; 
                landmarks[pip] = { x: x, y: y + 0.3 };
                landmarks[tip] = { x: x, y: y }; 
            } else {
                landmarks[mcp] = { x: x, y: y + 0.2 }; 
                landmarks[pip] = { x: x, y: y + 0.1 };
                landmarks[tip] = { x: x, y: y + 0.05 }; 
            }
        };

        // Index at y=-0.8
        setFinger(8, 7, 6, 0, -0.8, true);  
        // Thumb at x=0.3, y=-0.8 -> distTI = 0.3. handSize=0.2. 0.3 > 0.16. OK.
        setFinger(4, 3, 2, 0.3, -0.8, true); 
        
        setFinger(12, 11, 10, 0, 0, false);
        setFinger(16, 15, 14, 0, 0, false);
        setFinger(20, 19, 18, 0, 0, false);

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('l_shape');
    });

    it('should detect "two_fingers" pose', () => {
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 
        landmarks[0] = { x: 0, y: 0 };    // Wrist
        landmarks[9] = { x: 0, y: -0.2 }; 
        landmarks[17] = { x: 0.1, y: 0.1 };

        const setFinger = (tip, pip, mcp, x, y, isExtended) => {
            if (isExtended) {
                landmarks[mcp] = { x: x, y: y + 0.6 }; 
                landmarks[pip] = { x: x, y: y + 0.3 };
                landmarks[tip] = { x: x, y: y }; 
            } else {
                landmarks[mcp] = { x: x, y: y + 0.2 }; 
                landmarks[pip] = { x: x, y: y + 0.1 };
                landmarks[tip] = { x: x, y: y + 0.05 }; 
            }
        };

        // Two Fingers: Index & Middle Extended
        setFinger(8, 7, 6, -0.1, -0.8, true);
        setFinger(12, 11, 10, 0.1, -0.8, true);
        setFinger(16, 15, 14, 0, 0, false);
        setFinger(20, 19, 18, 0, 0, false);
        setFinger(4, 3, 2, 0, 0, false);

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('two_fingers');
    });

    it('should trigger photo_next with Left hand L-shape and photo_prev with Right hand', () => {
        let lastPose = null;
        controller.addEventListener('gesture', (e) => { lastPose = e.detail.pose; });
        vi.useFakeTimers();

        const landmarks = Array(21).fill({ x: 0, y: 0 });
        landmarks[0] = { x: 0, y: 0 };    // Wrist
        landmarks[9] = { x: 0, y: -0.2 }; // Size 0.2
        landmarks[17] = { x: 0.1, y: 0.1 };

        // L Shape Setup
        landmarks[8] = { x: 0, y: -0.8 }; landmarks[7] = { x: 0, y: -0.5 }; landmarks[6] = { x: 0, y: -0.2 };
        landmarks[4] = { x: 0.3, y: -0.8 }; landmarks[3] = { x: 0.3, y: -0.5 }; landmarks[2] = { x: 0.3, y: -0.2 };
        [12,16,20].forEach(tip => landmarks[tip] = { x: 0.1, y: 0.05 });
        [11,15,19].forEach(pip => landmarks[pip] = { x: 0.1, y: 0.1 });

        // Warm up by 2000ms to clear the 1500ms cooldown
        vi.advanceTimersByTime(2000);

        // 1. Left Hand
        controller.process({ multiHandLandmarks: [landmarks], multiHandedness: [{ label: 'Left' }] });
        vi.advanceTimersByTime(200);
        controller.process({ multiHandLandmarks: [landmarks], multiHandedness: [{ label: 'Left' }] });
        expect(lastPose).toBe('photo_next');
        
        lastPose = null;
        vi.advanceTimersByTime(2000); // Increased to 2000ms to clear the 1500ms cooldown

        // 2. Right Hand
        controller.process({ multiHandLandmarks: [] }); 
        vi.advanceTimersByTime(100);
        controller.process({ multiHandLandmarks: [landmarks], multiHandedness: [{ label: 'Right' }] });
        vi.advanceTimersByTime(200);
        controller.process({ multiHandLandmarks: [landmarks], multiHandedness: [{ label: 'Right' }] });
        expect(lastPose).toBe('photo_prev');

        vi.useRealTimers();
    });

    it('should detect horizontal L-shape (Gun gesture)', () => {
        const landmarks = Array(21).fill({ x: 0, y: 0 }); 
        landmarks[0] = { x: 0, y: 0 };
        landmarks[9] = { x: 0, y: -0.2 }; 

        // Index (Horizontal): Tip(0.5, 0)
        landmarks[6] = { x: 0.1, y: 0 }; landmarks[7] = { x: 0.3, y: 0 }; landmarks[8] = { x: 0.5, y: 0 };
        // Thumb (Vertical): Tip(0, -0.5)
        landmarks[2] = { x: 0, y: -0.1 }; landmarks[3] = { x: 0, y: -0.3 }; landmarks[4] = { x: 0, y: -0.5 }; 

        [12,16,20].forEach(tip => landmarks[tip] = { x: 0.1, y: 0.05 });
        [11,15,19].forEach(pip => landmarks[pip] = { x: 0.1, y: 0.1 });

        const pose = controller.detectPose(landmarks);
        expect(pose).toBe('l_shape');
    });

    it('should process rotation but disable it when in l_shape', () => {
        // 1. Neutral (Index only)
        const neutral = Array(21).fill({x: 0.5, y: 0.5});
        neutral[0] = { x: 0.5, y: 0.5 }; neutral[9] = { x: 0.5, y: 0.3 };
        neutral[8] = { x: 0.5, y: -0.1 }; neutral[7] = { x: 0.5, y: 0.1 }; neutral[6] = { x: 0.5, y: 0.3 };
        // Thumb curled
        neutral[4] = { x: 0.5, y: 0.52 }; neutral[3] = { x: 0.5, y: 0.51 }; neutral[2] = { x: 0.5, y: 0.5 };
        
        controller.process({ multiHandLandmarks: [neutral] });
        
        const neutral2 = JSON.parse(JSON.stringify(neutral));
        neutral2.forEach(p => p.x += 0.1);
        const res2 = controller.process({ multiHandLandmarks: [neutral2] });
        expect(res2.rotation).toBeCloseTo(0.5);

        // 2. L-Shape
        const lShape = Array(21).fill({ x: 0.7, y: 0 }); 
        lShape[0] = { x: 0.7, y: 0 }; lShape[9] = { x: 0.7, y: -0.2 };
        lShape[8] = { x: 0.7, y: -0.8 }; lShape[7] = { x: 0.7, y: -0.5 }; lShape[6] = { x: 0.7, y: -0.2 };
        lShape[4] = { x: 1.0, y: -0.8 }; lShape[3] = { x: 1.0, y: -0.5 }; lShape[2] = { x: 1.0, y: -0.2 };
        [12,16,20].forEach(tip => lShape[tip] = { x: 0.8, y: 0.1 });
        [11,15,19].forEach(pip => lShape[pip] = { x: 0.8, y: 0.2 });

        vi.useFakeTimers();
        controller.process({ multiHandLandmarks: [lShape] });
        vi.advanceTimersByTime(200);
        const res3 = controller.process({ multiHandLandmarks: [lShape] });
        
        expect(res3.rotation).toBe(0);
        expect(res3.activePose).toBe('l_shape');
        vi.useRealTimers();
    });
});