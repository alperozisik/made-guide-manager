// preload.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { contextBridge } = require('electron');

const dbPath = path.join(__dirname, 'data', 'guide.db');
const db = new sqlite3.Database(dbPath);

contextBridge.exposeInMainWorld('database', {
  getLinks: (callback) => {
    db.all('SELECT * FROM links', (err, rows) => {
      callback(err, rows);
    });
  },
});