/* ---------- The snake: a single continuous colored tube winding through 3D
   space, threading behind the entire page. One mesh, one draw call, unlit
   (MeshBasicMaterial, no lighting cost) — replaces an earlier particle-dot
   version that didn't land. The camera travels along the tube's length as
   you scroll the whole document, so it reads as one continuous shape the
   page moves through rather than ambient background noise.

   Color runs along the tube's length via vertex colors, banded to echo the
   section you're approaching (gold near Categories, oxblood near Vendors/
   For Vendors and again at the Get Started finale) — the page's own section
   backgrounds carry most of the color now, this ties them together visually.

   Bails out cleanly with no canvas if WebGL/Three.js aren't available or the
   GPU is software-emulated, skipped entirely under prefers-reduced-motion,
   pauses via the Page Visibility API when the tab isn't active. ---------- */
(() => {
  const canvas = document.getElementById('siteScene');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduceMotion || !window.THREE) return;

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
  const TUNNEL_LENGTH = 90;
  const pixelRatioCap = isCompact ? 1.3 : 2;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200);
  camera.position.set(0, 0, 3);

  /* A wandering path — sine/cosine offsets in x/y as it travels down z —
     built from a handful of control points and smoothed into a curve. */
  const controlPoints = [];
  const SEGMENTS = 14;
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const z = -t * TUNNEL_LENGTH;
    const x = Math.sin(t * Math.PI * 3.4) * 4.2;
    const y = Math.cos(t * Math.PI * 2.6) * 2.6;
    controlPoints.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(controlPoints);
  const tubeGeometry = new THREE.TubeGeometry(curve, isCompact ? 160 : 260, isCompact ? 0.34 : 0.4, 8, false);

  /* Depth bands (0 = top of page, 1 = bottom) echo the page's own section
     order and its new section-background colors: intro -> categories(gold)
     -> vendors/for-vendors(oxblood) -> pricing/faq(neutral) -> get-started
     finale(oxblood). */
  const bands = [
    { end: 0.16, color: new THREE.Color(0xece2cd) },
    { end: 0.36, color: new THREE.Color(0x8a5c0c) },
    { end: 0.64, color: new THREE.Color(0x6b2337) },
    { end: 0.82, color: new THREE.Color(0xece2cd) },
    { end: 1.01, color: new THREE.Color(0x6b2337) },
  ];
  function colorForT(t) {
    const band = bands.find(b => t <= b.end) || bands[bands.length - 1];
    return band.color;
  }

  const uv = tubeGeometry.attributes.uv;
  const vertexCount = tubeGeometry.attributes.position.count;
  const colors = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    const c = colorForT(uv.getY(i));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  tubeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  const snake = new THREE.Mesh(tubeGeometry, material);
  scene.add(snake);

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

  /* Plain scroll listener (no GSAP/ScrollTrigger in this build) — the
     camera travels the tube's length in step with the whole document. */
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

    const travel = Math.min(0.985, scrollProgress);
    const point = curve.getPointAt(travel);
    const tangent = curve.getTangentAt(travel);

    camera.position.x = point.x + pointer.x * 1.4;
    camera.position.y = point.y - pointer.y * 1;
    camera.position.z = point.z + 3.2;
    camera.lookAt(point.x + tangent.x * 4, point.y + tangent.y * 4, point.z + tangent.z * 4);

    snake.rotation.z = Math.sin(t * 0.03) * 0.015;

    renderer.render(scene, camera);
  }

  function start() { if (rafId === null) animate(); }
  function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  start();
})();
