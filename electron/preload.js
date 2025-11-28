const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Get dynamic server URL
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  
  // Print recovery key
  printRecoveryKey: (content) => ipcRenderer.invoke('print-recovery-key', content),
  
  // Platform info
  platform: process.platform
})