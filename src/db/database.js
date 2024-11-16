// src/db/database.js

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid')

// Corrected database path
const dbPath = path.resolve(__dirname, '..', '..', 'data', 'guide.db');
/**
 * Function to open a new database connection and its specific methods.
 */
function openDatabase() {
  const connectionUUID = uuidv4();
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(`Could not connect to database - ${connectionUUID}:`, err.message);
    } else {
      console.log(`Connected to SQLite database - ${connectionUUID}`);
    }
  });

  /**
   * Function to close a database connection.
   */
  function closeDatabase() {
    db.close((err) => {
      if (err) {
        console.error(`Error closing the database connection - ${connectionUUID}:`, err.message);
      } else {
        console.log(`Database connection closed. - ${connectionUUID}`);
      }
    });
  }

  /**
   * Function to run SQL queries with logging.
   * Logs the SQL statement, parameters, and the result (lastID and changes).
   */
  async function runAsync(sql, params = []) {
    console.log(`runAsync called - Connection UUID: ${connectionUUID}`);
    console.log(`SQL: ${sql}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);

    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) { // Preserve the 'this' context by using 'function'
        if (err) {
          console.error(`Error executing runAsync - Connection UUID: ${connectionUUID}:`, err.message);
          return reject(err);
        }
        console.log(`runAsync executed successfully - Connection UUID: ${connectionUUID}`);
        console.log(`lastID: ${this.lastID}, changes: ${this.changes}`);
        resolve(this); // 'this' contains lastID and changes
      });
    });
  }

  /**
   * Promisified function for the get method with logging.
   * Logs the SQL statement, parameters, and the retrieved row.
   */
  async function getAsync(sql, params = []) {
    console.log(`getAsync called - Connection UUID: ${connectionUUID}`);
    console.log(`SQL: ${sql}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);

    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error(`Error executing getAsync - Connection UUID: ${connectionUUID}:`, err.message);
          return reject(err);
        }
        console.log(`getAsync executed successfully - Connection UUID: ${connectionUUID}`);
        console.log(`Retrieved Row: ${JSON.stringify(row)}`);
        resolve(row);
      });
    });
  }

  /**
   * Promisified function for the all method with logging.
   * Logs the SQL statement, parameters, and the retrieved rows.
   */
  async function allAsync(sql, params = []) {
    console.log(`allAsync called - Connection UUID: ${connectionUUID}`);
    console.log(`SQL: ${sql}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(`Error executing allAsync - Connection UUID: ${connectionUUID}:`, err.message);
          return reject(err);
        }
        console.log(`allAsync executed successfully - Connection UUID: ${connectionUUID}`);
        console.log(`Retrieved Rows: ${JSON.stringify(rows)}`);
        resolve(rows);
      });
    });
  }

  return { db, closeDatabase, runAsync, getAsync, allAsync };
}



/**
 * Fetch links from the database.
 * @param {boolean} showInvalid - Whether to include invalid links.
 * @returns {Promise<Array>} - A promise that resolves to an array of links.
 */
async function fetchLinksFromDB(showInvalid) {
  const { closeDatabase, allAsync } = openDatabase();
  try {
    let tableSourceName = showInvalid ? 'links' : 'current_links';
    let queryLinks = `SELECT * FROM ${tableSourceName}  ORDER BY Id`;
    let subTableLinks = `SELECT id FROM ${tableSourceName}  ORDER BY Id`;

    let queryLinkTopics = `SELECT * FROM topic_links`
    let queryLinkPersonas = `SELECT * FROM persona_links`;

    if (!showInvalid) {
      queryLinkTopics += ` WHERE link IN (${subTableLinks});`;
      queryLinkPersonas += ` WHERE link_id IN (${subTableLinks});`;
    }

    const linkRows = await allAsync(queryLinks);
    const linkTopicRows = await allAsync(queryLinkTopics);
    const linkPersonaRows = await allAsync(queryLinkPersonas);

    const linkMap = {};
    linkRows.forEach((link) => {
      link.topics = [];
      link.personas = [];
      linkMap[link.id] = link;
    });
    linkTopicRows.forEach((linkTopic) => {
      linkMap[linkTopic.Link].topics.push(linkTopic.Topic);
    });

    linkPersonaRows.forEach((linkPersona) => {
      linkMap[linkPersona.link_id].personas.push(linkPersona.persona_id);
    });


    return linkRows;
  } catch (err) {
    console.error('Error fetching links:', err);
    throw err;
  } finally {
    closeDatabase();
  }
}

/**
 * Find a link by its ID.
 * @param {number} id - The ID of the link.
 * @param {boolean} showInvalid - Whether to include invalid links.
 * @returns {Promise<Object>} - A promise that resolves to the link object.
 */
async function findLinkByIdInDB(id, showInvalid) {
  const { closeDatabase, getAsync } = openDatabase();
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
    closeDatabase();
  }
}

/**
 * Update a link in the database.
 * @param {Object} link - The link object with updated data.
 * @returns {Promise<void>}
 */
async function updateLinkInDB(link) {
  const { db, runAsync, closeDatabase } = openDatabase();

  try {
    const { id, url, name, certification, valid, successor } = link;
    const query = `
        UPDATE links
        SET URL = ?, Name = ?, Certification = ?, Valid = ?, Successor = ?
        WHERE id = ?
      `;
    await runAsync('BEGIN TRANSACTION;');
    await runAsync(query, [url, name, certification ? 1 : 0, valid ? 1 : 0, successor, id]);
    await updateTopicsForLink({ db, runAsync, linkId: id, topicKeys: link.topics });
    await updatePersonasForLink({ db, runAsync, linkId: id, personaKeys: link.personas });
    await runAsync('COMMIT;');
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
  const { closeDatabase, allAsync } = openDatabase();
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
    closeDatabase();
  }
}

/**
 * Update topics associated with a link.
 * @param {number} linkId - The ID of the link.
 * @param {Array<string>} topicKeys - An array of topic keys.
 * @returns {Promise<void>}
 */
async function updateTopicsForLink({ db, runAsync, linkId, topicKeys }) {
  try {
    /* await runAsync('BEGIN TRANSACTION;'); */

    // Delete existing Topic_Links for the link
    const deleteQuery = `DELETE FROM Topic_Links WHERE link = ?`;
    await runAsync(deleteQuery, [linkId]);

    // Insert new Topic_Links records
    const insertQuery = `INSERT OR IGNORE INTO Topic_Links (topic, link) VALUES (?, ?)`;
    const stmt = db.prepare(insertQuery);

    for (const topicKey of topicKeys) {
      await new Promise((resolve, reject) => {
        stmt.run([topicKey, linkId], function (err) {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    stmt.finalize();
    /* await runAsync('COMMIT;'); */
  } catch (err) {
    console.error('Error updating topics for link:', err);
    /* await runAsync('ROLLBACK;'); */
    throw err;
  } finally {
    /* closeDatabase(); */
  }
}

/**
 * Update personas associated with a link.
 * @param {number} linkId - The ID of the link.
 * @param {Array<string>} linkKeys - An array of topic keys.
 * @returns {Promise<void>}
 */
async function updatePersonasForLink({ db, runAsync, linkId, personaKeys }) {
  try {
    /* await runAsync('BEGIN TRANSACTION;'); */

    // Delete existing persona links for the link
    const deleteQuery = `DELETE FROM persona_links WHERE link_id = ?`;
    await runAsync(deleteQuery, [linkId]);

    // Insert new persona_links records
    const insertQuery = `INSERT OR IGNORE INTO persona_links (link_id, persona_id) VALUES (?, ?)`;
    const stmt = db.prepare(insertQuery);

    for (const personaKey of personaKeys) {
      await new Promise((resolve, reject) => {
        stmt.run([linkId, personaKey], function (err) {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    stmt.finalize();
    /* await runAsync('COMMIT;'); */
  } catch (err) {
    console.error('Error updating personas for link:', err);
    /* await runAsync('ROLLBACK;') */;
    throw err;
  } finally {
    /* closeDatabase(); */
  }
}

/**
 * Fetch all topics from the database.
 * @returns {Promise<Array>} - A promise that resolves to an array of topics.
 */
async function fetchAllTopics() {
  const { closeDatabase, allAsync } = openDatabase();
  try {
    const query = `SELECT MADE, Topic FROM MADE_Topics`;
    const rows = await allAsync(query);
    return rows;
  } catch (err) {
    console.error('Error fetching topics:', err);
    throw err;
  } finally {
    closeDatabase();
  }
}

/**
 * Fetch all personas from the database.
 * @returns {Promise<Array>} - A promise that resolves to an array of topics.
 */
async function fetchAllPersonas() {
  const { closeDatabase, allAsync } = openDatabase();
  try {
    const query = `SELECT * FROM personas`;
    const rows = await allAsync(query);
    return rows;
  } catch (err) {
    console.error('Error fetching personas:', err);
    throw err;
  } finally {
    closeDatabase();
  }
}

/**
 * Create a new link in the database.
 * @param {Object} link - The link data.
 * @returns {Promise<number>} - The ID of the newly created link.
 */
async function createNewLinkInDB(link) {
  const { closeDatabase, runAsync } = openDatabase();
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

    const copyTopics = `INSERT INTO topic_links (link, topic)
       SELECT ?, topic FROM topic_links WHERE link = ?`


    const result = await runAsync(insertQuery, [url, name, certification ? 1 : 0, valid ? 1 : 0, successor]);
    const newLinkId = result.lastID;

    if (predecessor) {
      await runAsync(updateOldLinkQuery, [newLinkId, predecessor]);
      await runAsync(copyTopics, [newLinkId, predecessor]);
    }

    await runAsync('COMMIT;');
    return newLinkId; // Return the ID of the new link
  } catch (err) {
    console.error('Error creating new link:', err);
    await runAsync('ROLLBACK;');
    throw err;
  } finally {
    closeDatabase();
  }
}



/**
 * Fetch successor links from the database.
 * @returns {Promise<Array>} - A promise that resolves to an array of links.
 */
async function fetchSuccessorList() {
  const { closeDatabase, allAsync } = openDatabase();
  try {
    const querySuccessors = `
      WITH RECURSIVE successor_chain(id, final_successor) AS (
        -- Base case: select links that have a successor
        SELECT id, successor AS final_successor
        FROM links
        WHERE successor IS NOT NULL

        UNION ALL

        -- Recursive case: find successors of successors
        SELECT sc.id, l.successor AS final_successor
        FROM successor_chain sc
        JOIN links l ON sc.final_successor = l.id
        WHERE l.successor IS NOT NULL
      )
      -- Select the starting id and the ultimate successor
      SELECT sc.id, sc.final_successor
      FROM successor_chain sc
      LEFT JOIN links l ON sc.final_successor = l.id
      WHERE l.successor IS NULL;
    `;

    const successorLinks = await allAsync(querySuccessors);
    const linkMap = {};
    successorLinks.forEach((link) => {
      linkMap[link.id] = link.final_successor;
    });
    return linkMap;
  } catch (err) {
    console.error('Error fetching successor links:', err);
    throw err;
  } finally {
    closeDatabase();
  }
}



module.exports = {
  fetchLinksFromDB,
  findLinkByIdInDB,
  updateLinkInDB,
  fetchTopicsForLink,
  fetchAllTopics,
  createNewLinkInDB,
  fetchAllPersonas,
  fetchSuccessorList,
};
