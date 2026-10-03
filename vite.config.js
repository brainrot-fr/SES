import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import removeConsole from 'vite-plugin-remove-console'

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react(),
    removeConsole({ includes: ['log', 'debug', 'info'] }),
  ],
})
