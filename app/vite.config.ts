import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind all interfaces so localhost + 127.0.0.1 both resolve
    port: 5173,
    strictPort: true,
  },
})
