# Open Folder Replaces the Playlist

**Status:** In Progress
**Created:** 2026-11-26
**Owner:** Maintainer
**Implementation:** Kiro

## Overview
The folder button on each skin (Dracula tool row, Frankenstein jacket pin,
Skeleton coffin icon) and the hidden floating pill all call
`openLocalFiles()` in `src/renderer/openFiles.ts`. It opens a multi-file
picker and appends the files. The required-controls rule calls this button
"open folder", and the maintainer wants it to behave that way.

Maintainer decisions (2026-11-26):
- Opening a folder **replaces** the playlist (demo tracks included).
- Audio files in **subfolders** are included.
- Picking individual files is dropped.
- Tracks are sorted by file name.

## Requirements
- [ ] R1: The button opens a native folder picker (starts in the OS Music folder).
- [ ] R2: The main process lists audio files in that folder and all subfolders, using the existing `AUDIO_EXTENSIONS`, sorted by relative path (natural, case-insensitive). Symlinks are not followed. At most 5,000 files and 20 levels deep, so a huge or looping tree cannot hang the app.
- [ ] R3: If the folder has at least one audio file, the playlist is replaced. If audio was playing, the first new track plays; otherwise the first track is selected and shown, not played. An empty folder or a cancel leaves the playlist alone.
- [ ] R4: Every skin's folder control is labelled "Open folder" (aria-label and title).
- [ ] R5: The old file-picker API (`dialog:openAudio`, `openAudioFiles`) is removed, since nothing calls it.
- [ ] R6: Paths reach the renderer as `file://` URLs (`pathToFileURL`), as today, so `audio:read` keeps working for names with spaces, `%` and `#`.

## Design
- `src/main/index.ts`: `dialog:openFolder` handler: `showOpenDialog({ properties: ['openDirectory'] })`, then a recursive `readdir(..., { withFileTypes: true })` walk.
- `src/preload/index.ts`, `src/renderer/env.d.ts`: `openAudioFolder(): Promise<string[]>`.
- `src/renderer/player/Player.ts`: `replacePlaylist(tracks)` stops audio, sets the list and index 0, notifies the skin (`onPlaylistUpdate`, `onTrackChange`), and plays if it was playing.
- `src/renderer/openFiles.ts`: `openFolder(player)` replaces `openLocalFiles`; all four callers switch.

## Tasks
- [ ] T1: Main-process folder dialog and walk.
- [ ] T2: Preload and types.
- [ ] T3: `Player.replacePlaylist`.
- [ ] T4: `openFolder` and the four callers; labels.
- [ ] T5: Remove the old file-picker API.

## Acceptance Criteria
- `npm run typecheck` and `npm run build` pass.
- [MAINTAINER: in the running app, on each skin: open a music folder with subfolders; the playlist shows only that folder's tracks, sorted; playback continues with the first track if it was playing; cancel changes nothing.]

## Implementation Notes
