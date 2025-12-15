import * as THREE from 'three';

const vertexShader = `
    attribute float size;
    attribute float phase;
    // attribute vec3 color; // Removed: automatically injected by Three.js when vertexColors: true

    uniform float uTime;

    varying vec3 vColor;

    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        
        // Twinkling effect: scale size based on sine wave
        float twinkle = sin(uTime * 5.0 + phase) * 0.5 + 0.5; // 0.0 to 1.0
        
        // Size attenuation: scale by (constant / distance)
        // 300.0 is an arbitrary scale factor to make points visible
        gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + twinkle * 0.5);

        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec3 vColor;

    void main() {
        // Basic circular particle, will be replaced with texture later
        if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.5 ) discard;
        gl_FragColor = vec4( vColor, 1.0 );
    }
`;

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

        this.uniforms = {
            uTime: { value: 0 }
        };

        this.colorThemes = [
            [new THREE.Color(0x00ff00), new THREE.Color(0xff0000), new THREE.Color(0xffff00)], // Classic (Green, Red, Yellow)
            [new THREE.Color(0xADD8E6), new THREE.Color(0x87CEEB), new THREE.Color(0xFFFFFF)], // Icy (LightBlue, SkyBlue, White)
            [new THREE.Color(0xFFD700), new THREE.Color(0xFFA500), new THREE.Color(0xFF8C00)]  // Warm (Gold, Orange, DarkOrange)
        ];
        this.currentThemeIndex = 0;
        
        this.generateParticles();
        this._applyTheme(this.colorThemes[this.currentThemeIndex]); // Apply initial theme
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
        const sizes = []; // New attribute for particle size
        const phases = []; // New attribute for twinkling phase
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

            sizes.push(0.05 + Math.random() * 0.02); // Vary size slightly
            phases.push(Math.random() * Math.PI * 2); // Random phase for twinkling
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1)); // Add size attribute
        geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1)); // Add phase attribute

        // Create the particle material and mesh
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.treeObject.add(this.particles);
    }

    // This method will return the Three.js object representing the tree
    getTreeObject() {
        return this.treeObject;
    }

    // This method will handle animation, e.g., rotation or particle effects
    animate(deltaTime) {
        this.uniforms.uTime.value += deltaTime; // Update uTime uniform


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

    // Cycles to the next color theme
    nextTheme() {
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.colorThemes.length;
        this._applyTheme(this.colorThemes[this.currentThemeIndex]);
    }

    // Applies a given theme to the particles
    _applyTheme(theme) {
        const colors = this.particles.geometry.attributes.color.array;
        const color = new THREE.Color();
        const tempColor = new THREE.Color(); // For interpolation

        for (let i = 0; i < this.particleCount; i++) {
            // Apply color based on theme. Simple: random color from theme palette
            // More complex: interpolate based on y-position or particle index
            const themeColor = theme[Math.floor(Math.random() * theme.length)];
            tempColor.set(themeColor); // Ensure it's a THREE.Color instance if coming from HSL/hex

            colors[i * 3] = tempColor.r;
            colors[i * 3 + 1] = tempColor.g;
            colors[i * 3 + 2] = tempColor.b;
        }
        this.particles.geometry.attributes.color.needsUpdate = true;
    }
}
