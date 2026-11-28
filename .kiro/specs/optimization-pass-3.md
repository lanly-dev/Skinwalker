# Optimization, Pass 3

**Status:** Complete (2026-11-26)
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Baseline (`9edca2b`)
- Assets 1,137 KB. No unused assets, no unused CSS classes (148), no unused `@keyframes`.
- Dead code: `Player.addTracks()` and `Player.trackCount` have no callers since Open folder replaces the playlist.
- Probe of every WebP at quality 92 with exact alpha: most are already at or below that size. Twelve files shrink by 9% or more with a mean RGB difference under 2 of 255. Files with a larger difference (blood line, volume crosses, prev/next glows, row skull: 2.8 to 9.6) are left alone, because they are small, sharp-edged art where loss would show.

## Requirements
- [x] R1: Remove `Player.addTracks()` and `Player.trackCount`.
- [x] R2: Re-encode only these at q92, exact alpha: `dracula-frame`, `dracula-hand-glow-left`, `dracula-hand-glow-right`, `dracula-medallion-face`, `frankenstein-eye-right`, `frankenstein-knob-face`, `frankenstein-knob-plate`, `skeleton-eye-pair`, `skeleton-tool-close`, `skeleton-tool-mini`, `skeleton-tool-skin`. Alpha max diff must be 0 for each.
- [x] R3: Typecheck and build pass. No visible change intended.

## Results
- Removed `Player.addTracks()` and `Player.trackCount` (10 lines).
- Eleven WebPs re-encoded once from their committed versions: 232,376 B -> 199,548 B (-32.8 KB, -14%). Alpha max diff 0 in every file. Mean RGB difference 0.02 to 1.99 of 255 (from the probe).
- An overlapping first run encoded some files twice; they were restored from git and encoded once before committing.
- Assets now 1,105 KB. Typecheck and build pass.
- What is left is small: the demo tracks (26 MB) are most of the payload, and the remaining images are either at their q92 size already or sharp-edged art where loss would show.