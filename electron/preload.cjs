const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadGames: () => ipcRenderer.invoke('load-games'),
  saveGames: (games) => ipcRenderer.invoke('save-games', games),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  fetchSteamGames: (payload) => ipcRenderer.invoke('fetch-steam-games', payload)
});
