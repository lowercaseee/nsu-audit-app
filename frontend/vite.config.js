import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/process-transcript': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/certificate-image': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/api-history': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
