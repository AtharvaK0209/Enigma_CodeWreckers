import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      'canvas-confetti',
      'html5-qrcode',
    ],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 5001}`,
        changeOrigin: true,
      },
    },
  },
})
