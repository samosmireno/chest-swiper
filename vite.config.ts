import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DRUPAL_ORIGIN = "https://detect-t1d-insightstoaction.impetusdigital.com";

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/drupal-api": {
        target: DRUPAL_ORIGIN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/drupal-api/, ""),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
