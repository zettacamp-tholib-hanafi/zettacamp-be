// *************** IMPORT CORE ***************
const ConnectDB = require("./src/core/db");

// *************** IMPORT MODULE ***************
const { apollo } = require("./src/core/apollo");
const { ExpressRun } = require("./src/core/express");

/**
 * Initializes and starts the application server.
 *
 * This asynchronous function performs the following steps in sequence:
 * 1. Connects to the MongoDB database.
 * 2. Starts the Apollo Server instance.
 * 3. Runs the Express server to begin handling HTTP requests.
 *
 * @async
 * @function start
 * @returns {Promise<void>} Resolves when all initialization steps are complete.
 */

async function start() {
  // *************** Connect to MongoDB
  await ConnectDB();

  // *************** Initialize Apollo Server
  await apollo.start();

  // *************** Run express
  ExpressRun();
}
// *************** Call Apollo Server
start();
