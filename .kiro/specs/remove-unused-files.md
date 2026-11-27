# Remove Unused Files

**Status:** In Progress
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The maintainer asked to remove files that are not used. Audit at `36414a2`:

| Check | Result |
|-------|--------|
| `src/renderer/assets/` (28 files) | every file is referenced from `src/` |
| `src/**/*.ts`, `style.css` | every module is imported; no unused exports |
| `scripts/generate-demo-tracks.js` | used by `npm run generate-tracks` |
| `.kiro/docs/*`, `.kiro/QUICK-REFERENCE.md`, `docs/PROJECT-STRUCTURE.md` | each is linked from another doc; kept as Kiro/judging evidence |
| `_arm_on.png` (700 KB), `_lit.png` (858 KB) at the repo root | **no references**; scratch screenshots committed with `8808735` |
| `window:maximize` IPC (`src/main/index.ts`), `maximize` in `src/preload/index.ts` and `src/renderer/env.d.ts` | **no caller** since the generic title bar was removed (`1e1fc21`) |

## Requirements
- [ ] R1: Delete `_arm_on.png` and `_lit.png`.
- [ ] R2: Delete the unused `maximize` API: main-process handler, preload method, type. Keep `win.unmaximize()` in the `window:set-size` handler (still used).
- [ ] R3: Nothing else changes. Typecheck and build pass.

## Tasks
- [ ] T1: R1.
- [ ] T2: R2.

## Implementation Notes
