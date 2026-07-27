/* ==========================================================================
   Vendkom — motion layer

   The hero centrepiece is a real 3D deck: three listing cards on separate Z
   planes inside one shared perspective. The cursor rotates the whole deck and
   simultaneously pushes each card by an amount scaled to its depth, so the
   near card travels further than the far one — that differential is what
   reads as depth rather than a flat image tilting.

   Performance rules held throughout, since earlier builds stuttered:
     · Nothing is WebGL. Every animated property is a transform or opacity.
     · Every scrubbed onUpdate caches its last written value and early-returns,
       because scrub callbacks fire on every tick and an unguarded textContent
       write forces a synchronous layout each time.
     · All pointer handlers use gsap.quickTo (one reusable tween per property)
       and are registered passive.
     · ScrollTrigger refreshes after fonts and load so pins never resolve
       against stale offsets.
   ========================================================================== */

document.querySelectorAll('.year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Preloader — must always resolve, even if GSAP never loads ---------- */
const preloader = document.getElementById('preloader');
let heroRevealCallbacks = [];
if (preloader) {
  const countEl = document.getElementById('preloaderCount');
  const markPath = preloader.querySelector('.preloader-mark path');
  const reduceMotionEarly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.style.overflow = 'hidden';

  let safetyTimer;
  const finishPreload = () => {
    clearTimeout(safetyTimer);
    if (preloader.classList.contains('is-done')) return;
    preloader.classList.add('is-done');
    document.body.style.overflow = '';
    heroRevealCallbacks.forEach(fn => fn());
    heroRevealCallbacks = [];
    setTimeout(() => preloader.remove(), 1100);
  };

  if (window.gsap && !reduceMotionEarly) {
    const counter = { val: 0 };
    if (markPath) {
      gsap.fromTo(markPath, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' });
    }
    let lastPct = -1;
    gsap.to(counter, {
      val: 100, duration: 1.4, ease: 'power2.inOut',
      onUpdate: () => {
        const pct = Math.round(counter.val);
        if (pct === lastPct || !countEl) return;
        lastPct = pct;
        countEl.textContent = `${pct}%`;
      },
      onComplete: finishPreload,
    });
  } else {
    if (countEl) countEl.textContent = '100%';
    finishPreload();
  }
  safetyTimer = setTimeout(finishPreload, 4000);
}

/* ---------- Chapter rail ---------- */
const chapterRail = document.getElementById('chapterRail');
if (chapterRail && 'IntersectionObserver' in window) {
  const dots = Array.from(chapterRail.querySelectorAll('i[data-rail-for]'));
  const map = new Map();
  dots.forEach(dot => {
    const section = document.getElementById(dot.dataset.railFor);
    if (section) map.set(section, dot);
  });
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const active = map.get(entry.target);
      dots.forEach(dot => dot.classList.toggle('active', dot === active));
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  map.forEach((_, section) => spy.observe(section));
}

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());

  gsap.to('#scrollProgressFill', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  /* ---------- Custom cursor ---------- */
  const cursorDot = document.getElementById('cursorDot');
  if (cursorDot && finePointer) {
    const cx = gsap.quickTo(cursorDot, 'x', { duration: 0.35, ease: 'power3.out' });
    const cy = gsap.quickTo(cursorDot, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.querySelectorAll(
      '.submit-cta, .form-field input, .form-field select, .form-field textarea, .index-row, .plan, .faq-item, .vendor-row, .step, .benefit, .deck-card'
    ).forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(cursorDot, { scale: 3, duration: 0.25, ease: 'power2.out' }));
      el.addEventListener('mouseleave', () => gsap.to(cursorDot, { scale: 1, duration: 0.3, ease: 'power2.out' }));
    });
  } else if (cursorDot) {
    cursorDot.style.display = 'none';
  }

  const onHeroReveal = fn => { if (preloader) heroRevealCallbacks.push(fn); else fn(); };

  /* ======================================================================
     THE 3D DECK
     ====================================================================== */
  const deckStage = document.getElementById('deckStage');
  const deck = document.getElementById('deck');
  const deckCards = gsap.utils.toArray('.deck-card');

  if (deck && deckCards.length) {
    /* Resting fan. Each card also carries a data-depth translateZ, so they
       occupy genuinely different planes inside the stage's perspective. */
    const layout = [
      { x: -108, y: -40, rz: -9,  drift: 12 },
      { x: 4,    y: 8,   rz: 1.5, drift: 26 },
      { x: 112,  y: 54,  rz: 8,   drift: 42 },
    ];

    const setters = deckCards.map((card, i) => {
      const L = layout[i] || layout[0];
      const z = parseFloat(card.dataset.depth) || 0;
      gsap.set(card, { z, x: L.x, y: L.y, rotationZ: L.rz });
      return {
        base: L,
        x: gsap.quickTo(card, 'x', { duration: 0.85, ease: 'power2.out' }),
        y: gsap.quickTo(card, 'y', { duration: 0.85, ease: 'power2.out' }),
      };
    });

    if (!reduceMotion) {
      onHeroReveal(() => {
        gsap.from(deckCards, {
          opacity: 0,
          yPercent: 26,
          rotationX: -18,
          duration: 1.3,
          ease: 'power3.out',
          stagger: 0.13,
        });
        gsap.from('.deck-glow', { opacity: 0, duration: 1.8, ease: 'none' });
      });
    }

    if (finePointer && !reduceMotion && deckStage) {
      const rotY = gsap.quickTo(deck, 'rotationY', { duration: 0.85, ease: 'power2.out' });
      const rotX = gsap.quickTo(deck, 'rotationX', { duration: 0.85, ease: 'power2.out' });

      /* Deepest layer moves least — the drift ladder across backdrop → cards
         is what sells the depth. */
      const heroBackdrop = document.getElementById('heroBackdrop');
      const bdX = heroBackdrop ? gsap.quickTo(heroBackdrop, 'x', { duration: 1.1, ease: 'power2.out' }) : null;

      /* One handler drives the container rotation and every card's offset.
         Cards nearer the viewer get a larger drift, which is the whole
         illusion — parallax between planes, not a single flat tilt.
         Bound to the hero so the deck reacts before the cursor is over it. */
      const heroEl = document.querySelector('.hero');
      const driver = heroEl || deckStage;

      driver.addEventListener('mousemove', e => {
        const r = driver.getBoundingClientRect();
        const rx = (e.clientX - r.left) / r.width - 0.5;
        const ry = (e.clientY - r.top) / r.height - 0.5;

        rotY(rx * 26);
        rotX(-ry * 18);

        setters.forEach(s => {
          s.x(s.base.x + rx * s.base.drift);
          s.y(s.base.y + ry * s.base.drift * 0.6);
        });

        if (bdX) bdX(rx * -18);
      }, { passive: true });

      driver.addEventListener('mouseleave', () => {
        rotY(0);
        rotX(0);
        setters.forEach(s => { s.x(s.base.x); s.y(s.base.y); });
        if (bdX) bdX(0);
      });
    }
  }

  if (!reduceMotion) {
    /* ---------- Hero copy entrance + pinned exit ---------- */
    onHeroReveal(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero .kicker', { opacity: 0, y: 20, duration: 0.7 })
        .from('.hero h1', { opacity: 0, y: 48, duration: 1.1 }, '-=0.45')
        .from('.hero-sub', { opacity: 0, y: 26, duration: 0.9 }, '-=0.8')
        .from('.hero-trust li', { opacity: 0, y: 16, duration: 0.7, stagger: 0.09 }, '-=0.65')
        .from('.scroll-cue', { opacity: 0, duration: 0.7 }, '-=0.5');
    });

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: heroSection, start: 'top top', end: '+=70%', scrub: 0.6, pin: true },
      });
      tl.to('.hero-copy', { opacity: 0, y: -70, ease: 'none' }, 0)
        .to('.category-marquee', { opacity: 0, ease: 'none' }, 0)
        .to('.hero-backdrop', { opacity: 0, scale: 1.1, ease: 'none' }, 0);
      if (deck) tl.to(deck, { y: -70, scale: 1.06, opacity: 0.2, ease: 'none' }, 0);
    }

    /* ---------- Shared band-head entrance ---------- */
    document.querySelectorAll('.band-head, .close-head').forEach(head => {
      gsap.from(head, {
        opacity: 0, y: 36, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: head, start: 'top 84%', toggleActions: 'play none none none' },
      });
    });

    /* ---------- 01 — steps rise; sticky label tracks which path you're in ---------- */
    document.querySelectorAll('.path-block').forEach(block => {
      gsap.from(block.querySelectorAll('.step'), {
        y: 44, opacity: 0, duration: 0.95, ease: 'power3.out', stagger: 0.13,
        scrollTrigger: { trigger: block, start: 'top 80%', toggleActions: 'play none none none' },
      });
    });
    const pathSwitch = document.getElementById('pathSwitch');
    if (pathSwitch) {
      const marks = Array.from(pathSwitch.querySelectorAll('span'));
      const setLive = key => {
        marks.forEach(m => m.classList.toggle('is-live', m.dataset.path === key));
      };
      setLive('organizer');
      ['organizer', 'vendor'].forEach(key => {
        const block = document.getElementById(`path-${key}`);
        if (!block) return;
        ScrollTrigger.create({
          trigger: block,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => setLive(key),
          onEnterBack: () => setLive(key),
        });
      });
    }

    /* ---------- 02 — index rows rise ---------- */
    gsap.from('.index-row', {
      opacity: 0, y: 34, duration: 0.85, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.index-list', start: 'top 82%', toggleActions: 'play none none none' },
    });

    /* ---------- 03 — vendor rows: alternate entry side + image parallax ---------- */
    gsap.utils.toArray('.vendor-row').forEach((row, i) => {
      gsap.from(row, {
        opacity: 0, x: i % 2 === 0 ? -50 : 50, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 84%', toggleActions: 'play none none none' },
      });
      const img = row.querySelector('.vendor-media img');
      if (img) {
        gsap.fromTo(img,
          { yPercent: -5 },
          {
            yPercent: 5, ease: 'none',
            scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
      }
    });

    /* ---------- 04 — counters, benefit tick-off, dashboard bars ---------- */
    document.querySelectorAll('[data-count-to]').forEach(el => {
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.countSuffix || '';
      const counter = { val: 0 };
      let last = -1;
      gsap.to(counter, {
        val: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        onUpdate: () => {
          const v = Math.round(counter.val);
          if (v === last) return;
          last = v;
          el.textContent = v + suffix;
        },
      });
    });

    const benefitGrid = document.getElementById('benefitGrid');
    if (benefitGrid) {
      const benefits = Array.from(benefitGrid.querySelectorAll('.benefit'));
      gsap.from(benefits, {
        opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: benefitGrid, start: 'top 82%', toggleActions: 'play none none none' },
      });
      /* Cached: without this the six class toggles would re-run on every tick */
      let lastDone = -1;
      ScrollTrigger.create({
        trigger: benefitGrid,
        start: 'top 72%',
        end: 'bottom 62%',
        scrub: 0.4,
        onUpdate: self => {
          const done = Math.round(self.progress * benefits.length);
          if (done === lastDone) return;
          lastDone = done;
          benefits.forEach((b, i) => b.classList.toggle('is-done', i < done));
        },
      });
    }

    document.querySelectorAll('.stat-bar i[data-bar-width]').forEach(bar => {
      gsap.to(bar, {
        scaleX: parseFloat(bar.dataset.barWidth) / 100,
        duration: 1.3, ease: 'power2.out',
        scrollTrigger: { trigger: bar, start: 'top 92%', toggleActions: 'play none none none' },
      });
    });

    /* ---------- 05 — plans rise; price ticks monthly → annual (cached) ---------- */
    gsap.from('.plan', {
      opacity: 0, y: 46, duration: 0.95, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.plan-list', start: 'top 82%', toggleActions: 'play none none none' },
    });
    document.querySelectorAll('.plan').forEach(plan => {
      const amountEl = plan.querySelector('.amount');
      const noteEl = plan.querySelector('[data-billing-note]');
      if (!amountEl) return;
      const monthly = parseFloat(amountEl.dataset.monthly);
      const annual = parseFloat(amountEl.dataset.annual);
      let lastAmount = null;
      let lastNote = null;
      ScrollTrigger.create({
        trigger: plan,
        start: 'top 78%',
        end: 'top 30%',
        scrub: 0.5,
        onUpdate: self => {
          const amount = Math.round(gsap.utils.interpolate(monthly, annual, self.progress));
          if (amount !== lastAmount) {
            lastAmount = amount;
            amountEl.textContent = `${amount} JD`;
          }
          if (noteEl) {
            const note = self.progress > 0.5 ? 'billed annually · save ~20%' : 'billed monthly';
            if (note !== lastNote) {
              lastNote = note;
              noteEl.textContent = note;
            }
          }
        },
      });
    });

    /* ---------- 06 — FAQ opens as each item reaches the middle ---------- */
    gsap.from('.faq-item', {
      opacity: 0, y: 24, duration: 0.7, ease: 'power3.out', stagger: 0.05,
      scrollTrigger: { trigger: '.faq-grid', start: 'top 84%', toggleActions: 'play none none none' },
    });
    document.querySelectorAll('.faq-item').forEach(item => {
      const answer = item.querySelector('.faq-a');
      if (!answer) return;
      const open = () => gsap.to(answer, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' });
      const close = () => gsap.to(answer, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.in' });
      ScrollTrigger.create({
        trigger: item, start: 'top 72%', end: 'bottom 32%',
        onEnter: open, onEnterBack: open, onLeave: close, onLeaveBack: close,
      });
    });

    /* ---------- 07 — backdrop drift + panels ---------- */
    const closeBackdropImg = document.getElementById('closeBackdropImg');
    if (closeBackdropImg) {
      gsap.fromTo(closeBackdropImg,
        { yPercent: -7 },
        {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: '#get-started', start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    }
    gsap.from('.gs-block', {
      opacity: 0, y: 50, duration: 1, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: '.gs-panels', start: 'top 84%', toggleActions: 'play none none none' },
    });

    const footerGhost = document.querySelector('.footer-ghost');
    if (footerGhost) {
      gsap.fromTo(footerGhost,
        { opacity: 0, scale: 0.86 },
        {
          opacity: 1, scale: 1, ease: 'none',
          scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'top 40%', scrub: 0.6 },
        }
      );
    }
  } else {
    /* Reduced motion — jump straight to every end state */
    document.querySelectorAll('.stat-bar i[data-bar-width]').forEach(bar => {
      bar.style.transform = `scaleX(${parseFloat(bar.dataset.barWidth) / 100})`;
    });
    document.querySelectorAll('[data-count-to]').forEach(el => {
      el.textContent = el.dataset.countTo + (el.dataset.countSuffix || '');
    });
    document.querySelectorAll('.benefit').forEach(b => b.classList.add('is-done'));
    document.querySelectorAll('.plan .amount').forEach(el => { el.textContent = `${el.dataset.annual} JD`; });
    document.querySelectorAll('.plan [data-billing-note]').forEach(el => {
      el.textContent = 'billed annually · save ~20%';
    });
    document.querySelectorAll('.faq-a').forEach(a => { a.style.height = 'auto'; a.style.opacity = '1'; });
    const firstPath = document.querySelector('#pathSwitch span');
    if (firstPath) firstPath.classList.add('is-live');
  }
}

/* ==========================================================================
   Category index — a single preview node tracks the cursor and swaps image
   on row hover. One fixed element and two quickTo setters, so hovering the
   list costs the same regardless of how many rows there are.
   ========================================================================== */
(() => {
  const preview = document.getElementById('indexPreview');
  const list = document.getElementById('indexList');
  if (!preview || !list || !window.gsap) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const images = new Map();
  preview.querySelectorAll('img[data-preview]').forEach(img => images.set(img.dataset.preview, img));

  const px = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
  const py = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
  const setOpacity = gsap.quickTo(preview, 'opacity', { duration: 0.35, ease: 'power2.out' });
  const setScale = gsap.quickTo(preview, 'scale', { duration: 0.45, ease: 'power3.out' });
  gsap.set(preview, { scale: 0.9, xPercent: -50, yPercent: -50 });

  let active = null;

  list.addEventListener('mousemove', e => { px(e.clientX); py(e.clientY); }, { passive: true });

  list.querySelectorAll('.index-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      const key = row.dataset.previewKey;
      if (key === active) return;
      if (active && images.get(active)) images.get(active).classList.remove('is-shown');
      const img = images.get(key);
      if (img) img.classList.add('is-shown');
      active = key;
      setOpacity(1);
      setScale(1);
    });
  });

  list.addEventListener('mouseleave', () => {
    setOpacity(0);
    setScale(0.9);
    if (active && images.get(active)) images.get(active).classList.remove('is-shown');
    active = null;
  });
})();

/* ---------- Forms: AJAX to Netlify, native POST fallback so a submission
     is never silently lost if fetch itself fails ---------- */
['organizerForm', 'vendorForm'].forEach(id => {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const body = new URLSearchParams(new FormData(form)).toString();
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
      .then(() => form.classList.add('submitted'))
      .catch(() => form.submit());
  });
});
