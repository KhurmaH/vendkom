# Vendkom logo — master files

This folder is the source of truth for the brand mark. Everything else on the
site and in email is generated from this geometry and these colours.

## Files

| File | Use it for |
|---|---|
| `vendkom-mark.svg` | **Primary.** The badge on its own, vector, scales to any size. Use this first wherever possible. |
| `vendkom-lockup-light.svg` | Badge + "VENDKOM" wordmark, for **light** backgrounds. |
| `vendkom-lockup-dark.svg` | Badge + wordmark, for **dark** backgrounds. |
| `vendkom-mark-1024.png` | Raster fallback where SVG isn't accepted (some print, some social uploads). |
| `vendkom-mark-512.png` | Raster, general purpose. |
| `vendkom-mark-256.png` | Raster, small placements. |

Generated from these same masters, do not edit by hand:
- `/favicon.ico` and `/icons/icon-*.png` — browser tab and app icons
- `/email/vendkom-signature.gif` — animated email signature

## The gradient

One diagonal sweep (135°) through all three brand colours:

```
#1f5075  (blue-dp)  0%
#2f6d9e  (blue)     60%
#ee9d2b  (orange)   90–100%
```

The stops are **deliberately uneven**. An even 50/50 blue-to-orange blend does
two bad things: it drops the white "V" to roughly 2.2:1 over the orange half,
and — because blue and orange are near-complementary — the midpoint desaturates
through a muddy tan. Holding blue to 60% and ramping orange in late keeps the
letterform between 5.5:1 and 8.5:1 everywhere it actually sits, and reads orange
as a clean corner accent.

**If you change the stops, re-check the "V" contrast.** That's the constraint
that matters here.

## The letterform

The V is a 7-point polygon, traced from the original mark so proportions match
exactly rather than being redrawn by eye. In a 198 × 213 box:

```
(0,0) (75,212) (121,212) (197,0) (152,0) (99,155) (47,0)
```

It sits centred at 46% of the badge width, on a rounded square with a 22% corner
radius.

## Clear space

Leave at least half the badge's width clear on every side. Don't recolour the
badge, don't put the wordmark on the gradient, and don't place the mark on a
busy photo without a solid or heavily scrimmed backing.
