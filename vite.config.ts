import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative by default so the build runs from any folder. VITE_BASE pins an
// absolute base for a known host path (see `npm run build:mlg`), which keeps
// assets loading when the page is served without a trailing slash.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
