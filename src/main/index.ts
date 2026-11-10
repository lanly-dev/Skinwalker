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

function createWindow(): void {
  win = new BrowserWindow({
    width: 480,
    height: 720,
    minWidth: 380,
    minHeight: 560,
    frame: false,          // no OS chrome — the skin IS the window
    transparent: true,     // lets non-rectangular skins breathe
    backgroundColor: '#00000000',
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

/** Drag the frameless window from renderer */
ipcMain.on('window:drag', (_e, { mouseX, mouseY }) => {
  if (!win) return
  const [x, y] = win.getPosition()
  win.setPosition(x + mouseX, y + mouseY)
})

/** Skins own the window shape: portrait skins are 480×720, the Trio is landscape */
ipcMain.on('window:set-size', (_e, { width, height }) => {
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  win.setSize(Math.round(width), Math.round(height))
  win.center()
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
