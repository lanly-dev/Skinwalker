/// <reference types="vite/client" />

/** Shape of the API exposed by src/preload/index.ts */
interface SkinwalkerAPI {
  dragWindow: (delta: { mouseX: number; mouseY: number }) => void
  minimize: () => void
  close: () => void
  maximize: () => void
  openAudioFiles: () => Promise<string[]>
}

declare interface Window {
  skinwalker: SkinwalkerAPI
}
