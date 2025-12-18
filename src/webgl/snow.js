import * as THREE from 'three';

export class SnowSystem {
    constructor(scene, camera, snowCount = 1333) {
        this.scene = scene;
        this.camera = camera;
        this.snowCount = snowCount;
        this.snowParticles = null;
        this.isActive = true;
        this.baseSpeed = 1.0;

        this.initSnow();
    }

    // Helper to get visible width/height at a given Z depth
    getVisibleSizeAtZ(depth) {
        const distance = this.camera.position.z - depth;
        // Convert FOV to radians
        const vFOV = this.camera.fov * Math.PI / 180;
        // Visible height at this distance
        const height = 2 * Math.tan(vFOV / 2) * distance;
        // Visible width
        const width = height * this.camera.aspect;
        return { width, height };
    }

    initSnow() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];
        const velocities = [];

        for (let i = 0; i < this.snowCount; i++) {
            // Z range: -10 to 4 (Cover from background to near camera)
            const z = Math.random() * 14 - 10;

            const { width, height } = this.getVisibleSizeAtZ(z);

            // Spread X/Y slightly beyond visible area (1.2x) to avoid hard edges
            const x = (Math.random() - 0.5) * width * 1.2;
            const y = (Math.random() - 0.5) * height * 1.2 + 2; // Offset Y slightly up

            positions.push(x, y, z);
            // Size: 0.05 to 0.25. Using power of 1.3 to increase large flake probability
            const sizeMap = Math.pow(Math.random(), 1.3) * 0.20 + 0.05;
            sizes.push(sizeMap);
            velocities.push(Math.random() * 0.5 + 0.8);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('pSize', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

        const textureLoader = new THREE.TextureLoader();
        const snowTexture = textureLoader.load('/images/snow.png');

        const material = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 1.0, // Base scale, actual size comes from pSize attribute
            map: snowTexture,
            transparent: true,
            opacity: 0.7,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        // Inject shader logic to use per-particle size
        material.onBeforeCompile = (shader) => {
            shader.vertexShader = `attribute float pSize;\n` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                'gl_PointSize = size',
                'gl_PointSize = pSize'
            );
        };

        this.snowParticles = new THREE.Points(geometry, material);
        this.snowParticles.visible = this.isActive;

        this.scene.add(this.snowParticles);
    }

        animate(deltaTime) {
            if (!this.isActive || !this.snowParticles) return;
    
            const positions = this.snowParticles.geometry.attributes.position.array;
            const velocities = this.snowParticles.geometry.attributes.velocity.array;
            const sizes = this.snowParticles.geometry.attributes.pSize.array;
            
            const time = performance.now() * 0.001;
    
            // Simulate very gentle, changing wind (significantly reduced)
            const windX = Math.sin(time * 0.3) * 0.2 + Math.cos(time * 0.7) * 0.1;
            const windZ = Math.cos(time * 0.2) * 0.15 + Math.sin(time * 0.5) * 0.05;
    
            for (let i = 0; i < positions.length; i += 3) {
                const vIndex = i / 3;
                // Use index to create unique variations for each snowflake
                const uniqueOffset = vIndex * 0.1;
    
                // Calculate subtle turbulence (significantly reduced)
                const swayX = Math.sin(time * 1.0 + uniqueOffset) * 0.3; 
                const swayZ = Math.cos(time * 0.8 + uniqueOffset) * 0.2;
                
                // Horizontal movement (Wind + Individual Sway)
                positions[i] += (windX + swayX) * deltaTime;
                positions[i + 2] += (windZ + swayZ) * deltaTime;
    
                // Vertical movement (Gravity + very slight turbulence)
                const turbulence = 1.0 + Math.sin(time * 2 + uniqueOffset) * 0.1;
                positions[i + 1] -= this.baseSpeed * velocities[vIndex] * deltaTime * turbulence;
                
                // Reset if below view (roughly -10 for safety, though depends on Z)
                if (positions[i + 1] < -10) { 
                    // New random Z
                    const z = Math.random() * 14 - 10;
                    
                    // Calculate bounds for this new Z
                    const { width, height } = this.getVisibleSizeAtZ(z);
    
                    positions[i + 2] = z; // Set Z
                    // Reset X to random position within view, adjusted for wind direction to maintain flow
                    // (e.g., if wind blows right, spawn more to the left to fill in)
                    positions[i] = (Math.random() - 0.5) * width * 1.2 - (windX * 2); 
                    positions[i + 1] = height / 2 + Math.random() * 5; // Reset to top + random buffer
    
                    // Regenerate size to maintain variety over time
                    sizes[vIndex] = Math.pow(Math.random(), 1.3) * 0.20 + 0.05;
                }
            }
            this.snowParticles.geometry.attributes.position.needsUpdate = true;
            this.snowParticles.geometry.attributes.pSize.needsUpdate = true;
        }
    toggle() {
        this.isActive = !this.isActive;
        if (this.snowParticles) {
            this.snowParticles.visible = this.isActive;
        }
    }
}