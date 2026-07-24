require('dotenv').config();
const { MongoClient } = require('mongodb');

// Pull the database variables from your environment setup
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME = 'explore_india';

// Establish a single, cached connection pool instance across the application lifecycle
let client = null;
let dbInstance = null;

/**
 * Initializes and connects to the native MongoDB deployment
 * @returns {Promise<import('mongodb').Db>} The connected Db instance
 */
async function connectDB() {
  // Return the existing connection if it has already been spun up
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Instantiate the native MongoClient pool configuration
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Execute the connection handshake
    await client.connect();
    console.log('🍃 Config Layer: Native MongoDB connection pool initialized safely.');

    // Isolate and cache the specific database handle instance
    dbInstance = client.db(DB_NAME);
    return dbInstance;
  } catch (error) {
    console.error('❌ Config Layer: Database infrastructure connection failed:', error);
    process.exit(1); // Kill the server process if database connectivity fails
  }
}

/**
 * Retrieves the currently active database instance
 * @returns {import('mongodb').Db} The current cached database instance
 */
function getDB() {
  if (!dbInstance) {
    throw new Error('Database connection has not been initialized. Call connectDB() first.');
  }
  return dbInstance;
}

/**
 * Safely terminates the database client pool connections on server shutdown
 */
async function closeDB() {
  if (client) {
    await client.close();
    console.log('🔌 Config Layer: MongoDB client connection pool cleanly terminated.');
    dbInstance = null;
    client = null;
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};