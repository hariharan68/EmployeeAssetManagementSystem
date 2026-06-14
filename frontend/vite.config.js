import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Prefer 5173, but it's fine if Vite moves to another port — the proxy
    // below means the browser always talks to Vite's own origin, so CORS is
    // never involved in development regardless of which port we land on.
    port: 5173,
    proxy: {
      // Any request starting with /api is forwarded to the backend
      // server-side. The browser sees a same-origin request, so there is no
      // CORS preflight to fail.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
