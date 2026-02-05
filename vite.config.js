import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow access from other devices on the network
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // Output to dist folder
    outDir: 'dist',
    // Generate sourcemaps for debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
  },
})
