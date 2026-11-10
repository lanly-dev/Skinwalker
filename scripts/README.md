# Scripts

Utility scripts for Skinwalker media player.

## generate-demo-tracks.js

Generates procedurally synthesized demo tracks matching the [boba.page reference implementation](https://boba.page/QRy-pZyZ-yDsNn2uSy3ydg/index.html).

### Usage

```bash
npm run generate-tracks
```

Or directly:

```bash
node scripts/generate-demo-tracks.js
```

### What it does

Creates 3 synthetic ambient tracks in `public/tracks/`:

1. **nocturne-in-blood.wav** (54s) — Dark ambient drone
2. **coffin-dream.wav** (58s) — Eerie atmospheric soundscape
3. **widows-kiss.wav** (51s) — Haunting ambient composition

### Synthesis Algorithm

Each track combines three layers:

- **Drone**: 3 harmonic sine waves (root, 1.5×, 2×) with slow amplitude modulation
- **Bell**: Pentatonic melody at 4× root frequency with exponential envelope (3.6s intervals)
- **Wind**: Pink noise filtered through slow sine modulation

Output format: 16-bit mono WAV, 22.05 kHz sample rate.

### Source

The synthesis code is a direct port of the JavaScript implementation from boba.page, originally written for in-browser real-time generation.

For Skinwalker, we pre-generate the tracks as WAV files so they can be bundled with the app and loaded instantly.
