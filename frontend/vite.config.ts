import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@fullcalendar')) return 'vendor-calendar'
          if (id.includes('@xyflow')) return 'vendor-flow'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'vendor-ui'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
