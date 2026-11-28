const { app, BrowserWindow } = require('electron')

setTimeout(() => {
  console.log('hard timeout')
  app.exit(1)
}, 40000)

const scan = `(async () => {
  const root = document.querySelector('.dracula-skin');
  const raw = getComputedStyle(root).getPropertyValue('--dr-frame-url').trim();
  const url = raw.replace(/^url\\((['"]?)/, '').replace(/(['"]?)\\)$/, '');
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const W = c.width, H = c.height;

  const lum = (x, y) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return Math.round(0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]);
  };
  const warm = (x, y) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
  };

  // 1) Where does painted gold actually begin? scan rows 41..57 for warm bright pixels
  const goldRows = [];
  for (let pct = 41; pct <= 57; pct += 0.5) {
    const y = Math.min(H - 1, Math.round((H * pct) / 100));
    const px = ctx.getImageData(0, y, W, 1).data;
    let count = 0;
    let first = -1;
    let last = -1;
    for (let x = Math.round(W * 0.1); x < W * 0.9; x++) {
      const i = x * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      if (r > 95 && r > b * 1.5 && g > b * 1.15 && r + g > 190) {
        count++;
        if (first < 0) first = x;
        last = x;
      }
    }
    if (count > 0) goldRows.push({ pct, count, firstPct: +((first / W) * 100).toFixed(1), lastPct: +((last / W) * 100).toFixed(1) });
  }

  // 2) Luminance across the title's line (45.5%) to find a natural dark crease
  const y = Math.round(H * 0.455);
  const profile = [];
  for (let pct = 22; pct <= 78; pct += 1) {
    const x = Math.round((W * pct) / 100);
    profile.push([pct, lum(x, y), warm(x, y)]);
  }
  return { W, H, goldRows, profile: profile.map(([p, l]) => [p, l]) };
})()`

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 480, height: 720, show: false, webPreferences: { offscreen: true } })
  await win.loadURL('http://localhost:5500/')
  await new Promise((r) => setTimeout(r, 2600))
  const out = await win.webContents.executeJavaScript(scan)
  console.log('SCAN', JSON.stringify(out))
  app.exit(0)
}).catch((err) => {
  console.log('FAILED', String(err))
  app.exit(1)
})
