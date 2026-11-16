import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // El navegador usa el mismo origen en desarrollo.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
