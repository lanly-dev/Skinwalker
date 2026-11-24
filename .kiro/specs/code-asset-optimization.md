# Code and Asset Optimization Specification

**Status:** Complete (2026-11-24). Runtime look and feel pending maintainer check.
**Created:** 2026-11-24
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
Make the shipped app smaller and remove duplicated code, with no visible or
behavioral change. Baseline measured 2026-11-24 at `84d0c02`.

## Baseline
| Item | Size | Note |
|------|------|------|
| Installer `dist/skinwalker Setup 0.1.0.exe` | 295.1 MB | `app.asar` is 238.7 MB: it packs the whole project folder, including 181.5 MB of gitignored `reference/` files, `.cloud-attachments/`, `.freebuff/`, `src/`, `.kiro/`, `docs/` (audit row 34). |
| `resources/icon.png` | 1,266 KB, 1024x1024 | Only used as the runtime window icon; installer uses the default Electron icon (audit row 23). |
| `src/renderer/assets/dracula-tools.jpg` | 167 KB, 1983x793 | Largest renderer image; every other plate is WebP. |
| Demo tracks `public/tracks/` | 26 MB | 3 MP3 + 3 WAV. Out of scope: no encoder installed, and re-encoding changes audio quality. |
| Duplicated code | 3 copies | `probeDurations()`, `trackDuration()`, `fmt()` are identical in all three skins; each skin re-probes every track. |
| Dead CSS | none | All 140 class selectors in `style.css` are referenced in `src/renderer/`; no unused `@keyframes`. |

## Requirements
- [x] R1: The installer contains only `out/**`, `resources/**` and `package.json` (plus what electron-builder adds itself).
- [x] R2: The installer and the app use the Skinwalker icon.
- [x] R3: `icon.png` is at least 256x256 (electron-builder minimum) and smaller on disk.
- [x] R4: `dracula-tools` is WebP and visually equal to the JPEG (mean absolute pixel difference reported).
- [x] R5: Track duration probing and time formatting live in one module; durations are probed once per URL for the whole app, not once per skin.
- [x] R6: No behavior change. `npm run typecheck` and `npm run build` pass.

## Tasks
- [x] T1: `package.json` `build.files` allow-list and `build.win.icon`.
- [x] T2: `icon.png` downscaled to 512x512 with PIL (LANCZOS), optimized PNG.
- [x] T3: `dracula-tools.jpg` to `dracula-tools.webp` (quality 90), update the import in `DraculaSkin.ts`.
- [x] T4: New `src/renderer/trackDurations.ts` (`formatTime`, `probeDurations`, `durationOf`, cached app-wide); the three skins use it.
- [x] T5: Rebuild, re-measure, fill the Results table.

## Acceptance Criteria
- Results table below filled with measured numbers.
- `npx @electron/asar list` on the new `app.asar` shows no `reference/`, `.cloud-attachments/`, `.freebuff/`, `src/`, `.kiro/` or `docs/` entries.
- Typecheck and build pass. The packaged app launches.
- [MAINTAINER: run the app and confirm the tool row, playlists and durations look and behave as before.]

## Results
Measured 2026-11-24 after commits `ae8edd5`, `04ceaf3`, `5d26469`.

| Item | Before | After |
|------|--------|-------|
| Installer | 295.1 MB | 140.0 MB |
| `app.asar` | 238.7 MB | 26.95 MB (38 `out/` entries, `package.json`, 2 `resources/` entries; nothing else) |
| electron-builder "default Electron icon is used" | logged | not logged |
| `resources/icon.png` | 1,266 KB, 1024x1024 | 375 KB, 512x512 |
| Dracula tools sprite | 167 KB JPEG | 126 KB WebP q90; mean absolute pixel difference 0.65 of 255, max 24 |
| Duration probe / `fmt` copies | 3 (about 33 lines each) | 1 (`src/renderer/trackDurations.ts`); 99 lines removed from the skins |

Most of the remaining 140 MB is the Electron runtime and the 26 MB of demo tracks.
`npm run typecheck` and `npm run build` pass. The packaged `skinwalker.exe` stayed running 8 s; no UI was inspected.
Kept `productName` unset on purpose: setting it would move the app's data folder and reset the saved skin (`.kiro/specs/remember-last-skin.md`).
Behavior note: the shared probe also records failed URLs and does not retry them, matching the old per-skin `probed` set.
