# Frankenstein Mini Player Hotspots

**Status:** Implemented in the working tree, not committed (see notes); in-app check pending
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Problem
The maintainer reports the mini player's button hover is not precise. The
three hotspots (`.fr-mini-close`, `.fr-mini-restore`, `.fr-mini-play` in
`src/renderer/style.css`) are circles laid over `frankenstein-mini.webp`
(1305 x 1600). An overlay of the current boxes on the art shows them larger
than the painted plates and off-centre, most for the compass (restore) and
the X plate (close), so hover lights up and clicks land outside the plate.

## Measurement (2026-11-26)
Centres from a flood fill of each plate's gold face (compass, dial) or the
X glyph's centroid (close); radius from rays cast outward to the end of the
plate's dark outline (72 rays, median):

| Button | Centre (px) | Radius (px) | Old box radius |
|--------|-------------|-------------|----------------|
| close (X plate) | 685.3, 265.3 | 58 (rays gave 48 because the X glyph is also dark; 58 matches the plate in the overlay) | 71.5 |
| restore (compass) | 407.5, 715.0 | 97 | 118.8 |
| play (dial) | 799.5, 925.5 | 169.5 | 172.3 |

## Requirements
- [x] R1: Each hotspot is the measured circle: close `48.07% / 12.96%`, `8.89% x 7.25%`; restore `23.79% / 38.62%`, `14.87% x 12.12%`; play `48.28% / 47.25%`, `25.98% x 21.19%`.
- [x] R2: Nothing else in the mini rules changes. The maintainer's uncommitted rim-light edits in the same block are kept as they are.
- [x] R3: The window is 300 x 368, the same ratio as the art (0.815), so the percentage boxes stay circles.

## Acceptance Criteria
- Overlay of the new boxes on the art lines up with each plate's outline.
- Typecheck and build pass.
- [MAINTAINER: in the running app, hover lights each plate's own edge and the pointer does not trigger off the plate.]

## Implementation Notes
2026-11-26: the three box lines and their comment in `style.css` were updated; an overlay of the new boxes on the art lines up with each plate. Typecheck and build pass. The change is left uncommitted because `style.css` also holds the maintainer's own uncommitted rim-light edits in the same block, and the two cannot be committed separately without the maintainer.
