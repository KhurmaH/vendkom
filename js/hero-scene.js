/* ---------- Hero 3D scene: a small cluster of floating glass-like brand-colored
   shapes rendered with Three.js — real depth and lighting instead of a flat
   CSS gradient. Reacts to mouse (parallax) and scroll (camera push-through as
   you leave the hero). Bails out cleanly if WebGL/Three.js isn't available, and
   is skipped entirely under prefers-reduced-motion. ---------- */
(() => {
  const canvas = document.getElementById('heroScene');
  const heroSection = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || !heroSection || reduceMotion || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  if (!renderer) return;

  const isCompact = window.matchMedia('(max-width: 720px)').matches;
  const shapeCount = isCompact ? 6 : 10;
  const pixelRatioCap = isCompact ? 1.5 : 2;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const hemi = new THREE.HemisphereLight(0xfff6e8, 0x3a2f22, 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(4, 6, 6);
  scene.add(key);
  const limeLight = new THREE.PointLight(0x4cb05f, 6, 18);
  limeLight.position.set(-4, 2, 4);
  scene.add(limeLight);
  const coralLight = new THREE.PointLight(0xe64562, 6, 18);
  coralLight.position.set(4, -2, 3);
  scene.add(coralLight);
  const cobaltLight = new THREE.PointLight(0x4fb3bf, 4, 16);
  cobaltLight.position.set(0, 4, -2);
  scene.add(cobaltLight);

  const palette = [0x4cb05f, 0x136e79, 0xe64562, 0x4fb3bf, 0x2a6d35];
  const geometries = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.7, 0.26, 16, 64),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.SphereGeometry(0.8, 32, 32),
  ];

  const group = new THREE.Group();
  const shapes = [];
  for (let i = 0; i < shapeCount; i++) {
    const geo = geometries[i % geometries.length];
    const color = palette[i % palette.length];
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.15,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const scale = 0.45 + Math.random() * 0.55;
    mesh.scale.setScalar(scale);
    mesh.position.set(
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    group.add(mesh);
    shapes.push({
      mesh,
      baseY: mesh.position.y,
      spin: (Math.random() - 0.5) * 0.006,
      spinY: (Math.random() - 0.5) * 0.006,
      bobSpeed: 0.4 + Math.random() * 0.4,
      bobAmount: 0.15 + Math.random() * 0.2,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }
  scene.add(group);

  function fitCanvas() {
    const rect = heroSection.getBoundingClientRect();
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
    heroSection.addEventListener('mousemove', e => {
      const rect = heroSection.getBoundingClientRect();
      pointerTarget.x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      pointerTarget.y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    });
    heroSection.addEventListener('mouseleave', () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    });
  }

  /* Scroll progress across the same pinned span script.js uses for the hero,
     so the scene's push-through finishes exactly as the section releases. */
  let scrollProgress = 0;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: heroSection,
      start: 'top top',
      end: '+=45%',
      onUpdate: self => { scrollProgress = self.progress; },
    });
  }

  const clock = new THREE.Clock();
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);

    const t = clock.getElapsedTime();
    pointer.x += (pointerTarget.x - pointer.x) * 0.04;
    pointer.y += (pointerTarget.y - pointer.y) * 0.04;

    group.rotation.y = pointer.x * 0.5 + t * 0.03;
    group.rotation.x = -pointer.y * 0.3;

    shapes.forEach(s => {
      s.mesh.rotation.x += s.spin;
      s.mesh.rotation.y += s.spinY;
      s.mesh.position.y = s.baseY + Math.sin(t * s.bobSpeed + s.bobOffset) * s.bobAmount;
    });

    camera.position.z = 9 - scrollProgress * 4;
    group.rotation.z = scrollProgress * 0.6;
    const fade = 1 - scrollProgress * 0.9;
    group.children.forEach(mesh => { mesh.material.opacity = 0.88 * fade; });

    renderer.render(scene, camera);
  }

  function start() { if (rafId === null) animate(); }
  function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.isIntersecting ? start() : stop(); });
  }, { threshold: 0 });
  observer.observe(heroSection);
  start();
})();
