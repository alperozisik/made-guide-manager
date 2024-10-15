// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected APIs to the renderer process via the contextBridge.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Fetch links from the database.
   * @param {boolean} showInvalid - Whether to include invalid links.
   */
  fetchLinks: async (showInvalid) => {
    return await ipcRenderer.invoke('fetch-links', showInvalid);
  },

  /**
   * Find a link by its ID.
   * @param {number} id - The ID of the link.
   * @param {boolean} showInvalid - Whether to include invalid links.
   */
  findLinkById: async (id, showInvalid) => {
    return await ipcRenderer.invoke('find-link-by-id', id, showInvalid);
  },

  /**
   * Update a link in the database.
   * @param {Object} link - The link object with updated data.
   */
  updateLink: async (link) => {
    return await ipcRenderer.invoke('update-link', link);
  },

  /**
   * Fetch all topics from the database.
   */
  fetchAllTopics: async () => {
    return await ipcRenderer.invoke('fetch-all-topics');
  },

  /**
   * Get the current URL from the WebView.
   */
  getWebViewUrl: () => {
    // Implement logic to get the current URL from the WebView
    return document.querySelector('iframe')?.contentWindow?.location.href || '';
  },

  /**
   * Create a new link in the database.
   * @param {Object} link - The new link data.
   */
  createLink: async (link) => {
    return await ipcRenderer.invoke('create-link', link);
  },

  /**
   * Get the preload path for the webview.
   */
  getWebViewPreloadPath: () => {
    return 'webview-preload.js'; // Return a relative path
  },
});