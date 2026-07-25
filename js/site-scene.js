/* ---------- Site-wide warp field: one fixed full-page canvas, one Three.js
   Points cloud (single draw call, no lighting) instead of per-section 3D
   objects. The camera dollies straight through a pre-placed field of
   brand-colored particles as you scroll the ENTIRE document — the same
   field threads behind every chapter instead of each section getting its
   own isolated effect. Colors are banded by depth so the field itself
   echoes the chapter you're about to reach (lime around Categories, cobalt
   around Vendors/For Vendors, coral toward Get Started).

   Deliberately unlit and single-object: this is the direct answer to "the
   site is laggy" — no per-object materials, no point lights, no clearcoat,
   just one geometry and one texture. Bails out cleanly with no visible
   canvas if WebGL/Three.js aren't available, and is skipped entirely under
   prefers-reduced-motion. ---------- */
(() => {
  const canvas = document.getElementById('siteScene');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduceMotion || !window.THREE) return;

  let renderer;
  try {
    /* antialias is wasted here — the particles are soft round sprites via a
       texture, not hard-edged geometry, so MSAA adds GPU cost for no visible
       benefit. */
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    return;
  }
  if (!renderer) return;

  /* Bail out entirely on a software/CPU-emulated GPU (e.g. hardware
     acceleration disabled, or a VM/remote desktop) — no amount of scene
     simplification fixes that, and rendering nothing beats rendering
     something unusably slow. */
  try {
    const gl = renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererName = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    if (/swiftshader|llvmpipe|software/i.test(rendererName)) {
      renderer.dispose();
      return;
    }
  } catch (e) {
    /* If the check itself fails, assume the GPU is fine and continue. */
  }

  const isCompact = window.matchMedia('(max-width: 720px)').matches;
  const COUNT = isCompact ? 450 : 800;
  const TUNNEL_LENGTH = 90;
  /* A full-viewport canvas's resolution is usually the single biggest GPU
     cost, well before particle count — kept deliberately conservative here
     rather than relying on devicePixelRatio at face value. */
  const pixelRatioCap = isCompact ? 1 : 1.5;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 200);
  camera.position.set(0, 0, 2);

  /* Soft round sprite drawn once on an offscreen canvas — no image asset needed. */
  function makeParticleTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /* Depth bands (0 = near camera start, 1 = far end) echoing the page's own
     chapter order: intro -> categories(lime) -> vendors/for-vendors(cobalt)
     -> pricing/faq(neutral) -> get-started(coral). */
  const bands = [
    { end: 0.18, colors: [0xf0ead9, 0x4cb05f] },
    { end: 0.34, colors: [0x4cb05f, 0x2a6d35] },
    { end: 0.66, colors: [0x136e79, 0x4fb3bf] },
    { end: 0.84, colors: [0xf0ead9, 0x4fb3bf] },
    { end: 1.01, colors: [0xe64562, 0xa63247] },
  ];
  function colorForDepth(depthFraction) {
    const band = bands.find(b => depthFraction <= b.end) || bands[bands.length - 1];
    const hex = band.colors[Math.random() < 0.5 ? 0 : 1];
    return new THREE.Color(hex);
  }

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const radius = 4 + Math.random() * 11;
    const angle = Math.random() * Math.PI * 2;
    const z = -Math.random() * TUNNEL_LENGTH;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius * 0.6;
    positions[i * 3 + 2] = z;

    const depthFraction = -z / TUNNEL_LENGTH;
    const c = colorForDepth(depthFraction);
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
    blending: THREE.AdditiveBlending,
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
      pointerTarget.x = (e.clientX / window.innerWidth - 0.5);
      pointerTarget.y = (e.clientY / window.innerHeight - 0.5);
    });
  }

  /* Camera travel is driven by progress across the WHOLE document, matching
     the existing top scroll-progress bar's own trigger, so the journey
     through the field spans the entire site rather than any one section. */
  let scrollProgress = 0;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => { scrollProgress = self.progress; },
    });
  }

  const clock = new THREE.Clock();
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);

    const t = clock.getElapsedTime();
    pointer.x += (pointerTarget.x - pointer.x) * 0.03;
    pointer.y += (pointerTarget.y - pointer.y) * 0.03;

    /* Direct rotation instead of camera.lookAt() every frame — lookAt()
       rebuilds a full orientation matrix from scratch each call; a plain
       rotation assignment is far cheaper and the parallax is subtle enough
       that the difference isn't visible. */
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
