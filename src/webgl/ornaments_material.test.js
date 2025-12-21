import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { OrnamentManager } from './tree.js'; 

describe('OrnamentManager Material Updates', () => {
    let treeObject;
    let manager;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        treeObject = new THREE.Object3D();
        mockScene = { attach: vi.fn(), add: vi.fn() };
        mockCamera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), getWorldDirection: vi.fn() };
        manager = new OrnamentManager(treeObject, mockScene, mockCamera);
    });

    it('should have updated frame material properties for 3D realism', () => {
        const frameMaterial = manager.sharedMaterial.frame;

        // Expect smoother surface for varnish look
        expect(frameMaterial.roughness).toBe(0.2); 
        
        // Expect bump map to be set (we use the same texture for bump)
        // Since texture loading is async, we simulate what the loader callback does
        // But here we check if the intention (code) sets it. 
        // We can inspect the material object directly if initialized in constructor.
        
        // The loader callback sets the map. We need to check if the code *plans* to set bumpMap.
        // Current code:
        // this.loader.load('images/wood_texture.jpg', (texture) => { ... });
        
        // Since we can't easily wait for async in this unit test without mocking the loader properly,
        // we will check the synchronous properties first.
    });

    it('should set texture repeat to 2x2 in loader callback', () => {
        // Mock the loader prototype
        const mockTexture = new THREE.Texture();
        mockTexture.repeat = new THREE.Vector2(1, 1);
        
        const loadSpy = vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(function(path, callback) {
             if (callback) callback(mockTexture);
             return mockTexture;
        });

        // Re-initialize to trigger loader
        manager = new OrnamentManager(treeObject, mockScene, mockCamera);
        
        expect(mockTexture.repeat.x).toBe(2);
        expect(mockTexture.repeat.y).toBe(2);
        
        loadSpy.mockRestore();
    });

    it('should apply bump map in loader callback', () => {
         // Mock the loader prototype
         const mockTexture = new THREE.Texture();
         
         const loadSpy = vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(function(path, callback) {
              if (callback) callback(mockTexture);
              return mockTexture;
         });
 
         manager = new OrnamentManager(treeObject, mockScene, mockCamera);
         const frameMaterial = manager.sharedMaterial.frame;
         
         expect(frameMaterial.bumpMap).toBe(mockTexture);
         expect(frameMaterial.bumpScale).toBe(0.005);
         
         loadSpy.mockRestore();
    });
});
