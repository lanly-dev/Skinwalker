---
inclusion: auto
name: skin-required-controls
description: Controls every Skinwalker skin must provide (playback, volume, seek, track board, 5 window buttons)
---
# Required Controls For Every Skin

Every skin in `src/renderer/skins/` must provide all of the controls below.
A skin that lacks one is not finished. Each control should be a monster body
part or painted element, never a generic widget stuck on top.

## Playback and audio
1. **Play / pause**: one control that toggles playback.
2. **Previous track** and **next track**: two controls.
3. **Seek bar**: draggable, shows position, commits the seek on release.
4. **Volume control**: drag, wheel or keyboard; shows the current level.

## Track board
5. **Track list board**: shows the playlist, highlights the current track,
   and plays a track when it is chosen.

## Five window buttons
6. **Close**: quits the app.
7. **Minimize**: minimizes the window.
8. **Switch skin**: moves to the next skin in `SKINS`.
9. **Mini version**: collapses the window to the compact player.
10. **Open folder**: opens the native picker to add local audio files to the playlist.

## Rules for implementing
- Wire controls through `Player` and the `window.skinwalker` API. Do not call Electron directly from a skin.
- Every control must be reachable by keyboard and have an accessible label.
- Window buttons must not start a window drag (`no-drag`, see `src/renderer/skinDrag.ts`).
- Buttons and controls must sit inside the painted silhouette so the shaped window does not click through them.
- Verify the check list below in the running app, not only in the code.

## Checklist for a new or changed skin
- [ ] play/pause
- [ ] previous, next
- [ ] seek bar
- [ ] volume
- [ ] track board
- [ ] close, minimize, switch skin, mini version, open folder
- [ ] `npm run typecheck` and `npm run build` pass

## Known conflicts (2026-11-20)
- `docs/AGENTS.md` and `.kiro/steering/skinwalker-project.md` say mid-playback skin switching is out of scope and there is no switcher. This rule requires a switch-skin button, so those two files must be updated when the switcher is built. Until the maintainer approves the scope change, treat this rule as the target, not as a description of current code.
- Not every skin has all ten controls today. Dracula has a tool row with close, minimize, add files and mini bat, and no switch-skin button. Other skins have not been audited against this list. A spec is needed before the missing controls are implemented.
