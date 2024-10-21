// src/db/database.js

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Corrected database path
const dbPath = path.resolve(__dirname, '..', '..', 'data', 'guide.db');

function createDBMethods(db) {
  // Creating a promisified function for the run method
  function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) { // We preserve the 'this' context by using 'function'
        if (err) {
          return reject(err);
        }
        resolve(this); // 'this' contains lastID and changes
      });
    });
  }

  // A promisified function for the get method
  const getAsync = promisify(db.get.bind(db));

  // A promisified function for the all method
  const allAsync = promisify(db.all.bind(db));
  return { runAsync, getAsync, allAsync };
}

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
async function fetchLinksFromDB(showInvalid) {
  const db = openDatabase();
  const { allAsync } = createDBMethods(db);
  try {
    let query = `SELECT * FROM links`;
    if (!showInvalid) {
      query += ` WHERE Valid = 1`;
    }
    const rows = await allAsync(query);
    return rows;
  } catch (err) {
    console.error('Error fetching links:', err);
    throw err;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Find a link by its ID.
 * @param {number} id - The ID of the link.
 * @param {boolean} showInvalid - Whether to include invalid links.
 * @returns {Promise<Object>} - A promise that resolves to the link object.
 */
async function findLinkByIdInDB(id, showInvalid) {
  const db = openDatabase();
  const { getAsync } = createDBMethods(db);
  try {
    let query = `SELECT * FROM links WHERE Id = ?`;
    if (!showInvalid) {
      query += ` AND Valid = 1`;
    }
    const row = await getAsync(query, [id]);
    return row;
  } catch (err) {
    console.error('Error finding link by ID:', err);
    throw err;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Update a link in the database.
 * @param {Object} link - The link object with updated data.
 * @returns {Promise<void>}
 */
async function updateLinkInDB(link) {
  const db = openDatabase();
  const { runAsync, } = createDBMethods(db);

  try {
    const { id, URL, Name, Certification, Valid, Successor } = link;
    const query = `
        UPDATE links
        SET URL = ?, Name = ?, Certification = ?, Valid = ?, Successor = ?
        WHERE id = ?
      `;
    await runAsync(query, [URL, Name, Certification ? 1 : 0, Valid ? 1 : 0, Successor, id]);
  } catch (err) {
    console.error('Error updating link:', err);
    throw err;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Fetch topics associated with a link.
 * @param {number} linkId - The ID of the link.
 * @returns {Promise<Array>} - A promise that resolves to an array of topic keys.
 */
async function fetchTopicsForLink(linkId) {
  const db = openDatabase();
  const { allAsync } = createDBMethods(db);
  try {
    const query = `
      SELECT topic FROM Topic_Links
      WHERE link = ?
    `;
    const rows = await allAsync(query, [linkId]);
    const topicKeys = rows.map((row) => row.topic);
    return topicKeys;
  } catch (err) {
    console.error('Error fetching topics for link:', err);
    throw err;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Update topics associated with a link.
 * @param {number} linkId - The ID of the link.
 * @param {Array<string>} topicKeys - An array of topic keys.
 * @returns {Promise<void>}
 */
async function updateTopicsForLink(linkId, topicKeys) {
  const db = openDatabase();
  const { runAsync, } = createDBMethods(db);
  try {
    await runAsync('BEGIN TRANSACTION;');

    // Delete existing Topic_Links for the link
    const deleteQuery = `DELETE FROM Topic_Links WHERE link = ?`;
    await runAsync(deleteQuery, [linkId]);

    // Insert new Topic_Links records
    const insertQuery = `INSERT INTO Topic_Links (topic, link) VALUES (?, ?)`;
    const stmt = db.prepare(insertQuery);

    for (const topicKey of topicKeys) {
      await runAsync.call(stmt, [topicKey, linkId]);
    }

    stmt.finalize();
    await runAsync('COMMIT;');
  } catch (err) {
    console.error('Error updating topics for link:', err);
    await runAsync('ROLLBACK;');
    throw err;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Fetch all topics from the database.
 * @returns {Promise<Array>} - A promise that resolves to an array of topics.
 */
async function fetchAllTopics() {
  const db = openDatabase();
  const { allAsync } = createDBMethods(db);
  try {
    const query = `SELECT MADE, Topic FROM MADE_Topics`;
    const rows = await allAsync(query);
    return rows;
  } catch (err) {
    console.error('Error fetching topics:', err);
    throw err;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Create a new link in the database.
 * @param {Object} link - The link data.
 * @returns {Promise<number>} - The ID of the newly created link.
 */
async function createNewLinkInDB(link) {
  const db = openDatabase();
  const { runAsync } = createDBMethods(db);
  try {
    await runAsync('BEGIN TRANSACTION;');

    const { url, name, certification, valid, successor, predecessor } = link;
    const insertQuery = `
      INSERT INTO links (URL, Name, Certification, Valid, Successor)
      VALUES (?, ?, ?, ?, ?)
    `;
    const updateOldLinkQuery = `
      UPDATE links
      SET Successor = ?, Valid = 0
      WHERE id = ?
    `;

    const result = await runAsync(insertQuery, [url, name, certification ? 1 : 0, valid ? 1 : 0, successor]);
    const newLinkId = result.lastID;

    if (predecessor) {
      await runAsync(updateOldLinkQuery, [newLinkId, predecessor]);
    }

    await runAsync('COMMIT;');
    return newLinkId; // Return the ID of the new link
  } catch (err) {
    console.error('Error creating new link:', err);
    await runAsync('ROLLBACK;');
    throw err;
  } finally {
    closeDatabase(db);
  }
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
