# Frankenstein Mini Play Dial: Hotspot and Play/Pause Icon

**Status:** Implemented; in-app check pending
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
- [x] R1: `.fr-mini-play` box becomes `left 48.74%; top 46.43%; width 26.36%; height 21.50%`.
- [x] R2: A small asset `frankenstein-mini-dial-face.webp` holds the dial face with the triangle painted out (OpenCV inpaint, crop of the 1305x1600 art).
- [x] R3: While playing, that face covers the triangle and two pause bars are drawn in the triangle's own dark ink, centred on the dial. While paused, the baked triangle shows as now.
- [x] R4: aria-label and `aria-pressed` keep toggling as they do (`Play` / `Pause`).

## Acceptance Criteria
- Overlay of the new box on the art matches the dial rim.
- A render of the playing state shows bars and no triangle.
- Typecheck and build pass.

## Implementation Notes
2026-11-26: box moved as specified. `frankenstein-mini-dial-face.webp` (170 x 170, 7,242 B) is the dial face around the glyph with the triangle inpainted (OpenCV TELEA, mask dilated 11 px), feathered at the edge. A `.fr-mini-pause` span inside the button shows it plus two bars only while `.playing`. Isolated Electron render at the 300 x 368 mini size: paused shows the baked triangle, playing shows the bars and the green rim on the dial edge, and the box outline sits on the painted rim. Typecheck and build pass. Not checked inside the running app.
