import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron'
  return {
    base: isElectron ? './' : '/',
    plugins: [
      react(),
      ...(isElectron ? [electron({
        main: { entry: 'electron/main.js' },
        preload: { input: 'electron/preload.js' },
      })] : []),
    ],
  }
})