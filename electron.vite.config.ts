import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
    },
  },
  renderer: {
    root: 'src/renderer',
    // Bundled demo tracks live in the project's public/ (served at /tracks in
    // dev, copied into out/renderer/tracks for the packaged app).
    publicDir: resolve(__dirname, 'public'),
    build: {
      outDir: 'out/renderer',
    },
  },
})
