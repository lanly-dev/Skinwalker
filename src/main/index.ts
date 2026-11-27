/**
 * Electron main process.
 * Creates a frameless, transparent window — the monster IS the window chrome.
 */
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readdir, readFile } from 'fs/promises'
import { fileURLToPath, pathToFileURL } from 'url'
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

/** Skins own the window shape. A skin may also hand its own minimum size:
 *  the mini bat is 380x380, below the portrait skin's 380x560 floor. */
ipcMain.on('window:set-size', (_e, size: {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
}) => {
  if (!win || !size) return
  if (win.isMaximized()) win.unmaximize()
  const { width, height, minWidth, minHeight } = size
  if (typeof minWidth === 'number' && typeof minHeight === 'number') {
    win.setMinimumSize(Math.round(minWidth), Math.round(minHeight))
  }
  if (Number.isFinite(width) && Number.isFinite(height)) {
    win.setSize(Math.round(width), Math.round(height))
    win.center()
  }
})

/** Shape the OS window to the active skin's silhouette (Windows/Linux).
 *  Outside the rects nothing is drawn and no mouse events arrive, so the
 *  transparent corners fall through to the desktop.
 *
 *  The rects carry the viewport they were sampled from and are scaled to the
 *  window's size here. Filtering out-of-range rects instead is what cut
 *  horizontal bands out of the mini bat: entering mini mode resizes and
 *  reshapes together, so the wide wing rows were sampled at the stage size
 *  and thrown away once the window was 380×380, leaving only the narrow crown
 *  and tail. */
ipcMain.on('window:set-shape', (
  _e,
  payload:
    | { rects?: Array<{ x: number; y: number; width: number; height: number }>; from?: { width: number; height: number } }
    | undefined,
) => {
  if (!win || win.isDestroyed() || process.platform === 'darwin' || process.env['SKINWALKER_SHAPE'] === '0') return
  try {
    const rects = payload?.rects
    const from = payload?.from
    const [w, h] = win.getContentSize()
    const sx = from && from.width > 0 ? w / from.width : 1
    const sy = from && from.height > 0 ? h / from.height : 1
    const clean = Array.isArray(rects)
      ? rects
          .filter((r) => r && r.width > 0 && r.height > 0)
          .map((r) => {
            const x = Math.max(0, Math.min(w - 1, Math.round(r.x * sx)))
            const y = Math.max(0, Math.min(h - 1, Math.round(r.y * sy)))
            return {
              x,
              y,
              width: Math.max(0, Math.min(w - x, Math.round(r.width * sx))),
              height: Math.max(0, Math.min(h - y, Math.round(r.height * sy))),
            }
          })
          .filter((r) => r.width > 0 && r.height > 0)
      : []
    lastShape = clean
    win.setShape(clean)
  } catch (err) {
    console.error('skinwalker: setShape failed', err)
  }
})

ipcMain.on('window:minimize', () => win?.minimize())
ipcMain.on('window:close',    () => win?.close())

/** Open a native file-picker for local audio files. Returns file:// URLs —
 *  pathToFileURL keeps spaces, '%' and '#' in a filename intact, so the read
 *  IPC can turn them back into the exact path that was picked. */
const AUDIO_EXTENSIONS = [
  'mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'oga', 'opus',
  'aiff', 'aif', 'alac', 'wma', 'ape', 'm4b', 'mp4', 'webm', 'caf',
]

/** Limits for the folder walk, so a huge or looping tree cannot hang the app. */
const MAX_FOLDER_FILES = 5000
const MAX_FOLDER_DEPTH = 20
const AUDIO_EXTENSION_SET = new Set(AUDIO_EXTENSIONS)

/** Audio files under `dir` and its subfolders, as absolute paths. Symlinks
 *  are not followed (Dirent reports them as neither file nor directory). */
async function collectAudio(dir: string, depth: number, out: string[]): Promise<void> {
  if (depth > MAX_FOLDER_DEPTH || out.length >= MAX_FOLDER_FILES) return
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return // unreadable folder: skip it, keep the rest
  }
  for (const entry of entries) {
    if (out.length >= MAX_FOLDER_FILES) return
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectAudio(full, depth + 1, out)
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.') + 1).toLowerCase()
      if (entry.name.includes('.') && AUDIO_EXTENSION_SET.has(ext)) out.push(full)
    }
  }
}

/** Pick a folder; return its audio files (subfolders included) as file://
 *  URLs, sorted by path relative to the folder. pathToFileURL keeps spaces,
 *  '%' and '#' in a name intact for audio:read. */
ipcMain.handle('dialog:openFolder', async () => {
  if (!win) return []
  const result = await dialog.showOpenDialog(win, {
    title: 'Open music folder',
    defaultPath: app.getPath('music'),
    properties: ['openDirectory'],
  })
  const root = result.filePaths[0]
  if (result.canceled || !root) return []
  const files: string[] = []
  await collectAudio(root, 0, files)
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  files.sort((a, b) => collator.compare(a.slice(root.length), b.slice(root.length)))
  return files.map((p) => pathToFileURL(p).href)
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
