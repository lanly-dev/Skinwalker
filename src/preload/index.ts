/**
 * Preload — runs in the renderer context but with Node access.
 * Exposes a locked-down API to the renderer via contextBridge.
 */
import { contextBridge, ipcRenderer } from 'electron'
import { exposeElectronAPI } from '@electron-toolkit/preload'

exposeElectronAPI()

// Skinwalker-specific bridge
contextBridge.exposeInMainWorld('skinwalker', {
  /** Drag the frameless window */
  dragWindow: (delta: { mouseX: number; mouseY: number }) =>
    ipcRenderer.send('window:drag', delta),
  beginWindowDrag: () => ipcRenderer.send('window:drag-start'),
  endWindowDrag: () => ipcRenderer.send('window:drag-end'),

  setWindowSize: (size: { width: number; height: number }) =>
    ipcRenderer.send('window:set-size', size),

  /** Shape the OS window to the active skin's silhouette (Windows/Linux) */
  setWindowShape: (rects: Array<{ x: number; y: number; width: number; height: number }>) =>
    ipcRenderer.send('window:set-shape', rects),

  minimize: () => ipcRenderer.send('window:minimize'),
  close:    () => ipcRenderer.send('window:close'),
  maximize: () => ipcRenderer.send('window:maximize'),

  /** Open native file picker, returns array of file:// URLs */
  openAudioFiles: async (): Promise<string[]> => {
    const paths: string[] = await ipcRenderer.invoke('dialog:openAudio')
    return paths.map((p) => `file:///${p.replace(/\\/g, '/')}`)
  },

  /** Read an audio file's bytes (file:// cannot be fetched by the renderer) */
  readAudioFile: async (url: string): Promise<ArrayBuffer | null> =>
    ipcRenderer.invoke('audio:read', url),
})
