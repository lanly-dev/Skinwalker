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
    // Vite's default 5173 sits inside a Windows reserved port range on some
    // machines (Hyper-V / WSL / Docker), which fails with EACCES.
    server: { port: 5500 },
    // Bundled demo tracks live in the project's public/ (served at /tracks in
    // dev, copied into out/renderer/tracks for the packaged app).
    publicDir: resolve(__dirname, 'public'),
    build: {
      outDir: 'out/renderer',
    },
  },
})
