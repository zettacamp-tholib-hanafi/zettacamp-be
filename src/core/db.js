// *************** IMPORT LIBRARY ***************
const mongoose = require("mongoose");

// *************** IMPORT CORE ***************
const { DB_URL, DB_PORT, DB_NAME } = require("./config");

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
    await mongoose.connect(`${DB_URL}:${DB_PORT}/${DB_NAME}`);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// *************** EXPORT MODULE ***************
module.exports = ConnectDB;
