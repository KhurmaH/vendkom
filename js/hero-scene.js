/* ---------- Hero particle scene — deliberately the lightest version of this
   idea tried this session. Scoped to the hero only (not a full-page fixed
   canvas), a small unlit point cloud with no scroll-tied camera movement,
   just gentle idle drift and mouse parallax. Colors match the editorial
   palette (bone / ink / oxblood / gold).

   Bails out cleanly with no visible canvas if WebGL/Three.js aren't
   available or the GPU is software-emulated, and is skipped entirely under
   prefers-reduced-motion. Pauses its render loop whenever the hero scrolls
   out of view. ---------- */
(() => {
  const canvas = document.getElementById('heroScene');
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || !hero || reduceMotion || !window.THREE) return;

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
  const COUNT = isCompact ? 180 : 340;
  const pixelRatioCap = isCompact ? 1 : 1.4;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.set(0, 0, 10);

  function makeParticleTexture() {
    const size = 48;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  const palette = [0x6b2337, 0x8a5c0c, 0x1c1712, 0xece2cd];
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    const c = new THREE.Color(palette[i % palette.length]);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: isCompact ? 0.16 : 0.2,
    map: makeParticleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const field = new THREE.Points(geometry, material);
  scene.add(field);

  function fitCanvas() {
    const rect = hero.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      pointerTarget.x = (e.clientX - rect.left) / rect.width - 0.5;
      pointerTarget.y = (e.clientY - rect.top) / rect.height - 0.5;
    });
    hero.addEventListener('mouseleave', () => { pointerTarget.x = 0; pointerTarget.y = 0; });
  }

  const clock = new THREE.Clock();
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    pointer.x += (pointerTarget.x - pointer.x) * 0.04;
    pointer.y += (pointerTarget.y - pointer.y) * 0.04;

    field.rotation.y = t * 0.02 + pointer.x * 0.3;
    field.rotation.x = pointer.y * 0.2;

    renderer.render(scene, camera);
  }

  function start() { if (rafId === null) animate(); }
  function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  let isIntersecting = true;
  const syncRunState = () => (isIntersecting && !document.hidden) ? start() : stop();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => { isIntersecting = entry.isIntersecting; syncRunState(); });
    }, { threshold: 0 });
    io.observe(hero);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', syncRunState);
})();
