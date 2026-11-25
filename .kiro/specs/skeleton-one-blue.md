# Skeleton Skin: One Blue

**Status:** In Progress
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
- [ ] T1: Script the CSS change (only inside Skeleton-scoped rules) and the TS canvas colours.
- [ ] T2: Hue-shift the five Skeleton webp assets with PIL (pixels with hue 170-230 and saturation above 0.15).
- [ ] T3: Measure: re-run the hue census; report remaining distinct hues.

## Acceptance Criteria
- Census of Skeleton CSS rules shows one hue (182, within rounding).
- `npm run typecheck` and `npm run build` pass.
- [MAINTAINER: in the running app, Skeleton reads as one blue and nothing looks washed out.]

## Implementation Notes
