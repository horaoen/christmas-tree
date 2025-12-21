import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { OrnamentManager, ChristmasTree } from './tree.js'; 

describe('ChristmasTree integration', () => {
    it('should initialize with an OrnamentManager', () => {
        const mockScene = { attach: vi.fn(), add: vi.fn() };
        const mockCamera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), getWorldDirection: vi.fn() };
        const tree = new ChristmasTree(mockScene, mockCamera);
        expect(tree.ornamentManager).toBeDefined();
        expect(tree.ornamentManager instanceof OrnamentManager).toBe(true);
    });
});

describe('OrnamentManager', () => {
    let treeObject;
    let manager;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        treeObject = new THREE.Object3D();
        treeObject.attach = vi.fn(); // Mock attach for treeObject
        mockScene = { attach: vi.fn(), add: vi.fn() };
        mockCamera = { 
            position: new THREE.Vector3(), 
            quaternion: new THREE.Quaternion(), 
            getWorldDirection: vi.fn((vec) => vec.set(0, 0, -1)) 
        };
        manager = new OrnamentManager(treeObject, mockScene, mockCamera);
    });

    it('should initialize with an empty ornaments array', () => {
        expect(manager.ornaments).toEqual([]);
    });

    it('should load ornaments from a config array', () => {
        const config = [
            { id: 'bell', path: 'images/ornaments/bell.png', position: [0, 1, 0] }
        ];
        manager.loadOrnaments(config);
        expect(manager.ornaments.length).toBe(1);
    });

    it('should handle config without position', () => {
        const config = [{ id: 'no-pos', path: 'images/ornaments/test.png' }];
        manager.loadOrnaments(config);
        expect(manager.ornaments[0].position.x).toBe(0);
        expect(manager.ornaments[0].position.y).toBe(0);
        expect(manager.ornaments[0].position.z).toBe(0);
    });

    it('should assign textures to ornaments', () => {
        const config = [{ id: 'bell', path: 'images/ornaments/bell.png' }];
        const texture = new THREE.Texture();
        const woodTexture = new THREE.Texture();
        
        vi.spyOn(manager.loader, 'load').mockImplementation((path, onLoad) => {
            if (path.includes('wood_texture.jpg')) {
                if (onLoad) onLoad(woodTexture);
                return woodTexture;
            }
            if (onLoad) onLoad(texture);
            return texture;
        });

        manager.loadOrnaments(config);
        
        // children[0]: frameMesh
        const frameMesh = manager.ornaments[0].children[0];
        expect(frameMesh.material.map).toBe(woodTexture);

        // children[2]: photoMesh
        const photoMesh = manager.ornaments[0].children[2];
        expect(photoMesh.material.map).toBe(texture);
    });

    it('should have 3:4 aspect ratio for photo and frame', () => {
        const config = [{ id: 'portrait', path: 'images/ornaments/test.png' }];
        manager.loadOrnaments(config);
        const group = manager.ornaments[0];
        
        // children[0]: frameMesh (Box)
        // children[1]: matteMesh (Plane)
        // children[2]: photoMesh (Plane)
        const frameMesh = group.children[0];
        const photoMesh = group.children[2];

        // 验证 PhotoMesh 比例 (3:4)
        // Expected: width=0.15, height=0.20
        expect(photoMesh.geometry.parameters.width).toBeCloseTo(0.15);
        expect(photoMesh.geometry.parameters.height).toBeCloseTo(0.20);

        // 验证 FrameMesh 比例
        // Expected: width=0.21, height=0.26
        expect(frameMesh.geometry.parameters.width).toBeCloseTo(0.21);
        expect(frameMesh.geometry.parameters.height).toBeCloseTo(0.26);
    });

    it('should calculate correct surface coordinates', () => {
        // Mock tree parameters: height=3, baseRadius=1.2
        const tree = new ChristmasTree(mockScene, mockCamera, 25000, 3, 1.2);
        
        // Test base (h=0)
        // At h=0 (bottom of foliage area, technically treeHeight/2 is top, -treeHeight/2 is bottom)
        // Normalized h=0 -> y = -1.5, radius = 1.2
        const p1 = tree.getSurfacePoint(0.0, 0); // h=0%, angle=0
        expect(p1.y).toBeCloseTo(-1.5);
        expect(p1.x).toBeCloseTo(1.2);
        expect(p1.z).toBeCloseTo(0);

        // Test top (h=1)
        // At h=1, y = 1.5, radius = 0
        const p2 = tree.getSurfacePoint(1.0, 0);
        expect(p2.y).toBeCloseTo(1.5);
        expect(p2.x).toBeCloseTo(0);

        // Test middle (h=0.5, angle=90 deg)
        // At h=0.5, y=0, radius=0.6
        // Angle PI/2 -> x=0, z=0.6
        const p3 = tree.getSurfacePoint(0.5, Math.PI / 2);
        expect(p3.y).toBeCloseTo(0);
        expect(p3.x).toBeCloseTo(0);
        expect(p3.z).toBeCloseTo(0.6);
    });

    it('should handle selecting an ornament', () => {
        const config = [{ id: 'bell', path: 'images/ornaments/bell.png' }];
        manager.loadOrnaments(config);
        const ornament = manager.ornaments[0];
        
        manager.select(ornament);
        expect(manager.selectedOrnament).toBe(ornament);
        expect(mockScene.attach).toHaveBeenCalledWith(ornament); // Verify scene attachment
        
        manager.select(null);
        expect(manager.selectedOrnament).toBeNull();
        expect(treeObject.attach).toHaveBeenCalledWith(ornament); // Verify return to tree
    });

    it('should update animations', () => {
        // 主要是确保 update 方法可调用且不报错
        expect(() => manager.update(0.016)).not.toThrow();
    });

    it('should highlight an ornament', () => {
        const config = [{ id: 'bell', path: 'images/ornaments/bell.png', position: [0, 0, 0] }];
        manager.loadOrnaments(config);
        const ornament = manager.ornaments[0];
        
        manager.highlight(ornament);
        manager.update(0.016);
        expect(ornament.scale.x).toBeGreaterThan(1.0);
        
        manager.highlight(null);
        expect(manager.hoveredOrnament).toBeNull();
    });
});
