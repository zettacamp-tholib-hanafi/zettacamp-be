// *************** IMPORT LIBRARY ***************
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const path = require("path");
const { loadFilesSync } = require("@graphql-tools/load-files");
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");

// *************** IMPORT UTILITIES ***************
const ConnectDB = require("./utils/db");
const { studentLoader } = require("./graphql/student/student.loader");
const { schoolLoader } = require("./graphql/school/school.loader");
const { formatError } = require("./utils/error.helper");

// *************** Connect to MongoDB
ConnectDB();

// *************** Load GraphQL schema and resolvers
const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "graphql/**/*.graphql"))
);
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "graphql/**/*.resolver.js"))
);

// *************** Configure Apollo Server
const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  formatError,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

// *************** Start Express and Apollo
async function start() {
  await apollo.start();

  const app = express();
  const PORT = process.env.PORT || 4000;

  // *************** Define GraphQL endpoint
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
