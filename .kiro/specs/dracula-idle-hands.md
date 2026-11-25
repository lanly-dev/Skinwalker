# Dracula Idle Hands Specification
**Status:** Implemented; runtime check pending
**Created:** 2026-11-25
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
When nobody touches the player, Dracula's crossed hands (prev / next) come alive: the painted hands pulse with a warm glow in turn, like fingers drumming. Any input stops it at once.

## Requirements
- [ ] R1: After 6 s with no pointer, keyboard or wheel input, the Dracula container gets the class `hands-idle`.
- [ ] R2: While `hands-idle` is set, the left and right hand glows pulse in alternation, looping.
- [ ] R3: Any `pointermove`, `pointerdown`, `keydown` or `wheel` removes the class immediately and restarts the 6 s timer.
- [ ] R4: Hover and focus glow on the hands behave as before when not idle.
- [ ] R5: The animation is CSS only (opacity on the existing `::after` glow layers). No per-frame JS, no new asset, no change to hit areas.
- [ ] R6: `prefers-reduced-motion` disables it (covered by the global rule in `src/renderer/style.css`).
- [ ] R8: Optional heart animation. If `src/renderer/assets/dracula-hands-heart.webp` exists, the container gets `has-heart` and, instead of the glow pulse, a 6 s loop plays over the hands: crossed, fingers form a heart, hold, relax back. If the file is absent, the glow pulse (R2) is used and the build is unaffected.
- [ ] R9: The frame overlay is never hit-tested; prev / next stay clickable while it plays.
- [ ] R7: `unmount()` clears the timer and removes the listeners. Mini-bat mode does not animate the hands (they are hidden there).

## Design
- `DraculaSkin`: `IDLE_MS = 6000`, `idleTimer`, and `wake = () => {...}` bound on `document` in `bindEvents()`, removed in `unmount()`. `wake` removes `hands-idle` and re-arms `setTimeout`. `wake()` is called once at bind time so the timer starts without input.
- `style.css`: `.dracula-skin.hands-idle:not(.mini-mode) .dr-prev::after` and `.dr-next::after` run `dr-hand-pulse` (2.4 s, infinite). The right hand is offset by half a cycle.
- A single `opacity` keyframe from 0 to about 0.8 and back; listeners are passive.

## Heart asset contract
- One horizontal strip, 12 frames, WebP, `src/renderer/assets/dracula-hands-heart.webp`.
- Each frame is plate px 128,1014 to 865,1303 (737 x 289), the same box as `.dr-hands-anim` in `src/renderer/style.css`. It covers both hands, the left nail tip, and headroom above for the heart.
- Frames repaint the whole box (robe included) and stay opaque wherever the plate is, so the painted crossed hands never show through.
- Frame 1 is the painted crossed pose; the stitch script forces it from the plate so the loop starts and ends seamlessly.
- The overlay sits at z-index 1, under the visualizer zone, so the bars still draw over it.
- Art must be original or properly licensed.

## Art pipeline
1. `python reference/dracula-web/hands-heart.py crop` writes `reference/dracula-web/hands-heart/frame-00.png` (exact box) and `context.png` (box marked on the plate).
2. Produce the 11 posed frames at 737 x 289: the two hands leave the crossed pose, meet at the centre with fingertips and thumbs forming a heart (frame 11 = full heart), same painting style, lighting, sleeves and robe as the plate. Frames 1 to 11 play forward, hold on 11, then play back. Either save them as `frame-01.png` ... `frame-11.png`, or as one sprite sheet `sheet.png` (3 columns x 4 rows of 737 x 289 panels, 2211 x 1156, panel 1 = crossed pose), which the script splits into frames. The art is generated outside Kiro with an image model from the plate crop; the model or service used is disclosed on Devpost.
3. `python reference/dracula-web/hands-heart.py stitch` writes the strip and warns about see-through pixels.
4. `npm run dev`, wait 6 s, check registration at frame 1 and the heart.

Note: `reference/` is gitignored, like the other plate scripts; only the strip asset is committed.
## Tasks
- [x] T1: Idle timer and listeners in `src/renderer/skins/DraculaSkin.ts`.
- [x] T2: Keyframes and rules in `src/renderer/style.css`.
- [x] T4: Frame overlay (`.dr-hands-anim`), optional asset glob, CSS keyframes.
- [x] T6: Crop / stitch script `reference/dracula-web/hands-heart.py` (smoke-tested: 12 copies of frame 00 stitch, build bundles the strip, build passes without it).
- [ ] T5: Create and add `dracula-hands-heart.webp` (art).
- [ ] T7: `hands-heart.py split` cuts `sheet.png` into `frame-01.png` ... `frame-11.png`.
- [ ] T3: Visual check in `npm run dev` (idle 6 s, move mouse, confirm stop).

## Acceptance Criteria
- `npm run typecheck` and `npm run build` pass.
- Hands pulse after 6 s idle and stop on the first input.
