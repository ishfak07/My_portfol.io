/* ============================================
   THREE.JS 3D IMMERSIVE BACKGROUND SCENE
   Particles + Wireframe Geometry + Scroll Camera
   ============================================ */
(function () {
  'use strict';

  // Wait for Three.js to load
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded');
    return;
  }

  /* ---------- CONFIG ---------- */
  var CONFIG = {
    particleCount: 600,
    particleFieldSize: 50,
    geometryCount: 7,
    mouseInfluence: 0.0004,
    scrollDepth: 30,
    colorPalette: {
      dark: {
        bg: 0x050508,
        particle1: new THREE.Color(0x7c3aed),
        particle2: new THREE.Color(0x06b6d4),
        particle3: new THREE.Color(0xf43f5e),
        wireframe: new THREE.Color(0x7c3aed),
        ambient: 0.15
      },
      light: {
        bg: 0xf8f8fc,
        particle1: new THREE.Color(0x6d28d9),
        particle2: new THREE.Color(0x0891b2),
        particle3: new THREE.Color(0xe11d48),
        wireframe: new THREE.Color(0x6d28d9),
        ambient: 0.06
      }
    }
  };

  /* ---------- SCENE SETUP ---------- */
  var canvas = document.getElementById('bg3d');
  if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 30);

  /* ---------- TARGET VALUES (smooth interpolation) ---------- */
  var mouse = { x: 0, y: 0 };
  var targetMouse = { x: 0, y: 0 };
  var scrollProgress = 0;
  var targetScrollProgress = 0;
  var clock = new THREE.Clock();

  /* ---------- PARTICLE SYSTEM ---------- */
  var particleGeometry = new THREE.BufferGeometry();
  var particlePositions = new Float32Array(CONFIG.particleCount * 3);
  var particleSpeeds = new Float32Array(CONFIG.particleCount);
  var particlePhases = new Float32Array(CONFIG.particleCount);
  var particleSizes = new Float32Array(CONFIG.particleCount);
  var particleColors = new Float32Array(CONFIG.particleCount * 3);

  for (var i = 0; i < CONFIG.particleCount; i++) {
    var i3 = i * 3;
    // Distribute in a spherical volume
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var r = Math.pow(Math.random(), 0.5) * CONFIG.particleFieldSize;

    particlePositions[i3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i3 + 2] = r * Math.cos(phi);

    particleSpeeds[i] = 0.2 + Math.random() * 0.8;
    particlePhases[i] = Math.random() * Math.PI * 2;
    particleSizes[i] = 0.5 + Math.random() * 2.5;

    // Color variety
    var colorChoice = Math.random();
    var col;
    if (colorChoice < 0.5) {
      col = CONFIG.colorPalette.dark.particle1;
    } else if (colorChoice < 0.8) {
      col = CONFIG.colorPalette.dark.particle2;
    } else {
      col = CONFIG.colorPalette.dark.particle3;
    }
    particleColors[i3] = col.r;
    particleColors[i3 + 1] = col.g;
    particleColors[i3 + 2] = col.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(particleSizes, 1));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  var particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uOpacity: { value: 0.7 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    vertexShader: [
      'attribute float aSize;',
      'uniform float uTime;',
      'uniform vec2 uMouse;',
      'uniform float uPixelRatio;',
      'varying vec3 vColor;',
      'varying float vOpacity;',
      'void main() {',
      '  vColor = color;',
      '  vec3 pos = position;',
      '  // Orbital motion',
      '  float angle = uTime * 0.1 + length(pos.xy) * 0.02;',
      '  float s = sin(angle) * 0.5;',
      '  float c = cos(angle) * 0.5;',
      '  pos.x += s;',
      '  pos.y += c;',
      '  pos.z += sin(uTime * 0.15 + pos.x * 0.05) * 1.5;',
      '  // Mouse influence',
      '  float distToCenter = length(pos.xy);',
      '  pos.x += uMouse.x * (30.0 - min(distToCenter, 30.0)) * 0.15;',
      '  pos.y += uMouse.y * (30.0 - min(distToCenter, 30.0)) * 0.15;',
      '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
      '  gl_PointSize = aSize * uPixelRatio * (80.0 / -mvPos.z);',
      '  gl_PointSize = max(gl_PointSize, 1.0);',
      '  gl_Position = projectionMatrix * mvPos;',
      '  vOpacity = smoothstep(100.0, 20.0, -mvPos.z);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float uOpacity;',
      'varying vec3 vColor;',
      'varying float vOpacity;',
      'void main() {',
      '  // Soft circle',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  float alpha = smoothstep(0.5, 0.1, d) * uOpacity * vOpacity;',
      '  // Glow effect',
      '  float glow = exp(-d * 4.0) * 0.5;',
      '  gl_FragColor = vec4(vColor + glow, alpha);',
      '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  var particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  /* ---------- CONNECTION LINES ---------- */
  var lineCount = 200;
  var lineGeometry = new THREE.BufferGeometry();
  var linePositions = new Float32Array(lineCount * 6);
  var lineColors = new Float32Array(lineCount * 6);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  var lineMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.12,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  /* ---------- WIREFRAME GEOMETRY ---------- */
  var wireframes = [];
  var geometryTypes = [
    function () { return new THREE.IcosahedronGeometry(2.5, 1); },
    function () { return new THREE.TorusKnotGeometry(1.8, 0.5, 64, 8, 2, 3); },
    function () { return new THREE.OctahedronGeometry(2, 1); },
    function () { return new THREE.TorusGeometry(2, 0.6, 12, 32); },
    function () { return new THREE.DodecahedronGeometry(2, 0); },
    function () { return new THREE.TetrahedronGeometry(2.5, 1); },
    function () { return new THREE.IcosahedronGeometry(3, 0); }
  ];

  for (var g = 0; g < CONFIG.geometryCount; g++) {
    var geo = geometryTypes[g % geometryTypes.length]();
    var wfMat = new THREE.MeshBasicMaterial({
      color: g % 2 === 0 ? 0x7c3aed : 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.08 + Math.random() * 0.07,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, wfMat);

    // Position in a ring around camera path
    var angle = (g / CONFIG.geometryCount) * Math.PI * 2;
    var radius = 15 + Math.random() * 20;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 20,
      -10 + Math.random() * -50
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    mesh.userData = {
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.008,
        z: (Math.random() - 0.5) * 0.003
      },
      floatSpeed: 0.3 + Math.random() * 0.5,
      floatAmp: 1 + Math.random() * 3,
      baseY: mesh.position.y,
      phase: Math.random() * Math.PI * 2
    };
    scene.add(mesh);
    wireframes.push(mesh);
  }

  /* ---------- NEBULA FOG PLANES ---------- */
  var nebulaGroup = new THREE.Group();
  for (var n = 0; n < 5; n++) {
    var nebulaGeo = new THREE.PlaneGeometry(40 + Math.random() * 30, 40 + Math.random() * 30);
    var nebulaMat = new THREE.MeshBasicMaterial({
      color: n % 3 === 0 ? 0x7c3aed : n % 3 === 1 ? 0x06b6d4 : 0xf43f5e,
      transparent: true,
      opacity: 0.015 + Math.random() * 0.01,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 30,
      -20 - Math.random() * 40
    );
    nebulaMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    nebulaMesh.userData = {
      rotSpeed: (Math.random() - 0.5) * 0.002,
      phase: Math.random() * Math.PI * 2
    };
    nebulaGroup.add(nebulaMesh);
  }
  scene.add(nebulaGroup);

  /* ---------- LIGHT RING (accent glow) ---------- */
  var ringGeo = new THREE.TorusGeometry(18, 0.08, 8, 100);
  var ringMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  var glowRing = new THREE.Mesh(ringGeo, ringMat);
  glowRing.position.z = -10;
  glowRing.rotation.x = Math.PI * 0.4;
  scene.add(glowRing);

  /* ---------- EVENT LISTENERS ---------- */
  window.addEventListener('mousemove', function (e) {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('scroll', function () {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    targetScrollProgress = docHeight > 0 ? window.scrollY / docHeight : 0;
  }, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  });

  /* ---------- THEME OBSERVER ---------- */
  function updateTheme() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var palette = isDark ? CONFIG.colorPalette.dark : CONFIG.colorPalette.light;

    // Update particle opacity
    particleMaterial.uniforms.uOpacity.value = isDark ? 0.7 : 0.45;

    // Update wireframe colors
    wireframes.forEach(function (wf, i) {
      wf.material.color.copy(i % 2 === 0 ? palette.wireframe : palette.particle2);
      wf.material.opacity = isDark ? 0.08 + Math.random() * 0.07 : 0.04 + Math.random() * 0.04;
    });

    // Update ring
    glowRing.material.opacity = isDark ? 0.15 : 0.06;
    ringMat.color.copy(palette.particle1);

    // Update line opacity
    lineMaterial.opacity = isDark ? 0.12 : 0.06;

    // Update nebula
    nebulaGroup.children.forEach(function (nb) {
      nb.material.opacity = isDark ? 0.015 + Math.random() * 0.01 : 0.008;
    });
  }

  // Watch for theme changes
  var themeObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.attributeName === 'data-theme') updateTheme();
    });
  });
  themeObserver.observe(document.documentElement, { attributes: true });
  updateTheme();

  /* ---------- UPDATE CONNECTION LINES ---------- */
  function updateLines() {
    var positions = particleGeometry.attributes.position.array;
    var lp = lineGeometry.attributes.position.array;
    var lc = lineGeometry.attributes.color.array;
    var lineIdx = 0;
    var maxDist = 8;

    // Sample nearby particles for connections
    for (var i = 0; i < CONFIG.particleCount && lineIdx < lineCount; i += 12) {
      for (var j = i + 12; j < CONFIG.particleCount && lineIdx < lineCount; j += 12) {
        var dx = positions[i * 3] - positions[j * 3];
        var dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        var dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          var li = lineIdx * 6;
          lp[li] = positions[i * 3];
          lp[li + 1] = positions[i * 3 + 1];
          lp[li + 2] = positions[i * 3 + 2];
          lp[li + 3] = positions[j * 3];
          lp[li + 4] = positions[j * 3 + 1];
          lp[li + 5] = positions[j * 3 + 2];

          var alpha = 1 - dist / maxDist;
          lc[li] = 0.49 * alpha; lc[li + 1] = 0.23 * alpha; lc[li + 2] = 0.93 * alpha;
          lc[li + 3] = 0.02 * alpha; lc[li + 4] = 0.71 * alpha; lc[li + 5] = 0.83 * alpha;
          lineIdx++;
        }
      }
    }

    // Zero out unused lines
    for (var k = lineIdx; k < lineCount; k++) {
      var ki = k * 6;
      lp[ki] = lp[ki + 1] = lp[ki + 2] = lp[ki + 3] = lp[ki + 4] = lp[ki + 5] = 0;
    }

    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  }

  /* ---------- ANIMATION LOOP ---------- */
  function animate() {
    requestAnimationFrame(animate);

    var elapsed = clock.getElapsedTime();
    var delta = clock.getDelta();

    // Smooth mouse interpolation
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    // Smooth scroll interpolation
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.03;

    // Update shader uniforms
    particleMaterial.uniforms.uTime.value = elapsed;
    particleMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Rotate particle field slowly
    particles.rotation.y = elapsed * 0.02 + mouse.x * 0.3;
    particles.rotation.x = Math.sin(elapsed * 0.01) * 0.1 + mouse.y * 0.2;

    // Scroll-linked camera movement
    camera.position.z = 30 - scrollProgress * CONFIG.scrollDepth;
    camera.position.y = scrollProgress * -5;
    camera.rotation.x = scrollProgress * -0.15 + mouse.y * 0.08;
    camera.rotation.y = mouse.x * 0.12;

    // Animate wireframe geometry
    wireframes.forEach(function (wf) {
      var ud = wf.userData;
      wf.rotation.x += ud.rotSpeed.x;
      wf.rotation.y += ud.rotSpeed.y;
      wf.rotation.z += ud.rotSpeed.z;
      wf.position.y = ud.baseY + Math.sin(elapsed * ud.floatSpeed + ud.phase) * ud.floatAmp;

      // Subtle breathing scale
      var breathe = 1 + Math.sin(elapsed * 0.5 + ud.phase) * 0.05;
      wf.scale.setScalar(breathe);
    });

    // Animate nebula planes
    nebulaGroup.children.forEach(function (nb) {
      nb.rotation.z += nb.userData.rotSpeed;
      nb.material.opacity = (Math.sin(elapsed * 0.3 + nb.userData.phase) * 0.5 + 0.5) * 0.025;
    });

    // Animate glow ring
    glowRing.rotation.z = elapsed * 0.05;
    glowRing.rotation.x = Math.PI * 0.4 + Math.sin(elapsed * 0.2) * 0.1;
    var ringPulse = 1 + Math.sin(elapsed * 0.8) * 0.03;
    glowRing.scale.setScalar(ringPulse);

    // Update connection lines periodically
    if (Math.floor(elapsed * 10) % 3 === 0) {
      updateLines();
    }

    renderer.render(scene, camera);
  }

  animate();

})();
