import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/steam-api': {
        target: 'https://store.steampowered.com/api',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/steam-api/, ''),
      },
    },
  },
})
