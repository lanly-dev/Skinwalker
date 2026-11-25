# Dracula Idle Hands Specification
**Status:** Experiment (feasibility trial), not a shipped feature. Code lives on branch `experiment/dracula-idle-hands`, not on `main`. Decide after seeing the heart frames whether it ships.
**Created:** 2026-11-25
**Owner:** Maintainer
**Implementation:** Kiro
## Overview
Trial: can Dracula's painted crossed hands (prev / next) make a finger-heart when nobody touches the player? The hands are baked into the plate, so the gesture is a pre-rendered frame strip played over them. Any input stops it at once. Without the strip, nothing animates.
## Requirements
- [ ] R1: After 6 s with no pointer, keyboard or wheel input, the Dracula container gets the class `hands-idle`.
- [ ] R2: If `src/renderer/assets/dracula-hands-heart.webp` exists, the container gets `has-heart`; while idle a 6 s loop plays over the hands: crossed, fingers form a heart, hold, relax back. If the file is absent nothing animates and the build is unaffected.
- [ ] R3: Any `pointermove`, `pointerdown`, `keydown` or `wheel` removes the class immediately and restarts the 6 s timer.
- [ ] R4: The frame overlay is never hit-tested; prev / next and their hover / focus glow behave as before.
- [ ] R5: CSS `steps()` animation on one overlay element; no per-frame JS.
- [ ] R6: `prefers-reduced-motion` disables it (covered by the global rule in `src/renderer/style.css`).
- [ ] R7: `unmount()` clears the timer and removes the listeners. Mini-bat mode does not animate (the hands are hidden there).
## Design
- `DraculaSkin`: `IDLE_MS = 6000`, `idleTimer`, and `wake()` bound on `document` in `bindEvents()`, removed in `unmount()`. `wake` removes `hands-idle` and re-arms `setTimeout`; it is called once at bind time so the timer starts without input. Listeners are passive.
- The strip is found with an eager `import.meta.glob`, so its absence is not a build error.
- `style.css`: `.dr-hands-anim` overlay at z-index 1 (under the visualizer zone), `dr-hands-heart` keyframes over 12 frames.
- Rejected: a glow pulse on the existing hand layers (maintainer did not want it).
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
- With the strip present, the heart plays after 6 s idle and stops on the first input; without it, nothing animates.
