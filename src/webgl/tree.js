import * as THREE from 'three';

const vertexShader = `
    attribute float size;
    attribute float phase;
    
    uniform float uTime;
    uniform float uScatter; // Scatter intensity

    varying vec3 vColor;

    void main() {
        // Starry Sky Scatter Effect
        // Displace particles randomly based on phase when uScatter > 0
        vec3 noiseDir = normalize(vec3(
            sin(phase * 12.0),
            cos(phase * 7.0),
            sin(phase * 3.0)
        ));
        
        vec3 displacedPosition = position + noiseDir * uScatter * 0.6; // Scatter outwards

        vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );
        
        // Enhanced asynchronous twinkling
        // Mix a slow wave and a fast wave for more organic "shimmer"
        float twinkle = sin(uTime * 3.0 + phase) * 0.5 + 0.5;
        float pulse = sin(uTime * 1.0 + phase * 0.5) * 0.5 + 0.5;
        
        // Balanced brightness for soft glow
        vColor = color * (0.7 + 0.4 * twinkle);

        float scale = 0.8 + twinkle * 0.3 + pulse * 0.2;
        
        // Size attenuation
        gl_PointSize = size * (450.0 / -mvPosition.z) * scale;

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
        strength = pow(strength, 2.0); 
        
        // Balanced alpha: visible but not blinding
        strength *= 0.35; 

        gl_FragColor = vec4( vColor, strength );
    }
`;

const starFragmentShader = `
    varying vec3 vColor;
    uniform float uTime;

    // Signed distance to a 5-pointed star
    // p: coordinate (centered at 0)
    // r: radius of the star
    // rf: geometric factor (controls pointiness, ~0.5 is standard)
    float sdStar5(in vec2 p, in float r, in float rf)
    {
        const vec2 k1 = vec2(0.809016994375, -0.587785252292);
        const vec2 k2 = vec2(-k1.x,k1.y);
        p.x = abs(p.x);
        p -= 2.0*max(dot(k1,p),0.0)*k1;
        p -= 2.0*max(dot(k2,p),0.0)*k2;
        p.x = abs(p.x);
        p.y -= r;
        vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
        float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
        return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
    }

    void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        
        // Gentle rotation
        float angle = uTime * 0.5;
        float c = cos(angle);
        float s = sin(angle);
        uv = mat2(c, -s, s, c) * uv;

        // Generate sharp 5-pointed star shape
        float dist = sdStar5(uv, 0.7, 0.45);

        // Sharp edges
        float shape = 1.0 - smoothstep(0.0, 0.02, dist);

        // Make it semi-transparent (glassy look)
        // Slightly increased opacity from 0.6 to 0.75 per user request
        float alpha = shape * 0.35; 

        if (alpha < 0.01) discard;

        // Color logic
        vec3 finalColor = vColor;
        
        // Add a subtle rim highlight for a 3D glass effect
        // Highlighting the edges slightly more than the center
        float rim = (1.0 - smoothstep(0.0, 0.1, abs(dist))) * shape;
        finalColor += vec3(0.5) * rim;

        gl_FragColor = vec4(finalColor, alpha);
    }
`;

export class ChristmasTree {
    constructor(particleCount = 25000, treeHeight = 3, baseRadius = 1.2) {
        this.particleCount = particleCount; // Approximate total for foliage
        this.treeHeight = treeHeight;
        this.baseRadius = baseRadius;
        this.treeObject = new THREE.Object3D();

        this.foliagePoints = null;
        this.ornamentPoints = null;
        this.starPoint = null;

        // Interaction targets
        this.targetRotationY = 0;
        this.currentScale = 1;
        this.targetScale = 1;

        this.uniforms = {
            uTime: { value: 0 },
            uScatter: { value: 0 }
        };

        this.colorThemes = [
            // Pink & White: High contrast Deep Pink and Pure White
            { 
                name: 'PinkWhite', 
                foliage: [
                    new THREE.Color(0xFF1493), // Deep Pink (Rich color)
                    new THREE.Color(0xFFFFFF), // Pure White (Bright accent)
                    new THREE.Color(0xFF69B4), // Hot Pink (Vibrant)
                    new THREE.Color(0xFFFFFF), // Pure White (Balanced ratio)
                    new THREE.Color(0xFFB6C1)  // Light Pink (Soft transition)
                ],
                ornaments: [
                    new THREE.Color(0xFFFFFF), // White
                    new THREE.Color(0xFF1493), // Deep Pink
                    new THREE.Color(0xFFFFFF), // White (More ornaments)
                    new THREE.Color(0xFF69B4), // Hot Pink
                    new THREE.Color(0xFFD700)  // Gold accent
                ],
                star: new THREE.Color(0xFF1493) // Deep Pink Star
            },
            // Classic: Green foliage, Red/Gold/Yellow ornaments
            { 
                name: 'Colorful', 
                foliage: [new THREE.Color(0x2d5a27), new THREE.Color(0x3d7a36), new THREE.Color(0x1d3a19)],
                ornaments: [new THREE.Color(0xff0000), new THREE.Color(0x00ff00), new THREE.Color(0x0000ff), new THREE.Color(0xffff00), new THREE.Color(0x00ffff), new THREE.Color(0xff00ff)],
                star: new THREE.Color(0xff0000)
            },
            // Icy: White/Blue foliage and Blue/White ornaments
            { 
                name: 'Icy', 
                foliage: [new THREE.Color(0xffffff), new THREE.Color(0xe0ffff), new THREE.Color(0xadd8e6)],
                ornaments: [new THREE.Color(0xADD8E6), new THREE.Color(0x00BFFF), new THREE.Color(0xFFFFFF)],
                star: new THREE.Color(0x00BFFF)
            },
            // Warm: Green foliage and Gold/Orange ornaments
            { 
                name: 'Warm', 
                foliage: [new THREE.Color(0x2d5a27), new THREE.Color(0x3d7a36), new THREE.Color(0x1d3a19)],
                ornaments: [new THREE.Color(0xFFD700), new THREE.Color(0xFFA500), new THREE.Color(0xFF4500)],
                star: new THREE.Color(0xFFA500)
            }
        ];
        this.currentThemeIndex = 0;

        this.generateTree();
        this._applyTheme(this.colorThemes[this.currentThemeIndex]);
    }

    generateTree() {
        // ... (rest of generateTree stays the same, I already modified the beginning in the previous step)
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

                // Initial Base Foliage Color (Placeholder, will be overwritten by _applyTheme)
                foliageColors.push(1, 1, 1);

                foliageSizes.push((0.025 + Math.random() * 0.03) * sizeFactor);
                foliagePhases.push(Math.random() * Math.PI * 2);

                // Chance to add an ornament at the edge (surface)
                // Ornaments are denser at the tips of the branches (max radius for height)
                if (Math.random() < 0.12 && r > currentRadius * (1 - h / layerHeight) * 0.8) {
                    // Push ornament at the same position (or slightly out)
                    ornamentPos.push(x * 1.05, y, z * 1.05);

                    // Placeholder color, will be set by theme
                    ornamentColors.push(1, 1, 1);

                    ornamentSizes.push((0.09 + Math.random() * 0.04) * sizeFactor); // Larger
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

        // --- Create Star Mesh (Top of Tree) ---
        const starPos = [0, this.treeHeight / 2 + 0.35, 0]; // Keep high position
        const starColors = [1.0, 0.1, 0.3]; // Ruby Red, distinct from tree
        const starSizes = [0.8]; // Increased size to show shape clearly
        const starPhases = [0.0];

        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        starGeo.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
        starGeo.setAttribute('phase', new THREE.Float32BufferAttribute(starPhases, 1));

        const starMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: starFragmentShader,
            vertexColors: true,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        this.starPoint = new THREE.Points(starGeo, starMaterial);
        this.treeObject.add(this.starPoint);
    }

    updateTargetRotation(delta) {
        this.targetRotationY += delta;
    }

    updateTargetScale(factor) {
        if (factor) {
            // factor is the pinchRatio. When 1, scale is 1.5. When it shrinks, scale grows.
            this.targetScale = 1.5 / factor;
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
        // Update Ornaments
        if (this.ornamentPoints) {
            const colors = this.ornamentPoints.geometry.attributes.color.array;
            const themePalette = themeObj.ornaments;
            const count = this.ornamentPoints.geometry.attributes.position.count;

            for (let i = 0; i < count; i++) {
                const targetColor = themePalette[i % themePalette.length];
                colors[i * 3] = targetColor.r;
                colors[i * 3 + 1] = targetColor.g;
                colors[i * 3 + 2] = targetColor.b;
            }
            this.ornamentPoints.geometry.attributes.color.needsUpdate = true;
        }

        // Update Foliage
        if (this.foliagePoints && themeObj.foliage) {
            const colors = this.foliagePoints.geometry.attributes.color.array;
            const themePalette = themeObj.foliage;
            const count = this.foliagePoints.geometry.attributes.position.count;

            for (let i = 0; i < count; i++) {
                const targetColor = themePalette[i % themePalette.length];
                // Add a little randomness to the foliage color within the theme
                const variance = Math.random() * 0.1 - 0.05;
                colors[i * 3] = Math.max(0, Math.min(1, targetColor.r + variance));
                colors[i * 3 + 1] = Math.max(0, Math.min(1, targetColor.g + variance));
                colors[i * 3 + 2] = Math.max(0, Math.min(1, targetColor.b + variance));
            }
            this.foliagePoints.geometry.attributes.color.needsUpdate = true;
        }

        // Update Star
        if (this.starPoint && themeObj.star) {
            const colors = this.starPoint.geometry.attributes.color.array;
            colors[0] = themeObj.star.r;
            colors[1] = themeObj.star.g;
            colors[2] = themeObj.star.b;
            this.starPoint.geometry.attributes.color.needsUpdate = true;
        }
    }
}
