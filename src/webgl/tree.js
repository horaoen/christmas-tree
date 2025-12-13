import * as THREE from 'three';

export class ChristmasTree {
    constructor(particleCount = 5000, treeHeight = 3, baseRadius = 1) {
        this.particleCount = particleCount;
        this.treeHeight = treeHeight;
        this.baseRadius = baseRadius;
        this.treeObject = new THREE.Object3D();
        this.particles = null; // Will hold the THREE.Points object
        this.generateParticles();
    }

    generateParticles() {
        const positions = [];
        const colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < this.particleCount; i++) {
            // Spiral cone generation
            const y = (i / this.particleCount) * this.treeHeight; // height from 0 to treeHeight
            const radius = this.baseRadius * (1 - y / this.treeHeight); // radius decreases with height
            const angle = i * 0.1; // adjust for more or less dense spiral

            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);

            positions.push(x, y - this.treeHeight / 2, z); // Center the tree vertically

            // Basic green color for now
            color.setHSL(0.3, 0.7, 0.5); // Green color
            colors.push(color.r, color.g, color.b);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Create the particle material and mesh (Task 1.3 will refine this)
        const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
        this.particles = new THREE.Points(geometry, material);
        this.treeObject.add(this.particles);
    }

    // This method will return the Three.js object representing the tree
    getTreeObject() {
        return this.treeObject;
    }

    // This method will handle animation, e.g., rotation or particle effects
    animate(deltaTime) {
        // Basic rotation
        this.treeObject.rotation.y += 0.1 * deltaTime;
    }
}
