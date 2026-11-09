# Skinwalker

> A media player where the skin is a living Halloween monster.

Kiroween 2026 — **Costume Contest** entry.

Swap monster skins mid-playback and every body part does real work: the mouth is the visualizer, the eyes toggle play/pause, the claws scrub the timeline. No decoration — pure functional anatomy.

---

## Skins

| Monster | Status | Anatomy |
|---------|--------|---------|
| 🧛 Dracula | flagship | eyes → play/pause · cape → visualizer · blood drip → seek · medallion → volume · fangs → prev/next |
| ⚡ Frankenstein | functional | skull flat-top → visualizer · eyes → play/pause · neck bolts → prev/next · chest scar → seek · hand → volume |
| 💀 Skeleton | functional | skull jaw → visualizer · eye sockets → play/pause · arm bones → prev/next · ribcage → seek · spine → volume |

---

## Stack

- **Electron 33** — frameless, transparent window (the monster IS the chrome)
- **electron-vite** — Vite HMR for main + preload + renderer
- **TypeScript** — strict, no UI framework
- **Web Audio API** — real `AnalyserNode` drives the visualizer; no fake animation loops

---

## Getting started

```bash
npm install
npm run dev        # Electron app with HMR
```

### Build

```bash
npm run build      # compile to out/
npm run package    # electron-builder installer → release/
```

### Typecheck

```bash
npm run typecheck
```

---

## Project layout

```
src/
├── main/           # Electron main process (window, IPC, file dialog)
├── preload/        # Context bridge → window.skinwalker API
└── renderer/       # All UI
    ├── audio/      # AudioEngine (Web Audio API wrapper)
    ├── player/     # Player state + playlist logic
    └── skins/      # Skin interface + one file per monster
        └── index.ts  ← register new skins here
public/
└── tracks/         # Bundled royalty-free demo tracks (add .mp3 files here)
resources/          # App icon and native assets
.kiro/              # Kiro specs, steering, hooks (planned — required for submission)
```

---

## Adding demo tracks

Drop royalty-free `.mp3` files into `public/tracks/` and update the `DEMO_TRACKS` array in `src/renderer/main.ts`. Only use tracks you own or that are explicitly royalty-free — copyrighted audio in the demo video is a submission rules violation.

---

## Adding a new skin

1. Create `src/renderer/skins/YourMonsterSkin.ts` implementing the `Skin` interface.
2. Map every monster body part to a real player control — no pure decoration.
3. Register it in `src/renderer/skins/index.ts`.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built with [Kiro](https://kiro.dev) for [Kiroween 2026](https://kiro.dev/kiroween).*
