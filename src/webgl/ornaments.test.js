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
        manager = new OrnamentManager(treeObject, mockScene, mockCamera, 16); // Test high anisotropy
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

    it('should share resources across ornaments', () => {
        const config = [
            { id: 'p1', path: 'img1.png' },
            { id: 'p2', path: 'img2.png' }
        ];
        manager.loadOrnaments(config);
        
        const o1 = manager.ornaments[0];
        const o2 = manager.ornaments[1];

        // Shared Geometry
        expect(o1.children[0].geometry).toBe(o2.children[0].geometry); // Frame
        expect(o1.children[2].geometry).toBe(o2.children[2].geometry); // Photo

        // Shared Material (except Photo)
        expect(o1.children[0].material).toBe(manager.sharedMaterial.frame);
        expect(o1.children[0].material).toBe(o2.children[0].material);
        
        // Unique Material (Photo)
        expect(o1.children[2].material).not.toBe(o2.children[2].material);
    });

    it('should assign textures with correct anisotropy and encoding', () => {
        const config = [{ id: 'bell', path: 'images/ornaments/bell.png' }];
        const texture = new THREE.Texture();
        
        vi.spyOn(manager.loader, 'load').mockImplementation((path, onLoad) => {
            if (onLoad) onLoad(texture);
            return texture;
        });

        manager.loadOrnaments(config);
        
        expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
        expect(texture.anisotropy).toBe(16);
        expect(texture.minFilter).toBe(THREE.LinearMipMapLinearFilter);
        expect(texture.magFilter).toBe(THREE.LinearFilter);
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

    it('should use MeshBasicMaterial for photos for 1:1 color', () => {
        const config = [{ id: 'test', path: 'test.png' }];
        manager.loadOrnaments(config);
        const photoMesh = manager.ornaments[0].children[2];
        
        expect(photoMesh.material instanceof THREE.MeshBasicMaterial).toBe(true);
        expect(photoMesh.material.color.getHex()).toBe(0xffffff);
    });

    it('should calculate correct surface coordinates', () => {
        // Mock tree parameters: maxAnisotropy=1, particleCount=25000, height=3, baseRadius=1.2
        const tree = new ChristmasTree(mockScene, mockCamera, 1, 25000, 3, 1.2);
        
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

    it('should calculate non-overlapping positions for multiple ornaments', () => {
        const tree = new ChristmasTree(mockScene, mockCamera);
        const count = 10;
        const positions = tree.calculateOrnamentPositions(count);
        
        expect(positions.length).toBe(count);
        
        // Check for duplicates and basic validity
        positions.forEach((pos, index) => {
            expect(pos).toBeInstanceOf(THREE.Vector3);
            // Ensure no exact duplicates
            for (let i = index + 1; i < count; i++) {
                expect(pos.equals(positions[i])).toBe(false);
            }
        });
    });

    it('should calculate correct surface normal', () => {
        // Tree: height=3, radius=1.2
        // Slope angle theta: tan(theta) = radius / height = 1.2 / 3 = 0.4
        // Normal vector in vertical plane: (cos(theta), sin(theta))? 
        // Actually simpler: Vector from axis (0, y, 0) to surface (x, y, z) is horizontal.
        // True surface normal tilts up.
        // Slope vector (downward): (1.2, -3, 0) normalized.
        // Normal vector (outward): (3, 1.2, 0) normalized.
        
        const tree = new ChristmasTree(mockScene, mockCamera, 1, 25000, 3, 1.2);
        
        // Test angle 0 (Point on +X axis)
        const normal1 = tree.getSurfaceNormal(0); 
        // Should point primarily +X, slightly +Y
        expect(normal1.x).toBeGreaterThan(0.8);
        expect(normal1.y).toBeGreaterThan(0);
        expect(normal1.z).toBeCloseTo(0);
        
        // Test angle PI/2 (Point on +Z axis)
        const normal2 = tree.getSurfaceNormal(Math.PI / 2);
        expect(normal2.x).toBeCloseTo(0);
        expect(normal2.z).toBeGreaterThan(0.8);
        expect(normal2.y).toBeGreaterThan(0);
    });

    it('should generate positions within tree boundaries', () => {
        const height = 3.0;
        const radius = 1.2;
        const tree = new ChristmasTree(mockScene, mockCamera, 1, 25000, height, radius);
        const positions = tree.calculateOrnamentPositions(20);

        positions.forEach(pos => {
            // y range: [-1.5, 1.5]
            expect(pos.y).toBeGreaterThanOrEqual(-height / 2);
            expect(pos.y).toBeLessThanOrEqual(height / 2);

            // Normalized height (0 at bottom, 1 at top)
            const hRatio = (pos.y + height / 2) / height;
            const maxRadiusAtY = radius * (1.0 - hRatio);
            
            const currentRadius = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
            expect(currentRadius).toBeLessThanOrEqual(maxRadiusAtY + 0.01);
        });
    });

    it('should auto-distribute ornaments based on image list', () => {
        // Integration test:
        // 1. Create Tree
        // 2. Call loadOrnamentsFromImages(['1.jpg', '2.jpg'])
        // 3. Verify 2 ornaments created with correct positions
        
        const tree = new ChristmasTree(mockScene, mockCamera, 1, 25000, 3, 1.2);
        const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
        
        // Mock calculateOrnamentPositions to return predictable positions
        // to simplify testing (or just rely on the real one and check count)
        const mockPositions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 1)
        ];
        vi.spyOn(tree, 'calculateOrnamentPositions').mockReturnValue(mockPositions);
        
        // Clear existing ornaments from constructor
        tree.ornamentManager.ornaments = [];
        tree.treeObject.children = tree.treeObject.children.filter(c => !(c instanceof THREE.Group && c.userData.id?.startsWith('photo-')));

        tree.loadOrnamentsFromImages(images);
        
        // Check ornament count
        expect(tree.ornamentManager.ornaments.length).toBe(3);
        
        // Check ids and paths
        expect(tree.ornamentManager.ornaments[0].userData.id).toBe('photo-0');
        expect(tree.ornamentManager.ornaments[0].userData.path).toBe('img1.jpg');
        
        // Check position assignment (should have 0.05 offset from mockPositions)
        const pos0 = tree.ornamentManager.ornaments[0].position;
        expect(pos0.distanceTo(mockPositions[0])).toBeCloseTo(0.05, 2);
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
