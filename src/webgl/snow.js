import * as THREE from 'three';

export class SnowSystem {
    constructor(scene, snowCount = 1000) {
        this.scene = scene;
        this.snowCount = snowCount;
        this.snowParticles = null;
        this.isActive = true; // Enable by default for visibility

        this.particleTexture = null; 
        
        this.initSnow();
    }

    initSnow() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];

        for (let i = 0; i < this.snowCount; i++) {
            // Random positions within a cube
            positions.push(
                (Math.random() - 0.5) * 20, // X
                Math.random() * 10,       // Y (start above the scene)
                (Math.random() - 0.5) * 20  // Z
            );
            sizes.push(Math.random() * 0.1 + 0.05); // Random size
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const textureLoader = new THREE.TextureLoader();
        const snowTexture = textureLoader.load('/images/snow.png');

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            map: snowTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.snowParticles = new THREE.Points(geometry, material);
        this.snowParticles.visible = this.isActive; 

        this.scene.add(this.snowParticles);
    }

    animate(deltaTime) {
        if (!this.isActive || !this.snowParticles) return;

        const positions = this.snowParticles.geometry.attributes.position.array;
        const speed = 1.5; // Faster snow
        const time = performance.now() * 0.001;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= speed * deltaTime; // Move down
            
            // Add slight horizontal sway
            positions[i] += Math.sin(time + positions[i] * 0.5) * 0.01;

            // If a snowflake falls below the scene, reset it to the top
            if (positions[i + 1] < -10) { 
                positions[i + 1] = 10; // Reset to top
                positions[i] = (Math.random() - 0.5) * 20; // Random X
                positions[i + 2] = (Math.random() - 0.5) * 20; // Random Z
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