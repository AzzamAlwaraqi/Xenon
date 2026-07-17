import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Bind to 0.0.0.0 — required for Docker container access
    port: 5173,
    proxy: {
      // Proxy API calls to backend during local dev (vite dev server only)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
