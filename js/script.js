document.querySelectorAll('.year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Reveal-on-scroll: the only motion on the page. Plain CSS
   transition toggled by IntersectionObserver — no animation library, no
   continuous per-frame work, nothing scroll-jacked. ---------- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
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
