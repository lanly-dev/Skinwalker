# Devpost Description (draft)

**Category:** Costume Contest
**Bonus prizes to claim:** Bonus Blog, Social Blitz. Best Demo needs nothing extra.
[MAINTAINER: confirm. Best Student, Startup, Ghost of Kiroween Past and Kiro Crew only if their conditions are true.]
**Repo:** https://github.com/lanly-dev/Skinwalker (MIT)
**App URL:** [MAINTAINER: GitHub release link once published; until then the repo, built with `npm install && npm run dev`.]

## Skinwalker

Skinwalker is a Windows desktop media player where the skin is a monster and its anatomy is the interface. The window has no title bar. It is cut to the silhouette of the character, so the desktop shows through everywhere the monster is not.

### What it does
- Plays local MP3 and WAV files through a native file picker, with a playlist, seek, volume, and previous/next.
- Ships six demo tracks: three synthesized WAVs and three Kevin MacLeod MP3s (CC BY 4.0).
- Draws a live visualizer from the Web Audio API `AnalyserNode`, not a canned animation.
- Three skins (anatomy mapped to controls, from the skin source files):

| Skin | Anatomy to control |
|------|--------------------|
| Dracula | medallion: play/pause. Cape: visualizer. Blood line: seek, painted from the plate art with six animated drops. Jeweled minus/plus: volume. Crossed hands: previous/next. Hover tool row: close, minimize, add files, next skin, mini bat. |
| Frankenstein | skull flat-top: visualizer. Eyes: play/pause. Neck bolts: previous/next. Chest scar: seek. Hand dial: volume. |
| Skeleton | pendant: play/pause. Jaw: visualizer. Bone board: playlist. Blood line: seek. Left bone column: volume. Bone plaques: previous/next. |

The first skin in `src/renderer/skins/index.ts` (Dracula) launches. Dracula's "next skin" button cycles Skeleton, then Frankenstein, then back to Dracula. Skeleton and Frankenstein have no switch button, so you cannot return from them without restarting. [MAINTAINER: fix before recording, or avoid showing the switch.]

### Platform
Built and tested on Windows. [MAINTAINER: Linux and macOS are untested; say so or leave them out.]

### Built with
Electron, electron-vite, TypeScript, Web Audio API, vanilla DOM and CSS. Built with Kiro. See the Kiro usage write-up.

### Disclosures
- [MAINTAINER: Dracula and Skeleton plates were derived from art on an earlier web version of this player ("Boba web build"). State who made it and who owns it. If it is yours, say it is pre-existing work reused here.]
- [MAINTAINER: character art was AI-generated. Name the tool.]
- Music: "Baba Yaga", "Darkling", "Thief in the Night" by Kevin MacLeod (incompetech.com), CC BY 4.0.
- Three demo WAVs were synthesized by `scripts/generate-demo-tracks.js`, an algorithm inspired by the same web build.
- Specs for this repo were mostly written after the code. See `.kiro/INDEX.md`.

### Install
Windows: [MAINTAINER: link to the installer in a release.] The installer is unsigned, so SmartScreen may warn. From source: `npm install`, then `npm run dev`.