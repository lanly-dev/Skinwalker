# Skeleton Skin: One Blue

**Status:** Implemented; visual check pending
**Created:** 2026-11-25
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The maintainer sees several different blues on the Skeleton skin and wants
them synced into one. Measured 2026-11-25 at `d8c233e`:

- `src/renderer/style.css`, rules scoped to `.skeleton-skin` / `.sk-*`: 77 uses
  of 40 distinct saturated blue/cyan colours, hues from 180 to 221.
  The most used is `#0af6ff` (hue 182, 12 uses); others cluster at 185-199,
  and a few button glows sit at 205-221 (`#008cff`, `#007bff`, `#0078ff`, `#0050d8`).
- `src/renderer/skins/SkeletonSkin.ts` canvas colours: `#0af6ff`, `#35e5ff`,
  `#66eaff`, `#b7f5ff`, `#eaffff` (plus green and violet EQ blocks, not blue).
- Baked art: the tool icons and mini face peak at hue 195-201
  (`skeleton-tool-minimize/mini/skin.webp`, `skeleton-mini-face.webp`),
  the folder icon at 183-186. The plate itself has few saturated pixels.

## Decision
One hue for the whole skin: **182, the hue of `#0af6ff`**, the colour the
skin already uses most. Each colour keeps its own saturation, brightness and
alpha, so dark panels stay dark and glows stay soft; only the hue changes.
[MAINTAINER: if you prefer another blue, give one hex and the same script re-runs.]

## Requirements
- [ ] R1: Every saturated blue/cyan in Skeleton CSS rules is at hue 182.
- [ ] R2: The pure neon is one variable, `--sk-blue: #0af6ff`, on `.skeleton-skin`.
- [ ] R3: Skeleton canvas colours in `SkeletonSkin.ts` are at hue 182; the green and violet EQ blocks are unchanged.
- [ ] R4: Blue pixels in the Skeleton tool icons and mini face are hue-shifted to 182; other pixels and alpha are unchanged.
- [ ] R5: No other skin's colours change.

## Tasks
- [x] T1: Script the CSS change (only inside Skeleton-scoped rules) and the TS canvas colours.
- [x] T2: Hue-shift the five Skeleton webp assets with PIL (pixels with hue 170-230 and saturation above 0.15).
- [x] T3: Measure: re-run the hue census; report remaining distinct hues.

## Acceptance Criteria
- Census of Skeleton CSS rules shows one hue (182, within rounding).
- `npm run typecheck` and `npm run build` pass.
- [MAINTAINER: in the running app, Skeleton reads as one blue and nothing looks washed out.]

## Implementation Notes
2026-11-25:
- CSS: 85 colour edits inside Skeleton-scoped rules only (checked: 0 changed lines fall outside them). `--sk-blue: #0af6ff` sits on `.skeleton-skin`; 12 uses go through it (`var(--sk-blue)`, or `color-mix(..., transparent)` where the old colour had alpha). Every other blue keeps its own saturation, brightness and alpha at hue 182.4.
- Census after: 65 uses at hue 182; 9 near-black panel colours (brightness 0.04 to 0.18) read as 180 or 183 because 8-bit rounding cannot hold the hue that dark. They are visually black.
- TS: `#35e5ff` -> `#35f8ff`, `#66eaff` -> `#66f9ff` in `SkeletonSkin.ts`; `#0af6ff` already matched; the green and violet EQ colours are untouched.
- Assets: blue pixels in `skeleton-mini-face`, `skeleton-tool-{close,folder,mini,minimize,skin}.webp` shifted to hue 182.4 (4% to 53% of pixels per file). Alpha unchanged (max diff 0). Other pixels moved 0.6 to 1.6 of 255 on average from WebP re-encoding (quality 92). Files are 2% to 38% smaller. `skeleton-tool-close` has almost no blue; its remaining tint reads at hue 167-171 and was left alone (below the 0.45 saturation used for the census).
- `npm run typecheck` and `npm run build` pass. Not checked in the running app; R1 to R5 stay unticked until the maintainer confirms.
- Not changed: `skeleton-frame.webp` (the plate has few saturated blue pixels; its median is hue 189).