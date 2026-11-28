const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('mute-audio')

setTimeout(() => {
  console.log('hard timeout')
  app.exit(1)
}, 45000)

const band = { x: 110, y: 310, width: 260, height: 36 }

function columnPeaks(image) {
  const buf = image.toBitmap()
  const size = image.getSize()
  const peaks = []
  for (let x = 0; x < size.width; x++) {
    let peak = 0
    for (let y = 0; y < size.height; y++) {
      const i = (y * size.width + x) * 4
      const b = buf[i], g = buf[i + 1], r = buf[i + 2]
      // Cream ink brightness, ignoring the dark velvet behind it.
      if (r > 120 && g > 110 && b > 95) peak = Math.max(peak, r)
    }
    peaks.push(peak)
  }
  const firstIdx = peaks.findIndex((p) => p > 12)
  const lastIdx = peaks.length - 1 - [...peaks].reverse().findIndex((p) => p > 12)
  return {
    first: firstIdx >= 0 ? firstIdx + band.x : null,
    firstPeak: firstIdx >= 0 ? peaks[firstIdx] : null,
    last: lastIdx >= 0 ? lastIdx + band.x : null,
    lastPeak: lastIdx >= 0 ? peaks[lastIdx] : null,
    profile: peaks.filter((p) => p > 12).slice(0, 12).map((p, i) => [i + (firstIdx >= 0 ? firstIdx + band.x : 0), p]),
  }
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 480,
    height: 720,
    useContentSize: true,
    show: false,
    webPreferences: { offscreen: true, backgroundThrottling: false },
  })
  await win.loadURL('http://localhost:5500/')
  await new Promise((r) => setTimeout(r, 2600))
  await win.webContents.executeJavaScript(`(() => {
    const rows = document.querySelectorAll('.dr-playlist li');
    rows[1].click();
    return true;
  })()`)
  await new Promise((r) => setTimeout(r, 260))
  const startImg = await win.webContents.capturePage(band)
  fs.writeFileSync(path.join(__dirname, '..', 'fade-start-band.png'), startImg.toPNG())
  const zoom = (await win.webContents.capturePage(band)).resize({ width: band.width * 3, quality: 'best' })
  fs.writeFileSync(path.join(__dirname, '..', 'fade-start-zoom.png'), zoom.toPNG())
  console.log('START', JSON.stringify(columnPeaks(startImg)))
  await new Promise((r) => setTimeout(r, 1200))
  const midImg = await win.webContents.capturePage(band)
  fs.writeFileSync(path.join(__dirname, '..', 'fade-mid-band.png'), midImg.toPNG())
  console.log('MID', JSON.stringify(columnPeaks(midImg)))
  app.exit(0)
}).catch((err) => {
  console.log('FAILED', String(err))
  app.exit(1)
})
