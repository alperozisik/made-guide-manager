// src/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { closeDatabase } = require('./db/database'); // Import the closeDatabase function
console.log('NODE_ENV:', process.env.NODE_ENV);

let mainWindow;

// Ensure only one instance of the application runs
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If another instance is already running, quit this one
  app.quit();
} else {
  // When a second instance is launched, focus the existing window
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create the main window when the app is ready
  app.whenReady().then(() => {
    createWindow();
  });

  // Quit the app when all windows are closed
  app.on('window-all-closed', function () {
    app.quit();
  });

  // Close the database connection when the app quits
  app.on('before-quit', () => {
    closeDatabase();
  });
}

// src/main.js
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    // Load the URL from the dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Load the local index.html file
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  // Dereference the window object when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}