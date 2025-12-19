import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
// 我们将要创建的类
// import { OrnamentManager } from './tree.js'; 

import { OrnamentManager } from './tree.js'; 

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

    it('should have a loadOrnaments method', () => {
        expect(typeof manager.loadOrnaments).toBe('function');
    });

    it('should load ornaments from a config array', () => {
        const config = [
            { id: 'bell', path: 'images/ornaments/bell.png', position: [0, 1, 0] },
            { id: 'gift', path: 'images/ornaments/gift.png', position: [1, 0, 0] }
        ];
        manager.loadOrnaments(config);
        expect(manager.ornaments.length).toBe(2);
        expect(manager.ornaments[0].userData.id).toBe('bell');
    });
});
