const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('icommConfig', {
  apiBaseUrl: process.env.ICOMM_API_URL || 'http://localhost:8000',
  gazeWsUrl: process.env.ICOMM_GAZE_WS_URL || 'ws://localhost:8765',
  gazeScreenW: Number(process.env.ICOMM_SCREEN_W) || 1920,
  gazeScreenH: Number(process.env.ICOMM_SCREEN_H) || 1080,
});

contextBridge.exposeInMainWorld('electronAPI', {
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (data) => ipcRenderer.invoke('settings:save', data),
});
