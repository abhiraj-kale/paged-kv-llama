import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // dev: backend runs at :8000 (uvicorn, typically inside WSL)
      '/api': 'http://localhost:8000',
      '/assets': 'http://localhost:8000',
    },
  },
  build: {
    // built app is served by the FastAPI backend itself
    outDir: '../backend/static',
    emptyOutDir: true,
    // keep vite's bundle out of /assets - that path serves the repo's
    // images (architecture diagram etc.) via the backend
    assetsDir: 'bundle',
  },
})
