# Asset Optimization, Pass 2

**Status:** In Progress
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
Second optimization pass, measured at `9de2e28`. Pass 1 is
`.kiro/specs/code-asset-optimization.md`.

## Baseline
- `src/renderer/assets/`: 1,250 KB in 29 files. `out/renderer/`: 27,410 KB, of which about 26 MB is the demo tracks.
- No unused assets, no unused CSS classes (140 checked), no unused `@keyframes`.
- Probed re-encodes (WebP, alpha kept exact):

| File | Now | WebP | Mean RGB diff (of 255) | Alpha max diff |
|------|-----|------|-------------------|----------------|
| `skeleton-frame.webp` | 285,198 B | 180,388 B (q92) | 1.14 | 0 |
| `skeleton-mini-face.webp` | 215,640 B | 67,706 B (q92) | 1.89 | 0 |
| `dracula-blood-line.png` | 30,756 B | 22,692 B (lossless) | 0 | 0 |
| `skeleton-next-glow.png` | 7,244 B | 6,246 B (lossless) | 0 | 0 |
| `skeleton-prev-glow.png` | 7,253 B | 6,322 B (lossless) | 0 | 0 |
| `skeleton-row-skull.png` | 5,355 B | 3,490 B (lossless) | 0 | 0 |

## Requirements
- [ ] R1: The four PNGs above become lossless WebP; references updated; pixel-identical.
- [ ] R2: The two large Skeleton webps are re-encoded at quality 92 with exact alpha (window shape unchanged); mean RGB difference stays under 2 of 255.
- [ ] R3: `skeleton-seek-thumb.png` stays a PNG with the same name: it is the maintainer's swappable image.
- [ ] R4: No visible or behavioural change. Typecheck and build pass.

## Out of scope (flagged)
- Demo tracks (26 MB) are most of the renderer payload. Shrinking them needs an encoder that is not installed and changes audio.
- Downscaling plates drawn below their native size (for example `dracula-bat.webp` 1254 px for a 380 px mini window) would save more but changes the shape-mask sampling; needs the maintainer's visual check.

## Tasks
- [ ] T1: Convert the four PNGs, update imports and CSS `url()`s, delete the PNGs.
- [ ] T2: Re-encode the two Skeleton webps.
- [ ] T3: Rebuild and fill the Results.

## Results
