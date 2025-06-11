// *************** IMPORT LIBRARY ***************
const mongoose = require("mongoose");
require("dotenv").config();

// *************** Constant Config DB
const DB_URL = process.env.DB_URL;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

/**
 * Asynchronously connects to the MongoDB database using the configured URL, port, and database name.
 * Logs a success message upon successful connection.
 * If the connection fails, logs the error message and exits the process with code 1.
 *
 * @async
 * @function ConnectDB
 * @returns {Promise<void>} Resolves when the connection is successful; exits the process on failure.
 */

async function ConnectDB() {
  try {
    await mongoose.connect(`mongodb://${DB_URL}:${DB_PORT}/${DB_NAME}`);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// *************** EXPORT MODULE ***************
module.exports = ConnectDB;
