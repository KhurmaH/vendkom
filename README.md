# Vendkom — marketing site

Single-page static site, no build step. Everything lives in `index.html`, styled by
`css/style.css` and scripted by `js/script.js`. Scroll animations use GSAP + ScrollTrigger
(loaded via CDN in `index.html`, no bundler needed).

## Sections (all on `index.html`, in scroll order)
- `#top` — Hero
- `#how-it-works` — Organizer / vendor flow (tabbed)
- `#categories` — Full vendor category list
- `#vendors` — For Vendors content + categories chip list
- `#pricing` — Subscription plans + billing toggle
- `#faq` — Full FAQ
- `#get-started` — Organizer / vendor sign-up forms (tabbed; any link with
  `data-goto-tab="vendor"` or `data-goto-tab="organizer"` preselects the right tab before
  scrolling there)

The nav bar links to these anchors and scrollspies (highlights the link for whichever
section is in view) via `js/script.js`. The header also inverts to a dark treatment while
scrolled behind a `data-theme="dark"` section (the CTA/get-started section and the footer).

The old standalone page files (`how-it-works.html`, `categories.html`, `vendors.html`,
`pricing.html`, `faq.html`, `get-started.html`) are now just redirect stubs to the matching
anchor on `index.html`, kept so old bookmarks/links don't break. Delete them if you don't
need that.

## Preview locally
```
cd vendkom-website
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy
Drag the folder into [Netlify Drop](https://app.netlify.com/drop), or connect the folder
to Vercel/Netlify/GitHub Pages — no build command needed, publish directory is `/`.

## Forms
The "Get started" forms (organizer + vendor) are client-side only right now — submitting
shows a success message but nothing is sent anywhere. To actually receive submissions,
either:
- Add `data-netlify="true"` to both `<form>` tags if hosting on Netlify (built-in form handling), or
- Point `form.action` at a service like Formspree, or
- Wire them to a real backend endpoint.

## What's editable
- Copy, categories, and FAQ: the individual page files
- Colors/fonts/spacing: CSS variables at the top of `css/style.css`
- Pricing numbers: `data-monthly` / `data-annual` attributes on the price amounts in `pricing.html`
