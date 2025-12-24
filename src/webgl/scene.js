import * as THREE from 'three';
import { ChristmasTree } from './tree.js';
import { SnowSystem } from './snow.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function setupScene(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); // Antialias often off for post-processing

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for high DPI

    camera.position.z = 5;

    // --- Lighting Setup ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 基础环境光
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2.0); // 降低强度至 2.0
    pointLight.position.set(3, 3, 3); // 稍微拉远
    scene.add(pointLight);

    // Frontal fill light for photos/ornaments
    const frontLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    frontLight.position.set(0, 2, 5);
    scene.add(frontLight);
    // ----------------------

    const christmasTree = new ChristmasTree(scene, camera);
    scene.add(christmasTree.getTreeObject());

    const snowSystem = new SnowSystem(scene, camera);

    // --- Starfield Setup ---
    const starVertexShader = `
        attribute float size;
        attribute float phase;
        varying float vAlpha;
        uniform float uTime;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            // Adjusted size: Visible but refined (was 100.0)
            gl_PointSize = size * (180.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            
            // Twinkle logic
            float twinkle = sin(uTime * 1.0 + phase) * 0.5 + 0.5;
            
            // Boosted visibility: Never fully invisible (was 0.1)
            // Range 0.3 to 0.8
            vAlpha = 0.3 + 0.5 * twinkle; 
        }
    `;

    const starFragmentShader = `
        varying float vAlpha;
        void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;
            
            // Soft glow for stars
            float strength = 1.0 - (dist * 2.0);
            strength = pow(strength, 2.5); // Slightly softer falloff
            
            // Brighter cool white (was 0.6) to pop against dark sky
            gl_FragColor = vec4(0.85, 0.9, 1.0, vAlpha * strength);
        }
    `;

    function createStarfield() {
        const starCount = 2500; 
        const geom = new THREE.BufferGeometry();
        const pos = [];
        const sizes = [];
        const phases = [];

        for(let i=0; i<starCount; i++) {
            // Push them much further away (Background sphere)
            const r = 50 + Math.random() * 40; 
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            pos.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            
            // Size distribution:
            // Math.pow(..., 4.0) creates a "Long Tail" distribution.
            // Most stars will be small (around 0.3), but a few will be much larger (up to 1.8).
            // This creates a realistic "constellation" feel.
            const sizeBase = 0.3 + Math.pow(Math.random(), 4.0) * 1.5;
            
            sizes.push(sizeBase);
            phases.push(Math.random() * Math.PI * 2);
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geom.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const stars = new THREE.Points(geom, mat);
        return stars;
    }

    const starfield = createStarfield();
    scene.add(starfield);
    // -----------------------

    // --- Post-Processing Setup ---
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2,  // strength
        0.8,  // radius 
        0.85  // threshold (was 0.5) - Strictly only for stars/glints
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    // -----------------------------

    // --- Background Setup ---
    function createNightSkyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Radial gradient
        const gradient = ctx.createRadialGradient(256, 200, 50, 256, 256, 400);
        // Deep Purple/Blue center to harmonize with pink tree
        gradient.addColorStop(0.0, '#1a1025'); 
        gradient.addColorStop(0.6, '#080510'); 
        gradient.addColorStop(1.0, '#000000'); 

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    scene.background = createNightSkyTexture();
    // ------------------------

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        christmasTree.animate(delta);
        snowSystem.animate(delta);
        
        // Update Stars
        if(starfield.material.uniforms) {
            starfield.material.uniforms.uTime.value = time;
        }

        composer.render();
    }

    animate();

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
        composer.setSize(width, height);
    });

    return { scene, camera, renderer, christmasTree, snowSystem };
}
