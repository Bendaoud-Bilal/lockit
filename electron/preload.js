const { contextBridge } = require('electron');

// Expose des APIs sécurisées au renderer process
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
}); 
