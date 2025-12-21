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

    it('should assign textures to ornaments', () => {
        const config = [{ id: 'bell', path: 'images/ornaments/bell.png' }];
        const texture = new THREE.Texture();
        vi.spyOn(manager.loader, 'load').mockImplementation((path, onLoad) => {
            if (onLoad) onLoad(texture);
            return texture;
        });

        manager.loadOrnaments(config);
        // ornaments[0] 是 Group
        // children[0]: frameMesh
        // children[1]: matteMesh
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
        const matteMesh = group.children[1];
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
