// *************** IMPORT LIBRARY ***************
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const path = require("path");
const { loadFilesSync } = require("@graphql-tools/load-files");
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");

// *************** IMPORT UTILITIES ***************
const ConnectDB = require("./src/core/db");
const { studentLoader } = require("./src/modules/student/student.loader");
const { schoolLoader } = require("./src/modules/school/school.loader");
const { formatError } = require("./src/core/error");

// *************** Connect to MongoDB
ConnectDB();

// *************** Load GraphQL schema and resolvers
const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "src/modules/**/*.typedef.js"))
);
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "src/modules/**/*.resolver.js"))
);

// *************** Configure Apollo Server
const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  formatError,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

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
  await apollo.start();

  const app = express();
  const PORT = process.env.PORT;

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => ({
        loaders: {
          student: studentLoader(),
          school: schoolLoader(),
        },
      }),
    })
  );

  app.listen(PORT, () => {
    console.log(`GraphQL Playground ready at http://localhost:${PORT}/graphql`);
  });
}
// *************** Call Apollo Server
start();
