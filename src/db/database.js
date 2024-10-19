// src/db/database.js

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Corrected database path
const dbPath = path.resolve(__dirname, '..', '..', 'data', 'guide.db');

/**
 * Function to open a new database connection.
 * @returns {sqlite3.Database} - The database connection.
 */
function openDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not connect to database', err);
    } else {
      console.log('Connected to SQLite database');
    }
  });
  return db;
}

/**
 * Function to close a database connection.
 * @param {sqlite3.Database} db - The database connection to close.
 */
function closeDatabase(db) {
  db.close((err) => {
    if (err) {
      console.error('Error closing the database connection:', err);
    } else {
      console.log('Database connection closed.');
    }
  });
}

/**
 * Fetch links from the database.
 * @param {boolean} showInvalid - Whether to include invalid links.
 * @returns {Promise<Array>} - A promise that resolves to an array of links.
 */
function fetchLinksFromDB(showInvalid) {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    let query = `SELECT * FROM links`;
    if (!showInvalid) {
      query += ` WHERE Valid = 1`;
    }
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching links:', err);
        reject(err);
      } else {
        resolve(rows);
      }
      closeDatabase(db);
    });
  });
}

/**
 * Find a link by its ID.
 * @param {number} id - The ID of the link.
 * @param {boolean} showInvalid - Whether to include invalid links.
 * @returns {Promise<Object>} - A promise that resolves to the link object.
 */
function findLinkByIdInDB(id, showInvalid) {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    let query = `SELECT * FROM links WHERE Id = ?`;
    if (!showInvalid) {
      query += ` AND Valid = 1`;
    }
    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Error finding link by ID:', err);
        reject(err);
      } else {
        resolve(row);
      }
      closeDatabase(db);
    });
  });
}

/**
 * Update a link in the database.
 * @param {Object} link - The link object with updated data.
 * @returns {Promise<void>}
 */
function updateLinkInDB(link) {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
  
      const { id, URL, Name, Certification, Valid, Successor } = link;
      const query = `
        UPDATE links
        SET URL = ?, Name = ?, Certification = ?, Valid = ?, Successor = ?
        WHERE id = ?
      `;
      db.run(
        query,
        [URL, Name, Certification ? 1 : 0, Valid ? 1 : 0, Successor, id],
        function (err) {
          if (err) {
            console.error('Error updating link:', err);
            closeDatabase(db);
            reject(err);
          } else {
            closeDatabase(db);
            resolve();
          }
        }
      );
    });
  }

/**
 * Fetch topics associated with a link.
 * @param {number} linkId - The ID of the link.
 * @returns {Promise<Array>} - A promise that resolves to an array of topic keys.
 */
function fetchTopicsForLink(linkId) {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    const query = `
      SELECT topic FROM Topic_Links
      WHERE link = ?
    `;
    db.all(query, [linkId], (err, rows) => {
      if (err) {
        console.error('Error fetching topics for link:', err);
        reject(err);
      } else {
        const topicKeys = rows.map((row) => row.topic);
        resolve(topicKeys);
      }
      closeDatabase(db);
    });
  });
}

/**
 * Update topics associated with a link.
 * @param {number} linkId - The ID of the link.
 * @param {Array<string>} topicKeys - An array of topic keys.
 * @returns {Promise<void>}
 */
function updateTopicsForLink(linkId, topicKeys) {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
  
      db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
  
        // Delete existing Topic_Links for the link
        const deleteQuery = `DELETE FROM Topic_Links WHERE link = ?`;
        db.run(deleteQuery, [linkId], function (err) {
          if (err) {
            console.error('Error deleting Topic_Links:', err);
            db.run('ROLLBACK;', [], () => {
              closeDatabase(db);
              reject(err);
            });
          } else {
            // Yeni Topic_Links kayıtlarını ekle
            const insertQuery = `INSERT INTO Topic_Links (topic, link) VALUES (?, ?)`;
            const stmt = db.prepare(insertQuery);
  
            topicKeys.forEach((topicKey) => {
              stmt.run([topicKey, linkId]);
            });
  
            stmt.finalize((err) => {
              if (err) {
                console.error('Error inserting Topic_Links:', err);
                db.run('ROLLBACK;', [], () => {
                  closeDatabase(db);
                  reject(err);
                });
              } else {
                db.run('COMMIT;', [], () => {
                  closeDatabase(db);
                  resolve();
                });
              }
            });
          }
        });
      });
    });
  }

/**
 * Fetch all topics from the database.
 * @returns {Promise<Array>} - A promise that resolves to an array of topics.
 */
function fetchAllTopics() {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    const query = `SELECT MADE, Topic FROM MADE_Topics`;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching topics:', err);
        reject(err);
      } else {
        resolve(rows);
      }
      closeDatabase(db);
    });
  });
}

/**
 * Create a new link in the database.
 * @param {Object} link - The link data.
 * @returns {Promise<number>} - The ID of the newly created link.
 */
function createNewLinkInDB(link) {
    return new Promise((resolve, reject) => {
      const db = openDatabase();
  
      db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
  
        const { URL, Name, Certification, Valid, Successor } = link;
        const query = `
          INSERT INTO links (URL, Name, Certification, Valid, Successor)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.run(
          query,
          [URL, Name, Certification ? 1 : 0, Valid ? 1 : 0, Successor],
          function (err) {
            if (err) {
              console.error('Error creating new link:', err);
              db.run('ROLLBACK;', [], () => {
                closeDatabase(db);
                reject(err);
              });
            } else {
              db.run('COMMIT;', [], () => {
                closeDatabase(db);
                resolve(this.lastID); // Return the ID of the new link
              });
            }
          }
        );
      });
    });
  }

module.exports = {
  fetchLinksFromDB,
  findLinkByIdInDB,
  updateLinkInDB,
  fetchTopicsForLink,
  updateTopicsForLink,
  fetchAllTopics,
  createNewLinkInDB,
};