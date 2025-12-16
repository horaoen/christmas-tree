import * as THREE from 'three';

const vertexShader = `
    attribute float size;
    attribute float phase;
    
    uniform float uTime;
    uniform float uScatter; // Scatter intensity

    varying vec3 vColor;

    void main() {
        vColor = color;
        
        // Starry Sky Scatter Effect
        // Displace particles randomly based on phase when uScatter > 0
        vec3 noiseDir = normalize(vec3(
            sin(phase * 12.0),
            cos(phase * 7.0),
            sin(phase * 3.0)
        ));
        
        vec3 displacedPosition = position + noiseDir * uScatter * 3.0; // Scatter outwards

        vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );
        
        // Enhanced asynchronous twinkling
        // Mix a slow wave and a fast wave for more organic "shimmer"
        float twinkle = sin(uTime * 3.0 + phase) * 0.5 + 0.5;
        float pulse = sin(uTime * 1.0 + phase * 0.5) * 0.5 + 0.5;
        
        float scale = 0.8 + twinkle * 0.3 + pulse * 0.2;
        
        // Size attenuation
        gl_PointSize = size * (400.0 / -mvPosition.z) * scale;

        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec3 vColor;

    void main() {
        // Soft circular glow (Procedural Sprite)
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        // Discard outside circle
        if (dist > 0.5) discard;
        
        // Radial gradient: 1.0 at center, 0.0 at edge
        float strength = 1.0 - (dist * 2.0);
        strength = pow(strength, 2.0); // Make the core brighter and falloff sharper
        
        gl_FragColor = vec4( vColor, strength );
    }
`;

export class ChristmasTree {
    constructor(particleCount = 15000, treeHeight = 3, baseRadius = 1.2) {
        this.particleCount = particleCount; // Approximate total for foliage
        this.treeHeight = treeHeight;
        this.baseRadius = baseRadius;
        this.treeObject = new THREE.Object3D();
        
        this.foliagePoints = null;
        this.ornamentPoints = null;
        
        // Interaction targets
        this.targetRotationY = 0;
        this.currentScale = 1;
        this.targetScale = 1;

        this.uniforms = {
            uTime: { value: 0 },
            uScatter: { value: 0 }
        };

        this.colorThemes = [
            // Classic: Green foliage (handled in logic), Red/Gold/Yellow ornaments
            { name: 'Classic', ornaments: [new THREE.Color(0xff0000), new THREE.Color(0xFFD700), new THREE.Color(0xffff00)] },
            // Icy: Blue/White ornaments
            { name: 'Icy', ornaments: [new THREE.Color(0xADD8E6), new THREE.Color(0x00BFFF), new THREE.Color(0xFFFFFF)] },
            // Warm: Gold/Orange ornaments
            { name: 'Warm', ornaments: [new THREE.Color(0xFFD700), new THREE.Color(0xFFA500), new THREE.Color(0xFF4500)] }
        ];
        this.currentThemeIndex = 0;
        
        this.generateTree();
        this._applyTheme(this.colorThemes[this.currentThemeIndex]);
    }

    generateTree() {
        // Tree parameters
        const layerCount = 7;
        // Layers overlap significantly to look dense
        const layerHeight = this.treeHeight / 3.0; 
        
        const foliagePos = [];
        const foliageColors = [];
        const foliageSizes = [];
        const foliagePhases = [];

        const ornamentPos = [];
        const ornamentColors = [];
        const ornamentSizes = [];
        const ornamentPhases = [];
        
        const color = new THREE.Color();
        
        // Generate Layers
        for (let l = 0; l < layerCount; l++) {
            const t = l / (layerCount - 1); // 0 at bottom, 1 at top
            const layerY = (this.treeHeight * 0.8) * t; // Spread layers up
            const currentRadius = this.baseRadius * (1.0 - t * 0.8); // Radius tapers
            
            // Foliage for this layer
            // Distribute particles within the cone of this layer
            const particlesPerLayer = Math.floor(this.particleCount / layerCount);
            
            // Taper size near top to prevent glare
            // t goes from 0 (bottom) to 1 (top)
            const sizeFactor = 1.0 - t * 0.4; // 1.0 at bottom, 0.6 at top

            for (let i = 0; i < particlesPerLayer; i++) {
                // Random point in cone
                const h = Math.random() * layerHeight;
                const rRatio = Math.sqrt(Math.random()); // Even areal distribution
                const r = rRatio * currentRadius * (1 - h / layerHeight);
                const theta = Math.random() * Math.PI * 2;
                
                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                const y = layerY + h - this.treeHeight / 2; // Centered vertically

                // Add to foliage
                foliagePos.push(x, y, z);
                
                // Base Foliage Color (Varied Green)
                color.setHSL(0.3 + Math.random() * 0.05, 0.6 + Math.random() * 0.2, 0.3 + Math.random() * 0.2);
                foliageColors.push(color.r, color.g, color.b);
                
                foliageSizes.push((0.04 + Math.random() * 0.04) * sizeFactor);
                foliagePhases.push(Math.random() * Math.PI * 2);

                // Chance to add an ornament at the edge (surface)
                // Ornaments are denser at the tips of the branches (max radius for height)
                if (Math.random() < 0.03 && r > currentRadius * (1 - h / layerHeight) * 0.8) {
                     // Push ornament at the same position (or slightly out)
                     ornamentPos.push(x * 1.05, y, z * 1.05);
                     
                     // Placeholder color, will be set by theme
                     ornamentColors.push(1, 1, 1);
                     
                     ornamentSizes.push((0.12 + Math.random() * 0.05) * sizeFactor); // Larger
                     ornamentPhases.push(Math.random() * Math.PI * 2);
                }
            }
        }
        
        // --- Create Foliage Mesh ---
        const foliageGeo = new THREE.BufferGeometry();
        foliageGeo.setAttribute('position', new THREE.Float32BufferAttribute(foliagePos, 3));
        foliageGeo.setAttribute('color', new THREE.Float32BufferAttribute(foliageColors, 3));
        foliageGeo.setAttribute('size', new THREE.Float32BufferAttribute(foliageSizes, 1));
        foliageGeo.setAttribute('phase', new THREE.Float32BufferAttribute(foliagePhases, 1));
        
        const foliageMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.foliagePoints = new THREE.Points(foliageGeo, foliageMaterial);
        this.treeObject.add(this.foliagePoints);

        // --- Create Ornament Mesh ---
        const ornamentGeo = new THREE.BufferGeometry();
        ornamentGeo.setAttribute('position', new THREE.Float32BufferAttribute(ornamentPos, 3));
        ornamentGeo.setAttribute('color', new THREE.Float32BufferAttribute(ornamentColors, 3));
        ornamentGeo.setAttribute('size', new THREE.Float32BufferAttribute(ornamentSizes, 1));
        ornamentGeo.setAttribute('phase', new THREE.Float32BufferAttribute(ornamentPhases, 1));

        // Use same shader for now, will upgrade later
        const ornamentMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.ornamentPoints = new THREE.Points(ornamentGeo, ornamentMaterial);
        this.treeObject.add(this.ornamentPoints);
    }

    updateTargetRotation(delta) {
        this.targetRotationY += delta;
    }

    updateTargetScale(factor) {
        if (factor) {
            this.targetScale *= factor;
            // Clamp scale: Min 1.5 (Larger default), Max 8.0 (Deep Zoom)
            this.targetScale = Math.max(1.5, Math.min(8.0, this.targetScale));
        }
    }

    getTreeObject() {
        return this.treeObject;
    }

    animate(deltaTime) {
        this.uniforms.uTime.value += deltaTime;

        // Calculate Scatter Factor based on Scale
        // When scale > 2.0, start scattering. Smooth transition.
        // Scale 1.5 to 2.0 is "Solid Tree" zone.
        const scatter = Math.max(0.0, (this.currentScale - 2.0) * 0.8);
        this.uniforms.uScatter.value = scatter;

        this.treeObject.rotation.y = THREE.MathUtils.lerp(this.treeObject.rotation.y, this.targetRotationY, 0.1);
        
        // Heavy damping for smooth zoom (0.03)
        this.currentScale = THREE.MathUtils.lerp(this.currentScale, this.targetScale, 0.03);
        this.treeObject.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }

    reset() {
        this.targetScale = 1.5;
        this.targetRotationY = 0;
        this.currentScale = 1.5; // Optional: Snap immediately or let it lerp. Let's lerp for smoothness, so just setting target is enough.
        // Actually, if we want "force reset", maybe we should clear rotation accumulation?
        // But targetRotationY is absolute. So setting to 0 resets orientation.
    }

    nextTheme() {
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.colorThemes.length;
        this._applyTheme(this.colorThemes[this.currentThemeIndex]);
    }

    _applyTheme(themeObj) {
        if (!this.ornamentPoints) return;
        
        const colors = this.ornamentPoints.geometry.attributes.color.array;
        const themePalette = themeObj.ornaments;
        const color = new THREE.Color();
        const count = this.ornamentPoints.geometry.attributes.position.count;

        for (let i = 0; i < count; i++) {
            const targetColor = themePalette[i % themePalette.length];
            colors[i * 3] = targetColor.r;
            colors[i * 3 + 1] = targetColor.g;
            colors[i * 3 + 2] = targetColor.b;
        }
        this.ornamentPoints.geometry.attributes.color.needsUpdate = true;
    }
}
