# Frankenstein Volume Readout Position

**Status:** In Progress
**Created:** 2026-11-24
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The volume percentage (`.fr-vol` in `src/renderer/skins/FrankensteinSkin.ts`)
sits below the gold watch (`top: 103%` in `src/renderer/style.css`). The
maintainer asked for it in the centre of the watch face.

## Requirements
- [ ] R1: The percentage is centred on the rotating knob face, not on the watch box. The face centre is the face's own box centre (`left 15.25% + 67.3% / 2`, `top 14.3% + 67.3% / 2`, i.e. 48.9% / 47.95% of `.fr-watch`).
- [ ] R2: The text does not rotate with the face and does not block the dial (`pointer-events: none`).
- [ ] R3: The text stays readable over the gold face.

## Tasks
- [ ] T1: Change the `.fr-vol` rule only: absolute, centred on 48.9% / 47.95% with `translate(-50%, -50%)`, above the face, stronger dark text shadow.

## Acceptance Criteria
- `npm run typecheck` and `npm run build` pass.
- [MAINTAINER: in the running app, the percentage sits in the middle of the watch face at 0%, 50% and 100%, and dragging the dial still works.]

## Implementation Notes
