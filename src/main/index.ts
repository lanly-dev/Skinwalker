/**
 * Electron main process.
 * Creates a frameless, transparent window — the monster IS the window chrome.
 */
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { is } from '@electron-toolkit/utils'

let win: BrowserWindow | null = null
/** Last silhouette applied, so a move can drop it and put it back. */
let lastShape: Array<{ x: number; y: number; width: number; height: number }> = []

function createWindow(): void {
  win = new BrowserWindow({
    width: 480,
    height: 720,
    minWidth: 380,
    minHeight: 560,
    frame: false,          // no OS chrome — the skin IS the window
    transparent: true,     // lets non-rectangular skins breathe
    backgroundColor: '#00000000',
    // Windows paints a rectangular DWM shadow around a transparent window and
    // rounds the corners on 11 — both make the window rectangle visible on the
    // desktop, so the art alone defines the silhouette.
    hasShadow: false,
    roundedCorners: false,
    resizable: true,
    show: false,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // Allow Web Audio + local file reads via the bridge
      contextIsolation: true,
    },
  })

  // Show only once ready to avoid blank flash
  win.once('ready-to-show', () => win?.show())

  // While the OS moves a shaped window, the region and the painted plate can
  // disagree for a frame — the art reads as sliding out of its own outline.
  // Dropping the shape for the duration of the move removes the mismatch; the
  // plate carries its own alpha, so nothing visible changes meanwhile.
  win.on('will-move', () => {
    if (!win || win.isDestroyed() || !lastShape.length) return
    try {
      win.setShape([])
    } catch (err) {
      console.error('skinwalker: setShape failed', err)
    }
  })
  win.on('moved', () => {
    if (!win || win.isDestroyed() || !lastShape.length) return
    try {
      win.setShape(lastShape)
    } catch (err) {
      console.error('skinwalker: setShape failed', err)
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

/** Size pinned for the current drag. setPosition re-derives the frame and
 *  grows the window a pixel or two per call on scaled displays (electron#9477,
 *  #40566), so the move pins the size with setBounds instead. */
let dragSize: { width: number; height: number } | null = null

ipcMain.on('window:drag-start', () => {
  if (!win || win.isDestroyed()) return
  try {
    const b = win.getBounds()
    dragSize = { width: b.width, height: b.height }
  } catch (err) {
    console.error('skinwalker: window bounds failed', err)
  }
})

/** Drag the frameless window from renderer */
ipcMain.on('window:drag', (_e, { mouseX, mouseY }) => {
  if (!win || win.isDestroyed()) return
  const dx = Number(mouseX)
  const dy = Number(mouseY)
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return
  try {
    const b = win.getBounds()
    const size = dragSize ?? { width: b.width, height: b.height }
    win.setBounds({
      x: Math.round(b.x + dx),
      y: Math.round(b.y + dy),
      width: Math.round(size.width),
      height: Math.round(size.height),
    })
    // setBounds alone still re-derives the frame and inflates it (~2px per
    // drag at 150% scaling, measured) — forcing the size back after the move
    // is what actually holds it.
    win.setSize(Math.round(size.width), Math.round(size.height))
  } catch (err) {
    console.error('skinwalker: window move failed', err)
  }
})

ipcMain.on('window:drag-end', () => {
  dragSize = null
})

/** Skins own the window shape: all skins are portrait 480x720 */
ipcMain.on('window:set-size', (_e, { width, height }) => {
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  win.setSize(Math.round(width), Math.round(height))
  win.center()
})

/** Shape the OS window to the active skin's silhouette (Windows/Linux).
 *  Outside the rects nothing is drawn and no mouse events arrive, so the
 *  transparent corners fall through to the desktop. */
ipcMain.on('window:set-shape', (_e, rects: Array<{ x: number; y: number; width: number; height: number }>) => {
  if (!win || win.isDestroyed() || process.platform === 'darwin' || process.env['SKINWALKER_SHAPE'] === '0') return
  try {
    const [w, h] = win.getSize()
    const clean = Array.isArray(rects)
      ? rects
          .filter(
            (r) =>
              r &&
              r.width > 0 &&
              r.height > 0 &&
              r.x >= 0 &&
              r.y >= 0 &&
              r.x + r.width <= w &&
              r.y + r.height <= h,
          )
          .map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }))
      : []
    lastShape = clean
    win.setShape(clean)
  } catch (err) {
    console.error('skinwalker: setShape failed', err)
  }
})

ipcMain.on('window:minimize', () => win?.minimize())
ipcMain.on('window:close',    () => win?.close())
ipcMain.on('window:maximize', () => {
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})

/** Open a native file-picker for local audio files */
ipcMain.handle('dialog:openAudio', async () => {
  if (!win) return []
  const result = await dialog.showOpenDialog(win, {
    title: 'Add tracks',
    filters: [{ name: 'Audio', extensions: ['mp3', 'flac', 'ogg', 'wav', 'm4a'] }],
    properties: ['openFile', 'multiSelections'],
  })
  return result.canceled ? [] : result.filePaths
})

/** Hand an audio file's bytes to the renderer — Chromium blocks fetch on
 *  file:// URLs, so this is the only way picked / bundled local tracks load. */
ipcMain.handle('audio:read', async (_e, url: string) => {
  try {
    const filePath = url.startsWith('file:') ? fileURLToPath(url) : url
    const bytes = await readFile(filePath)
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return copy.buffer
  } catch (err) {
    console.error('skinwalker: cannot read audio file', err)
    return null
  }
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
