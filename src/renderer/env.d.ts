/// <reference types="vite/client" />

/** Shape of the API exposed by src/preload/index.ts */
interface SkinwalkerAPI {
  dragWindow: (delta: { mouseX: number; mouseY: number }) => void
  beginWindowDrag: () => void
  endWindowDrag: () => void
  setWindowSize: (size: { width: number; height: number }) => void
  setWindowShape: (rects: Array<{ x: number; y: number; width: number; height: number }>) => void
  minimize: () => void
  close: () => void
  maximize: () => void
  openAudioFiles: () => Promise<string[]>
  readAudioFile: (url: string) => Promise<ArrayBuffer | null>
}

declare interface Window {
  skinwalker: SkinwalkerAPI
}
