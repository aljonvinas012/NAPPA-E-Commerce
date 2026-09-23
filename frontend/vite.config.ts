import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',  // ✅ Dapat naka-set to 'public'
  server: {
    port: 5173,
    strictPort: true,
  },
})