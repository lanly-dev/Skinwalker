const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('mute-audio')

setTimeout(() => {
  console.log('hard timeout')
  app.exit(1)
}, 40000)

const SAMPLE = `(async () => {
  const c = document.querySelector('canvas.dr-viz');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const bars = [];
  for (let i = 0; i < 32; i++) {
    bars.push(Math.round(c.width * 0.19 + ((i + 0.5) / 32) * c.width * 0.62));
  }
  const frames = [];
  const t0 = performance.now();
  while (performance.now() - t0 < 4000) {
    const frame = [];
    for (const x of bars) {
      const strip = ctx.getImageData(x - 1, 0, 3, c.height).data;
      let top = -1, bottom = -1;
      for (let y = 0; y < c.height; y++) {
        let hit = false;
        for (let dx = 0; dx < 3; dx++) if (strip[(y * 3 + dx) * 4 + 3] >= 12) { hit = true; break; }
        if (hit) { if (top < 0) top = y; bottom = y; }
      }
      frame.push({ top, bottom });
    }
    frames.push(frame);
    await new Promise(r => setTimeout(r, 120));
  }
  return frames;
})()`

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 480,
    height: 720,
    useContentSize: true,
    show: false,
    webPreferences: { offscreen: true, backgroundThrottling: false },
  })
  await win.loadURL('http://localhost:5500/')
  await new Promise((r) => setTimeout(r, 2200))
  await win.webContents.executeJavaScript(
    `document.querySelector('[aria-label="Play Baba Yaga"]')?.click(); true`,
  )
  await new Promise((r) => setTimeout(r, 2500))
  const frames = await win.webContents.executeJavaScript(SAMPLE)
  const shot = await win.webContents.capturePage()
  fs.writeFileSync(path.join(__dirname, '..', 'wings-smooth.png'), shot.toPNG())

  const steps = []
  const spreads = []
  for (const frame of frames) {
    const heights = frame.map((b) => (b.top < 0 ? 0 : b.bottom - b.top))
    const live = heights.filter((h) => h > 2)
    if (live.length) {
      spreads.push(Math.max(...live) - Math.min(...live))
      for (let i = 1; i < heights.length; i++) {
        if (heights[i] > 2 && heights[i - 1] > 2) steps.push(Math.abs(heights[i] - heights[i - 1]))
      }
    }
  }
  const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)]
  console.log(
    JSON.stringify({
      frames: frames.length,
      medianNeighbourStepPx: med(steps),
      p90NeighbourStepPx: steps.sort((a, b) => a - b)[Math.floor(steps.length * 0.9)],
      medianSpreadPx: med(spreads),
      maxSpreadPx: Math.max(...spreads),
    }),
  )
  app.exit(0)
})
