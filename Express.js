// *************** IMPORT LIBRARY ***************
const express = require("express");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");

// *************** IMPORT CORE ***************
const ConnectDB = require("./src/core/db");
const { PORT } = require("./src/core/config");

// *************** IMPORT MODULE ***************
const { apollo, contextApollo } = require("./src/core/apollo");

/**
 * Initialize and start the Express server with Apollo GraphQL middleware.
 *
 * - Starts Apollo Server instance.
 * - Configures Express with `/graphql` route and applies middleware:
 *   - `cors()` for CORS handling.
 *   - `express.json()` for JSON body parsing.
 *   - `expressMiddleware()` for Apollo integration with custom context.
 * - Context includes DataLoader instances for student and school batching.
 * - Server listens on the configured PORT from environment variables.
 *
 * @async
 * @returns {Promise<void>} Resolves when server is successfully started.
 */
async function start() {
  // *************** Connect to MongoDB
  await ConnectDB();
  
  // *************** Initialize Apollo Server
  await apollo.start();

  const app = express();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(apollo, contextApollo)
  );

  app.listen(PORT, () => {
    console.log(`GraphQL Playground ready at http://localhost:${PORT}/graphql`);
  });
}
// *************** Call Apollo Server
start();
