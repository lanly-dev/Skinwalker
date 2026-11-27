# Durations for Tracks From Open Folder

**Status:** In Progress (revision 2)
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Problem
After Open folder the playlist showed no durations. Cause: in dev the page
is served from `http://localhost:5500`, and Chromium will not load a
`file://` media URL from an `http` page (MediaError 4, reproduced in an
isolated Electron test).

Revision 1 (`33c5c89`) read every file in full over IPC and probed it as a
Blob URL. The maintainer reports the app freezes when a folder is opened.
From the code: every track is read and copied in full in the main process,
and every arriving duration rebuilds the whole playlist (N rebuilds of N rows).

## Revision 2: the simple fix
- [ ] R1: Duration probes load local files through a small app protocol, `skinwalker-media:`, whose handler returns `net.fetch` of the `file://` URL. The `Audio` element with `preload="metadata"` then reads only what it needs, not the whole file.
- [ ] R2: The handler serves only files returned by the last Open folder (an in-memory allow-list); anything else gets 403.
- [ ] R3: Arriving durations are applied in one playlist rebuild at most every 200 ms, not one rebuild per track.
- [ ] R4: Revision 1's IPC read, Blob URLs and queue are removed; CSP `media-src` swaps `blob:` for `skinwalker-media:`.
- [ ] R5: Playback is unchanged (still `audio:read`).

## Acceptance Criteria
- Isolated test: a page served over http gets a duration for a local MP3 through the protocol.
- Typecheck and build pass.
- [MAINTAINER: Open folder no longer freezes and durations appear.]

## Implementation Notes
