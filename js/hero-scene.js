/* ---------- Hero blob scene — glossy overlapping spheres in the current
   brand colors (oxblood, gold, warm cream), lit for a soft liquid/plastic
   sheen rather than the faceted low-poly look of the earlier rejected
   attempt. Reference: glossy gradient "blob" hero graphics — a small
   cluster of large smooth shapes with soft studio lighting, not a field of
   small objects.

   Deliberately simple animation this time (idle rotation/bob + mouse
   parallax only, no scroll-driven camera) after the scroll-tied camera in
   the previous attempt read as disorienting. Scoped to the hero, positioned
   off to the side so it sits behind/beside the copy rather than under it.

   Bails out cleanly with no canvas if WebGL/Three.js aren't available or the
   GPU is software-emulated, skipped entirely under prefers-reduced-motion,
   pauses via IntersectionObserver + Page Visibility when not in view. ---------- */
(() => {
  const canvas = document.getElementById('heroScene');
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || !hero || reduceMotion || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0, 11);

  /* Soft studio lighting: warm hemisphere fill so shadows are never pure
     black, a bright warm key light for the glossy highlight, a cooler
     oxblood-tinted fill from the other side for a gradient-like blend
     across each sphere's surface. */
  scene.add(new THREE.HemisphereLight(0xf7ead0, 0x2a1016, 1.1));
  const key = new THREE.DirectionalLight(0xfff3d6, 1.7);
  key.position.set(5, 6, 8);
  scene.add(key);
  const fill = new THREE.PointLight(0x6b2337, 2.4, 30);
  fill.position.set(-6, -3, 4);
  scene.add(fill);
  const rim = new THREE.PointLight(0x8a5c0c, 1.6, 30);
  rim.position.set(2, -4, -3);
  scene.add(rim);

  /* Positions kept conservative on purpose: camera is at z=11 with a 42°
     FOV, so the visible half-width at z=0 is roughly 11*tan(21°) ≈ 4.2, and
     half-height is smaller still on a wide/short hero — every blob's final
     world position (group offset + local offset) stays well inside that so
     nothing clips off the edge of a real hero's aspect ratio. */
  const group = new THREE.Group();
  const blobDefs = [
    { radius: 2.0, color: 0x6b2337, x: 1.0, y: -0.3, z: 0 },
    { radius: 1.4, color: 0x8a5c0c, x: -0.8, y: 0.6, z: 1.2 },
    { radius: 1.0, color: 0xf7ead0, x: 1.8, y: 0.8, z: -1 },
    { radius: 0.7, color: 0x8a5c0c, x: 0.2, y: -1.0, z: 1.8 },
  ];
  const blobs = blobDefs.map(def => {
    const geo = new THREE.SphereGeometry(def.radius, isCompact ? 32 : 48, isCompact ? 32 : 48);
    const mat = new THREE.MeshPhysicalMaterial({
      color: def.color,
      roughness: 0.22,
      metalness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(def.x, def.y, def.z);
    group.add(mesh);
    return { mesh, baseY: def.y, bobSpeed: 0.3 + Math.random() * 0.25, bobAmount: 0.12 + Math.random() * 0.1, bobOffset: Math.random() * Math.PI * 2 };
  });
  group.position.set(1.6, -0.2, 0);
  scene.add(group);

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

    group.rotation.y = t * 0.05 + pointer.x * 0.25;
    group.rotation.x = pointer.y * 0.15;

    blobs.forEach(b => {
      b.mesh.position.y = b.baseY + Math.sin(t * b.bobSpeed + b.bobOffset) * b.bobAmount;
    });

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
