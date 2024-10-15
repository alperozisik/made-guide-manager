// src/renderer/webview-preload.js
console.log('webview-preload.js loaded');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronWebviewAPI', {
  sendMessage: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  onMessage: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
});