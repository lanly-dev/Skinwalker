# Blog Post (draft)

Publish on a third-party platform (for example dev.to or Medium) between 2026-10-30 and 2026-12-04. It must say it was written as part of the Kiroween 2026 hackathon. Write the first-person parts yourself.

---

**Title:** [YOU: your title]

*This post was written as part of the Kiroween 2026 hackathon.*

## The idea
Skinwalker is a Windows media player where the skin is a monster and each body part is a control. Dracula's medallion plays and pauses, his cape is the visualizer, and the blood line is the seek bar. [YOU: why you chose this idea.]

## How it works
- Electron with a frameless, transparent window. The window shape is set from the painted alpha of the character plate, so clicks outside the monster reach the desktop.
- Playback uses the Web Audio API. The visualizer reads an `AnalyserNode`.
- Skins are TypeScript classes registered in `src/renderer/skins/index.ts`.
[YOU: the problems that cost you time. `docs/AGENTS.md` records a few: a filtered wrapper collapsing child plates to zero height, and the window growing on a 150% display during drags.]

## Using Kiro
[YOU: your real experience with Kiro. Cover only what you did. Facts you can use from the repo: three hooks, seven steering files, three specs; the specs for the first two features were written after the code; no MCP, powers or tests.]

## What I would do differently
[YOU]

Repo: https://github.com/lanly-dev/Skinwalker