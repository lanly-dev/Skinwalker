# Skinwalker 🎃

A Halloween-themed media player where the monster's anatomy IS the interface — Kiroween 2026 Costume Contest entry.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-45.4.1-47848F.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6.svg)

## What Is This?

Skinwalker is an Electron desktop media player where **the skin is a living Halloween monster**. Every body part is a working control:

- 🌀 **Cape / jaw / skull** → Audio visualizer (varies by skin; see `docs/README.md` for the per-skin anatomy table)
- 🩸 **Blood line** → Seek bar (Dracula paints the line from the plate artwork, with six animated drops)
- ❤️ **Medallion** → Play/pause
- 🦴 **Hands / bones / bolts** → Previous/Next track
- 🧛 **Monster body** → Window chrome (frameless, transparent)

## Features

- **3 Monster Skins:** Dracula (flagship), Skeleton, Frankenstein. Each carries a "next skin" control (Dracula's hover tool row, Skeleton's right bone plaques, Frankenstein's brass skin pin), so you can cycle through all three; the order wraps back to Dracula. The app reopens on the last skin used.
- **Audio:** local MP3/WAV playback through the Web Audio API. The three bundled WAV demo tracks were synthesized offline by `npm run generate-tracks`; the app itself does not synthesize audio at runtime.
- **Real-Time Visualizer:** Driven by Web Audio API AnalyserNode
- **Animated blood drops:** Dracula's blood line has six painted drops that stretch, snap and fall (CSS animation).
- **Shaped Window:** the window is clipped to the monster silhouette with `setShape` (code path runs on Windows and Linux, skipped on macOS). Checked on Windows only that the packaged app launches; the clipped shape and Linux are UNVERIFIED.
- **Bundled Tracks:** 6 demo tracks: 3 synthesized WAVs and 3 Kevin MacLeod MP3s (CC BY 4.0)

## Quick Start

If `npm run dev` fails with "Electron uninstall", the Electron binary was not downloaded. Run `node node_modules/electron/install.js` once, then `npm run dev` again. The dev server listens on port 5500 (set in `electron.vite.config.ts`) because Vite's default 5173 can fall inside a Windows reserved port range.


```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Package installer
npm run package
```

## Project Structure

```
skinwalker/
├── .kiro/              # Kiro workflows, steering, hooks, specs
├── docs/               # Project documentation
├── public/tracks/      # Bundled demo audio files
├── reference/          # Design references (gitignored)
├── resources/          # App icons and native assets
├── scripts/            # Build and utility scripts
├── src/
│   ├── main/          # Electron main process
│   ├── preload/       # IPC bridge (contextBridge)
│   └── renderer/      # UI, player, audio engine, skins
└── out/               # Build output (gitignored)
```

## Tech Stack

- **Electron 45.4.1** — Desktop app framework
- **TypeScript 7.0.2** — Type-safe development
- **Vite 8** (via electron-vite 6.0) — Fast builds and HMR
- **Web Audio API** — Audio playback and visualizer
- **Vanilla DOM** — No UI framework, pure TypeScript + CSS

## Documentation

- **[AGENTS.md](docs/AGENTS.md)** — Project history, decisions, lessons learned
- **[.kiro/specs/](/.kiro/specs/)** — Feature specifications
- **[.kiro/steering/](/.kiro/steering/)** — Development guides and conventions

## Kiroween 2026

This is a **Costume Contest** entry for Kiroween 2026, developed with Kiro as part of a mixed-tooling workflow — see **Kiro Usage** below for the honest breakdown.

- **Category:** Costume Contest (spooky UI where every element does functional work)
- **Deadline:** Friday, December 4, 2026, 2:00 PM PT
- **Requirements:** new project, MIT license, `.kiro/` folder committed

### Kiro Usage

- ✅ Steering files in `.kiro/steering/` guide CSS, audio, and Electron conventions across the project
- ✅ Hooks in `.kiro/hooks/` automate TypeScript checks, spec-first reminders, and security/privacy checks
- ✅ A workflow in `.kiro/workflows/` structures new-skin feature development
- ⚠️ Specs in `.kiro/specs/` cover the code-optimization pass, the Dracula blood-effects feature and submission readiness. `git log` shows the blood-effects spec was committed after its feature code, and the blood-effects spec describes elements (splatter, trails) that were never committed. See `.kiro/INDEX.md` for the full list of what was and was not built from a spec.
- Disclosure: the core player and skin system were built with mixed tooling, with Kiro steering and hooks in the loop. Spec-driven development applies where specs exist, and newer feature work is done spec-first in Kiro. The `/.kiro` contents are the real working files, not a retroactive trail.

## License

MIT — See [LICENSE](LICENSE) file for details.

## Credits

- **Demo Music:** Kevin MacLeod (incompetech.com) — Licensed under CC BY 4.0
- **Synthesis Algorithm:** Inspired by boba.page reference implementation
- **Built With:** Kiro (steering, hooks, workflow, and spec-guided feature work) alongside other development tools
