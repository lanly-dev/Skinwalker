---
inclusion: auto
name: audio-guide
description: Web Audio API patterns and audio engine architecture for Skinwalker
---

# Audio Engineering Guide for Skinwalker

## Audio Architecture

```
┌─────────────────────────────────────────┐
│           AudioEngine.ts                │
│  - Dual-mode playback                   │
│  - Synthesis (procedural tracks)        │
│  - File playback (MP3/WAV)              │
│  - AnalyserNode for visualizer          │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│            Player.ts                    │
│  - Playlist management                  │
│  - Track selection                      │
│  - Position/duration                    │
│  - Volume control                       │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│            Skin.ts                      │
│  - Visualizer rendering                 │
│  - UI updates                           │
│  - User interactions                    │
└─────────────────────────────────────────┘
```

## Web Audio Graph

### Standard File Playback
```
AudioElement → MediaElementSource → GainNode → AnalyserNode → Destination
                                        ↓
                                    Volume Control
```

### Synthetic Track Playback
```
AudioBuffer → BufferSourceNode → GainNode → AnalyserNode → Destination
                                     ↓
                                 Volume Control
```

## AudioEngine API

### Initialization
```typescript
const engine = new AudioEngine();
await engine.initialize(); // Creates AudioContext
```

### Playing Files
```typescript
await engine.playFile(track: Track, onEnd: () => void);
engine.pause();
engine.resume();
engine.seek(positionSeconds: number);
```

### Playing Synthetic Tracks
```typescript
await engine.playSynthetic(track: Track, onEnd: () => void);
// Uses track.demo (0, 1, or 2) to select synthesis parameters
```

### Volume Control
```typescript
engine.setVolume(0.0); // Silent
engine.setVolume(0.5); // 50%
engine.setVolume(1.0); // Full
```

### Visualizer Data
```typescript
const bins = engine.getFrequencyData(); // Uint8Array(128)
// Values 0-255, use for visualizer bars
```

## Synthesis Algorithm

Based on boba.page reference implementation:

### Parameters
```typescript
const SAMPLE_RATE = 22050; // 22.05 kHz
const DURATION = 55; // seconds

const roots = [55, 48.9994, 58.2705]; // Hz (base frequencies)
const scales = [
  [0, 3, 7, 10, 7, 3],  // Track 0
  [0, 5, 7, 3, 10, 7],  // Track 1
  [0, 3, 8, 7, 5, 3]    // Track 2
];
```

### Three-Layer Synthesis
```typescript
function synthesize(demo: number): AudioBuffer {
  const root = roots[demo];
  const scale = scales[demo];
  
  // Layer 1: Drone (sine waves on scale degrees)
  addDrone(buffer, root, scale);
  
  // Layer 2: Bell tones (decaying harmonics)
  addBells(buffer, root, scale);
  
  // Layer 3: Wind/noise texture
  addWind(buffer);
  
  // Apply fade in/out
  applyFades(buffer);
  
  return buffer;
}
```

### Caching
```typescript
// Cache synthesized tracks to avoid re-generation
const synthCache = new Map<number, AudioBuffer>();

if (!synthCache.has(demo)) {
  const buffer = synthesize(demo);
  synthCache.set(demo, buffer);
}
```

## Visualizer Patterns

### Frequency Analysis
```typescript
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256; // 128 frequency bins
analyser.smoothingTimeConstant = 0.8;

// In animation loop
const bins = new Uint8Array(128);
analyser.getByteFrequencyData(bins);

// Map 128 bins to N bars (e.g., 48 for Dracula)
const barCount = 48;
for (let i = 0; i < barCount; i++) {
  const binIndex = Math.floor((i / barCount) * 128);
  const value = bins[binIndex] / 255; // Normalize to 0-1
  drawBar(i, value);
}
```

### Smoothing (Attack/Release)
```typescript
const levels = new Float32Array(barCount);
const ATTACK = 0.12;  // Rise speed
const DECAY = 0.045;  // Fall speed

function update(bins: Uint8Array) {
  for (let i = 0; i < barCount; i++) {
    const target = bins[binIndex] / 255;
    const current = levels[i];
    
    if (target > current) {
      // Attack: rise quickly
      levels[i] += (target - current) * ATTACK;
    } else {
      // Decay: fall slowly
      levels[i] += (target - current) * DECAY;
    }
  }
}
```

### Mirrored Spectrum
```typescript
// For symmetric visualizers (e.g., Dracula cape)
const halfCount = barCount / 2;

for (let i = 0; i < halfCount; i++) {
  const value = levels[i];
  
  // Left side
  drawBar(i, value);
  
  // Right side (mirrored)
  drawBar(barCount - 1 - i, value);
}
```

## Track Format

```typescript
interface Track {
  title: string;
  artist: string;
  file?: string;        // Path to MP3/WAV (for file-based)
  demo?: number;        // 0, 1, or 2 (for synthetic)
  duration?: number;    // Seconds (optional, calculated if missing)
}
```

## Common Audio Patterns

### Crossfading Tracks
```typescript
async function crossfade(fromTrack: Track, toTrack: Track) {
  const fadeTime = 2.0; // seconds
  const now = audioContext.currentTime;
  
  // Fade out current
  gainNode.gain.setValueAtTime(1.0, now);
  gainNode.gain.linearRampToValueAtTime(0.0, now + fadeTime);
  
  // Start next track
  setTimeout(async () => {
    await engine.playFile(toTrack, onEnd);
    
    // Fade in
    gainNode.gain.setValueAtTime(0.0, now + fadeTime);
    gainNode.gain.linearRampToValueAtTime(1.0, now + fadeTime * 2);
  }, fadeTime * 1000);
}
```

### Looping
```typescript
bufferSource.loop = true;
bufferSource.loopStart = 0;
bufferSource.loopEnd = buffer.duration;
```

### Playback Rate (Pitch Shift)
```typescript
bufferSource.playbackRate.value = 1.0;  // Normal
bufferSource.playbackRate.value = 0.5;  // Half speed (lower pitch)
bufferSource.playbackRate.value = 2.0;  // Double speed (higher pitch)
```

## Performance

### Buffer Management
- Keep buffers in memory (don't decode repeatedly)
- Use cache for synthetic tracks
- Decode files once at load time

### AnalyserNode Settings
```typescript
// Lower fftSize = less CPU, fewer bins
analyser.fftSize = 256;  // 128 bins (good balance)
analyser.fftSize = 512;  // 256 bins (more detail, more CPU)
analyser.fftSize = 128;  // 64 bins (faster, less detail)
```

### Animation Frame Budgets
- Target: 16.67ms per frame (60 FPS)
- Visualizer update: < 2ms
- Leave headroom for CSS animations

## Audio Context States

### Handling Autoplay Policy
```typescript
// AudioContext starts suspended due to autoplay policy
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}
```

### User Interaction Required
```typescript
// First play must be user-initiated
button.addEventListener('click', async () => {
  await audioContext.resume();
  await engine.playFile(track, onEnd);
});
```

## Debugging Audio

### Check Context State
```typescript
console.log('AudioContext state:', audioContext.state);
// 'suspended', 'running', 'closed'
```

### Verify Graph Connections
```typescript
console.log('Source connected:', sourceNode.numberOfOutputs > 0);
console.log('Analyser connected:', analyserNode.numberOfInputs > 0);
```

### Monitor Frequency Data
```typescript
setInterval(() => {
  const bins = engine.getFrequencyData();
  const avg = bins.reduce((a, b) => a + b) / bins.length;
  console.log('Average frequency:', avg);
}, 1000);
```

## Known Issues & Solutions

### Issue: Seeking Stutters
**Cause:** Restarting buffer source on every input event  
**Fix:** Paint seek on `input`, commit on `change`

### Issue: No Audio After Sleep
**Cause:** AudioContext suspended  
**Fix:** Resume on focus/visibility change

### Issue: Crackling on Synthetic Tracks
**Cause:** Buffer discontinuities  
**Fix:** Proper fade in/out envelopes

### Issue: Visualizer Lags Behind Audio
**Cause:** Smoothing too aggressive  
**Fix:** Reduce `smoothingTimeConstant` or increase attack rate
