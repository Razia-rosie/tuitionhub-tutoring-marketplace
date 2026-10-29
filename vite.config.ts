import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Must match the Supabase Auth Site URL / redirect URLs (http://localhost:8443).
    port: 8443,
    strictPort: true,
  },
  preview: {
    port: 8443,
  },
})
