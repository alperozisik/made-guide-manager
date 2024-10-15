const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { ipcMain } = require('electron');

// Path to your SQLite database file
const dbPath = path.join(__dirname, '..', '..', 'data', 'guide.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Function to fetch data from 'current_links' view
function fetchCurrentLinks() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM current_links';
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error querying database:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Handle IPC calls from renderer process
ipcMain.handle('fetch-current-links', async () => {
  try {
    const data = await fetchCurrentLinks();
    return data;
  } catch (error) {
    return { error: error.message };
  }
});

// Close the database when the app quits
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Closed the database connection.');
    }
  });
}

module.exports = {
  closeDatabase,
};