# Skeleton Skin: One Blue

**Status:** Reverted 2026-11-26 at the maintainer's request. All three revisions undone; the skin is back to its original colours for re-evaluation.
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

## Revision 2 (2026-11-25): cyan to blue
The maintainer asked for the cyan to become blue. New target: **`#008cff`, hue 207.1**, the deeper azure the skin already used on its glows before revision 1.

- R7: Every Skeleton colour with hue 170-230 and saturation above 0.15 moves to hue 207.1, keeping its own saturation, brightness and alpha. This now also covers pale tints (saturation 0.15-0.4), so no cyan-white remains next to the blue. `--sk-blue` becomes `#008cff`.
- R8: Same shift in `SkeletonSkin.ts` canvas colours and the six Skeleton icon/mini assets.
- R9: The plate `skeleton-frame.webp` is shifted too: 58% of its opaque pixels are in the cyan range (measured at `28c15b8`), so leaving it would keep a cyan skeleton under blue controls. Alpha must stay identical, because the window shape is built from it.
- Known effect: at the same brightness value, blue looks darker than cyan, so the skin will read darker overall. [MAINTAINER: say if a lighter blue is wanted, e.g. `#3aa0ff`.]

Revision 2 results (2026-11-25):
- CSS: 88 edits, all inside Skeleton rules (0 changed lines outside). `--sk-blue: #008cff`. Census of Skeleton blue-range colours (brightness above 0.25): 70 at hue 207, 1 at 206, 1 at 208 (rounding).
- TS: `#0af6ff` -> `#0a91ff`, `#35f8ff` -> `#35a4ff`, `#b7f5ff` -> `#b7dfff`, `#66f9ff` -> `#66baff`.
- Assets: all seven Skeleton webps, including the plate (34% of its pixels moved). Every file: same size in pixels, alpha max diff 0 against `HEAD`, saturated blue now peaks at hue 205-208. The plate went from 287,688 to 182,270 bytes at WebP quality 92.
- `npm run typecheck` and `npm run build` pass. Not checked in the running app; R1 to R9 stay unticked until the maintainer confirms.

## Revision 3 (2026-11-25): brighter blue
The maintainer asked for a brighter blue. Neon colours are already at full brightness value (1.0), so the blue is lifted by lowering saturation toward white, keeping hue 207.
- R10: Skeleton colours and pixels with hue 200-215, saturation above 0.15 and brightness value above 0.5 get saturation x 0.75. `--sk-blue` becomes `#40a9ff` (`#008cff` at 0.75 saturation). Dark panels (value 0.5 or less) are not touched, so backgrounds stay deep.
- Same scope as revision 2: Skeleton CSS rules, `SkeletonSkin.ts` canvas colours, the seven Skeleton webps. Alpha must stay identical.

Revision 3 results (2026-11-25):
- CSS: 58 edits inside Skeleton rules (0 lines outside); `--sk-blue: #40a9ff`. Dark panels unchanged.
- TS: `#0a91ff` -> `#47acff`, `#35a4ff` -> `#68bbff`, `#b7dfff` -> `#c9e7ff`, `#66baff` -> `#8ccbff`.
- Images: the CSS rule (bright pixels only) moved just 0.2% of the plate, because its blue glows are dim (value 0.5 or less). So images use a different rule: every blue pixel gets saturation x0.75 and value x1.3 (clamped at 1). Pixels moved per file: plate not counted (run interrupted, re-run once from `HEAD`), mini face 15.9%, tools 1.7% to 37.9%. Alpha max diff 0 in all seven files.
- `npm run typecheck` and `npm run build` pass. Not checked in the running app.

## Reverted (2026-11-26)
The maintainer judged the blue change a bad call and asked for the original colours back, to evaluate again. The colour diffs of the three revision commits (`5a433e9`, `af000dd`, `b75fed4`) were reverse-applied to `src/` only. Verified against `5a433e9~1` (the state before revision 1):
- Six Skeleton webps are byte-identical to the originals.
- `skeleton-tool-minimize.webp` is the maintainer's later version from `28c15b8` (left as is; it was made after revision 1).
- `SkeletonSkin.ts` is identical to the original.
- `style.css` differs from the original only by the maintainer's later edits: the `28c15b8` minimize position and the bone seek thumb (`032d172`). The thumb's glow used `var(--sk-blue)`, which no longer exists, so it now uses the original neon `#0af6ff` at 70% alpha.
Open idea from the maintainer, not started: a glossier outline on the neon elements.