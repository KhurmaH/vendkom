document.querySelectorAll('.year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Preloader: draws the mark, counts up, iris-wipes away ----------
   Must always resolve — a hard timeout forces it closed even if GSAP fails to load. */
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
    setTimeout(() => preloader.remove(), 1000);
  };

  if (window.gsap && !reduceMotionEarly) {
    const counter = { val: 0 };
    if (markPath) gsap.fromTo(markPath, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(counter, {
      val: 100,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: () => { if (countEl) countEl.textContent = `${Math.round(counter.val)}%`; },
      onComplete: finishPreload,
    });
  } else {
    if (countEl) countEl.textContent = '100%';
    finishPreload();
  }
  safetyTimer = setTimeout(finishPreload, 4000);
}

/* ---------- Chapter rail: passive scroll-position indicator (nothing to click) ---------- */
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

/* ---------- Pause the ken-burns zoom on any vendor photo that's off-screen ----------
   9 images running a continuous CSS transform animation at all times is real ongoing
   compositing cost; no reason to pay it for photos nowhere near the viewport. */
if ('IntersectionObserver' in window) {
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-paused', !entry.isIntersecting));
  }, { rootMargin: '200px 0px' });
  document.querySelectorAll('.vendor-photo').forEach(img => photoObserver.observe(img));
}

/* ---------- Scroll-driven effects (GSAP + ScrollTrigger) ---------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress bar spanning the whole document */
  gsap.to('#scrollProgressFill', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  /* Custom cursor — a mix-blend-mode dot that reads against every chapter color automatically,
     and swells over anything worth noticing even though almost nothing here is clickable. */
  const cursorDot = document.getElementById('cursorDot');
  if (cursorDot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cursorX = gsap.quickTo(cursorDot, 'x', { duration: 0.35, ease: 'power3.out' });
    const cursorY = gsap.quickTo(cursorDot, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', e => { cursorX(e.clientX); cursorY(e.clientY); });
    document.querySelectorAll(
      '.submit-cta, .form-field input, .form-field select, .form-field textarea, .category-card, .price-card, .faq-item, .checklist-item, .hv-card'
    ).forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(cursorDot, { scale: 3.2, duration: 0.25, ease: 'power2.out' }));
      el.addEventListener('mouseleave', () => gsap.to(cursorDot, { scale: 1, duration: 0.3, ease: 'power2.out' }));
    });
  } else if (cursorDot) {
    cursorDot.style.display = 'none';
  }

  /* Fire once the curtain finishes (or immediately if there's no preloader to wait on) */
  const onHeroReveal = fn => { if (preloader) heroRevealCallbacks.push(fn); else fn(); };

  if (!reduceMotion) {
    /* Pinned hero: ghost wordmark pushes forward, copy and cards fall away as you scroll off it */
    const heroSection = document.querySelector('.hero');
    const heroGhost = document.querySelector('.hero-ghost');
    if (heroSection && heroGhost) {
      gsap.timeline({
        scrollTrigger: { trigger: heroSection, start: 'top top', end: '+=90%', scrub: 0.6, pin: true },
      })
        .to(heroGhost, { scale: 1.25, y: 40, opacity: 0.35, ease: 'none' }, 0)
        .to('.hero-copy', { opacity: 0, y: -60, ease: 'none' }, 0)
        .to('.hero-visual', { opacity: 0, y: -40, scale: 0.94, ease: 'none' }, 0)
        .to('.category-marquee', { opacity: 0, ease: 'none' }, 0);
    }

    /* Mouse parallax + a subtle 3D tilt on the floating hero cards as a group.
       quickTo pre-builds one reusable tween per property instead of creating a new
       tween on every mousemove — the same effect for a fraction of the CPU cost. */
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
      gsap.set(heroVisual, { transformPerspective: 1000 });
      const parallaxSetters = Array.from(heroVisual.querySelectorAll('[data-parallax]')).map(el => ({
        setX: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power2.out' }),
        setY: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power2.out' }),
        speed: parseFloat(el.dataset.parallax) * 60,
      }));
      const setTiltX = gsap.quickTo(heroVisual, 'rotateX', { duration: 0.6, ease: 'power2.out' });
      const setTiltY = gsap.quickTo(heroVisual, 'rotateY', { duration: 0.6, ease: 'power2.out' });

      heroVisual.addEventListener('mousemove', e => {
        const rect = heroVisual.getBoundingClientRect();
        const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;
        parallaxSetters.forEach(p => { p.setX(relX * p.speed); p.setY(relY * p.speed); });
        setTiltY(relX * 8);
        setTiltX(-relY * 8);
      });
      heroVisual.addEventListener('mouseleave', () => {
        parallaxSetters.forEach(p => { p.setX(0); p.setY(0); });
        setTiltX(0);
        setTiltY(0);
      });
    }

    /* Ambient glow that trails the cursor around the hero */
    const heroGlow = document.getElementById('heroGlow');
    const heroSectionEl = document.querySelector('.hero');
    if (heroGlow && heroSectionEl) {
      const glowX = gsap.quickTo(heroGlow, 'x', { duration: 0.9, ease: 'power2.out' });
      const glowY = gsap.quickTo(heroGlow, 'y', { duration: 0.9, ease: 'power2.out' });
      heroSectionEl.addEventListener('mousemove', e => {
        const rect = heroSectionEl.getBoundingClientRect();
        glowX(e.clientX - rect.left);
        glowY(e.clientY - rect.top);
        heroGlow.classList.add('is-visible');
      });
      heroSectionEl.addEventListener('mouseleave', () => heroGlow.classList.remove('is-visible'));
    }

    /* Headline unmasks in a clean clip-path wipe, timed to the curtain lifting */
    const heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
      onHeroReveal(() => {
        gsap.fromTo(heroH1,
          { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
          { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 1, ease: 'power3.out' }
        );
      });
    }

    /* One-time impact flash as the curtain lifts */
    const heroFlash = document.getElementById('heroFlash');
    if (heroFlash) {
      onHeroReveal(() => {
        gsap.fromTo(heroFlash, { opacity: 0.85, scale: 0.6 }, { opacity: 0, scale: 1.4, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 0%' });
      });
    }

    /* Simple, shared entrance for the quieter chapter furniture — heads, tickers, dashboard card */
    const fadeUpOnScroll = (trigger, targets, vars = {}) => {
      if (!trigger || !targets || !targets.length) return;
      gsap.from(targets, {
        opacity: 0, y: 24, duration: 0.8, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger, start: 'top 85%', toggleActions: 'play none none none' },
        ...vars,
      });
    };
    document.querySelectorAll('.chapter-head').forEach(head => fadeUpOnScroll(head, [head], { stagger: 0 }));
    const tagTicker = document.querySelector('.tag-ticker');
    if (tagTicker) fadeUpOnScroll(tagTicker, [tagTicker], { y: 0, stagger: 0 });
    const statCard = document.querySelector('.vendors-visual .stat-card');
    if (statCard) fadeUpOnScroll(statCard, [statCard]);
    fadeUpOnScroll(document.querySelector('.stat-counter-row'), gsap.utils.toArray('.stat-counter'), { stagger: 0.1 });
    document.querySelectorAll('.gs-block').forEach(block => fadeUpOnScroll(block, [block], { stagger: 0 }));

    /* How it works: each lane slides in from its own side — organizer from the left, vendor from the right */
    document.querySelectorAll('.lane').forEach(lane => {
      const fromX = lane.dataset.lane === 'organizer' ? -70 : 70;
      gsap.from(lane.querySelectorAll('.lane-step'), {
        x: fromX, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: lane, start: 'top 78%', toggleActions: 'play none none none' },
      });
    });

    /* Categories: horizontal filmstrip — vertical scroll drives horizontal motion while pinned */
    const categoriesPin = document.querySelector('.categories-pin');
    const categoriesTrack = document.querySelector('.categories-track');
    if (categoriesPin && categoriesTrack && window.matchMedia('(min-width: 900px)').matches) {
      const getScrollDistance = () => categoriesTrack.scrollWidth - categoriesPin.clientWidth;
      categoriesPin.style.overflowX = 'hidden';
      gsap.to(categoriesTrack, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: categoriesPin,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: 0.8,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
    }

    /* Each category card tilts toward the cursor while it drifts past — one quickTo pair
       built per card up front, reused on every mousemove instead of tweening from scratch. */
    document.querySelectorAll('.category-card').forEach(card => {
      gsap.set(card, { transformPerspective: 600 });
      const setTiltX = gsap.quickTo(card, 'rotateX', { duration: 0.4, ease: 'power2.out' });
      const setTiltY = gsap.quickTo(card, 'rotateY', { duration: 0.4, ease: 'power2.out' });
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setTiltY(relX * 14);
        setTiltX(-relY * 14);
      });
      card.addEventListener('mouseleave', () => { setTiltX(0); setTiltY(0); });
    });

    /* Vendors directory: cards wipe in from alternating directions, each photo drifts at its own
       pace as it scrolls (independent of the photo's own continuous ken-burns zoom), and tilts
       toward the cursor on hover. */
    const vendorGrid = document.getElementById('vendorGrid');
    if (vendorGrid) {
      const wipeDirections = [
        'inset(0 100% 0 0)', 'inset(0 0 0 100%)', 'inset(100% 0 0 0)', 'inset(0 0 100% 0)',
      ];
      gsap.utils.toArray(vendorGrid.querySelectorAll('.vendor-card')).forEach((card, i) => {
        gsap.from(card, {
          clipPath: wipeDirections[i % wipeDirections.length],
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        });

        gsap.set(card, { transformPerspective: 700 });
        const setTiltX = gsap.quickTo(card, 'rotateX', { duration: 0.4, ease: 'power2.out' });
        const setTiltY = gsap.quickTo(card, 'rotateY', { duration: 0.4, ease: 'power2.out' });
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
          const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;
          setTiltY(relX * 10);
          setTiltX(-relY * 10);
        });
        card.addEventListener('mouseleave', () => { setTiltX(0); setTiltY(0); });
      });

      vendorGrid.querySelectorAll('.vendor-photo-parallax').forEach(wrap => {
        gsap.fromTo(wrap,
          { yPercent: -10 },
          { yPercent: 10, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } }
        );
      });
    }

    /* For vendors: the checklist ticks itself off as you scroll through it, and un-ticks in reverse */
    const checklist = document.getElementById('vendorChecklist');
    if (checklist) {
      const items = Array.from(checklist.querySelectorAll('.checklist-item'));
      ScrollTrigger.create({
        trigger: checklist,
        start: 'top 75%',
        end: 'bottom 55%',
        scrub: 0.4,
        onUpdate: self => {
          const doneCount = Math.round(self.progress * items.length);
          items.forEach((item, i) => item.classList.toggle('is-done', i < doneCount));
        },
      });
    }
    document.querySelectorAll('.stat-bar i[data-bar-width]').forEach(bar => {
      gsap.to(bar, {
        scaleX: parseFloat(bar.dataset.barWidth) / 100,
        duration: 1.1, ease: 'power2.out',
        scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none none' },
      });
    });
    document.querySelectorAll('[data-count-to]').forEach(el => {
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.countSuffix || '';
      const counter = { val: 0 };
      gsap.to(counter, {
        val: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        onUpdate: () => { el.textContent = Math.round(counter.val) + suffix; },
        onComplete: () => el.classList.add('is-locked'),
      });
    });

    /* Pricing: cards flip up like a split-flap board, then each price ticks from monthly to annual
       as its own card scrolls through view — reverses cleanly if you scroll back up. */
    gsap.from('.price-card', {
      rotateX: -18, opacity: 0, transformOrigin: 'bottom center', duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.pricing-grid', start: 'top 78%', toggleActions: 'play none none none' },
    });
    document.querySelectorAll('.price-card').forEach(card => {
      const amountEl = card.querySelector('.amount');
      const noteEl = card.querySelector('[data-billing-note]');
      if (!amountEl) return;
      const monthly = parseFloat(amountEl.dataset.monthly);
      const annual = parseFloat(amountEl.dataset.annual);
      ScrollTrigger.create({
        trigger: card,
        start: 'top 75%',
        end: 'top 25%',
        scrub: 0.5,
        onUpdate: self => {
          amountEl.textContent = `${Math.round(gsap.utils.interpolate(monthly, annual, self.progress))} JD`;
          if (noteEl) noteEl.textContent = self.progress > 0.5 ? 'billed annually · save ~20%' : 'billed monthly';
        },
      });
    });

    /* FAQ: answers open and close on their own as each question crosses the middle of the screen */
    gsap.from('.faq-item h3', {
      opacity: 0, y: 12, duration: 0.6, stagger: 0.05,
      scrollTrigger: { trigger: '.faq-list', start: 'top 82%', toggleActions: 'play none none none' },
    });
    document.querySelectorAll('.faq-item').forEach(item => {
      const answer = item.querySelector('.faq-a');
      if (!answer) return;
      ScrollTrigger.create({
        trigger: item,
        start: 'top 65%',
        end: 'bottom 35%',
        onEnter: () => gsap.to(answer, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' }),
        onLeave: () => gsap.to(answer, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.in' }),
        onEnterBack: () => gsap.to(answer, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' }),
        onLeaveBack: () => gsap.to(answer, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.in' }),
      });
    });

    /* A second impact flash as you arrive at the final chapter */
    const gsFlash = document.getElementById('gsFlash');
    if (gsFlash) {
      ScrollTrigger.create({
        trigger: '#get-started',
        start: 'top 65%',
        once: true,
        onEnter: () => gsap.fromTo(gsFlash, { opacity: 0.8, scale: 0.6 }, { opacity: 0, scale: 1.4, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 0%' }),
      });
    }

    /* Footer: the wordmark reprises, growing in as the page ends */
    const footerGhost = document.querySelector('.footer-ghost');
    if (footerGhost) {
      gsap.fromTo(footerGhost,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'top 40%', scrub: 0.6 } }
      );
    }
  } else {
    /* Reduced motion: skip pins/scrubs/parallax, just show the end states */
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
    document.querySelectorAll('.faq-a').forEach(answer => {
      answer.style.height = 'auto';
      answer.style.opacity = '1';
    });
  }
}

/* ---------- Forms: submit to Netlify Forms via AJAX, falling back to a native
   POST (page reload) if the fetch itself fails, so a submission is never silently lost. ---------- */
['organizerForm', 'vendorForm'].forEach(id => {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener('submit', (e) => {
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
