# Remember Last Skin Specification

**Status:** Implemented; runtime check pending
**Created:** 2026-11-22
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The app always opened on `SKINS[0]` (Dracula). It should reopen on the skin
that was active when it was last closed.

## Requirements
- [ ] R1: Every time a skin is mounted, its `id` is saved.
- [ ] R2: On startup, the saved skin is mounted if it is still in `SKINS`.
- [ ] R3: If nothing is saved, the id is unknown (skin removed or renamed), or storage fails, the app mounts `SKINS[0]`.
- [x] R4: No new dependency, no main-process change, no file on disk that the app manages itself.

## Design
- New module `src/renderer/lastSkin.ts` with `loadLastSkinId()` and `saveLastSkinId(id)`, using `localStorage` key `skinwalker.lastSkin`. Both catch storage errors and return or do nothing.
- `Player.mountSkin()` calls `saveLastSkinId(skin.id)`.
- `src/renderer/main.ts` picks `SKINS.find((s) => s.id === loadLastSkinId()) ?? SKINS[0]`.
- Note: `localStorage` is per origin. The dev server (`http://localhost:5500`) and the packaged app (`file://`) keep separate values. Changing the dev port also resets it in dev.

## Tasks
- [x] T1: `src/renderer/lastSkin.ts`.
- [x] T2: Save in `Player.mountSkin()`.
- [x] T3: Load in `src/renderer/main.ts`.

## Acceptance Criteria
- `npm run typecheck` and `npm run build` pass.
- In the running app: switch to Skeleton, close, reopen: Skeleton shows. Same for Frankenstein and Dracula.
- Clearing storage (DevTools > Application > Local Storage) reopens on Dracula.

## Implementation Notes
2026-11-22: implemented as designed. `npm run typecheck` and `npm run build` pass. R1 to R3 not checked in the running app. [MAINTAINER: run the acceptance steps above, then tick R1 to R3.]
