# Skinwalker 🎃

A Halloween-themed media player where the monster's anatomy IS the interface — Kiroween 2026 Costume Contest entry.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-45.3.0-47848F.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6.svg)

## What Is This?

Skinwalker is an Electron desktop media player where **the skin is a living Halloween monster**. Every body part is a working control:

- 👁️ **Eyes** → Audio visualizer
- 🩸 **Blood drip** → Seek bar (with 101+ animated blood effects)
- ❤️ **Medallion** → Play/pause
- 🦴 **Bones/Hands** → Previous/Next track
- 🧛 **Monster body** → Window chrome (frameless, transparent)

## Features

- **3 Monster Skins:** Dracula (flagship), Frankenstein, Skeleton
- **Dual-Mode Audio:** File-based (MP3/WAV) + Procedural synthesis
- **Real-Time Visualizer:** Driven by Web Audio API AnalyserNode
- **Living Blood Effects:** 101+ animated blood drips, trails, and splatter
- **Shaped Window:** OS window clips to monster silhouette (Windows/Linux)
- **Bundled Tracks:** 6 royalty-free demo tracks included

## Quick Start

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

- **Electron 45.3.0** — Desktop app framework
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
- **Requirements:** New project, MIT license, `.kiro/` folder committed, spec-first development

### Kiro Usage

- ✅ Steering files in `.kiro/steering/` guide CSS, audio, and Electron conventions across the project
- ✅ Hooks in `.kiro/hooks/` automate TypeScript checks, spec-first reminders, and security/privacy checks
- ✅ A workflow in `.kiro/workflows/` structures new-skin feature development
- ✅ Specs in `.kiro/specs/` cover the code-optimization pass and the Dracula blood-effects feature — those were built spec-first from their specs
- Disclosure: the core player and skin system were built with mixed tooling, with Kiro steering and hooks in the loop. Spec-driven development applies where specs exist, and newer feature work is done spec-first in Kiro. The `/.kiro` contents are the real working files, not a retroactive trail.

## License

MIT — See [LICENSE](LICENSE) file for details.

## Credits

- **Demo Music:** Kevin MacLeod (incompetech.com) — Licensed under CC BY 4.0
- **Synthesis Algorithm:** Inspired by boba.page reference implementation
- **Built With:** Kiro (steering, hooks, workflow, and spec-guided feature work) alongside other development tools
