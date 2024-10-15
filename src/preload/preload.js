// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchCurrentLinks: async () => {
    try {
      // Invoke the 'fetch-current-links' IPC call to the main process
      const data = await ipcRenderer.invoke('fetch-current-links');
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return { error: error.message };
    }
  },
});