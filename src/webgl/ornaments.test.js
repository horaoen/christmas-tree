import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { OrnamentManager, ChristmasTree } from './tree.js'; 

describe('ChristmasTree integration', () => {
    it('should initialize with an OrnamentManager', () => {
        const tree = new ChristmasTree();
        expect(tree.ornamentManager).toBeDefined();
        expect(tree.ornamentManager instanceof OrnamentManager).toBe(true);
    });
});

describe('OrnamentManager', () => {
    let treeObject;
    let manager;

    beforeEach(() => {
        treeObject = new THREE.Object3D();
        manager = new OrnamentManager(treeObject);
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
        // ornaments[0] 现在是 Group，children[1] 是 photoMesh
        const photoMesh = manager.ornaments[0].children[1];
        expect(photoMesh.material.map).toBe(texture);
    });

    it('should handle selecting an ornament', () => {
        const config = [{ id: 'bell', path: 'images/ornaments/bell.png' }];
        manager.loadOrnaments(config);
        const ornament = manager.ornaments[0];
        
        manager.select(ornament);
        expect(manager.selectedOrnament).toBe(ornament);
        
        manager.select(null);
        expect(manager.selectedOrnament).toBeNull();
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
