import { contextBridge, ipcRenderer } from 'electron'

// Whatever you add here becomes window.electronAPI in your React app.
// This is where you'll wire up push notifications and other native libs later.
contextBridge.exposeInMainWorld('electronAPI', {
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
})
