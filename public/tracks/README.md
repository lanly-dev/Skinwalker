# Demo Tracks

Six demo tracks for Skinwalker media player: 3 synthetic ambient tracks + 3 royalty-free music tracks.

---

## Synthetic Tracks (procedurally generated)

Generated using Web Audio API synthesis algorithm from [boba.page reference](https://boba.page/QRy-pZyZ-yDsNn2uSy3ydg/index.html).

1. **nocturne-in-blood.wav** (54s, 2.27 MB)
   - Dark ambient drone with pentatonic bells
   - Root frequency: 55 Hz
   - Scale: [0, 3, 7, 10, 7, 3]

2. **coffin-dream.wav** (58s, 2.44 MB)
   - Eerie atmospheric soundscape
   - Root frequency: 48.9994 Hz
   - Scale: [0, 5, 7, 3, 10, 7]

3. **widows-kiss.wav** (51s, 2.14 MB)
   - Haunting ambient composition
   - Root frequency: 58.2705 Hz
   - Scale: [0, 3, 8, 7, 5, 3]

### How They're Made

Each track synthesizes 3 layers:
- **Drone**: 3 harmonic sine waves with slow amplitude modulation
- **Bell**: Pentatonic sequence (4× root frequency) with exponential envelope
- **Wind**: Filtered pink noise

**Format**: 16-bit mono WAV, 22.05 kHz sample rate  
**License**: Original synthesis for Skinwalker (MIT)  
**Note**: "Bathory • Eternal Night" is fictional styling; no copyrighted recording used

---

## Royalty-Free Music Tracks

From **Incompetech** by Kevin MacLeod, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

4. **baba-yaga.mp3** (7.69 MB)
   - Source: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Baba%20Yaga.mp3
   - Dark, mysterious orchestral theme

5. **darkling.mp3** (5.18 MB)
   - Source: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Darkling.mp3
   - Eerie ambient soundscape

6. **thief-in-the-night.mp3** (5.64 MB)
   - Source: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Thief%20in%20the%20Night.mp3
   - Suspenseful, sneaky atmospheric track

**License**: Music by Kevin MacLeod (incompetech.com)  
Licensed under Creative Commons: By Attribution 4.0  
http://creativecommons.org/licenses/by/4.0/

---

## Regenerate Synthetic Tracks

To rebuild the WAV files:

```bash
npm run generate-tracks
```

Or directly:

```bash
node scripts/generate-demo-tracks.js
```

---

## Attribution Required

When using the Incompetech tracks in your project, include:

```
Music: "Baba Yaga", "Darkling", "Thief in the Night" by Kevin MacLeod
Source: https://incompetech.com
License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
```

---

## More Royalty-Free Sources

- **Incompetech**: https://incompetech.com/music/royalty-free/
- **Pixabay Music**: https://pixabay.com/music/search/spooky%20halloween/
- **FreePD**: https://freepd.com/ (Public domain music)
- **Purple Planet**: https://www.purple-planet.com (Free with attribution)
