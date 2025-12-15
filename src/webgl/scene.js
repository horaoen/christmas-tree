import * as THREE from 'three';
import { ChristmasTree } from './tree.js';
import { SnowSystem } from './snow.js'; // Import SnowSystem

export function setupScene(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.position.z = 5;

    const christmasTree = new ChristmasTree();
    scene.add(christmasTree.getTreeObject());

    const snowSystem = new SnowSystem(scene); // Create SnowSystem instance

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        christmasTree.animate(delta);
        snowSystem.animate(delta); // Animate snow system

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer, christmasTree, snowSystem }; // Return snowSystem
}
