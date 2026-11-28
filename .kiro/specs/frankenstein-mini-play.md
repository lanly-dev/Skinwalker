# Frankenstein Mini Play Dial: Hotspot and Play/Pause Icon

**Status:** In Progress
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Problem
1. The maintainer reports the play dial hover is still slightly off. The
   pass in `.kiro/specs/frankenstein-mini-hotspots.md` took the dial centre
   from a flood fill of the gold face, which leaks into the plate around it.
2. The play triangle is baked into `frankenstein-mini.webp`, so the icon
   never changes to pause while playing.

## Measurement (2026-11-26)
360 rays from inside the dial find the face's inner edge; a least-squares
circle through the 216 consistent hits gives centre **808.1, 914.9** (the old
box used 799.5, 925.5: 8.6 px left and 10.6 px low). The dark rim's outer
edge is at a median radius of **172 px**. The baked triangle spans
x 773-858, y 876-956.

## Requirements
- [ ] R1: `.fr-mini-play` box becomes `left 48.74%; top 46.43%; width 26.36%; height 21.50%`.
- [ ] R2: A small asset `frankenstein-mini-dial-face.webp` holds the dial face with the triangle painted out (OpenCV inpaint, crop of the 1305x1600 art).
- [ ] R3: While playing, that face covers the triangle and two pause bars are drawn in the triangle's own dark ink, centred on the dial. While paused, the baked triangle shows as now.
- [ ] R4: aria-label and `aria-pressed` keep toggling as they do (`Play` / `Pause`).

## Acceptance Criteria
- Overlay of the new box on the art matches the dial rim.
- A render of the playing state shows bars and no triangle.
- Typecheck and build pass.

## Implementation Notes
