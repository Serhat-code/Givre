/* ============================================================
   GIVRÉ — WebGL Scene  (Awwwards Edition — ESM / Vite)
   • Mesh verre Fresnel + aberration chromatique
   • IBL procédural (environnement givré gradient)
   • Frost shader 4 octaves (croît après le preloader)
   • AO / shadow contact au sol
   • Camera reveal z:15→11 déclenché par givre:intro-start
   • Particules atmosphériques : poussière de glace flottante
   • Parallaxe souris en temps réel
   • Dissolution au scroll : flacon → nuage de givre (0→1 page entière)
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  /* ─── Fallback mobile / CPU faible ──────────────────────── */
  if (
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
  ) {
    canvas.style.display = 'none';
    return;
  }

  /* ─── Three.js en import dynamique ───────────────────────── */
  /* Vite isole Three.js dans un chunk séparé, téléchargé UNIQUEMENT quand
     cette branche s'exécute (desktop). Sur mobile / CPU faible / page sans
     <canvas>, on a déjà fait return ci-dessus → le ~123 Ko gzip n'est
     jamais chargé ni parsé. */
  import('three').then(function (THREE) {
    var WebGLRenderer     = THREE.WebGLRenderer,
        Scene             = THREE.Scene,
        PerspectiveCamera = THREE.PerspectiveCamera,
        Vector2           = THREE.Vector2,
        LatheGeometry     = THREE.LatheGeometry,
        ShaderMaterial    = THREE.ShaderMaterial,
        DoubleSide        = THREE.DoubleSide,
        AdditiveBlending  = THREE.AdditiveBlending,
        NormalBlending    = THREE.NormalBlending,
        Group             = THREE.Group,
        Mesh              = THREE.Mesh,
        BufferGeometry    = THREE.BufferGeometry,
        BufferAttribute   = THREE.BufferAttribute,
        Points            = THREE.Points,
        PlaneGeometry     = THREE.PlaneGeometry;

  /* ─── Renderer ───────────────────────────────────────────── */
  var renderer = new WebGLRenderer({ canvas: canvas, alpha: false, antialias: true });
  renderer.setClearColor(0x070810, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  var scene  = new Scene();
  var camera = new PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 15); /* z=15 → 11 révélé après preloader */

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, { passive: true });

  /* ─── Profil flacon (Byredo large + bouchon massif) ─────── */
  var profilePts = [
    new Vector2(0.000, -2.40),
    new Vector2(0.740, -2.40),
    new Vector2(0.770, -2.26),
    new Vector2(0.770, -2.05),
    new Vector2(0.762, -0.55),
    new Vector2(0.762,  0.00),
    new Vector2(0.762,  0.72),
    new Vector2(0.750,  1.02),
    new Vector2(0.680,  1.22),
    new Vector2(0.440,  1.44),
    new Vector2(0.225,  1.60),
    new Vector2(0.205,  1.70),
    new Vector2(0.205,  1.82),
    new Vector2(0.720,  1.94),
    new Vector2(0.735,  2.02),
    new Vector2(0.738,  3.10),
    new Vector2(0.720,  3.22),
    new Vector2(0.000,  3.22),
  ];

  var latheGeo = new LatheGeometry(profilePts, 128);

  /* ─── Déformation squircle n=4.5 → rectangle arrondi ─────── */
  (function squircleDeform(geo) {
    var arr = geo.attributes.position.array;
    var N = 4.5;
    for (var i = 0; i < arr.length; i += 3) {
      var x = arr[i], z = arr[i + 2];
      var r = Math.sqrt(x * x + z * z);
      if (r < 0.001) continue;
      var a = Math.atan2(z, x);
      var d = Math.pow(
        Math.pow(Math.abs(Math.cos(a)), N) + Math.pow(Math.abs(Math.sin(a)), N),
        1.0 / N
      );
      arr[i]     = (Math.cos(a) / d) * r;
      arr[i + 2] = (Math.sin(a) / d) * r;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  })(latheGeo);

  /* ─── SHADER VERRE + BOUCHON ─────────────────────────────── */
  var glassVert = [
    'uniform float uProgress;',
    'uniform float uTime;',
    'varying vec3  vNormal;',
    'varying vec3  vWorldPos;',
    'varying float vT;',
    'varying float vY;',
    'void main() {',
    /* Fragmentation très progressive : commence dès le scroll, s'étale sur toute la page */
    '  float t  = smoothstep(0.0, 0.92, uProgress);',
    '  vec3 rd  = vec3(position.x, position.y * 0.20, position.z);',
    '  float dl = length(rd);',
    '  vec3 dir = (dl > 0.001) ? (rd / dl) : vec3(0.0, 1.0, 0.0);',
    '  vec3 pos = position + dir * t * 3.0;',
    '  float mv = sin(uTime * 1.1 + position.y * 2.4) * 0.002 * position.y;',
    '  pos.y += mv * (1.0 - t);',
    '  float br = sin(uTime * 0.85 + position.y * 1.6) * 0.003 * (1.0 - t);',
    '  pos += normal * br;',
    '  vNormal   = normalize(mat3(modelMatrix) * normal);',
    '  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;',
    '  vT = t; vY = position.y;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
    '}',
  ].join('\n');

  var glassFrag = [
    'uniform vec3  uCamPos;',
    'uniform float uProgress;',
    'uniform float uFrost;',
    'varying vec3  vNormal;',
    'varying vec3  vWorldPos;',
    'varying float vT;',
    'varying float vY;',

    'float sp(vec3 L, vec3 N, vec3 V, float pw) {',
    '  return pow(max(dot(N, normalize(L + V)), 0.0), pw);',
    '}',
    'float h2(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
    '}',
    'float vn(vec2 p) {',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);',
    '}',

    /* IBL procédural */
    'vec3 envSample(vec3 R) {',
    '  float t = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);',
    '  return mix(vec3(0.04, 0.07, 0.14), vec3(0.70, 0.86, 1.00), t * t);',
    '}',

    'void main() {',
    '  vec3  N = normalize(vNormal);',
    '  vec3  V = normalize(uCamPos - vWorldPos);',
    '  vec3 R  = reflect(-V, N);',
    '  vec3 L0 = normalize(vec3( 5.0,  8.0,  4.0) - vWorldPos);',
    '  vec3 L1 = normalize(vec3(-4.5,  2.5, -4.0) - vWorldPos);',
    '  vec3 L2 = normalize(vec3(-1.5, -4.0,  4.5) - vWorldPos);',
    '  vec3 L3 = normalize(vec3( 0.5,  9.0,  2.0) - vWorldPos);',

    '  float ndotv = abs(dot(N, V));',
    '  float fres  = pow(1.0 - ndotv, 3.8);',
    '  float fres2 = pow(1.0 - ndotv, 1.4);',

    '  float ab      = fres * 0.018;',
    '  float fR      = pow(1.0 - max(ndotv - ab,   0.0), 3.8);',
    '  float fG      = pow(1.0 - ndotv,              3.8);',
    '  float fB      = pow(1.0 - max(ndotv + ab * 0.5, 0.0), 3.8);',
    '  vec3 rimAberr = vec3(fR * 0.85, fG * 0.88, fB * 1.00);',

    '  float s0 = sp(L0, N, V, 600.0);',
    '  float s1 = sp(L1, N, V, 120.0);',
    '  float s2 = sp(L2, N, V,  48.0);',
    '  float s3 = sp(L3, N, V, 320.0);',
    '  vec3 specular = vec3(1.00,1.00,1.00)*s0*1.20',
    '                + vec3(0.50,0.72,1.00)*s1*0.55',
    '                + vec3(0.75,0.88,1.00)*s2*0.18',
    '                + vec3(1.00,0.97,0.93)*s3*0.50;',

    '  vec3 ibl = envSample(R) * fres * 0.30;',

    '  vec3 glassBody = vec3(0.28,0.46,0.62)*(1.0-fres)*0.05',
    '                 + rimAberr',
    '                 + vec3(0.20,0.35,0.52)*fres2*0.07',
    '                 + specular + ibl;',
    '  float glassA = fres*0.85 + fres2*0.09 + s0*0.95+s1*0.45+s2*0.12+s3*0.50 + 0.012;',
    '  glassA = clamp(glassA,0.0,1.0);',

    /* Frost 4 octaves */
    '  float frostLine  = -2.4 + uFrost * 5.6;',
    '  float frostMask  = smoothstep(frostLine - 1.0, frostLine, vY);',
    '  float fn1 = vn(vWorldPos.xz * 6.0);',
    '  float fn2 = vn(vWorldPos.xz * 13.0) * 0.50;',
    '  float fn3 = vn(vWorldPos.xz * 24.0 + 7.3) * 0.15;',
    '  float fn4 = vn(vWorldPos.yz *  8.0) * 0.35;',
    '  float frostNoise = fn1 + fn2 + fn3 + fn4;',
    '  float crystal = smoothstep(0.80, 0.86, frostNoise) * frostMask * (1.0-vT) * fres2 * 0.55;',
    '  glassBody += vec3(0.82, 0.91, 1.00) * crystal;',
    '  glassA    += crystal * 0.40;',

    /* Bouchon */
    '  float dif0   = 0.62 + 0.38 * max(dot(N, L0), 0.0);',
    '  float dif1   = 0.38 + 0.35 * max(dot(N, L1), 0.0);',
    '  float dif    = max(dif0, dif1);',
    '  float sc0    = sp(L0, N, V, 90.0)*0.70;',
    '  float sc1    = sp(L1, N, V, 40.0)*0.35;',
    '  float sc3    = sp(L3, N, V,150.0)*0.45;',
    '  vec3 capBase = vec3(0.30, 0.56, 0.82);',
    '  vec3 capCol  = capBase * dif',
    '               + vec3(0.72,0.88,1.00)*(sc0+sc1+sc3)',
    '               + vec3(0.40,0.65,0.90)*pow(1.0-ndotv,2.2)*0.22',
    '               + envSample(R) * fres * 0.15;',
    '  float capFrost = smoothstep(0.82, 0.88, frostNoise) * frostMask * 0.20;',
    '  capCol += vec3(0.80, 0.92, 1.00) * capFrost;',

    '  float isCap = smoothstep(1.87, 1.96, vY);',
    '  vec3  col   = mix(glassBody, capCol, isCap);',
    '  float alpha = mix(glassA,    1.0,    isCap);',
    /* Verre disparaît très progressivement sur toute la hauteur de page */
    '  alpha *= 1.0 - smoothstep(0.0, 0.92, uProgress);',
    '  gl_FragColor = vec4(col, alpha);',
    '}',
  ].join('\n');

  var glassMat = new ShaderMaterial({
    vertexShader:   glassVert,
    fragmentShader: glassFrag,
    uniforms: {
      uProgress: { value: 0.0 },
      uTime:     { value: 0.0 },
      uCamPos:   { value: camera.position },
      uFrost:    { value: 0.0 },
    },
    transparent: true,
    side:        DoubleSide,
    depthWrite:  false,
    blending:    AdditiveBlending,
  });

  /* ─── Ombre contact (AO) sous le flacon ──────────────────── */
  var shadowMat = new ShaderMaterial({
    vertexShader: [
      'varying vec2 vUv;',
      'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    ].join('\n'),
    fragmentShader: [
      'varying vec2 vUv;',
      'void main() {',
      '  float d = length(vUv - 0.5) * 2.0;',
      '  float s = smoothstep(1.0, 0.0, d) * 0.45;',
      '  float e = smoothstep(0.6, 0.0, d) * 0.20;',
      '  gl_FragColor = vec4(0.0, 0.02, 0.06, s + e);',
      '}',
    ].join('\n'),
    transparent: true,
    depthWrite:  false,
    blending:    NormalBlending,
  });
  var shadowPlane = new Mesh(new PlaneGeometry(2.8, 1.6), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(1.5, -2.45, 0);
  scene.add(shadowPlane);

  /* ─── Groupe principal ───────────────────────────────────── */
  var bottleGroup = new Group();
  bottleGroup.position.set(1.5, -0.5, 0);
  scene.add(bottleGroup);
  bottleGroup.add(new Mesh(latheGeo, glassMat));

  /* ─── Particules dissolution au scroll ───────────────────── */
  var gArr   = latheGeo.attributes.position.array;
  var vCount = Math.floor(gArr.length / 3);
  var P      = Math.min(vCount, 9000);
  var stride = Math.max(1, Math.floor(vCount / P));
  var pOrig  = new Float32Array(P * 3);
  var pTarg  = new Float32Array(P * 3);
  var pDelay = new Float32Array(P);
  var pSize  = new Float32Array(P);
  var pCap   = new Float32Array(P);

  for (var i = 0; i < P; i++) {
    var vi = (i * stride) % vCount;
    var px = gArr[vi*3], py = gArr[vi*3+1], pz = gArr[vi*3+2];
    pOrig[i*3]   = px; pOrig[i*3+1] = py; pOrig[i*3+2] = pz;
    pCap[i]   = (py > 1.90) ? 1.0 : 0.0;
    pDelay[i] = Math.random();
    pSize[i]  = 1.2 + Math.random() * 3.5;

    /* Nuage de givre large : dérive très haut + forte expansion radiale */
    var radialR = Math.sqrt(px*px + pz*pz) + 0.01;
    var ang     = Math.atan2(pz, px) + (Math.random() - 0.5) * 1.2;
    var spread  = 2.0 + Math.random() * 6.0;
    var upDrift = (Math.random() > 0.08)
      ? (2.0 + Math.random() * 7.5)
      : -(0.5 + Math.random() * 2.5);

    pTarg[i*3]   = Math.cos(ang) * (radialR + spread);
    pTarg[i*3+1] = py + upDrift;
    pTarg[i*3+2] = Math.sin(ang) * (radialR + spread);
  }
  var pGeo = new BufferGeometry();
  pGeo.setAttribute('position', new BufferAttribute(pOrig.slice(), 3));
  pGeo.setAttribute('aOrig',    new BufferAttribute(pOrig,  3));
  pGeo.setAttribute('aTarg',    new BufferAttribute(pTarg,  3));
  pGeo.setAttribute('aDelay',   new BufferAttribute(pDelay, 1));
  pGeo.setAttribute('aSize',    new BufferAttribute(pSize,  1));
  pGeo.setAttribute('aIsCap',   new BufferAttribute(pCap,   1));

  var pMat = new ShaderMaterial({
    vertexShader: [
      'attribute vec3  aOrig; attribute vec3  aTarg;',
      'attribute float aDelay; attribute float aSize; attribute float aIsCap;',
      'uniform float uProg; uniform float uPR;',
      'varying float vA; varying float vCap;',
      'void main() {',
      /* Activation dès le début : décalage par particule jusqu'à 20 % du scroll */
      '  float stagger = aDelay * 0.20;',
      '  float t = clamp((uProg - stagger) / (1.0 - stagger + 0.001), 0.0, 1.0);',
      '  float e = t * t * (3.0 - 2.0 * t);',
      '  vec3 pos = mix(aOrig, aTarg, e);',
      '  vec4 mv  = modelViewMatrix * vec4(pos, 1.0);',
      '  gl_Position  = projectionMatrix * mv;',
      /* Les particules grossissent doucement à mesure qu'elles s'écartent */
      '  float sizeBoost = 1.0 + e * 1.2;',
      '  gl_PointSize = aSize * uPR * sizeBoost * (300.0 / max(-mv.z, 0.1));',
      /* Apparition douce étalée, reste en suspension légère */
      '  vA   = smoothstep(0.0, 0.28, uProg) * (1.0 - e * 0.12) * mix(0.22, 0.68, aDelay);',
      '  vCap = aIsCap;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying float vA; varying float vCap;',
      'void main() {',
      '  vec2 uv = gl_PointCoord - 0.5; float d = length(uv);',
      '  if (d > 0.5) discard;',
      '  float g    = 1.0 - smoothstep(0.0, 0.5,  d);',
      '  float core = 1.0 - smoothstep(0.0, 0.12, d);',
      '  vec3 cG = mix(vec3(0.40, 0.62, 0.82), vec3(0.92, 0.97, 1.00), core);',
      '  vec3 cC = mix(vec3(0.28, 0.52, 0.80), vec3(0.60, 0.82, 1.00), core);',
      '  gl_FragColor = vec4(mix(cG, cC, vCap), (g * 0.07 + core * 0.28) * vA);',
      '}',
    ].join('\n'),
    uniforms: { uProg: { value: 0.0 }, uPR: { value: Math.min(window.devicePixelRatio, 1.5) } },
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  bottleGroup.add(new Points(pGeo, pMat));

  /* ─── Particules atmosphériques — poussière de glace ──────── */
  var ATM     = 280;
  var atmOrig = new Float32Array(ATM * 3);
  var atmOff  = new Float32Array(ATM);
  var atmSpd  = new Float32Array(ATM);

  for (var j = 0; j < ATM; j++) {
    atmOrig[j*3]   = (Math.random() - 0.5) * 22;
    atmOrig[j*3+1] = (Math.random() - 0.5) * 16;
    atmOrig[j*3+2] = (Math.random() - 0.5) * 10 - 3;
    atmOff[j]      = Math.random();
    atmSpd[j]      = 0.04 + Math.random() * 0.06;
  }

  var atmGeo = new BufferGeometry();
  atmGeo.setAttribute('position', new BufferAttribute(atmOrig, 3));
  atmGeo.setAttribute('aOff',     new BufferAttribute(atmOff,  1));
  atmGeo.setAttribute('aSpd',     new BufferAttribute(atmSpd,  1));

  /* uProg alimente le bloom froid : particules s'intensifient avec le scroll */
  var atmMat = new ShaderMaterial({
    vertexShader: [
      'attribute float aOff; attribute float aSpd;',
      'uniform float uTime; uniform float uPR; uniform float uProg;',
      'varying float vOff; varying float vProg;',
      'void main() {',
      '  float y = mod(position.y + uTime * aSpd + aOff * 16.0, 18.0) - 9.0;',
      '  float x = position.x + sin(uTime * 0.25 + aOff * 6.28) * 0.45;',
      '  float z = position.z + cos(uTime * 0.18 + aOff * 4.12) * 0.28;',
      '  vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);',
      '  gl_Position  = projectionMatrix * mv;',
      /* Bloom froid subtil : particules atmosphériques s'étoffent avec le scroll */
      '  float bloom  = 1.0 + uProg * 2.0;',
      '  gl_PointSize = uPR * bloom * (1.1 + 0.7 * abs(sin(uTime * 2.2 + aOff * 6.28)));',
      '  vOff = aOff; vProg = uProg;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying float vOff; varying float vProg; uniform float uTime;',
      'void main() {',
      '  vec2 uv = gl_PointCoord - 0.5;',
      '  if (length(uv) > 0.5) discard;',
      '  float c  = 1.0 - smoothstep(0.0, 0.5, length(uv));',
      /* Opacité douce : brume de givre délicate */
      '  float tw = (0.07 + 0.13 * abs(sin(uTime * 2.2 + vOff * 6.28))) * (0.4 + vProg * 1.2);',
      '  gl_FragColor = vec4(0.72, 0.88, 1.00, c * tw);',
      '}',
    ].join('\n'),
    uniforms: {
      uTime: { value: 0.0 },
      uPR:   { value: Math.min(window.devicePixelRatio, 1.5) },
      uProg: { value: 0.0 },
    },
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  scene.add(new Points(atmGeo, atmMat));

  /* ─── Parallaxe souris ───────────────────────────────────── */
  var mouseTargX = 0, mouseTargY = 0;
  var mouseCurX  = 0, mouseCurY  = 0;

  document.addEventListener('mousemove', function (e) {
    mouseTargX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseTargY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ─── État animation ─────────────────────────────────────── */
  var smooth       = 0.0;   /* uProgress : 0 → 1 sur toute la hauteur de page */
  var autoRotY     = 0.0;
  var frostProg    = 0.0;   /* reste à 0 jusqu'à givre:intro-start */
  var cameraZ      = 15.0;
  var introStarted = false; /* verrou : intro ne joue pas pendant le preloader */
  var lastTs       = performance.now();

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Source de vérité unique : rend si l'onglet est visible ── */
  function updateLoop() {
    renderer.setAnimationLoop(document.hidden ? null : tick);
  }

  /* ── Boucle de rendu ─────────────────────────────────────── */
  function tick(ts) {
    var delta = Math.min((ts - lastTs) / 1000.0, 0.05);
    lastTs = ts;

    /* Dissolution scroll : lerp lent pour une transition très fluide */
    var pageH  = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    var target = Math.max(0.0, Math.min(1.0, window.scrollY / pageH));
    smooth += (target - smooth) * Math.min(1.0, delta * 2.2);

    /* Givre : croît seulement après que le preloader ait disparu */
    if (introStarted) {
      if (!reducedMotion) frostProg = Math.min(1.0, frostProg + delta / 4.0);
      else                frostProg = 1.0;
    }

    /* Reveal caméra : z=15 → 11, déclenché par givre:intro-start */
    if (introStarted && cameraZ > 11.0) {
      cameraZ = Math.max(11.0, cameraZ - delta * 2.8);
      camera.position.z = cameraZ;
    }

    /* Parallaxe souris */
    if (!reducedMotion) {
      mouseCurX += (mouseTargX - mouseCurX) * delta * 2.8;
      mouseCurY += (mouseTargY - mouseCurY) * delta * 2.8;
    }

    /* Rotation : légère accélération avec la dissolution */
    autoRotY += delta * (0.07 + smooth * 0.10);
    bottleGroup.rotation.y = autoRotY + mouseCurX * 0.28;
    bottleGroup.rotation.x = 0.04    + mouseCurY * -0.14;

    /* Légère dérive verticale du groupe : nuage monte avec le scroll */
    bottleGroup.position.y = -0.5 + smooth * 0.55;

    glassMat.uniforms.uProgress.value = smooth;
    glassMat.uniforms.uTime.value    += delta;
    glassMat.uniforms.uFrost.value    = frostProg;
    pMat.uniforms.uProg.value         = smooth;
    atmMat.uniforms.uTime.value      += delta;
    atmMat.uniforms.uProg.value       = smooth;

    renderer.render(scene, camera);
  }

  /* ── Démarrage de la boucle (frames initiales rendues, intro gelée) */
  renderer.setAnimationLoop(tick);

  /* ── Intro : frost + reveal caméra démarrés par le preloader ── */
  function startIntro() {
    introStarted = true;
    lastTs = performance.now();
  }
  /* Race-safe : Three.js étant async, le preloader a pu émettre l'évènement
     avant ce point. S'il a déjà posé .done, on démarre tout de suite. */
  var preloaderEl = document.getElementById('preloader');
  if (!preloaderEl || preloaderEl.classList.contains('done')) {
    startIntro();
  } else {
    document.addEventListener('givre:intro-start', startIntro, { once: true });
  }

  /* ── Pause quand l'onglet est masqué ─────────────────────── */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) lastTs = performance.now();
    updateLoop();
  });

  }).catch(function (err) {
    /* Si le chunk Three.js echoue a charger, on masque proprement le canvas */
    canvas.style.display = 'none';
    if (window.console && console.warn) console.warn('[givre] WebGL indisponible :', err);
  });

}());
