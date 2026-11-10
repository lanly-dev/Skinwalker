// Generate synthetic demo tracks matching boba.page implementation
// Run with: node scripts/generate-demo-tracks.js

const fs = require('fs');
const path = require('path');

// Track definitions from boba.page
const tracks = [
  { name: 'Nocturne In Blood', subtitle: 'BATHORY • ETERNAL NIGHT', duration: 54, demo: 0 },
  { name: 'Coffin Dream', subtitle: 'SYNTHESIZED AMBIENT • DEMO II', duration: 58, demo: 1 },
  { name: "Widow's Kiss", subtitle: 'SYNTHESIZED AMBIENT • DEMO III', duration: 51, demo: 2 }
];

// Synthesis parameters from boba.page
const SAMPLE_RATE = 22050;
const roots = [55, 48.9994, 58.2705];
const scales = [
  [0, 3, 7, 10, 7, 3],
  [0, 5, 7, 3, 10, 7],
  [0, 3, 8, 7, 5, 3]
];

function synth(track) {
  const sr = SAMPLE_RATE;
  const n = Math.floor(track.duration * sr);
  const out = new Float32Array(n);
  
  const r = roots[track.demo];
  const notes = scales[track.demo];
  
  let noise = 0;
  let seed = 419 + track.demo * 901;
  
  for (let i = 0; i < n; i++) {
    const x = i / sr;
    
    // Linear congruential generator for white noise
    seed = (1664525 * seed + 1013904223) >>> 0;
    const white = seed / 2147483648 - 1;
    noise = noise * 0.97 + white * 0.03;
    
    // Slow modulation
    const slow = 0.78 + 0.22 * Math.sin(x * 0.21 + track.demo);
    
    // Drone layer (3 harmonics)
    const drone = (
      Math.sin(2 * Math.PI * r * x) +
      0.38 * Math.sin(2 * Math.PI * r * 1.5 * x + 0.2) +
      0.28 * Math.sin(2 * Math.PI * r * 2.003 * x)
    ) * 0.105 * slow;
    
    // Bell layer (pentatonic sequence with envelope)
    const interval = 3.6;
    const step = Math.floor(x / interval);
    const phase = x % interval;
    const f = r * 4 * Math.pow(2, notes[step % notes.length] / 12);
    const envelope = Math.exp(-phase * 1.1) * (1 - Math.exp(-phase * 14));
    const bell = (
      Math.sin(2 * Math.PI * f * x) +
      0.27 * Math.sin(2 * Math.PI * f * 2.01 * x)
    ) * envelope * 0.075;
    
    // Wind layer (filtered noise)
    const wind = noise * 0.09 * (0.6 + 0.4 * Math.sin(x * 0.14));
    
    // Fade in/out
    const fade = Math.min(1, x / 2, (track.duration - x) / 3);
    
    out[i] = (drone + bell + wind) * Math.max(0, fade);
  }
  
  return out;
}

function float32ToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  
  return Buffer.from(buffer);
}

// Generate tracks
const outDir = path.join(__dirname, '..', 'public', 'tracks');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating synthetic demo tracks...\n');

tracks.forEach(track => {
  console.log(`Synthesizing: ${track.name} (${track.duration}s)`);
  const samples = synth(track);
  const wavData = float32ToWav(samples, SAMPLE_RATE);
  
  const filename = track.name.toLowerCase().replace(/[']/g, '').replace(/\s+/g, '-') + '.wav';
  const filepath = path.join(outDir, filename);
  
  fs.writeFileSync(filepath, wavData);
  const sizeMB = (wavData.length / 1024 / 1024).toFixed(2);
  console.log(`  ✓ Wrote ${filename} (${sizeMB} MB)`);
});

console.log('\n✓ All tracks generated successfully!');
console.log('\nNote: Tracks are in WAV format. Electron can play WAV directly.');
console.log('For smaller file sizes, convert to MP3 using ffmpeg if needed.');
