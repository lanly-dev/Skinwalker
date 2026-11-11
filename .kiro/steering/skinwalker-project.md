---
inclusion: always
---

# Skinwalker Project Context

This is the Skinwalker media player — a Kiroween 2026 **Costume Contest** entry where monster anatomy IS the interface.

## Project Identity
- **Type:** Electron desktop app (Electron 33 + electron-vite + TypeScript)
- **Category:** Costume Contest — spooky UI where every monster element does functional work
- **Deadline:** Fri Dec 4, 2026, 2:00 PM PT
- **Credit Budget:** ~900 of shared 4,000 (explore elsewhere, execute in Kiro)

## Core Rules (Critical — Never Violate)

### 1. Spec-First Development
**EVERY implementation must have a `.kiro/specs/` file BEFORE code.**
- Kiroween requires this for judging
- Spec must include: requirements, design approach, tasks, acceptance criteria
- Commit the spec before writing implementation code
- If you find yourself writing code without a spec, STOP and create one first

### 2. No Absolute Paths (Standing Rule)
**Nothing that leaves this machine may contain absolute paths.**
- ❌ Never: `C:\Users\...`, `/home/user/...`, `~/workspace/...`
- ✅ Always: Repo-relative paths like `src/renderer/main.ts`, `.kiro/specs/dracula-skin.md`
- Applies to: code, comments, specs, docs, commits, READMEs, screenshots, Devpost text
- Local directory layout is PRIVATE

### 3. Kiro Does Core Implementation
- Other agents (Claude, etc.) can: plan, prototype, write docs, prep assets
- Kiro must: write the core app implementation
- `.kiro/` history must honestly show Kiro built it
- Any carried-over code needs one-line disclosure on Devpost

## Current Stack & Structure

### Technology
- **Main Process:** `src/main/index.ts` — frameless transparent window, IPC
- **Preload:** `src/preload/index.ts` — `window.skinwalker` API bridge
- **Renderer:** `src/renderer/` — UI, audio engine, player, skins
- **Audio:** Web Audio API with AnalyserNode for live visualizer
- **Assets:** `src/renderer/assets/` for character frames/layers
- **Demo Tracks:** `public/tracks/` (3 synthetic + 3 Incompetech MP3s)

### Key Files
- `src/renderer/skins/index.ts` — skin registry (add new skins here)
- `src/renderer/player/Player.ts` — core playback logic
- `src/renderer/audio/AudioEngine.ts` — dual-mode audio (synthetic + file)
- `src/renderer/style.css` — per-skin themes
- `AGENTS.md` — project decisions, lessons, status (read first every session)

### NPM Scripts
- `npm run dev` — dev server (Vite HMR)
- `npm run build` — production build
- `npm run typecheck` — TypeScript validation
- `npm run package` — create installer/binary
- `npm run generate-tracks` — synthesize demo WAV files

## Scope & Constraints

### In Scope (v1)
- ✅ Local audio playback (file picker + bundled demo tracks)
- ✅ Core controls: play/pause, seek, volume, next/prev, playlist
- ✅ Real-time visualizer driven by audio signal
- ✅ Dracula skin (flagship with 101+ blood effects)
- ✅ Frankenstein + Skeleton skins (simpler but fully functional)
- ✅ Frameless transparent window shaped to character silhouette

### Out of Scope (Do NOT Add Without Approval)
- ❌ Spectrogram/analysis features (that's SpectreGram, the sibling entry)
- ❌ Streaming services, accounts, backends, uploads
- ❌ Auto-updater, in-app store, telemetry
- ❌ Mid-playback skin switching (removed from scope)

## Skin Anatomy Pattern

Every skin follows this pattern:
1. **Character frame** — transparent WebP plate with alpha channel
2. **Separated layers** — eyes, medallions, dials extracted as PNG overlays
3. **Functional anatomy** — body parts ARE the controls:
   - Eyes/medallion → play/pause
   - Jaw/cape → visualizer canvas
   - Blood line/ribcage → seek bar
   - Spine/dial → volume control
   - Fangs/hands/bones → prev/next track
4. **Window shaping** — OS window clips to character silhouette (Windows/Linux)

## Development Workflow

### Before Starting Any Feature
1. Read `AGENTS.md` — check current decisions and lessons
2. Check if a spec exists in `.kiro/specs/`
3. If no spec: **CREATE IT FIRST** (see spec template below)
4. Run `npm run typecheck` to verify baseline is clean

### During Development
1. Make changes iteratively
2. Test in `npm run dev` after each change
3. Update `AGENTS.md` when earning a lesson or making a decision
4. Keep TypeScript strict — no `any`, no type errors

### Before Completing
1. Run `npm run typecheck` — must pass
2. Test `npm run build` — must produce working binary
3. Verify acceptance checks in `AGENTS.md`
4. Update spec with "Status: Complete" and actual implementation notes

## Common Pitfalls (Lessons Earned)

### 1. Flood Fill Protections
When removing backdrops with flood fill, protect enclosed regions:
- Dark boards/panels need borders excluded from seeds
- Near-black JPEG dust needs fringe cleanup (4px tolerance)
- Always verify on white AND colored backgrounds

### 2. Filter Containing Blocks
`filter: drop-shadow()` on a wrapper makes it the containing block:
- Positioned children (`absolute`, `fixed`) resolve against wrapper height
- If wrapper has no height, children collapse to 0
- **Fix:** Move filters to the elements themselves, not wrappers

### 3. Window Sizing on High-DPI
`setPosition` on Windows can grow window dimensions on scaled displays:
- Use `setBounds` with pinned size + trailing `setSize` call
- Pin window size during drag operations
- Re-measure and re-apply shape after moves

### 4. Card-Era CSS Pollution
Old CSS blocks can still win on specificity:
- Always delete replaced blocks completely
- Don't just add overrides — clean up dead code
- Verify before/after renders match

### 5. Stale Local Sync
Re-sync before every push when working across sessions:
- `git pull --rebase` before making changes
- Diff every changed file against remote main before pushing
- Stale syncs can revert recent work

## Testing Checklist

Before marking any feature complete:
- [ ] TypeScript compiles with zero errors
- [ ] `npm run build` succeeds
- [ ] Feature works in dev mode (`npm run dev`)
- [ ] Feature works in built binary
- [ ] No console errors or warnings
- [ ] Tested on target OS (Windows primary)
- [ ] Acceptance criteria from spec are met
- [ ] AGENTS.md updated with decisions/lessons

## Packaging Requirements (Before Submission)

- [ ] Working installer/portable binary via `npm run package`
- [ ] Public repo with MIT license visible
- [ ] `.kiro/` folder committed (specs, steering, hooks)
- [ ] Demo video < 3 min on YouTube
- [ ] Devpost description with Kiro-usage write-up
- [ ] Blog post about the build (Bonus Blog prize)
- [ ] Social post starting with `#KiroweenHackathon26`
