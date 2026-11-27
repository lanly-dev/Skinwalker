# Durations for Tracks From Open Folder

**Status:** Implemented; in-app check pending
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Problem
Reported by the maintainer: after Open folder, the playlist lists the tracks
but shows no durations (`--:--`).

Cause, reproduced in an isolated Electron test: `probeDurations()` in
`src/renderer/trackDurations.ts` sets a `file://` URL on an `Audio` element.
In dev the renderer is served from `http://localhost:5500`, and Chromium
refuses to load a `file://` resource from an `http` page (the probe fires
`error`, MediaError code 4). The probe then marks the URL as failed, so it is
never retried. Bundled demo tracks use relative URLs, so they were not
affected. Playback works because it already reads bytes through the
`audio:read` IPC (`window.skinwalker.readAudioFile`).

## Requirements
- [x] R1: For `file:` URLs, the probe reads the bytes through `readAudioFile`, wraps them in a Blob URL, reads the duration from that, and revokes the Blob URL afterwards.
- [x] R2: At most 2 local files are read at a time, so a large folder does not read hundreds of files at once.
- [x] R3: The renderer CSP allows `blob:` for media (`media-src 'self' file: blob:`). Nothing else in the CSP changes.
- [x] R4: Relative URLs (bundled tracks) keep the current path.

## Tasks
- [x] T1: `trackDurations.ts`: blob path with a 2-slot queue.
- [x] T2: CSP in `src/renderer/index.html`.

## Acceptance Criteria
- Typecheck and build pass.
- [MAINTAINER: in `npm run dev`, Open folder; durations appear on every skin's playlist within a few seconds.]

## Notes
Each local track is read in full once to get its duration (playback reads it in full anyway). A custom streaming protocol would avoid that, but needs an allow-list of picked files to be safe; not done here.

## Implementation Notes
2026-11-26: isolated Electron test, page served over http with the new CSP: a `file://` src fails with MediaError 4 (the bug); the same file as a Blob URL reports duration 169.7 s (`darkling.mp3`). Implemented in `trackDurations.ts` with a 2-slot queue; CSP gains `blob:` for media only. Typecheck and build pass. Not checked inside the running app.
