const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dragontail', {
  startBackend: () => ipcRenderer.send('start-backend'),
  startGM: () => ipcRenderer.send('start-gm'),
  startPlayer: () => ipcRenderer.send('start-player'),
  stopAll: () => ipcRenderer.send('stop-all'),
  onLog: (callback) => ipcRenderer.on('log', (_event, data) => callback(data)),
  onStatus: (callback) => ipcRenderer.on('status', (_event, data) => callback(data)),
});
