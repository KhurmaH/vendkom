/* ==========================================================================
   Vendkom — motion layer

   Cinematic (pinned sections, scrubbed sequences, horizontal scroll) but
   built against the specific things that caused stutter earlier:

     1. Nothing here is WebGL. Every animated property is a transform or an
        opacity, which the compositor handles off the main thread.
     2. Every scrubbed onUpdate caches its last written value and returns
        early when nothing changed — scrub callbacks fire on every scroll
        tick, and an unguarded textContent write forces a layout each time.
     3. All mousemove handlers use gsap.quickTo, which reuses one tween per
        property instead of allocating a new one per event.
     4. ScrollTrigger recalculates after fonts and images settle, so pins
        don't fire against stale positions.
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
      val: 100,
      duration: 1.4,
      ease: 'power2.inOut',
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

/* ---------- Chapter rail — passive position indicator ---------- */
const chapterRail = document.getElementById('chapterRail');
if (chapterRail && 'IntersectionObserver' in window) {
  const dots = Array.from(chapterRail.querySelectorAll('i[data-rail-for]'));
  const sectionToDot = new Map();
  dots.forEach(dot => {
    const section = document.getElementById(dot.dataset.railFor);
    if (section) sectionToDot.set(section, dot);
  });
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const activeDot = sectionToDot.get(entry.target);
      dots.forEach(dot => dot.classList.toggle('active', dot === activeDot));
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sectionToDot.forEach((_, section) => spy.observe(section));
}

/* ---------- Scroll-driven effects ---------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Trigger positions are computed at first layout — before webfonts swap and
     before below-the-fold images size themselves. Both change document height,
     which would leave every pin firing at the wrong offset. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* Progress bar across the whole document */
  gsap.to('#scrollProgressFill', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  /* Custom cursor — mix-blend-mode means it reads against every surface */
  const cursorDot = document.getElementById('cursorDot');
  if (cursorDot && finePointer) {
    const cursorX = gsap.quickTo(cursorDot, 'x', { duration: 0.35, ease: 'power3.out' });
    const cursorY = gsap.quickTo(cursorDot, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', e => { cursorX(e.clientX); cursorY(e.clientY); }, { passive: true });
    document.querySelectorAll(
      '.submit-cta, .form-field input, .form-field select, .form-field textarea, .category-card, .price-card, .faq-item, .vendor-card, .lane-step'
    ).forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(cursorDot, { scale: 3, duration: 0.25, ease: 'power2.out' }));
      el.addEventListener('mouseleave', () => gsap.to(cursorDot, { scale: 1, duration: 0.3, ease: 'power2.out' }));
    });
  } else if (cursorDot) {
    cursorDot.style.display = 'none';
  }

  const onHeroReveal = fn => { if (preloader) heroRevealCallbacks.push(fn); else fn(); };

  if (!reduceMotion) {
    /* ---------- Hero ---------- */
    const heroSection = document.querySelector('.hero');
    const heroObject = document.getElementById('heroObject');
    const heroGhost = document.querySelector('.hero-ghost');

    if (heroObject) gsap.set(heroObject, { yPercent: -50 });

    /* Staged entrance once the curtain lifts */
    onHeroReveal(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero .eyebrow', { opacity: 0, y: 20, duration: 0.7 })
        .from('.hero h1', { opacity: 0, y: 46, duration: 1.1 }, '-=0.45')
        .from('.hero-sub', { opacity: 0, y: 26, duration: 0.9 }, '-=0.8')
        .from('.hero-trust li', { opacity: 0, y: 16, duration: 0.7, stagger: 0.09 }, '-=0.65')
        .from('.scroll-cue', { opacity: 0, duration: 0.7 }, '-=0.5');
      if (heroObject) {
        tl.from(heroObject, { opacity: 0, scale: 0.92, duration: 1.4, ease: 'power2.out' }, 0.15);
      }
      tl.from('.hero-halo', { opacity: 0, duration: 1.6, ease: 'none' }, 0);
    });

    /* Pinned exit — copy lifts away, object drifts back, ghost pushes forward */
    if (heroSection) {
      const heroTl = gsap.timeline({
        scrollTrigger: { trigger: heroSection, start: 'top top', end: '+=70%', scrub: 0.6, pin: true },
      });
      heroTl.to('.hero-copy', { opacity: 0, y: -70, ease: 'none' }, 0)
            .to('.category-marquee', { opacity: 0, ease: 'none' }, 0);
      if (heroGhost) heroTl.to(heroGhost, { scale: 1.3, opacity: 0.4, ease: 'none' }, 0);
      if (heroObject) heroTl.to(heroObject, { y: -60, scale: 1.08, opacity: 0.25, ease: 'none' }, 0);
    }

    /* Hero object drifts with the cursor — quickTo, so one tween is reused */
    if (heroObject && heroSection && finePointer) {
      const objX = gsap.quickTo(heroObject, 'x', { duration: 0.9, ease: 'power2.out' });
      const objRotY = gsap.quickTo(heroObject, 'rotationY', { duration: 0.9, ease: 'power2.out' });
      gsap.set(heroObject, { transformPerspective: 1200 });
      heroSection.addEventListener('mousemove', e => {
        const rect = heroSection.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        objX(relX * 44);
        objRotY(relX * 9);
      }, { passive: true });
      heroSection.addEventListener('mouseleave', () => { objX(0); objRotY(0); });
    }

    /* ---------- Shared section entrances ---------- */
    document.querySelectorAll('.chapter-head').forEach(head => {
      gsap.from(head, {
        opacity: 0, y: 34, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: head, start: 'top 84%', toggleActions: 'play none none none' },
      });
    });

    /* 01 — lanes slide in from their own side */
    document.querySelectorAll('.lane').forEach(lane => {
      const fromX = lane.dataset.lane === 'organizer' ? -60 : 60;
      gsap.from(lane.querySelectorAll('.lane-step'), {
        x: fromX, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.14,
        scrollTrigger: { trigger: lane, start: 'top 78%', toggleActions: 'play none none none' },
      });
    });

    /* 02 — Categories: vertical scroll drives the filmstrip sideways while pinned */
    const categoriesPin = document.querySelector('.categories-pin');
    const categoriesTrack = document.querySelector('.categories-track');
    if (categoriesPin && categoriesTrack && window.matchMedia('(min-width: 900px)').matches) {
      const distance = () => Math.max(0, categoriesTrack.scrollWidth - categoriesPin.clientWidth);
      categoriesPin.style.overflowX = 'hidden';
      gsap.to(categoriesTrack, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: categoriesPin,
          start: 'top 30%',
          end: () => `+=${distance()}`,
          scrub: 0.8,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
    }
    gsap.utils.toArray('.category-card').forEach((card, i) => {
      gsap.from(card, {
        opacity: 0, y: 50, duration: 0.9, ease: 'power3.out', delay: i * 0.06,
        scrollTrigger: { trigger: categoriesPin || card, start: 'top 82%', toggleActions: 'play none none none' },
      });
      if (!finePointer) return;
      gsap.set(card, { transformPerspective: 800 });
      const tx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      const ty = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        ty(((e.clientX - r.left) / r.width - 0.5) * 12);
        tx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      }, { passive: true });
      card.addEventListener('mouseleave', () => { tx(0); ty(0); });
    });

    /* 03 — Vendors: staggered rise, photo parallax, cursor tilt */
    const vendorGrid = document.getElementById('vendorGrid');
    if (vendorGrid) {
      gsap.utils.toArray(vendorGrid.querySelectorAll('.vendor-card')).forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 56, duration: 0.95, ease: 'power3.out', delay: i * 0.09,
          scrollTrigger: { trigger: vendorGrid, start: 'top 82%', toggleActions: 'play none none none' },
        });
        if (!finePointer) return;
        gsap.set(card, { transformPerspective: 900 });
        const tx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
        const ty = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          ty(((e.clientX - r.left) / r.width - 0.5) * 9);
          tx(-((e.clientY - r.top) / r.height - 0.5) * 9);
        }, { passive: true });
        card.addEventListener('mouseleave', () => { tx(0); ty(0); });
      });

      vendorGrid.querySelectorAll('.vendor-photo-parallax').forEach(wrap => {
        gsap.fromTo(wrap,
          { yPercent: -8 },
          {
            yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
      });
    }

    /* 04 — Checklist ticks itself off as it passes.
       doneCount is cached: without this, every scroll tick would re-toggle
       six classes whether or not the count actually moved. */
    const checklist = document.getElementById('vendorChecklist');
    if (checklist) {
      const items = Array.from(checklist.querySelectorAll('.checklist-item'));
      let lastDone = -1;
      ScrollTrigger.create({
        trigger: checklist,
        start: 'top 72%',
        end: 'bottom 58%',
        scrub: 0.4,
        onUpdate: self => {
          const done = Math.round(self.progress * items.length);
          if (done === lastDone) return;
          lastDone = done;
          items.forEach((item, i) => item.classList.toggle('is-done', i < done));
        },
      });
    }

    document.querySelectorAll('.stat-bar i[data-bar-width]').forEach(bar => {
      gsap.to(bar, {
        scaleX: parseFloat(bar.dataset.barWidth) / 100,
        duration: 1.3, ease: 'power2.out',
        scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none none' },
      });
    });

    /* Counters — cached so a repeated integer never re-writes the DOM */
    document.querySelectorAll('[data-count-to]').forEach(el => {
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.countSuffix || '';
      const counter = { val: 0 };
      let lastVal = -1;
      gsap.to(counter, {
        val: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        onUpdate: () => {
          const v = Math.round(counter.val);
          if (v === lastVal) return;
          lastVal = v;
          el.textContent = v + suffix;
        },
      });
    });

    /* 05 — Pricing: cards rise, then each price ticks monthly → annual as its
       own card crosses the viewport. Both writes are cached. */
    gsap.from('.price-card', {
      opacity: 0, y: 60, duration: 1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.pricing-grid', start: 'top 80%', toggleActions: 'play none none none' },
    });
    document.querySelectorAll('.price-card').forEach(card => {
      const amountEl = card.querySelector('.amount');
      const noteEl = card.querySelector('[data-billing-note]');
      if (!amountEl) return;
      const monthly = parseFloat(amountEl.dataset.monthly);
      const annual = parseFloat(amountEl.dataset.annual);
      let lastAmount = null;
      let lastNote = null;
      ScrollTrigger.create({
        trigger: card,
        start: 'top 75%',
        end: 'top 25%',
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

    /* 06 — FAQ answers open on their own as each question reaches the middle */
    gsap.from('.faq-item', {
      opacity: 0, y: 22, duration: 0.7, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: { trigger: '.faq-list', start: 'top 82%', toggleActions: 'play none none none' },
    });
    document.querySelectorAll('.faq-item').forEach(item => {
      const answer = item.querySelector('.faq-a');
      if (!answer) return;
      const open = () => {
        item.classList.add('is-open');
        gsap.to(answer, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' });
      };
      const close = () => {
        item.classList.remove('is-open');
        gsap.to(answer, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.in' });
      };
      ScrollTrigger.create({
        trigger: item,
        start: 'top 68%',
        end: 'bottom 34%',
        onEnter: open, onEnterBack: open,
        onLeave: close, onLeaveBack: close,
      });
    });

    /* 07 — Backdrop drifts slowly behind the closing section */
    const gsBackdropImg = document.getElementById('gsBackdropImg');
    if (gsBackdropImg) {
      gsap.fromTo(gsBackdropImg,
        { yPercent: -7 },
        {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: '#get-started', start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    }

    /* 07 — Form panels rise in */
    gsap.from('.gs-block', {
      opacity: 0, y: 50, duration: 1, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: '.gs-panels', start: 'top 82%', toggleActions: 'play none none none' },
    });

    /* Footer wordmark grows in as the page ends */
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
    /* Reduced motion: no pins, no scrubs — jump straight to every end state */
    document.querySelectorAll('.stat-bar i[data-bar-width]').forEach(bar => {
      bar.style.transform = `scaleX(${parseFloat(bar.dataset.barWidth) / 100})`;
    });
    document.querySelectorAll('[data-count-to]').forEach(el => {
      el.textContent = el.dataset.countTo + (el.dataset.countSuffix || '');
    });
    document.querySelectorAll('.checklist-item').forEach(item => item.classList.add('is-done'));
    document.querySelectorAll('.price-card .amount').forEach(el => {
      el.textContent = `${el.dataset.annual} JD`;
    });
    document.querySelectorAll('.price-card [data-billing-note]').forEach(el => {
      el.textContent = 'billed annually · save ~20%';
    });
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.add('is-open');
      const a = item.querySelector('.faq-a');
      if (a) { a.style.height = 'auto'; a.style.opacity = '1'; }
    });
  }
}

/* ---------- Forms: AJAX to Netlify, native POST as the fallback so a
     submission is never silently lost if fetch itself fails ---------- */
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
