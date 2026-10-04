import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react', 'framer-motion']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api to PHP backend so frontend uses same origin in dev (avoids CORS + 404 path issues)
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/gha-asset-manager/backend/api'),
      },
      // Proxy /uploads so profile pictures load in development
      '/uploads': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/gha-asset-manager/backend/uploads'),
      },
    },
  },
})
