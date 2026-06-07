/* ============================================================
   GIVRÉ — Three.js Glass Bottle — Fresnel + Squircle
   ============================================================ */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') { console.error('Three.js manquant'); return; }
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) { console.error('Canvas introuvable'); return; }

  /* ── Renderer ─────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
  renderer.setClearColor(0x0a0a0a, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, { passive: true });

  /* ── Profil du flacon ─────────────────────────────────────
     Inspiré d'un flacon de luxe rectangulaire :
     base large → corps droit → épaule prononcée → col fin → bouchon
  ─────────────────────────────────────────────────────────── */
  const profile = [
    [0.00, -2.10],   // centre bas
    [0.52, -2.10],   // bord de la base (large)
    [0.55, -2.00],   // biseau base
    [0.53, -1.80],
    [0.51, -0.80],   // corps — relativement constant
    [0.51,  0.00],
    [0.51,  0.50],
    [0.50,  0.80],
    [0.44,  1.10],   // épaule — commence à rétrécir
    [0.22,  1.30],   // épaule brusque (angle marqué)
    [0.16,  1.38],   // départ col
    [0.15,  1.55],   // col
    [0.15,  1.68],   // fin col
    [0.24,  1.76],   // lèvre du bouchon
    [0.24,  2.08],   // corps du bouchon
    [0.20,  2.18],   // dessus bouchon biseauté
    [0.00,  2.18],   // centre dessus
  ];

  /* ── Squircle (superellipse n=4.5) ────────────────────────
     Donne une section rectangulaire aux coins arrondis
     plutôt qu'un cylindre rond → aspect flacon authentique
  ─────────────────────────────────────────────────────────── */
  const SQ_N = 4.5;

  function squirclePoint(angle, r) {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const d  = Math.pow(
      Math.pow(Math.abs(ca), SQ_N) + Math.pow(Math.abs(sa), SQ_N),
      1 / SQ_N
    );
    return { x: ca / d * r, z: sa / d * r };
  }

  function squircleNormal(angle) {
    // Dérivée de la superellipse → normale extérieure
    const ca = Math.cos(angle), sa = Math.sin(angle);
    let nx = Math.sign(ca) * Math.pow(Math.abs(ca), SQ_N - 1);
    let nz = Math.sign(sa) * Math.pow(Math.abs(sa), SQ_N - 1);
    const nl = Math.sqrt(nx * nx + nz * nz) || 1;
    return { nx: nx / nl, nz: nz / nl };
  }

  /* ── Génération des particules ────────────────────────── */
  const origArr   = [], targArr  = [];
  const normalArr = [], delayArr = [], sizeArr = [];

  function addParticle(x, y, z, nx, ny, nz, size) {
    origArr.push(x, y, z);
    normalArr.push(nx, ny, nz);
    sizeArr.push(size);
    delayArr.push(Math.random());

    // Position d'éclatement : vers l'extérieur + dérive aléatoire
    const hr    = Math.sqrt(x * x + z * z) + 0.01;
    const ang   = Math.atan2(z, x) + (Math.random() - 0.5) * 0.9;
    const push  = 3.5 + Math.random() * 9.0;
    const yBias = y > 0 ? 1.2 : -0.8;
    targArr.push(
      Math.cos(ang) * (hr + push),
      y + yBias * Math.random() * 3.5 + (Math.random() - 0.5) * 3.0,
      Math.sin(ang) * (hr + push)
    );
  }

  const SEG   = 7;   // subdivisions entre deux points de profil
  const RING  = 36;  // points par anneau (densité angulaire)

  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i + 1];

    for (let s = 0; s < SEG; s++) {
      const t  = s / SEG;
      const r  = r0 + (r1 - r0) * t;
      const y  = y0 + (y1 - y0) * t;
      const count = Math.max(8, Math.round(RING * (r / 0.55 + 0.15)));

      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2;
        const sq    = squirclePoint(angle, r);
        const nrm   = squircleNormal(angle);

        // Taille de particule plus grande aux coins (Fresnel anticipé en JS aussi)
        const cornerFactor = Math.pow(
          Math.pow(Math.abs(Math.cos(angle * 2)), 4) +
          Math.pow(Math.abs(Math.sin(angle * 2)), 4),
          0.25
        );
        const size = 1.0 + cornerFactor * 2.2 + Math.random() * 1.0;

        addParticle(sq.x, y, sq.z, nrm.nx, 0, nrm.nz, size);
      }
    }
  }

  // Face du bas (fond du flacon)
  for (let rStep = 0.05; rStep <= 0.52; rStep += 0.09) {
    const cnt = Math.max(4, Math.round(rStep * 50));
    for (let j = 0; j < cnt; j++) {
      const angle = (j / cnt) * Math.PI * 2;
      const sq    = squirclePoint(angle, rStep);
      addParticle(sq.x, -2.10, sq.z, 0, -1, 0, 1.0 + Math.random());
    }
  }

  // Face du dessus du bouchon
  for (let rStep = 0.04; rStep <= 0.20; rStep += 0.06) {
    const cnt = Math.max(4, Math.round(rStep * 60));
    for (let j = 0; j < cnt; j++) {
      const angle = (j / cnt) * Math.PI * 2;
      const sq    = squirclePoint(angle, rStep);
      addParticle(sq.x, 2.18, sq.z, 0, 1, 0, 1.0 + Math.random());
    }
  }

  // Reflets intérieurs — caustics simulés (qques particules à l'intérieur)
  for (let i = 0; i < 300; i++) {
    const ti   = Math.random();
    const pidx = Math.floor(ti * (profile.length - 1));
    const rMax = profile[Math.min(pidx, profile.length - 1)][0] * 0.6;
    const ri   = Math.random() * rMax;
    const ai   = Math.random() * Math.PI * 2;
    const yi   = profile[Math.min(pidx, profile.length - 1)][1];
    const sq   = squirclePoint(ai, ri);
    addParticle(sq.x, yi, sq.z, 0, 0, 0, 0.5 + Math.random() * 0.8);
  }

  console.log('GIVRÉ — particules verre:', origArr.length / 3);

  /* ── BufferGeometry ───────────────────────────────────── */
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',  new THREE.BufferAttribute(new Float32Array(origArr.slice()), 3));
  geo.setAttribute('aOrigPos',  new THREE.BufferAttribute(new Float32Array(origArr),  3));
  geo.setAttribute('aTargPos',  new THREE.BufferAttribute(new Float32Array(targArr),  3));
  geo.setAttribute('aNormal',   new THREE.BufferAttribute(new Float32Array(normalArr),3));
  geo.setAttribute('aDelay',    new THREE.BufferAttribute(new Float32Array(delayArr), 1));
  geo.setAttribute('aSize',     new THREE.BufferAttribute(new Float32Array(sizeArr),  1));

  /* ── Vertex Shader ────────────────────────────────────── */
  const vert = `
    attribute vec3  aOrigPos;
    attribute vec3  aTargPos;
    attribute vec3  aNormal;
    attribute float aDelay;
    attribute float aSize;

    uniform float uProg;
    uniform float uPR;
    uniform float uTime;

    varying float vFresnel;
    varying float vAlpha;
    varying float vProgress;

    float easeInOutCubic(float t) {
      return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t+2.0,3.0)*0.5;
    }

    void main() {
      float delay = aDelay * 0.45;
      float t = clamp((uProg - delay) / (1.0 - delay + 0.001), 0.0, 1.0);
      float e = easeInOutCubic(t);

      // Micro-oscillation au repos (s'éteint quand les particules partent)
      float bAmp = (1.0 - e) * 0.006;
      vec3 breath = vec3(
        sin(uTime * 0.72 + aDelay * 6.28) * bAmp,
        cos(uTime * 0.51 + aDelay * 3.14) * bAmp * 1.4,
        sin(uTime * 0.88 + aDelay * 4.71) * bAmp
      );

      vec3 pos = mix(aOrigPos + breath, aTargPos, e);

      // ── Fresnel (verre : transparent en face, brillant sur les bords) ──
      vec3 worldPos = (modelMatrix * vec4(aOrigPos, 1.0)).xyz;
      vec3 toCamera = normalize(cameraPosition - worldPos);

      // Normale de surface (horizontale pour le corps, verticale pour les faces)
      float hLen = length(aNormal.xz);
      vec3 nrm   = hLen > 0.01
                   ? normalize(vec3(aNormal.x, 0.0, aNormal.z))
                   : normalize(aNormal);

      float ndotv  = abs(dot(nrm, toCamera));
      vFresnel     = pow(1.0 - ndotv, 2.8);  // rebord brillant, face transparente

      vec4 mv      = modelViewMatrix * vec4(pos, 1.0);
      gl_Position  = projectionMatrix * mv;

      // Particules plus grosses sur les bords Fresnel
      float pSize  = aSize * (0.5 + vFresnel * 1.2);
      gl_PointSize = pSize * uPR * (360.0 / max(-mv.z, 0.1));

      vAlpha    = (1.0 - e * 0.95) * mix(0.55, 1.0, aDelay);
      vProgress = e;
    }
  `;

  /* ── Fragment Shader ──────────────────────────────────── */
  const frag = `
    varying float vFresnel;
    varying float vAlpha;
    varying float vProgress;

    void main() {
      vec2  uv   = gl_PointCoord - 0.5;
      float dist = length(uv);
      if (dist > 0.5) discard;

      // Forme de la particule : cercle doux avec cœur lumineux
      float halo = 1.0 - smoothstep(0.0, 0.50, dist);
      float core = 1.0 - smoothstep(0.0, 0.12, dist);

      // ── Couleurs verre ──────────────────────────────────
      // Corps du verre : bleu-vert très subtil, quasi invisible
      vec3 glassBody = vec3(0.38, 0.55, 0.65);
      // Bord Fresnel : reflet blanc-bleu glacé (lumière rasante)
      vec3 glassRim  = vec3(0.82, 0.92, 0.98);
      // Cœur de la caustic : blanc pur
      vec3 caustic   = vec3(1.00, 1.00, 1.00);

      vec3 col = mix(glassBody, glassRim,  vFresnel);
           col = mix(col,       caustic,   core * 0.6);

      // ── Alpha : verre = transparent en centre, opaque sur les bords ──
      float bodyAlpha    = halo  * 0.06;               // quasi invisible (verre)
      float fresnelAlpha = halo  * vFresnel * 0.70;    // rebords lumineux
      float coreAlpha    = core  * 0.50;               // cœur lumineux
      float a = (bodyAlpha + fresnelAlpha + coreAlpha) * vAlpha;

      // Légère extinction pendant la dispersion
      a *= (1.0 - vProgress * 0.4);

      gl_FragColor = vec4(col, a);
    }
  `;

  /* ── Matériau ─────────────────────────────────────────── */
  const mat = new THREE.ShaderMaterial({
    vertexShader:   vert,
    fragmentShader: frag,
    uniforms: {
      uProg: { value: 0.0 },
      uPR:   { value: Math.min(window.devicePixelRatio, 2) },
      uTime: { value: 0.0 },
    },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.rotation.x = 0.04;           // légère inclinaison
  points.position.x = 1.5;            // décalé à droite
  points.position.y = -0.1;
  scene.add(points);

  /* ── Boucle d'animation ───────────────────────────────── */
  let smooth = 0, lastTs = performance.now();

  function tick(ts) {
    requestAnimationFrame(tick);
    const delta = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    const pageH  = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const raw    = (window.scrollY - window.innerHeight * 0.08) / (pageH * 0.75);
    const target = Math.min(1.0, Math.max(0.0, raw));
    smooth += (target - smooth) * Math.min(1.0, delta * 5.5);

    mat.uniforms.uProg.value  = smooth;
    mat.uniforms.uTime.value += delta;

    // Rotation douce — accélère légèrement lors de l'éclatement
    points.rotation.y += delta * (0.10 + smooth * 0.65);

    renderer.render(scene, camera);
  }

  requestAnimationFrame(tick);

}());
