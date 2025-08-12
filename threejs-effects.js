class ThreeJSEffects {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.heart3D = null;
        this.floatingHearts = [];
        this.lightTrails = [];
        this.audioReactiveParticles = [];
        this.rainbowTrails = [];

        this.clock = new THREE.Clock();
        this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.audioContext = null;
        this.analyser = null;
        this.audioData = null;
        this.rainbowTimer = 0;
        
        this.init();
        this.createParticleSystem();
        this.createHeart3D();
        this.createGalaxyField();
        this.createFloatingHearts();
        this.createLightTrails();
        this.createAudioReactiveParticles();
        this.createRainbowTrails();
        this.createAmbientLights();
        this.setupAudioAnalyser();
        this.setupPostProcessing();
        this.animate();
        this.setupEventListeners();
    }

    init() {
        const canvas = document.getElementById('threejs-canvas');
        
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 1000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.z = 5;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        
        // Fog for depth
        this.scene.fog = new THREE.Fog(0x000000, 1, 50);
    }

    setupPostProcessing() {
        // Add bloom effect for glowing particles
        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        // Bloom pass for glow effects
        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(this.bloomPass);
    }

    createRainbowTrails() {
        const trailCount = this.isMobile ? 2 : 4;
        
        for (let i = 0; i < trailCount; i++) {
            const trailGeometry = new THREE.BufferGeometry();
            const points = [];
            const colors = [];
            
            for (let j = 0; j < 100; j++) {
                points.push(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );
                
                // Rainbow colors
                const hue = (j / 100) * 360;
                const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
                colors.push(color.r, color.g, color.b);
            }
            
            trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            const trailMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            trail.userData = {
                speed: Math.random() * 0.02 + 0.01,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                rotationSpeed: Math.random() * 0.01 + 0.005
            };
            
            this.scene.add(trail);
            this.rainbowTrails.push(trail);
        }
    }

    setupAudioAnalyser() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Connect to audio element
            const audioElement = document.getElementById('bg-audio');
            if (audioElement) {
                const source = this.audioContext.createMediaElementSource(audioElement);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
        } catch (error) {
            console.log('Audio analysis not available:', error);
        }
    }

    createAudioReactiveParticles() {
        const particleCount = this.isMobile ? 100 : 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            const color = new THREE.Color();
            color.setHSL(0.7 + Math.random() * 0.3, 0.9, 0.5 + Math.random() * 0.5);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                audioData: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                uniform float audioData;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Audio reactive movement
                    float audio = audioData * 0.1;
                    pos.x += sin(time * 2.0 + position.y * 0.5) * audio;
                    pos.y += cos(time * 1.5 + position.x * 0.5) * audio;
                    pos.z += sin(time * 3.0 + position.z * 0.5) * audio;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (1.0 + audio) * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.audioReactiveParticles.push(particles);
    }

    createParticleSystem() {
        const particleCount = this.isMobile ? 500 : 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Position
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

            // Color - pink to purple gradient
            const color = new THREE.Color();
            color.setHSL(0.8 + Math.random() * 0.2, 0.8, 0.6 + Math.random() * 0.4);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Size
            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Shader material for glowing particles
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vDistance;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vDistance = -mvPosition.z;
                    
                    // Add some movement
                    vec3 pos = position;
                    pos.x += sin(time * 0.5 + position.y * 0.1) * 0.1;
                    pos.y += cos(time * 0.3 + position.x * 0.1) * 0.1;
                    
                    vec4 finalPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -finalPosition.z);
                    gl_Position = projectionMatrix * finalPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vDistance;
                
                void main() {
                    float alpha = 1.0 - (vDistance / 50.0);
                    alpha = clamp(alpha, 0.0, 1.0);
                    
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    float alpha2 = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, alpha * alpha2);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, particleMaterial);
        this.scene.add(particles);
        this.particles.push(particles);
    }

    createHeart3D() {
        // Create heart shape using custom geometry
        const heartShape = new THREE.Shape();
        
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, 1, -1, 1.5, -1, 0.5);
        heartShape.bezierCurveTo(-1, -0.5, 0, -1, 0, 0);
        heartShape.bezierCurveTo(0, 1, 1, 1.5, 1, 0.5);
        heartShape.bezierCurveTo(1, -0.5, 0, -1, 0, 0);

        const geometry = new THREE.ExtrudeGeometry(heartShape, {
            depth: 0.2,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 2,
            bevelSize: 0.1,
            bevelThickness: 0.1
        });

        // Create glowing material
        const heartMaterial = new THREE.MeshPhongMaterial({
            color: 0xff69b4,
            emissive: 0xff1493,
            emissiveIntensity: 0.3,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        this.heart3D = new THREE.Mesh(geometry, heartMaterial);
        this.heart3D.position.set(0, 0, 2);
        this.heart3D.scale.set(0.5, 0.5, 0.5);
        this.scene.add(this.heart3D);

        // Add point light inside heart
        const heartLight = new THREE.PointLight(0xff69b4, 1, 10);
        heartLight.position.set(0, 0, 2);
        this.scene.add(heartLight);
    }

    createFloatingHearts() {
        const heartCount = this.isMobile ? 5 : 10;
        
        for (let i = 0; i < heartCount; i++) {
            const heartShape = new THREE.Shape();
            heartShape.moveTo(0, 0);
            heartShape.bezierCurveTo(0, 0.5, -0.5, 0.75, -0.5, 0.25);
            heartShape.bezierCurveTo(-0.5, -0.25, 0, -0.5, 0, 0);
            heartShape.bezierCurveTo(0, 0.5, 0.5, 0.75, 0.5, 0.25);
            heartShape.bezierCurveTo(0.5, -0.25, 0, -0.5, 0, 0);

            const geometry = new THREE.ExtrudeGeometry(heartShape, {
                depth: 0.1,
                bevelEnabled: true,
                bevelSegments: 2,
                steps: 1,
                bevelSize: 0.05,
                bevelThickness: 0.05
            });

            const material = new THREE.MeshPhongMaterial({
                color: 0xff1493,
                emissive: 0xff69b4,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.7
            });

            const heart = new THREE.Mesh(geometry, material);
            
            // Random position
            heart.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10 - 5
            );
            
            heart.scale.set(0.3, 0.3, 0.3);
            heart.userData = {
                speed: Math.random() * 0.02 + 0.01,
                rotationSpeed: Math.random() * 0.02 + 0.01,
                floatSpeed: Math.random() * 0.01 + 0.005
            };
            
            this.scene.add(heart);
            this.floatingHearts.push(heart);
        }
    }

    createLightTrails() {
        const trailCount = this.isMobile ? 3 : 6;
        
        for (let i = 0; i < trailCount; i++) {
            const trailGeometry = new THREE.BufferGeometry();
            const trailCount = 50;
            const positions = new Float32Array(trailCount * 3);
            const colors = new Float32Array(trailCount * 3);
            
            for (let j = 0; j < trailCount; j++) {
                positions[j * 3] = (Math.random() - 0.5) * 20;
                positions[j * 3 + 1] = (Math.random() - 0.5) * 20;
                positions[j * 3 + 2] = (Math.random() - 0.5) * 20;
                
                const color = new THREE.Color();
                color.setHSL(0.9 + Math.random() * 0.1, 0.8, 0.6 + Math.random() * 0.4);
                colors[j * 3] = color.r;
                colors[j * 3 + 1] = color.g;
                colors[j * 3 + 2] = color.b;
            }
            
            trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const trailMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending
            });
            
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            trail.userData = {
                speed: Math.random() * 0.01 + 0.005,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize()
            };
            
            this.scene.add(trail);
            this.lightTrails.push(trail);
        }
    }

    createAmbientLights() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light for shadows and depth
        const directionalLight = new THREE.DirectionalLight(0xff69b4, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Multiple colored point lights
        const colors = [0xff1493, 0xff69b4, 0xffb6c1, 0xffc0cb];
        for (let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(colors[i], 0.3, 20);
            light.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            light.userData = {
                speed: Math.random() * 0.01 + 0.005,
                radius: 10 + Math.random() * 10
            };
            this.scene.add(light);
        }
    }

    createGalaxyField() {
        const galaxyCount = this.isMobile ? 200 : 400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(galaxyCount * 3);
        const colors = new Float32Array(galaxyCount * 3);

        for (let i = 0; i < galaxyCount; i++) {
            // Spiral galaxy distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 15 + 5;
            const height = (Math.random() - 0.5) * 2;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius - 10;

            // Star colors - white to blue
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.1, 0.3, 0.8 + Math.random() * 0.2);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const galaxyMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const galaxy = new THREE.Points(geometry, galaxyMaterial);
        this.scene.add(galaxy);
        this.particles.push(galaxy);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Update audio data
        if (this.analyser && this.audioData) {
            this.analyser.getByteFrequencyData(this.audioData);
            const average = this.audioData.reduce((a, b) => a + b) / this.audioData.length;
            
            // Update audio reactive particles
            this.audioReactiveParticles.forEach(particles => {
                if (particles.material.uniforms) {
                    particles.material.uniforms.audioData.value = average / 255;
                }
            });
        }

        // Update particle uniforms
        this.particles.forEach(particles => {
            if (particles.material.uniforms) {
                particles.material.uniforms.time.value = time;
            }
            
            // Rotate particles
            particles.rotation.y = time * 0.1;
            particles.rotation.x = time * 0.05;
        });

        // Animate floating hearts
        this.floatingHearts.forEach(heart => {
            heart.rotation.y += heart.userData.rotationSpeed;
            heart.rotation.z += heart.userData.speed;
            heart.position.y += Math.sin(time * heart.userData.floatSpeed) * 0.01;
            heart.position.x += Math.cos(time * heart.userData.floatSpeed * 0.7) * 0.005;
        });

        // Animate light trails
        this.lightTrails.forEach(trail => {
            trail.position.add(trail.userData.direction.clone().multiplyScalar(trail.userData.speed));
            
            // Reset trail position when it goes too far
            if (trail.position.length() > 20) {
                trail.position.set(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );
            }
        });

        // Animate rainbow trails
        this.rainbowTrails.forEach(trail => {
            trail.position.add(trail.userData.direction.clone().multiplyScalar(trail.userData.speed));
            trail.rotation.y += trail.userData.rotationSpeed;
            
            if (trail.position.length() > 25) {
                trail.position.set(
                    (Math.random() - 0.5) * 25,
                    (Math.random() - 0.5) * 25,
                    (Math.random() - 0.5) * 25
                );
            }
        });



        // Animate heart
        if (this.heart3D) {
            this.heart3D.rotation.y = time * 0.5;
            this.heart3D.rotation.z = Math.sin(time) * 0.1;
            this.heart3D.scale.x = 0.5 + Math.sin(time * 2) * 0.05;
            this.heart3D.scale.y = 0.5 + Math.sin(time * 2) * 0.05;
            this.heart3D.scale.z = 0.5 + Math.sin(time * 2) * 0.05;
        }

        // Camera movement
        this.camera.position.x = Math.sin(time * 0.2) * 2;
        this.camera.position.y = Math.cos(time * 0.3) * 1;
        this.camera.lookAt(0, 0, 0);

        // Use composer for post-processing effects
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize Three.js effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThreeJSEffects();
});
