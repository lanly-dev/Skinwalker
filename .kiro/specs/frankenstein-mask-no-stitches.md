# Frankenstein Mask Without Stitches

**Status:** In Progress
**Created:** 2026-11-24
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The maintainer asked to remove the stitches around Frankenstein's mouth mask.
The mask is inline SVG in `mouthMaskSvg()` in `src/renderer/skins/FrankensteinSkin.ts`.
It draws three stitched seams: left cheek, right cheek, and chin. Each seam
is a faint line plus suture ticks from `sutureTicks()`.

## Requirements
- [ ] R1: No seam lines and no suture ticks on the mask.
- [ ] R2: Everything else on the mask is unchanged: leather shell, three bolted points, cheek studs, steel grille and its bolts, the live playlist screen.
- [ ] R3: The neck-to-chest seek scar is not touched (it is the seek bar, not part of the mask).

## Tasks
- [ ] T1: Delete the three seam groups (6 SVG paths) from `mouthMaskSvg()`.
- [ ] T2: Delete `sutureTicks()`, which has no other caller.
- [ ] T3: Update the comments that describe the seams (the `mouthMaskSvg()` doc comment, the mask block comment in `src/renderer/style.css`).

## Acceptance Criteria
- `git grep sutureTicks -- src` returns nothing.
- `npm run typecheck` and `npm run build` pass.
- [MAINTAINER: in the running app, the mask shows no stitches and nothing else changed.]

## Implementation Notes
