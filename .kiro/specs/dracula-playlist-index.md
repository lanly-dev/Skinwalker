# Dracula Playlist Index

**Status:** Implemented; visual check pending
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
Commit `d060991` (2026-11-23) removed the track number from Dracula's
playlist rows, so a row reads `Title • mm:ss`. The maintainer asked to put
the index back: `01. Title • mm:ss`, as before.

## Requirements
- [ ] R1: Each row's name is `NN. Title`, two-digit, 1-based, as it was before `d060991`.
- [ ] R2: The aria-label stays `Play <title>` (no number), matching the other skins.
- [ ] R3: Only `buildPlaylist()` in `src/renderer/skins/DraculaSkin.ts` changes.

## Tasks
- [x] T1: Restore `` `${String(i + 1).padStart(2, '0')}. ${track.title}` ``.

## Acceptance Criteria
- Typecheck and build pass.
- [MAINTAINER: in the running app, Dracula rows read `01. Nocturne In Blood • 00:54` and long titles still fit.]

## Implementation Notes
2026-11-26: restored the line removed in d060991. The aria-label is unchanged. Typecheck and build pass. Not checked in the running app.
