import * as THREE from 'three';

export class SnowSystem {
    constructor(scene, snowCount = 2000) {
        this.scene = scene;
        this.snowCount = snowCount;
        this.snowParticles = null;
        this.isActive = true; // Enable by default for visibility
        this.baseSpeed = 1.0; // Slower falling speed

        this.particleTexture = null; 
        
        this.initSnow();
    }

    initSnow() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];
        const velocities = []; // Store individual speeds

        for (let i = 0; i < this.snowCount; i++) {
            // Random positions within a cube
            // Z range: -5 to 10 (concentrate more in front of the tree which is at 0)
            // Camera is at Z=5. Tree is at Z=0.
            // We want snow between Z=-5 (behind tree) and Z=8 (near camera)
            positions.push(
                (Math.random() - 0.5) * 25, // X width
                Math.random() * 15,       // Y height
                Math.random() * 12.5 - 10 // Z: -10 to 2.5 (Keep away from camera at 5)
            );
            sizes.push(Math.random() * 0.1 + 0.05); // Smaller size (0.05 - 0.15)
            velocities.push(Math.random() * 0.5 + 0.8); // 0.8 to 1.3 scale
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

        const textureLoader = new THREE.TextureLoader();
        const snowTexture = textureLoader.load('/images/snow.png');

        // Basic material for now, will be replaced with texture later
        const material = new THREE.PointsMaterial({
            color: 0xaaaaaa, // Light grey for visibility without bloom
            size: 0.3, // Reduced global size
            map: snowTexture,
            transparent: true,
            opacity: 0.7, // Increased opacity for clarity
            blending: THREE.NormalBlending, // No glow accumulation, clearer flakes
            depthWrite: false
        });

        this.snowParticles = new THREE.Points(geometry, material);
        this.snowParticles.visible = this.isActive; 

        this.scene.add(this.snowParticles);
    }

    animate(deltaTime) {
        if (!this.isActive || !this.snowParticles) return;

        const positions = this.snowParticles.geometry.attributes.position.array;
        const velocities = this.snowParticles.geometry.attributes.velocity.array;
        
        const time = performance.now() * 0.001;

        for (let i = 0; i < positions.length; i += 3) {
            const vIndex = i / 3;
            // Use individual velocity
            positions[i + 1] -= this.baseSpeed * velocities[vIndex] * deltaTime; // Move down
            
            // Add slight horizontal sway
            positions[i] += Math.sin(time + positions[i] * 0.5) * 0.02;

            // If a snowflake falls below the scene, reset it to the top
            if (positions[i + 1] < -8) { 
                positions[i + 1] = 12 + Math.random() * 5; // Reset to random top Y
                positions[i] = (Math.random() - 0.5) * 25; // Random X
                positions[i + 2] = Math.random() * 12.5 - 10; // Z: -10 to 2.5
            }
        }
        this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }

    toggle() {
        this.isActive = !this.isActive;
        if (this.snowParticles) {
            this.snowParticles.visible = this.isActive;
        }
    }
}