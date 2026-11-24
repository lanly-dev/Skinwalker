# Code and Asset Optimization Specification

**Status:** In Progress
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
- [ ] R1: The installer contains only `out/**`, `resources/**` and `package.json` (plus what electron-builder adds itself).
- [ ] R2: The installer and the app use the Skinwalker icon.
- [ ] R3: `icon.png` is at least 256x256 (electron-builder minimum) and smaller on disk.
- [ ] R4: `dracula-tools` is WebP and visually equal to the JPEG (mean absolute pixel difference reported).
- [ ] R5: Track duration probing and time formatting live in one module; durations are probed once per URL for the whole app, not once per skin.
- [ ] R6: No behavior change. `npm run typecheck` and `npm run build` pass.

## Tasks
- [ ] T1: `package.json` `build.files` allow-list and `build.win.icon`.
- [ ] T2: `icon.png` downscaled to 512x512 with PIL (LANCZOS), optimized PNG.
- [ ] T3: `dracula-tools.jpg` to `dracula-tools.webp` (quality 90), update the import in `DraculaSkin.ts`.
- [ ] T4: New `src/renderer/trackDurations.ts` (`formatTime`, `probeDurations`, `durationOf`, cached app-wide); the three skins use it.
- [ ] T5: Rebuild, re-measure, fill the Results table.

## Acceptance Criteria
- Results table below filled with measured numbers.
- `npx @electron/asar list` on the new `app.asar` shows no `reference/`, `.cloud-attachments/`, `.freebuff/`, `src/`, `.kiro/` or `docs/` entries.
- Typecheck and build pass. The packaged app launches.
- [MAINTAINER: run the app and confirm the tool row, playlists and durations look and behave as before.]

## Results
(filled in T5)
