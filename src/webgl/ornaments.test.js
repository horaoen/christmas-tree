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

    it('should have an update method', () => {
        expect(typeof manager.update).toBe('function');
    });
});
