# AGENTS.md — Skinwalker

Kiroween 2026 entry — **Costume Contest**. Read this file first in every session on this project.

## Status
- Name **Skinwalker** — CONFIRMED 2026-11-08. (Proposed 2026-11-06; collision check run 2026-11-06 — CLEAR: no repo by that name in the `lanly-dev` namespace (66 repos checked) and no media player by that name found. Watch-outs noted and accepted: the word is used elsewhere, including horror games / Skinwalker Ranch, and it is a Navajo figure with a taboo around casual use. Trademark registers and domain availability were not checked.)
- Repo `lanly-dev/Skinwalker` — **created 2026-11-08** (private for now; Kiroween submission requires public — flip before submitting). Electron app built in Kiro; first commit + Electron migration landed 2026-11-08.
- Deadline for the whole hackathon: **Fri Dec 4, 2026, 2:00 PM PT**. Credit request (shared 4,000-credit pool, one code per entrant) due **Dec 1, 12:00 PM PT**.

## What this is
A media player where the skin is a living Halloween monster. Media player skins (Winamp / Windows Media Player era) are the interface: swapping skins swaps monsters, and the monster's body parts are the working controls — the skin enhances function, which is exactly what Costume Contest judges score.

## Category fit
Costume Contest: a haunting UI that is polished/unforgettable AND where the spooky elements do functional work. Every monster element must be a control or a readout, never decoration pasted on a normal player.

## Hard rules (Kiroween)
- New project, built during the window, core implementation built by **Kiro, spec-first**: spec committed in `/.kiro` before implementation code.
- `/.kiro` at repo root (specs, steering, hooks), never gitignored. MIT license file visible at repo top.
- Other agents (Claude etc.) may plan, prototype throwaway code, write docs, and prep assets. They may not write the core app — that is Kiro's job, and the `/.kiro` history must honestly show it. Any carried-over code gets a one-line disclosure on Devpost.
- Kiro credit budget for this entry: **~900** of the shared 4,000. Explore elsewhere, execute in Kiro.
- **No absolute paths (standing rule, 2026-11-07).** Nothing that leaves this machine — code, comments, specs, docs, commit messages, READMEs, screenshots, Devpost text — may contain an absolute local path (no `/home/<user>/...`, no `~/workspace/...`, no `C:\Users\...`). Reference files by repo-relative path only (e.g. `src/renderer/main.ts`, `/.kiro/specs/...`). The local directory layout is private and must never leak into the public repo or the submission.

## Stack — DECIDED 2026-11-08
- **Electron 33 + electron-vite + TypeScript** (no UI framework — vanilla DOM + SVG).
- Renderer: Vite-bundled, strict TypeScript, Web Audio API (`AnalyserNode` for visualizer).
- Main process: frameless transparent window; IPC for drag, window controls, native file dialog.
- Preload: locked-down `contextBridge` — `window.skinwalker` API only.
- Build output: `out/` (gitignored). Packaged installers: `release/` (gitignored).
- Key paths:
  - `src/main/index.ts` — Electron main process
  - `src/preload/index.ts` — context bridge
  - `src/renderer/` — all UI code (audio engine, player logic, skins)
  - `src/renderer/skins/index.ts` — skin registry (add new skins here)
  - `resources/` — app icon and other native assets
  - `public/tracks/` — bundled royalty-free demo tracks (added 2026-11-10; see Open decisions)

## Scope v1
- **Electron desktop app**; local audio files via native OS file picker + bundled royalty-free demo tracks.
- Core player: play / pause / seek / volume, playlist, next / prev.
- **Two monster skins** (Dracula flagship + Frankenstein) — no skin switcher, the app boots Dracula.
- Per skin, functional anatomy: e.g. mouth or eyes as the live visualizer (Web Audio AnalyserNode), claw / tongue / vine as the seek bar, skin-themed play/pause and volume organs.
- One skin is the design flagship (Dracula) — polish it hardest; Frankenstein can be simpler but must be a fully functional skin, not a color swap.
- Frameless, transparent window — the monster body IS the window chrome. No OS titlebar.

## Non-goals (scope caps — do not cross without explicit approval)
- **No spectrogram / file-quality analysis.** That is SpectreGram, the sibling Resurrection entry. A simple live visualizer is fine; analysis features would blur the two entries and endanger the "substantially different" rule.
- No streaming-service logins, no accounts, no backend, no uploads.
- Demo and demo-video audio: royalty-free / own tracks only (copyrighted music in the video is a rules violation).
- No auto-updater, no in-app store, no telemetry.

## Acceptance checks (must all pass before "done")
- [ ] Load a track, play it — audio never interrupts.
- [ ] Every visible control in every skin actually works (seek, volume, playlist).
- [ ] Visualizer is driven by the real audio signal, not a fake animation loop.
- [ ] Frameless window drags, minimizes, maximizes, and closes correctly.
- [ ] Native file picker adds local tracks to playlist without restart.
- [ ] `npm run build` produces a working installer or portable binary.
- [ ] App runs from a clean install on Windows with no extra dependencies.

## Packaging checklist
- [ ] Packaged installer / portable binary (electron-builder), public repo + MIT license + `/.kiro`.
- [ ] Demo video < 3 min, public YouTube: play a track → close-up of the skin where the anatomy IS the control.
- [ ] Devpost text description + Kiro-usage write-up (specs vs vibe coding, hooks, steering used).
- [ ] Blog post about the build (Bonus Blog prize) + one social post starting with `#KiroweenHackathon26` (Social Blitz).

## Decisions
- **Name: Skinwalker — CONFIRMED 2026-11-08** (collision check CLEAR 2026-11-06, watch-outs accepted; see Status).
- **Stack: Electron 33 + electron-vite + TypeScript, vanilla DOM — DECIDED 2026-11-08.**
- **Flagship skin: Dracula — DECIDED 2026-11-08.** Anatomy map: eyes → play/pause, cape → visualizer, blood drip → seek, medallion → volume, fangs → prev/next.
- **All 3 skins confirmed — DECIDED 2026-11-08:** Dracula (flagship), Frankenstein, Skeleton. Werewolf and Swamp Thing removed.
- **Style revamp — 2026-11-08:** per-skin themes in `src/renderer/style.css` (presentation-only; no selector, class, or wiring changes — anatomy controls untouched). Started as a moonlit/ember werewolf theme; reworked the same day for the Dracula/Frankenstein/Swamp Thing lineup.
- **Inline SVG art + swap-state fix — 2026-11-09:** SVG anatomy on the existing class hooks in all 3 skins (Dracula: hairline, eyes, cape wings, fangs, medallion; Frankenstein: forehead stitches, eyes, bolts; Swamp Thing: tendrils, eyes, leaves). Also fixed two skin-swap bugs found in review: `Player.mountSkin` now re-fires `onTrackChange` after mount (title/highlight survive swaps), and volume is player-owned (`currentVolume`) so swaps no longer reset it to 80%.
- **Character-as-frame — 2026-11-09 (Lan's design call):** skins are full character silhouettes, never rectangular cards — the monster's body is the frame, and the frameless transparent window shows the desktop outside it. Reference renders live in the local sync's `design-refs/` (not committed).
- **Image frame + separated mechanism — 2026-11-09 (Lan's direction, supersedes the hand-drawn SVG silhouette for Dracula):** the approved artwork itself is the frame. A text-free edit of the reference ships as `src/renderer/assets/dracula-frame.webp`, clipped to the character outline via CSS `clip-path`; each painted element is a live overlay control — eyes = play/pause hotspot + playing glow, blood line = seek (transparent track, drip thumb), medallion = volume (drag / wheel / arrow keys; a gold orbit dot circles it to show the value), cape interior = live visualizer over a settling panel, fangs = prev/next hotspots, real title + playlist rendered over the art. Hotspot coordinates were verified by compositing the control boxes over the plate. Lesson earned the same day: match the approved reference's proportions, not just its ingredient list — a from-scratch SVG redraw read as "lame" next to the generated art.
- **Separated element layers — 2026-11-09:** the plate's eyes, medallion and fangs are now real transparent layers (`src/renderer/assets/dracula-*.png`, full-canvas so they stack pixel-exact), extracted by color segmentation (SAM was attempted first; the PyTorch download is proxy-blocked in the build sandbox, and for flat art the color masks are crisper anyway). The medallion is erased from the shipped plate (stretch-inpaint) so the extracted layer genuinely rotates with volume; eye layers pulse via CSS filter while playing; fang layers glow when their hotspot is hovered/pressed. Layers recombine over the cleaned plate pixel-identical to the original art (verified by composite).
- **True transparency — 2026-11-09:** the plate's baked-in dark backdrop survived the hand-traced CSS `clip-path` as a faint square around the character (Lan spotted it on Windows). Fix: the backdrop is flood-filled out of the plate itself (the gold trim is a closed boundary; backdrop = neutral grey connected to the image borders), so `dracula-frame.webp` now carries a real alpha channel and the `clip-path` is gone. Verified by compositing the plate on white and bright teal — clean character edge, no rectangle. Lesson: never approximate an outline with a polygon when the art can carry its own alpha.
- **Skin #4: Skeleton Trio — 2026-11-09 (Lan's pick, one skin with three skeletons):** three skeletons shoulder-to-shoulder as one frame; all six eye sockets (mint / cyan / violet) are one separated layer + one wide play/pause hotspot; the CENTER skeleton carries the jaw visualizer, ribcage seek and spine volume (same vertical mechanism as solo Skeleton); the raised outer hands at the top corners are prev/next. **Revised to BUSTS the same day (Lan: "no need the whole body"):** three big busts cropped at mid-torso — skulls and sockets much larger, seek across the center ribs, spine volume on the short vertebra stub below the ribs, playlist across the lower ribs. The full-body version exists only in git history (`ccd82196`). **Then revised to LANDSCAPE the same day (Lan's pick):** the Trio is a wide 16:9 plate and it is the first skin to own the window shape: `Skin.windowSize` (Trio declares 1024×576; every other skin defaults to portrait 480×720) is applied by `Player.mountSkin` through the `window:set-size` IPC (main unmaximizes, resizes, centers). **Final plate (Lan pointed at the portrait-bust art: "make this one in landscape"; hands removed on his call 2026-11-10):** the big-skulled bust trio recomposed wide with NO hands anywhere — the arms are single hanging bones at the far edges and those bones are prev/next. The seek line spans all three ribcages again (its CSS glow band is mask-clipped to the three cage columns so it never floats over the gaps), center skeleton carries jaw viz + spine volume, side skulls complete the play/pause row, playlist across the lower center ribs. The smaller holding-hands landscape plate and the first bust-landscape plate (waving hands) were both replaced. **Superseded the same evening (Lan: "it suppose similar to this, and below will have a board that holded by 2 hands"): the BOARD plate** — back to the tight overlapping trio (center skull high, side skulls low, no bodies), and below them a wide dark board held by two bony hands: the board's glowing top edge is the seek, the board face is the playlist (title on its top strip), the gripping hands are prev/next, and volume runs down the board's right edge (the vertical drag mechanism, ending at the baked dot). Pipeline note: the near-black board is backdrop-dark, so the flood fill protects its rectangle or it eats the board. Note: rib-gap pockets sealed by overlapping bodies stay as dark backing inside the cages — reads as shadow, accepted.
- **Push repair — 2026-11-10:** the no-hands Trio push was built on a stale local sync and briefly reverted the 2026-11-10/11 work in `style.css` / this file (web-parity Dracula, window shape, plate sizing). Repaired the same session by rebuilding both files on top of the live versions with only the Trio delta reapplied, and verified the remote diff. Lesson (again): re-sync and diff every pushed file against live main at push time, especially after time away from the repo.

- **All three skins image-frame — 2026-11-09:** Frankenstein and Skeleton got the full Dracula treatment — generated character art (text-free on the first pass this time), backdrop flood-filled to alpha, element layers separated by color segmentation. Frankenstein: forehead EQ = visualizer panel, eyes = play/pause (layers pulse), neck bolts = prev/next, chest scar = seek, brass dial in the hand = volume (dial erased from the plate via a palm-gradient fill and the layer rotates; two erase lessons — a horizontal-stretch inpaint smears when neighbours aren't uniform, and any erase zone must sit inside the flood-fill's protected region or the fill eats it). Skeleton: eye sockets = play/pause, jaw gap = visualizer, ribcage line = seek, spine = VERTICAL volume (drag up/down; a glow fill + dot travel the vertebrae), bony hands = prev/next; the gaps between its bones are genuinely see-through, and the baked seek line's stubs outside the ribcage were alpha-clipped. All hotspot geometry verified by compositing the CSS boxes over the plates; the dial rotation was verified ghost-free.

- **Dracula player mechanics — 2026-11-10 (web-version parity):** the Boba web build of the player is the behaviour reference for Dracula, and `DraculaSkin` now matches it: eye sockets bloom from real RMS energy (no fake CSS pulse), the seek paints on `input` and commits on `change` so scrubbing no longer restarts the buffer per pixel, a red `--progress` fill sits over the painted blood line with an animated drip curtain and a `00:00 / -00:00` readout, the cape draws a 48-bar crimson→violet spectrum with gold caps and attack/release smoothing, and playlist rows are `01. title • mm:ss` with durations probed per track. Fixed en route: `src/renderer/main.ts` pointed at nonexistent `demo-01..03.mp3`; the six bundled tracks are wired instead. `electron.vite.config.ts` now sets the renderer `publicDir` to the project `public/` — it had defaulted to `src/renderer/public`, so no bundled track was ever served in dev or copied into `out/renderer`. Local playback now goes through a new `audio:read` IPC (`window.skinwalker.readAudioFile`) because Chromium refuses `fetch()` on `file://`, which had made picked files unplayable. Verified in the dev-server renderer: play → position advances, seek to 50% → `00:27 / -00:26`, volume wheel → 85% + orbit dot turns, next → Coffin Dream still playing, console clean.

- **Dracula play control moved to the medallion — 2026-11-10 (web-version parity, Lan's correction):** in the Boba web build the medallion is `#play` and the eyes are `pointer-events: none` readouts, so the skin now matches: medallion = play/pause (pulses while playing), eyes = energy readout only (no hotspot), and volume moved to the speaker icons painted at each end of the blood line (click / wheel / arrow keys, a gold level bar under each icon). The old eyes-hotspot + medallion-as-volume mapping is retired.

- **Dracula plate replaced with the web build's artwork — 2026-11-10 (Lan's correction: "there are subtle different skin that use in web, could you check again?"):** the Boba web build renders a *different* Dracula — jeweled play-triangle medallion at the throat, plain slit eyes, empty maroon cape, baked title/blood-line/playlist. Its stage image was extracted from the reference copy of the web page (1024×1536 JPEG) and cut to alpha: the exact-neutral charcoal backdrop is flood-filled from the borders, then the near-black JPEG dust within 4px of that cut is removed so the dotted gold trim keeps a clean edge. Shipped as `src/renderer/assets/dracula-frame.webp`; the plate is full-bleed (`position: fixed`, `100vw`/`100vh`) because the window is 2:3 like the web stage. Live UI uses the web build's own percentages: eyes 16.3%, medallion 44%/29%, chest panel 27%/38%, blood line 27.2%/43.35%, cape spectrum 18%/49.5% (64×22%), fangs 72%, playlist 33%/81.4%. Baked panels are covered by live panels, exactly as in the web build, and the visualizer is the web's mirrored 48-bar spectrum (crimson→violet, gold caps). Volume has no web equivalent, so it lives on two speaker glyphs drawn at the blood line's ends, their glow showing the level. Lesson: the old `.dr-body` drop-shadow filter painted a halo around the new plate — a transparent plate must carry `filter: none`.

- **The skin drags the window — 2026-11-10 (superseded the same day by the pointer-driven drag in `src/renderer/skinDrag.ts` — native drag regions cannot follow a silhouette):** every skin surface is now `-webkit-app-region: drag` chrome, so the monster's body is literally the titlebar (the window is frameless anyway). Interactive elements opt back out with `no-drag` — buttons, inputs, lists and any `[role="button" | "slider" | "group"]` generically, and the portrait skins' anatomy controls also carry their own. The stripped titlebar region stays for the window buttons.

- **Aura behind the plate — 2026-11-10:** the web plate's alpha edge carries JPEG grit, so three layers sit behind it: a blurred dark copy (`blur(14px) brightness(.45) saturate(1.35)`) as the halo, a tighter `blur(2px)` copy as a fine contour, and the plate itself with a warm `drop-shadow` pair. The grit now reads as an intentional glow instead of a ragged cut. The layers are `pointer-events: none`, so the plate stays the drag surface.

- **Window shaped to the skin — 2026-11-10:** the OS window is no longer a plain rectangle on Windows/Linux. `src/renderer/windowShape.ts` loads the active skin's plate, builds a mask (painted alpha > 24 plus its blurred aura at > 8, so the glow is not sliced off), merges it into scanline rects and sends them over `window:set-shape` to `win.setShape()` — outside them nothing is drawn and the desktop receives the clicks. The skin drag moved from `-webkit-app-region` to a pointer handler in `src/renderer/skinDrag.ts` that hit-tests the same alpha, so the window only moves when you grab painted pixels. Falls back to a rectangular window on macOS, when `setShape` is unavailable, or with `SKINWALKER_SHAPE=0`.

- **Drag lifts the window shape — 2026-11-11:** with the OS region applied, moving the window through `window:drag` made the plate smear against its own outline (Lan: the silhouette stayed put while the art slid out of it). A native `-webkit-app-region` drag was tried as the smooth path and did not start at all on the shaped window, so the pointer drag in `src/renderer/skinDrag.ts` stays and instead lifts the region for the duration of the move: `clearShapeForDrag()` on pointerdown, `restoreShape()` on pointerup/cancel, and one `window:drag` per animation frame instead of one per pointer event. A plain transparent rectangle moves as one piece; the silhouette returns the moment the drag ends. The move also pins the window size for the duration of the drag (`window:drag-start` / `drag-end`), and re-applies it after every move (`setSize`): on a 150% display, measured in a scratch Electron window, `setPosition` grew the window 40px per drag and `setBounds` with a pinned size still managed 2px per drag, while `setBounds` + trailing `setSize` held 480×720 across drags (electron#9477, #40566). The plate is window-sized, so any of that growth scaled the whole monster up. Main still drops/re-applies the region on `will-move`/`moved` for native moves (the titlebar).

- **Plates size to the window, not to a filtered wrapper — 2026-11-11:** Frankenstein, Skeleton and Skeleton Trio rendered with a zero-height body after the image-frame pass. Cause: each skin's wrapper carries `filter: drop-shadow(...)`, and a filtered ancestor becomes the containing block for its positioned descendants — while the wrapper itself has no height (every child is absolute), so `.fr-body` / `.sk-body` / `.tr-body` with `inset: 0` resolved against a 0px-tall box. Dracula only escaped because its block sets `filter: none` and `position: fixed`. Fix: the wrappers stay `filter: none`, the drop-shadow moves onto the plate body, and all three bodies are `position: fixed; inset: 0; width: 100vw; height: 100vh`, which also overrides the stale card-era `width: min(440px, 96vw); margin: 0 auto`. Verified in the built renderer: 480×720 bodies for the portrait skins and 1024×576 for the Trio, every control inside its body, plate aspect equal to window aspect, and shape-mask coverage 72.6% / 75.3% / 63.5% / 68%.

- **Card-era CSS removed — 2026-11-11:** the pre-image-frame blocks (Dracula/Frankenstein/Skeleton cards, the inline-SVG art sheet, Dracula's SVG silhouette) were still in `style.css`, and several of their declarations still won on live elements — the image-frame blocks only override the properties they declare. Cleanup rule: find declarations the live rule lacks (title weight/glow, the divider under the artist, the mono time font, playlist borders and row layout, the 10px inset the fang hotspots were tuned against, the faint socket rim on `.dr-eye`), fold them into the live rule, then delete the block. 422 lines removed (1719 → 1338; 54.8 → 38.5 kB); `npm run build` passes and Dracula/Frankenstein render the same as their pre-cleanup captures. One deliberate drop: `.dr-eye`'s card-era 2px rim and inset shadow — invisible under `mix-blend-mode: screen`.

- **Lineup cut — 2026-11-11 (Lan's call):** Skeleton + Skeleton Trio removed (skin files, CSS blocks, plate assets), and the skin-switcher toggle is gone too — no mid-playback swapping. Dracula is the launch skin; Frankenstein stays registered but unreachable until a selector returns. Scope is two skins, no swap.

- **Skeleton returns — the web build's neon plate (2026-11-11, Lan's pick):**
the lineup cut is partly reversed: `SkeletonSkin` is back, rebuilt from the Boba
web build (`SKINWALKER PLAYER • v1.0 SKELETON`) instead of the old portrait bust.
The stage art was embedded as a base64 JPEG in the page; its near-black backdrop
(0,8,15) is flood-filled to alpha with a 2px fringe pass, and the plate ships as
`src/renderer/assets/skeleton-frame.webp` (1536×1024, 64% coverage). Every live
element keeps the web build's own stage percentages: bone board 30.5%/7.4%
39×17 (playlist), pendant 45.6%/58.3% (play/pause, breathes while playing), jaw
canvas 45.8%/43.7% 7.8×7.2 (20 mirrored bars, colour blocks of seven), seek
28.5%/80.4% 43.2×2.3, times 29%/82.6%, title block 30.1%/69.9% 40.5×10,
prev/next 29%/58% at 85.7%, vertical volume on the left bone 16.25%/43.7%
2.25×21.9, eye glows 45.3%/51.8% at 32.9%. The skin owns a 3:2 window
(960×640) — the first skin since the Trio to set `windowSize`. **Shape-mask check:** every live panel (board, title block, seek, times, pendant, volume, jaw) sits 100% inside the painted silhouette at the mask's half resolution, and the plate has no enclosed transparent pockets — the rib gaps are connected to the image border, so they stay click-through — which means `windowShape.ts` needed no change for this skin. Deliberate
call: the four painted icons on the right bone column get no hotspots (three
were dead "coming soon" stubs on the web) — painted detail, not controls. With
no switcher, `SKINS[0]` is what launches, so Skeleton boots first and Dracula
and Frankenstein stay registered behind it.

- **Dracula rebuilt on the updated web build (2026-11-11, Lan's new link):** the reference page
changed — a new 2:3 plate (velvet robe, crossed hands, baked speaker glyphs at the blood line's
ends), new stage percentages, a tool row revealed on hover and a mini bat player. The plate and
the bat were alpha-cut with a border-seeded flood fill; the robe reaches the bottom frame edge,
so the bottom border is excluded from the seeds — seeding it starts the fill inside the figure
and the robe dissolves into speckles. Live geometry is the web build's own: title 27%/43.5%
46×5.5, seek 27.2%/49.6% 45.6×5.2, medallion 44%/34.1% 12×7, spectrum zone 19%/55% 62×17,
hands 13%/57% at 72% 30×11, tracklist 36%/88% 28×5.7, eyes 42.5%/16.3% 5.8×1.8; all sizes run
in `cqw` so the UI scales with the window as it does on the web. New controls: the hover tool
row (close, minimize, add files, mini bat — the web's dead "change skin" stub is not rendered,
same rule as the Skeleton icons) and the mini bat, which shrinks the window to 380×380 and
re-shapes the OS region to the bat; `window:set-size` now accepts an optional minimum size,
because main's portrait floor (380×560) would otherwise clamp the square bat. Volume keeps its
web-build position on the painted speakers, with a gold level bar under each. Dracula is
`SKINS[0]` again so the updated skin actually launches; there is still no switcher.

## Recent Improvements (2026-11-08)
- **Blood effects massively enhanced:** Dracula seekbar now has 101+ blood elements (21 main drips + 40 small + 30 splatter + 10 trails) with procedural generation in `buildDrips()`, plus inline SVG dripping edge with 14 animated elements. Glow effects reduced by 50% for matte/realistic blood appearance.
- **Complete Kiro infrastructure:** Full `.kiro/` folder created with specs (6 files), steering files (7 files including auto-load guides), hooks (2 active), workflows (1 template), and comprehensive documentation explaining all Kiro concepts.
- **Code optimization:** Removed 5 unused Dracula assets (eye-left/right, fang-left/right, medallion), added CSS variables for blood colors to `:root`, verified all code is in active use. CSS: 35.74 KB, TypeScript: 0 errors.
- **Dependencies upgraded:** Electron 33→45.3.0, TypeScript 5→7.0.2, Vite 2→8.3.8, electron-vite 2→6.0.0, electron-builder 24→26.18.0, @electron-toolkit packages to latest. Build output: -116 packages (-25%), 343 total packages, all builds passing.
- **File structure reorganization:** Created `docs/` folder for documentation, moved AGENTS.md there, created professional README.md at root, PROJECT-STRUCTURE.md guide, organized .kiro/ with separate docs/ and specs/ subfolders.
- **Kiro methodology documentation:** Created `understanding-kiro.md` (500+ lines explaining specs, steering, hooks, workflows) and `QUICK-REFERENCE.md` (1-page cheat sheet). Project now exemplifies spec-first development for Kiroween judging.

## Open decisions
1. ~~Demo tracks~~ — RESOLVED 2026-11-10: six royalty-free tracks live in `public/tracks/` (3 synthesized + 3 Incompetech) and are wired in `src/renderer/main.ts`.

## How we work
Plan → Work → Assess → Compound. When a session earns a lesson (a bug's real cause, a workflow that works), write it into this file the moment it is earned. When a decision above is made, update the Open decisions section in the same session — undecided items stay visibly undecided, never silently assumed.


## Lessons Earned (Session 2026-11-08)

### Procedural Blood Generation
When building complex visual effects like the 101+ blood drips, procedural generation in code (TypeScript function returning HTML strings) beats static HTML:
- **Flexibility:** Single function call with parameters controls density, size distribution
- **Maintainability:** One function to update, not 100+ elements in markup
- **Performance:** Generates once at mount, not parsed on every page load
- **Scalability:** Easy to add variations (trails, splatter, pools) without bloating files

### CSS Variable Organization
When effects use multiple shades of the same hue, define them as CSS variables in `:root`:
```css
--blood-dark: #7c121d;
--blood-bright: #d83c3b;
--blood-orange: #e04846;
```
**Benefits:** Color adjustments in one place, easier theme variants, consistent palette enforcement.

### Dependency Upgrade Strategy
When upgrading major versions across multiple packages:
1. **Check compatibility:** Run `npm outdated` to see available versions
2. **Update package.json manually:** Gives full control over version choices
3. **Install and verify:** `npm install` then `npm run typecheck` and `npm run build`
4. **Test incrementally:** Don't upgrade everything at once if one package breaks
5. **Document rationale:** Note which packages maxed out at specific versions

### Kiro Infrastructure Organization
When building a Kiroween entry, organize `.kiro/` clearly from the start:
- **`.kiro/specs/`** — Technical specifications for features (spec-first requirement)
- **`.kiro/docs/`** — Summaries, reports, non-spec documentation
- **`.kiro/steering/`** — Context files that guide Kiro sessions
- **`.kiro/hooks/`** — Automation triggers (JSON files)
- **`.kiro/workflows/`** — Multi-step workflow definitions

Keep root-level docs/ separate for user-facing documentation (README, PROJECT-STRUCTURE).

### File Structure Best Practices
When a project matures, organize for two audiences:
- **Root level:** User-facing (README, LICENSE, package.json)
- **docs/ folder:** Project documentation (AGENTS.md, structure guides)
- **src/ folder:** Implementation code
- **.kiro/ folder:** Kiro methodology artifacts (never gitignored for Kiroween)

This separation makes the repo professional and submission-ready.

### Stale Sync Prevention (Reinforced Lesson)
**Always re-sync before pushing**, especially after time away:
```bash
git pull --rebase
git diff origin/main <changed-file>  # For every file
```
Stale local state can revert recent work. Verify every changed file against remote main at push time.
