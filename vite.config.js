import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app under /KinakanGo/; Vercel (which sets VERCEL=1
  // while building) serves it from the root of its own domain
  base: process.env.VITE_BASE || (process.env.VERCEL ? '/' : '/KinakanGo/'),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
