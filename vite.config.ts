import { defineConfig } from 'vite'

export default defineConfig({
  // Base path — change to '/skinwalker/' if deploying to a GitHub Pages subdirectory
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
})
