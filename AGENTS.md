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
  - `public/tracks/` — bundled royalty-free demo tracks (not yet added)

## Scope v1
- **Electron desktop app**; local audio files via native OS file picker + bundled royalty-free demo tracks.
- Core player: play / pause / seek / volume, playlist, next / prev.
- **At least 3 monster skins**, swappable mid-playback without stopping the track.
- Per skin, functional anatomy: e.g. mouth or eyes as the live visualizer (Web Audio AnalyserNode), claw / tongue / vine as the seek bar, skin-themed play/pause and volume organs.
- One skin is the design flagship (Dracula) — polish it hardest; the other two can be simpler but must be fully functional skins, not color swaps.
- Frameless, transparent window — the monster body IS the window chrome. No OS titlebar.

## Non-goals (scope caps — do not cross without explicit approval)
- **No spectrogram / file-quality analysis.** That is SpectreGram, the sibling Resurrection entry. A simple live visualizer is fine; analysis features would blur the two entries and endanger the "substantially different" rule.
- No streaming-service logins, no accounts, no backend, no uploads.
- Demo and demo-video audio: royalty-free / own tracks only (copyrighted music in the video is a rules violation).
- No auto-updater, no in-app store, no telemetry.

## Acceptance checks (must all pass before "done")
- [ ] Load a track, play it, swap all 3 skins mid-play — audio never interrupts.
- [ ] Every visible control in every skin actually works (seek, volume, playlist).
- [ ] Visualizer is driven by the real audio signal, not a fake animation loop.
- [ ] Frameless window drags, minimizes, maximizes, and closes correctly.
- [ ] Native file picker adds local tracks to playlist without restart.
- [ ] `npm run build` produces a working installer or portable binary.
- [ ] App runs from a clean install on Windows with no extra dependencies.

## Packaging checklist
- [ ] Packaged installer / portable binary (electron-builder), public repo + MIT license + `/.kiro`.
- [ ] Demo video < 3 min, public YouTube: play a track → swap skins mid-song → close-up of one skin where the anatomy IS the control.
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
- **All three skins image-frame — 2026-11-09:** Frankenstein and Skeleton got the full Dracula treatment — generated character art (text-free on the first pass this time), backdrop flood-filled to alpha, element layers separated by color segmentation. Frankenstein: forehead EQ = visualizer panel, eyes = play/pause (layers pulse), neck bolts = prev/next, chest scar = seek, brass dial in the hand = volume (dial erased from the plate via a palm-gradient fill and the layer rotates; two erase lessons — a horizontal-stretch inpaint smears when neighbours aren't uniform, and any erase zone must sit inside the flood-fill's protected region or the fill eats it). Skeleton: eye sockets = play/pause, jaw gap = visualizer, ribcage line = seek, spine = VERTICAL volume (drag up/down; a glow fill + dot travel the vertebrae), bony hands = prev/next; the gaps between its bones are genuinely see-through, and the baked seek line's stubs outside the ribcage were alpha-clipped. All hotspot geometry verified by compositing the CSS boxes over the plates; the dial rotation was verified ghost-free.

## Open decisions
1. Demo tracks: source and filenames for the 3 bundled royalty-free tracks (drop into `public/tracks/`).

## How we work
Plan → Work → Assess → Compound. When a session earns a lesson (a bug's real cause, a workflow that works), write it into this file the moment it is earned. When a decision above is made, update the Open decisions section in the same session — undecided items stay visibly undecided, never silently assumed.
