import { describe, it, expect, vi } from 'vitest';
import { setupScene } from './scene.js';
import * as THREE from 'three';

// Mock WebGLRenderer
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        WebGLRenderer: class {
            constructor() {
                this.domElement = document.createElement('canvas');
                this.capabilities = { isWebGL2: true };
            }
            setSize() {}
            getSize(target) { 
                target.set(100, 100); 
                return target;
            }
            setPixelRatio() {}
            getPixelRatio() { return 1; }
            getRenderTarget() { return null; }
            setRenderTarget() {}
            clear() {}
            setScissor() {}
            setScissorTest() {}
            setViewport() {}
            getClearColor() { return new THREE.Color(); }
            getClearAlpha() { return 1; }
            setClearColor() {}
            setClearAlpha() {}
            render() {}
        },
    };
});

// Mock Canvas 2D Context
const mockContext2D = {
    createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
    })),
    fillRect: vi.fn(),
    fillStyle: '',
};

const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
        return mockContext2D;
    }
    return originalGetContext.call(this, type);
};

describe('Scene Lighting', () => {
    it('should have a frontal directional light', () => {
        const canvas = document.createElement('canvas');
        // Because we mocked THREE, setupScene will use the mocked Renderer
        const { scene } = setupScene(canvas);
        
        let directionalLightFound = false;
        scene.traverse((child) => {
            if (child.isDirectionalLight) {
                directionalLightFound = true;
                expect(child.intensity).toBe(0.8);
                expect(child.color.getHex()).toBe(0xffeedd);
                expect(child.position.x).toBe(0);
                expect(child.position.y).toBe(2);
                expect(child.position.z).toBe(5);
            }
        });
        
        expect(directionalLightFound).toBe(true);
    });
});
