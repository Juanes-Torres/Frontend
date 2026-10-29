import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Siempre 5173: es el origen que el backend permite en CORS. Si el puerto está
    // ocupado (por ejemplo por el contenedor), Vite falla en vez de usar otro en silencio.
    port: 5173,
    strictPort: true,
  },
})
