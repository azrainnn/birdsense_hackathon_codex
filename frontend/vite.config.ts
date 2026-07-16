import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKEND_URL = 'http://127.0.0.1:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/predict': BACKEND_URL,
      '/history': BACKEND_URL,
      '^/species$': BACKEND_URL,
      '/spectrograms': BACKEND_URL,
      '/uploads': BACKEND_URL,
    },
  },
})
