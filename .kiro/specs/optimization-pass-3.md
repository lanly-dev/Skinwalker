# Optimization, Pass 3

**Status:** In Progress
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Baseline (`9edca2b`)
- Assets 1,137 KB. No unused assets, no unused CSS classes (148), no unused `@keyframes`.
- Dead code: `Player.addTracks()` and `Player.trackCount` have no callers since Open folder replaces the playlist.
- Probe of every WebP at quality 92 with exact alpha: most are already at or below that size. Twelve files shrink by 9% or more with a mean RGB difference under 2 of 255. Files with a larger difference (blood line, volume crosses, prev/next glows, row skull: 2.8 to 9.6) are left alone, because they are small, sharp-edged art where loss would show.

## Requirements
- [ ] R1: Remove `Player.addTracks()` and `Player.trackCount`.
- [ ] R2: Re-encode only these at q92, exact alpha: `dracula-frame`, `dracula-hand-glow-left`, `dracula-hand-glow-right`, `dracula-medallion-face`, `frankenstein-eye-right`, `frankenstein-knob-face`, `frankenstein-knob-plate`, `skeleton-eye-pair`, `skeleton-tool-close`, `skeleton-tool-mini`, `skeleton-tool-skin`. Alpha max diff must be 0 for each.
- [ ] R3: Typecheck and build pass. No visible change intended.

## Results
