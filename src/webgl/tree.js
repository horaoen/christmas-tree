import * as THREE from 'three';

export class ChristmasTree {
    constructor(particleCount = 5000, treeHeight = 3, baseRadius = 1) {
        this.particleCount = particleCount;
        this.treeHeight = treeHeight;
        this.baseRadius = baseRadius;
        this.treeObject = new THREE.Object3D();
        this.particles = null; // Will hold the THREE.Points object
        
        // Interaction targets
        this.targetRotationY = 0;
        this.currentScale = 1;
        this.targetScale = 1;
        
        this.generateParticles();
    }

    // ... generateParticles ...

    updateTargetRotation(delta) {
        this.targetRotationY += delta;
    }

    updateTargetScale(factor) {
        if (factor) {
            this.targetScale *= factor;
            // Clamp scale
            this.targetScale = Math.max(0.5, Math.min(3.0, this.targetScale));
        }
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
        // Basic auto-rotation
        this.targetRotationY += 0.1 * deltaTime;

        // Smoothly interpolate rotation
        // We accumulate rotation in targetRotationY, so we just set it.
        // Wait, lerping rotation is tricky if it wraps. But for simple Y rotation it's fine.
        // Actually, for direct control, maybe we should lerp the object's rotation towards target?
        // Let's simpler approach: direct mapping with damping.
        
        // Apply smooth transition
        this.treeObject.rotation.y = THREE.MathUtils.lerp(this.treeObject.rotation.y, this.targetRotationY, 0.1);
        
        // Smoothly interpolate scale
        this.currentScale = THREE.MathUtils.lerp(this.currentScale, this.targetScale, 0.1);
        this.treeObject.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }
}
