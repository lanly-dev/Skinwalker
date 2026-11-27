# Skeleton Seek Thumb as a Bone

**Status:** Implemented with the maintainer's own image (27 x 34 px, commit 032d172); in-app check pending
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The maintainer wants the Skeleton seek bar's thumb to be a bone, as in the
reference art: an upright cartoon bone, a straight shaft with two round knobs
at each end, cream with a dark outline. The maintainer's own image did not
reach the workspace, so they asked for a generic one. Today the thumb
(`.skeleton-skin .sk-seek::-webkit-slider-thumb` in `src/renderer/style.css`)
is a 0.5cqw glowing pale dot.

An earlier CSS-gradient attempt read as a plain rounded bar, because gradients
cannot draw the double knobs. That attempt was removed from history by the
maintainer.

## Requirements
- [ ] R1: The thumb is an upright bone: shaft plus two round knobs at each end, cream shading, dark outline drawn around the whole silhouette only (no outline lines inside the shape).
- [ ] R2: About three times the bar's height (about 2.2cqw tall) and centred on the bar.
- [ ] R3: A faint blue glow (`--sk-blue`) that follows the bone's outline, not a rectangle.
- [ ] R4: Only the thumb rule changes. No new image file: the bone is an inline SVG data URI. Bar, fill, times and seeking behaviour are unchanged.

## Tasks
- [x] T1: Draw the bone as SVG (outline pass in dark, fill pass in cream on top) and set it as the thumb background.
- [x] T2: Check in an isolated Electron render at values 0, 500 and 1000.

## Acceptance Criteria
- `npm run typecheck` and `npm run build` pass.
- [MAINTAINER: in the running app, the bone sits centred on the bar and dragging still seeks.]

## Implementation Notes
2026-11-26: inline SVG bone (viewBox 20x28: four knob circles and a shaft, dark pass r=5, cream gradient pass r=3.8 on top), 1.57cqw x 2.2cqw (min 11 x 15 px), blue `drop-shadow` glow. Isolated Electron render of the real `.sk-seek` rules at a 960 px container, values 0, 500, 1000: the bone shows both knob pairs, is centred on the bar at all three, and the glow follows the silhouette. Not checked in the full app. Typecheck and build pass.

## Revision 2 (2026-11-26): image file
The maintainer wants an image file they can swap. The bone moves from the inline SVG to `src/renderer/assets/skeleton-seek-thumb.png`, 80 x 112 px (4x the 20:28 drawing, so it stays sharp), transparent background. The CSS points at that file and uses `background-size: contain`, so a replacement PNG with the same name and any similar upright shape works without a code change. Size, glow and centring stay as in revision 1.

Revision 2 results (2026-11-26): `src/renderer/assets/skeleton-seek-thumb.png` (80 x 112, 1,079 bytes) drawn with PIL from the same shapes and gradient as the SVG. `style.css` now uses `url("./assets/skeleton-seek-thumb.png")`. Vite inlines it as a data URI at build time because it is under 4 KB; a replacement file is picked up the same way on the next build. Isolated Electron render with the PNG matches revision 1. Typecheck and build pass.

Update 2026-11-26: the maintainer replaced the generated 80 x 112 bone with their own 27 x 34 PNG at the same path (commit 032d172), and refined the slider in commit d474c0f. The CSS still scales it with `background-size: contain`.
