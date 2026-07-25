/* ---------- Site-wide particle field — one fixed full-page canvas threading
   behind every section instead of an isolated hero effect. A single Three.js
   Points cloud (one draw call, unlit, no lighting cost), camera dollying
   through it as you scroll the WHOLE document. Particle color is banded by
   depth so the field itself echoes the section you're approaching (gold
   around Categories, oxblood around Vendors/For Vendors and the finale).

   No GSAP/ScrollTrigger dependency — the editorial rebuild dropped those, so
   scroll progress here is just a plain rAF-throttled scroll listener.

   Bails out cleanly with no canvas if WebGL/Three.js aren't available or the
   GPU is software-emulated, skipped entirely under prefers-reduced-motion,
   and pauses via the Page Visibility API when the tab isn't active. ---------- */
(() => {
  const canvas = document.getElementById('siteScene');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduceMotion || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    return;
  }
  if (!renderer) return;

  try {
    const gl = renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererName = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    if (/swiftshader|llvmpipe|software/i.test(rendererName)) {
      renderer.dispose();
      return;
    }
  } catch (e) {
    /* assume the GPU is fine if the check itself fails */
  }

  const isCompact = window.matchMedia('(max-width: 720px)').matches;
  const COUNT = isCompact ? 380 : 700;
  const TUNNEL_LENGTH = 90;
  const pixelRatioCap = isCompact ? 1 : 1.4;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(0, 0, 2);

  function makeParticleTexture() {
    const size = 48;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /* Depth bands (0 = top of page, 1 = bottom) echo the page's own section
     order: intro -> categories(gold) -> vendors/for-vendors(oxblood) ->
     pricing/faq(neutral) -> get-started finale(oxblood). */
  const bands = [
    { end: 0.16, colors: [0xece2cd, 0x1c1712] },
    { end: 0.36, colors: [0x8a5c0c, 0xece2cd] },
    { end: 0.64, colors: [0x6b2337, 0x1c1712] },
    { end: 0.82, colors: [0xece2cd, 0x8a5c0c] },
    { end: 1.01, colors: [0x6b2337, 0x8a5c0c] },
  ];
  function colorForDepth(depthFraction) {
    const band = bands.find(b => depthFraction <= b.end) || bands[bands.length - 1];
    return new THREE.Color(band.colors[Math.random() < 0.5 ? 0 : 1]);
  }

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const radius = 3 + Math.random() * 9;
    const angle = Math.random() * Math.PI * 2;
    const z = -Math.random() * TUNNEL_LENGTH;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius * 0.6;
    positions[i * 3 + 2] = z;
    const c = colorForDepth(-z / TUNNEL_LENGTH);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: isCompact ? 0.5 : 0.62,
    map: makeParticleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const field = new THREE.Points(geometry, material);
  scene.add(field);

  function fitCanvas() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', e => {
      pointerTarget.x = e.clientX / window.innerWidth - 0.5;
      pointerTarget.y = e.clientY / window.innerHeight - 0.5;
    });
  }

  /* Plain scroll listener (no GSAP/ScrollTrigger in this build) — just a
     ratio of how far down the whole document you've scrolled. */
  let scrollProgress = 0;
  let scrollQueued = false;
  function updateScrollProgress() {
    scrollQueued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScrollProgress);
    }
  }, { passive: true });
  updateScrollProgress();

  const clock = new THREE.Clock();
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    pointer.x += (pointerTarget.x - pointer.x) * 0.03;
    pointer.y += (pointerTarget.y - pointer.y) * 0.03;

    camera.position.x = pointer.x * 1.2;
    camera.position.y = -pointer.y * 0.8;
    camera.position.z = 2 - scrollProgress * (TUNNEL_LENGTH - 6);
    camera.rotation.y = pointer.x * 0.12;
    camera.rotation.x = pointer.y * 0.08;

    field.rotation.z = t * 0.01;

    renderer.render(scene, camera);
  }

  function start() { if (rafId === null) animate(); }
  function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  start();
})();
