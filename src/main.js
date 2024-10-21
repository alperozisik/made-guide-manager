// src/main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const {
  fetchLinksFromDB,
  findLinkByIdInDB,
  updateLinkInDB,
  fetchTopicsForLink,
  updateTopicsForLink,
  fetchAllTopics,
  createNewLinkInDB,
} = require('./db/database');

let mainWindow;
const preloadPath = path.join(__dirname, 'preload', 'preload.js');

/**
 * Function to create the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webviewTag: true,
    },
  });

  // Load the URL based on the environment
  if (process.env.NODE_ENV === 'development') {
    console.log('Loading from webpack dev server');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    console.log('Loading from index.html');
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  // Event when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

/**
 * Application event handlers.
 */

// Create window when Electron is ready
app.whenReady().then(() => {
  session.fromPartition('persist:webview').setPermissionRequestHandler((webContents, permission, callback) => {
    if (['notifications', 'fullscreen', 'openExternal', 'media', 'geolocation'].includes(permission)) {
      callback(true); // Allow the requested permission
    } else {
      callback(false); // Deny other permissions
    }
  });

  // Make sure to call createWindow()
  createWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window when app icon is clicked (macOS)
app.on('activate', function () {
  if (mainWindow === null) createWindow();
});


/**
 * IPC handlers for communication between renderer and main process.
 */

// Handle fetching links
ipcMain.handle('fetch-links', async (event, showInvalid) => {
  try {
    const links = await fetchLinksFromDB(showInvalid);

    // For each link, fetch associated topics
    const linksWithTopics = await Promise.all(
      links.map(async (link) => {
        const topics = await fetchTopicsForLink(link.id);
        return { ...link, topics };
      })
    );

    return linksWithTopics;
  } catch (error) {
    console.error('Error in fetch-links:', error);
    return { error: error.message };
  }
});

// Handle finding a link by ID
ipcMain.handle('find-link-by-id', async (event, id, showInvalid) => {
  try {
    const link = await findLinkByIdInDB(id, showInvalid);
    if (!link) {
      return { error: 'Requested ID does not exist' };
    }
    // Fetch topics associated with the link
    const topics = await fetchTopicsForLink(link.id);
    link.topics = topics;
    return link;
  } catch (error) {
    console.error('Error in find-link-by-id:', error);
    return { error: error.message };
  }
});

// Handle updating a link
ipcMain.handle('update-link', async (event, link) => {
  try {
    if (!link.topics) {
      await updateLinkInDB(link);
    }
    // Update topics if provided
    if (link.topics) {
      await updateTopicsForLink(link.id, link.topics);
    }
    return { success: true };
  } catch (error) {
    console.error('Error in update-link:', error);
    return { error: error.message };
  }
});

// Handle fetching all topics
ipcMain.handle('fetch-all-topics', async () => {
  try {
    const topics = await fetchAllTopics();
    return topics;
  } catch (error) {
    console.error('Error in fetch-all-topics:', error);
    return { error: error.message };
  }
});

// Handle creating a new link
ipcMain.handle('create-link', async (event, link) => {
  try {
    const newLinkId = await createNewLinkInDB(link);
    // Fetch the newly created link
    const newLink = await findLinkByIdInDB(newLinkId, true);
    // Fetch topics associated with the new link
    const topics = await fetchTopicsForLink(newLinkId);
    newLink.topics = topics;
    return newLink;
  } catch (error) {
    console.error('Error in create-link:', error);
    return { error: error.message };
  }
});