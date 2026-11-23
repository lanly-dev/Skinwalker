# Skin Required Controls Specification

**Status:** In progress. Audit complete (2026-11-21). Skeleton's five buttons and mini version landed 2026-11-22 (T4); Frankenstein (T3) and the shared helper decision remain.
**Created:** 2026-11-21
**Owner:** Maintainer
**Implementation:** Kiro, after the open decisions below are answered

## Overview
Every skin must provide the ten controls in `.kiro/steering/skin-required-controls.md`:
play/pause, previous, next, seek, volume, track board, and the five window
buttons (close, minimize, switch skin, mini version, open folder). This spec
records which skins have which controls today and defines the work to close the gaps.

## Audit (from source, 2026-11-21, `HEAD` = `da004d3`)
Checked by reading `src/renderer/skins/*.ts` and `src/renderer/main.ts`. Not run in the app.

| Control | Dracula | Frankenstein | Skeleton |
|---------|---------|--------------|----------|
| Play / pause | yes (`dr-medallion`) | yes (`fr-eyes`) | yes (`sk-pendant`) |
| Previous / next | yes | yes | yes |
| Seek bar | yes | yes | yes |
| Volume | yes (speaker buttons, wheel, keys) | yes (dial: drag, wheel, keys) | yes (slider + speaker mute) |
| Track board | yes (`dr-playlist`) | yes (`fr-playlist`) | yes (`sk-board`) |
| Close | yes (tool row) | none (global bar removed 2026-11-21) | none (global bar removed 2026-11-21) |
| Minimize | yes (tool row) | none (global bar removed 2026-11-21) | none (global bar removed 2026-11-21) |
| Switch skin | yes (`Player.nextSkin()`, commit `4598551`) | no | no |
| Mini version | yes (bat, 380x380) | no | no |
| Open folder | yes (tool row) | global "+ Add files" button | global "+ Add files" button |

"Global" means `renderWindowControls()` and `renderOpenButton()` in
`src/renderer/main.ts`. The title bar there is `aria-hidden`, is a generic
36px strip (`style.css`), and has a maximize button that is not on the list.
The "+ Add files" button is hidden only for Dracula (`style.css`, `body:has(.dracula-skin)`).
Dracula is the only skin that meets the rule.

## Requirements
### Functional
- [ ] R1: Frankenstein and Skeleton each provide close, minimize, switch skin, mini version and open folder as painted anatomy, inside the plate silhouette.
- [ ] R2: Each button works through `window.skinwalker` and `Player`, as Dracula's does.
- [ ] R3: Each button is keyboard-reachable, has an accessible label, and does not start a window drag.
- [ ] R4: Each skin has a mini version that the user can leave again.
- [ ] R5: The generic global title bar and "+ Add files" button do not show on a skin that provides its own.
- [ ] R6 (bug, 2026-11-21): while the user drags a skin, the generic title bar (minimize, maximize, close) and the "+ Add files" pill must not appear. Cause: `clearShapeForDrag()` in `src/renderer/windowShape.ts` makes the window a full rectangle for the drag, which exposes elements that the silhouette normally clips.

### Technical
- [ ] Shapes: the window shape is re-applied after a skin swap and after entering or leaving mini (see lesson on shape timing in `docs/AGENTS.md` and commit `da004d3`).
- [ ] Volume and playback state survive a skin swap (`Player` owns them).
- [ ] No `any`. `npm run typecheck` and `npm run build` pass.

## Open decisions (maintainer)
1. **Art.** Each new button and each mini plate needs painted art matching the skin. Who makes it, and is generating it acceptable (see disclosure risks in `docs/submission/AUDIT.md`)?
2. **Mini version for Frankenstein and Skeleton.** Design per skin (like Dracula's bat), or one shared compact player? A shared one is cheaper but less on theme.
3. **Shared code.** Put the five buttons in one helper module that each skin positions with CSS, or copy Dracula's tool row into each skin?
4. **Maximize.** Drop it from the global bar, or keep it?
5. **Scope.** `docs/AGENTS.md` and `.kiro/steering/skinwalker-project.md` still say mid-playback skin switching is out of scope. Switching already exists in code. Update those files to match.

## Tasks (do not start until open decisions 1 to 3 are answered)
- [x] T0: Hide the global bar and "+ Add files" pill during a drag (R6). Small fix, does not depend on the open decisions.
- [x] T0b: Remove the generic title bar (minimize, maximize, close) entirely: `#titlebar` in `src/renderer/index.html`, `renderWindowControls()` in `src/renderer/main.ts`, its CSS in `src/renderer/style.css`. Maintainer decision 2026-11-21. Answers open decision 4 (maximize is dropped).
- [ ] T1: Resolve open decisions and update this spec's design section.
- [ ] T2: Shared helper for the five window buttons (if decision 3 says so).
- [ ] T3: Frankenstein: five buttons and mini version.
- [x] T4: Skeleton: five buttons and mini version.
- [ ] T5: Hide the global bar and "+ Add files" for skins that provide their own.
- [ ] T6: Update `docs/AGENTS.md` scope text and `README.md` skin table.

## Acceptance Criteria
- In the running app, on each skin: all ten controls are present and work. Record the check in this spec's Implementation Notes with the date.
- Switching skins through all three and back keeps the playing track, position and volume.
- Window shape matches the plate after every swap and every mini toggle.
- `npm run typecheck` and `npm run build` pass.

## Implementation Notes
2026-11-21: audit only. The steering file first said Dracula lacked a switch-skin button. That was wrong: `nextSkin()` landed in commit `4598551` before the steering file was written. The steering file is corrected in the same commit as this spec.

T0 (2026-11-21): `clearShapeForDrag()` in `src/renderer/windowShape.ts` now hides `#titlebar` and `#open-files`, and `restoreShape()` shows them again. `npm run typecheck` and `npm run build` pass. Not checked visually. [MAINTAINER: drag each skin and confirm the corner buttons stay hidden, then tick R6.]

T0 follow-up (2026-11-21): a plain click on the skin still flashed the generic buttons. Cause: `pointerdown` lifted the OS shape at once, so a click with no movement exposed the full rectangle for a frame, and `restoreShape()` made the bar visible again before the OS region was back. Plan: (1) do not lift the shape or start the window drag until the pointer has moved at least 4 px, so a click changes nothing; (2) after a real drag, show the generic bar again only after the shape has been restored (150 ms). Implemented 2026-11-21 in `src/renderer/skinDrag.ts` (4 px start threshold) and `src/renderer/windowShape.ts` (150 ms delayed reveal). `npm run typecheck` and `npm run build` pass. Not checked visually. [MAINTAINER: click and drag each skin and confirm no corner buttons flash.]

T0 follow-up 2 (2026-11-21): the buttons still showed for a moment at the start of a real drag. Likely cause (not confirmed by a capture): `clearShapeForDrag()` set `visibility: hidden` and sent the shape-lift message in the same tick. The main process lifts the region at once, but the renderer paints the hidden state a frame later, so one frame shows the full rectangle with the buttons still painted. Plan: hide the buttons first, wait two animation frames so the hidden state is on screen, then lift the shape and start moving the window. Pointer movement during that wait is accumulated and applied afterwards. Implemented 2026-11-21: `clearShapeForDrag()` in `src/renderer/windowShape.ts` returns a promise that resolves after two frames; `src/renderer/skinDrag.ts` waits on it before moving the window and before restoring the shape. `npm run typecheck` and `npm run build` pass. Not checked visually. [MAINTAINER: drag each skin and confirm no corner buttons flash at the start, middle or end.]

T0b decision (2026-11-21): the maintainer asked to remove the generic title bar instead of hiding it during drags. Consequence: Skeleton and Frankenstein have no on-skin close or minimize until T3 and T4 land. The taskbar and Alt+F4 remain [MAINTAINER: confirm they work on the frameless window]. The "+ Add files" pill stays, because it is the only open-folder control on those two skins; it is still hidden during drags. Implemented 2026-11-21: removed `#titlebar` from `src/renderer/index.html`, `renderWindowControls()` and `btn()` from `src/renderer/main.ts`, and the `#titlebar` CSS block from `src/renderer/style.css`. Left in place: the `window:maximize` IPC and the `--titlebar-h` CSS variable (still used by `#app` padding and the pill). `npm run typecheck` and `npm run build` pass. Not checked visually.

T4 (2026-11-22): used the Boba web build the skin came from as the design reference. The five window tools sit on the skeleton's painted icon row, left to right: skull → mini, half-mask → change skin, coffin → add files, bar → minimize, X → close; the painted speaker beside the volume bar mutes and restores the level. The mini version follows the web build's mini player: the window shrinks to 380×220, the shape is lifted, and the card shows a skull crop, title, play/pause, seek and restore/close. The generic "+ Add files" pill is now hidden on Skeleton as well (R5). `npm run typecheck` and `npm run build` pass; not checked visually in the running app. [MAINTAINER: exercise all five tools, the mini card and its restore/seek, and the shape after entering and leaving mini.]